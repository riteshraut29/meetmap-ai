const openaiModel = process.env.OPENAI_MODEL || "gpt-5.5";

function cleanText(value = "") {
  return String(value)
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function extractMeta(html, name) {
  const patterns = [
    new RegExp(`<meta[^>]+property=["']${name}["'][^>]+content=["']([^"']+)["']`, "i"),
    new RegExp(`<meta[^>]+name=["']${name}["'][^>]+content=["']([^"']+)["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${name}["']`, "i"),
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) return cleanText(match[1]);
  }

  return "";
}

function extractJsonLd(html) {
  const blocks = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  const parsed = [];

  for (const block of blocks) {
    try {
      parsed.push(JSON.parse(block[1]));
    } catch {
      // Ignore malformed structured data.
    }
  }

  return parsed;
}

async function fetchEventData(eventUrl) {
  const url = new URL(eventUrl);
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("Event URL must be http or https");
  }

  const response = await fetch(url, {
    headers: {
      "User-Agent": "MeetMapAI/1.0 event research bot",
      Accept: "text/html,application/xhtml+xml",
    },
  });

  if (!response.ok) {
    throw new Error(`Event page returned ${response.status}`);
  }

  const html = await response.text();
  const title = cleanText(extractMeta(html, "og:title") || html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || "");
  const description = cleanText(extractMeta(html, "og:description") || extractMeta(html, "description"));

  return {
    url: eventUrl,
    title,
    description,
    jsonLd: extractJsonLd(html),
    bodyText: cleanText(html).slice(0, 9000),
  };
}

function extractResponseText(data) {
  if (typeof data.output_text === "string") return data.output_text;

  const chunks = [];
  for (const item of data.output || []) {
    for (const content of item.content || []) {
      if ((content.type === "output_text" || content.type === "text") && content.text) {
        chunks.push(content.text);
      }
    }
  }

  return chunks.join("\n");
}

function parseJsonFromText(text) {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("AI did not return JSON");
    return JSON.parse(match[0]);
  }
}

async function callOpenAI(prompt, options = {}) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is missing on the server");
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: openaiModel,
      ...(options.webSearch
        ? {
            tools: [{ type: "web_search", search_context_size: "low" }],
            tool_choice: "auto",
          }
        : {}),
      input: prompt,
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error?.message || `OpenAI request failed with ${response.status}`);
  }

  return extractResponseText(data);
}

function buildAnalyzePrompt({ profile, eventData }) {
  return `
You are MeetMap AI, an event opportunity strategist.

Product promise:
Know who to meet. What to say. When to follow up.

User profile and startup context:
${JSON.stringify(profile, null, 2)}

Public event data:
${JSON.stringify(eventData, null, 2).slice(0, 16000)}

Return ONLY valid JSON with this shape:
{
  "event": {
    "name": "string",
    "summary": "string",
    "themes": ["string"],
    "sourceNote": "string"
  },
  "strategy": {
    "primaryGoal": "string",
    "networkingThesis": "string",
    "followupAngle": "string"
  },
  "cards": [
    {
      "name": "string",
      "role": "string",
      "company": "string",
      "type": "Investor|Customer|Partner|Mentor|Recruit|Community|Learning|Random meet",
      "score": 0,
      "why": "string",
      "opener": "string",
      "outcome": "string",
      "source": "string",
      "confidence": "High|Medium|Low"
    }
  ]
}

Rules:
- Create 5 to 8 opportunity cards.
- Prefer real hosts, speakers, organizers, sponsors, visible people, or honest persona targets supported by the event page.
- If attendee data is private or unavailable, use persona cards and clearly mark confidence/source.
- Connect every card to the user's goal, looking-for field, and challenge.
- Make openers short enough to say live at an event.
- No markdown. JSON only.
`;
}

function buildFollowupPrompt({ profile, person, note, event }) {
  return `
You are MeetMap AI's follow-up agent.

User profile:
${JSON.stringify(profile, null, 2)}

Event:
${JSON.stringify(event || {}, null, 2)}

Selected opportunity:
${JSON.stringify(person, null, 2)}

Raw meeting notes:
${note}

Return ONLY valid JSON:
{
  "message": "short warm follow-up message",
  "nextAction": "concrete next action",
  "dueDate": "suggested due date",
  "relationshipTag": "tag",
  "status": "Cold|Warm opportunity|Hot opportunity|Not relevant"
}

Rules:
- Mention a real detail from the raw notes.
- Keep the message ready to send on LinkedIn, WhatsApp, or email.
- Do not invent promises, meetings, or personal facts absent from the notes.
- No markdown. JSON only.
`;
}

export async function analyzeEvent(payload = {}) {
  const { profile = {}, eventUrl } = payload;
  if (!eventUrl) {
    const error = new Error("eventUrl is required");
    error.status = 400;
    throw error;
  }

  let eventData;
  try {
    eventData = await fetchEventData(eventUrl);
  } catch (error) {
    eventData = {
      url: eventUrl,
      title: "Event URL provided by user",
      description: `Direct fetch failed: ${error.message}. Use web search and mark low-confidence assumptions clearly.`,
      jsonLd: [],
      bodyText: "",
    };
  }

  const aiText = await callOpenAI(buildAnalyzePrompt({ profile, eventData }), { webSearch: true });
  return parseJsonFromText(aiText);
}

export async function generateFollowup(payload = {}) {
  const { profile = {}, person, note, event = {} } = payload;
  if (!person || !note) {
    const error = new Error("person and note are required");
    error.status = 400;
    throw error;
  }

  const aiText = await callOpenAI(buildFollowupPrompt({ profile, person, note, event }));
  return parseJsonFromText(aiText);
}
