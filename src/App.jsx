import React from "react";

const demoEventUrl = "https://luma.com/d4srtk7l?tk=kLvzJe";

const fallbackEvent = {
  name: "Codex Community Hackathon - Pune",
  summary:
    "A live builder event for people exploring agentic coding, product workflows, and practical AI applications. MeetMap AI uses the public event context plus founder goals to recommend who to meet and what to say.",
  themes: ["Agentic coding", "Founder validation", "AI workflows", "Community builders"],
  sourceNote: "Demo-safe fallback based on the provided Luma event URL. Run Analyze Event with OPENAI_API_KEY for live AI research.",
};

const fallbackStrategy = {
  primaryGoal: "Find early users, event workflow feedback, and warm community intros.",
  networkingThesis:
    "Prioritize builders, organizers, and community operators who can validate whether event networking should become an AI-powered opportunity pipeline.",
  followupAngle: "Send a short product recap tied to the exact conversation and ask for one concrete next step.",
};

const fallbackCards = [
  {
    name: "Aman Mogal",
    role: "Host / Community Builder",
    company: "Codex community",
    type: "Community",
    score: 94,
    why: "Can validate whether founders and organizers need a smarter event opportunity workflow.",
    opener: "I am testing MeetMap AI here today. Could I show you how it maps who to meet at this event?",
    outcome: "Get organizer feedback and ask for intros to high-signal builders.",
    source: "Public event host signal and demo fallback.",
    confidence: "Medium",
  },
  {
    name: "Codex Builder",
    role: "Hackathon participant",
    company: "Independent builder",
    type: "Customer",
    score: 89,
    why: "Builders need fast ways to find useful people during short networking windows.",
    opener: "Are you also trying to figure out who is most useful to meet here?",
    outcome: "Run a 2-minute user test and capture product feedback.",
    source: "Event theme and attendee persona assumption.",
    confidence: "Medium",
  },
  {
    name: "Event Organizer Persona",
    role: "Startup ecosystem operator",
    company: "Community or accelerator",
    type: "Customer",
    score: 86,
    why: "Organizers care whether attendees leave with useful conversations and measurable ROI.",
    opener: "Would attendee-level follow-up and ROI reporting help you prove event outcomes?",
    outcome: "Validate B2B event ROI use case.",
    source: "Persona inferred from event format.",
    confidence: "Low",
  },
  {
    name: "AI Product Mentor",
    role: "Advisor / experienced builder",
    company: "AI startup ecosystem",
    type: "Mentor",
    score: 84,
    why: "Can critique whether the product is differentiated from note-taking and CRM tools.",
    opener: "I am positioning this as an opportunity pipeline, not a CRM. Does that land?",
    outcome: "Sharpen pitch and judge narrative.",
    source: "Useful mentor persona for hackathon context.",
    confidence: "Low",
  },
  {
    name: "Potential Investor Scout",
    role: "Angel / venture network contact",
    company: "Startup ecosystem",
    type: "Investor",
    score: 78,
    why: "Can assess if event intelligence is a fundable wedge for sales, recruiting, or communities.",
    opener: "Do you see event ROI as a painful enough wedge for founders or ecosystem teams?",
    outcome: "Market feedback and possible follow-up intro.",
    source: "Persona inferred from startup event context.",
    confidence: "Low",
  },
];

const emptyFollowup =
  "Select an opportunity, add raw meeting notes, then generate a follow-up. Real AI is used when the server has OPENAI_API_KEY configured.";

const initialProfile = {
  name: "Ritesh",
  role: "Founder",
  startup: "MeetMap AI",
  startupContext:
    "MeetMap AI helps event attendees turn random networking into a structured opportunity pipeline: who to meet, what to say, what happened, and what to do next.",
  eventGoal: "Find early users, product feedback, and event organizer validation",
  lookingFor: "founders, Codex builders, event organizers, investors, community leaders",
  challenge: "Networking time is short, attendee data is incomplete, and follow-ups are easy to forget.",
};

function fallbackRandomCard(index) {
  return {
    name: `Random Meet ${index}`,
    role: "New contact from live networking",
    company: "Unknown until notes are captured",
    type: "Random meet",
    score: 72,
    why: "A spontaneous conversation can still become structured follow-up and ROI evidence.",
    opener: "Great meeting you here. What are you building, and who would make this event valuable for you?",
    outcome: "Capture the conversation and decide whether the next step is useful.",
    source: "Created manually from live event notes.",
    confidence: "High",
  };
}

async function postJson(url, payload) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Request failed");
  return data;
}

function Field({ label, children, wide = false }) {
  return (
    <label className={wide ? "field wide" : "field"}>
      <span>{label}</span>
      {children}
    </label>
  );
}

function App() {
  const [profile, setProfile] = React.useState(initialProfile);
  const [eventUrl, setEventUrl] = React.useState(demoEventUrl);
  const [event, setEvent] = React.useState(fallbackEvent);
  const [strategy, setStrategy] = React.useState(fallbackStrategy);
  const [cards, setCards] = React.useState(fallbackCards);
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const [note, setNote] = React.useState(
    "Met Aman. He liked the idea of event ROI tracking and suggested showing it to other Codex builders today."
  );
  const [followup, setFollowup] = React.useState(emptyFollowup);
  const [status, setStatus] = React.useState({
    label: "Demo fallback ready",
    tone: "warn",
    message: "Click Analyze Event to use real AI research when the server key is configured.",
  });
  const [loading, setLoading] = React.useState("");
  const [randomCount, setRandomCount] = React.useState(0);
  const [metCount, setMetCount] = React.useState(0);
  const [followCount, setFollowCount] = React.useState(0);

  const selected = cards[selectedIndex] || cards[0];
  const warmCount = followCount > 0 ? Math.max(1, followCount) : 0;

  function updateProfile(key, value) {
    setProfile((current) => ({ ...current, [key]: value }));
  }

  function normalizeCards(nextCards = []) {
    return nextCards.slice(0, 8).map((card, index) => ({
      name: card.name || `Opportunity ${index + 1}`,
      role: card.role || "Relevant event contact",
      company: card.company || "Event network",
      type: card.type || "Community",
      score: Number(card.score) || 75,
      why: card.why || "Relevant to your event goal.",
      opener: card.opener || "I would love to compare notes on what you are hoping to get from this event.",
      outcome: card.outcome || "Decide whether a follow-up is worthwhile.",
      source: card.source || event.sourceNote || "AI event analysis",
      confidence: card.confidence || "Medium",
    }));
  }

  async function analyzeEvent() {
    setLoading("analyze");
    setStatus({ label: "Researching", tone: "active", message: "MeetMap AI is analyzing the event and your context." });

    try {
      const data = await postJson("/api/analyze-event", { profile, eventUrl });
      const nextCards = normalizeCards(data.cards || []);
      setEvent(data.event || fallbackEvent);
      setStrategy(data.strategy || fallbackStrategy);
      setCards(nextCards.length >= 5 ? nextCards : fallbackCards);
      setSelectedIndex(0);
      setStatus({
        label: "AI analyzed",
        tone: "good",
        message: "Live AI research generated the current event strategy and opportunity cards.",
      });
    } catch (error) {
      setEvent(fallbackEvent);
      setStrategy(fallbackStrategy);
      setCards(fallbackCards);
      setSelectedIndex(0);
      setStatus({
        label: "Fallback visible",
        tone: "warn",
        message: `Real AI analysis failed: ${error.message}. These cards are clearly labeled demo fallback content.`,
      });
    } finally {
      setLoading("");
    }
  }

  function addRandomMeet() {
    const nextCard = fallbackRandomCard(randomCount + 1);
    setCards((current) => [nextCard, ...current]);
    setSelectedIndex(0);
    setRandomCount((count) => count + 1);
    setNote(
      "Met a founder randomly during networking. They are exploring AI tools for sales and liked the idea of turning event conversations into follow-up tasks."
    );
    setFollowup(emptyFollowup);
  }

  async function generateFollowup() {
    if (!selected || !note.trim()) {
      setStatus({ label: "Needs notes", tone: "warn", message: "Add raw meeting notes before generating a follow-up." });
      return;
    }

    setLoading("followup");
    setStatus({ label: "Writing follow-up", tone: "active", message: "MeetMap AI is turning raw notes into next steps." });

    try {
      const data = await postJson("/api/generate-followup", { profile, person: selected, note, event });
      setFollowup(
        `${data.message}\n\nNext action: ${data.nextAction}\nDue: ${data.dueDate}\nTag: ${data.relationshipTag}\nStatus: ${data.status}`
      );
      setMetCount((count) => count + 1);
      setFollowCount((count) => count + 1);
      setStatus({ label: "Follow-up ready", tone: "good", message: "Real AI generated the follow-up from your raw notes." });
    } catch (error) {
      const firstName = selected.name?.split(" ")[0] || "there";
      setFollowup(
        `Demo fallback follow-up, not AI-generated:\n\nHi ${firstName}, great meeting you at the event. I appreciated the conversation about ${note.slice(
          0,
          90
        )}. I will send a short MeetMap AI demo and would value one concrete piece of feedback.\n\nNext action: Send demo link and ask for feedback\nDue: Tonight\nTag: Demo fallback\nStatus: Warm opportunity`
      );
      setMetCount((count) => count + 1);
      setFollowCount((count) => count + 1);
      setStatus({
        label: "Fallback follow-up",
        tone: "warn",
        message: `Real AI follow-up failed: ${error.message}. The visible message is labeled fallback content.`,
      });
    } finally {
      setLoading("");
    }
  }

  async function copyFollowup() {
    await navigator.clipboard?.writeText(followup);
    setStatus({ label: "Copied", tone: "good", message: "Follow-up copied to clipboard." });
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">M</div>
          <div>
            <h1>MeetMap AI</h1>
            <p>Opportunity pipeline</p>
          </div>
        </div>
        <nav className="nav" aria-label="Dashboard sections">
          <span className="active">Opportunity Radar</span>
          <span>Profile Context</span>
          <span>Event Intelligence</span>
          <span>Follow-up Desk</span>
          <span>ROI Dashboard</span>
        </nav>
        <div className="proof-card">
          <strong>Pitch</strong>
          <span>MeetMap AI turns event attendance into an AI-powered opportunity pipeline.</span>
        </div>
      </aside>

      <main className="main">
        <section className="hero">
          <div>
            <p className="eyebrow">Live event AI dashboard</p>
            <h2>Know who to meet. What to say. When to follow up.</h2>
            <p>
              Add your context, paste an event URL, generate meeting cards, capture raw notes, and convert
              conversations into follow-ups.
            </p>
          </div>
          <div className="event-box">
            <label htmlFor="eventUrl">Event URL</label>
            <div>
              <input id="eventUrl" value={eventUrl} onChange={(e) => setEventUrl(e.target.value)} />
              <button onClick={analyzeEvent} disabled={loading === "analyze"}>
                {loading === "analyze" ? "Analyzing..." : "Analyze Event"}
              </button>
            </div>
          </div>
        </section>

        <section className="metrics" aria-label="Event ROI metrics">
          <div><span>Opportunity cards</span><strong>{cards.length}</strong></div>
          <div><span>Random meets</span><strong>{randomCount}</strong></div>
          <div><span>Conversations</span><strong>{metCount}</strong></div>
          <div><span>Follow-ups</span><strong>{followCount}</strong></div>
          <div><span>Warm opportunities</span><strong>{warmCount}</strong></div>
        </section>

        <div className={`status ${status.tone}`}>
          <strong>{status.label}</strong>
          <span>{status.message}</span>
        </div>

        <section className="panel profile-panel">
          <div className="panel-head">
            <div>
              <h3>Profile & Startup Context</h3>
              <p>MeetMap uses this to rank who matters at the event.</p>
            </div>
            <span className="pill">Server-side AI</span>
          </div>
          <div className="form-grid">
            <Field label="Name"><input value={profile.name} onChange={(e) => updateProfile("name", e.target.value)} /></Field>
            <Field label="Role"><input value={profile.role} onChange={(e) => updateProfile("role", e.target.value)} /></Field>
            <Field label="Startup / company"><input value={profile.startup} onChange={(e) => updateProfile("startup", e.target.value)} /></Field>
            <Field label="Event goal"><input value={profile.eventGoal} onChange={(e) => updateProfile("eventGoal", e.target.value)} /></Field>
            <Field label="Startup context" wide>
              <textarea value={profile.startupContext} onChange={(e) => updateProfile("startupContext", e.target.value)} />
            </Field>
            <Field label="Looking for" wide>
              <input value={profile.lookingFor} onChange={(e) => updateProfile("lookingFor", e.target.value)} />
            </Field>
            <Field label="Challenge" wide>
              <input value={profile.challenge} onChange={(e) => updateProfile("challenge", e.target.value)} />
            </Field>
          </div>
        </section>

        <section className="panel event-panel">
          <div className="panel-head">
            <div>
              <h3>Event Intelligence Summary</h3>
              <p>{strategy.primaryGoal}</p>
            </div>
            <span className="pill dark">Research + match</span>
          </div>
          <div className="event-summary">
            <div>
              <h4>{event.name}</h4>
              <p>{event.summary}</p>
              <div className="tags">
                {(event.themes || []).slice(0, 6).map((theme) => <span key={theme}>{theme}</span>)}
              </div>
            </div>
            <div className="strategy-box">
              <strong>Networking thesis</strong>
              <span>{strategy.networkingThesis}</span>
              <strong>Follow-up angle</strong>
              <span>{strategy.followupAngle || "Tie every message to the conversation and ask for one clear next step."}</span>
            </div>
          </div>
        </section>

        <section className="workbench">
          <div className="panel radar">
            <div className="panel-head">
              <div>
                <h3>Opportunity Cards</h3>
                <p>5-8 ranked cards plus random-meet capture.</p>
              </div>
              <button className="secondary" onClick={addRandomMeet}>Add Random Meet</button>
            </div>
            <div className="card-list">
              {cards.map((card, index) => (
                <button
                  className={index === selectedIndex ? "opportunity active" : "opportunity"}
                  key={`${card.name}-${index}`}
                  onClick={() => setSelectedIndex(index)}
                >
                  <div>
                    <h4>{card.name}</h4>
                    <p>{card.role} at {card.company}</p>
                    <span>{card.type} · {card.confidence} confidence</span>
                  </div>
                  <strong>{card.score}</strong>
                </button>
              ))}
            </div>
          </div>

          <div className="panel detail-panel">
            {selected && (
              <>
                <div className="person-head">
                  <div>
                    <span className="pill">{selected.type}</span>
                    <h3>{selected.name}</h3>
                    <p>{selected.role} at {selected.company}</p>
                  </div>
                  <strong>{selected.score}</strong>
                </div>
                <div className="detail-grid">
                  <div><b>Why meet</b><span>{selected.why}</span></div>
                  <div><b>Desired outcome</b><span>{selected.outcome}</span></div>
                  <div><b>Confidence / source</b><span>{selected.confidence}: {selected.source}</span></div>
                  <div><b>Suggested opener</b><span>{selected.opener}</span></div>
                </div>
                <label className="notes">
                  <span>Raw notes after meeting</span>
                  <textarea value={note} onChange={(e) => setNote(e.target.value)} />
                </label>
                <button className="primary" onClick={generateFollowup} disabled={loading === "followup"}>
                  {loading === "followup" ? "Generating..." : "Generate Follow-Up"}
                </button>
                <div className="followup">
                  <div>
                    <span className="pill dark">Follow-up output</span>
                    <button className="copy" onClick={copyFollowup}>Copy</button>
                  </div>
                  <pre>{followup}</pre>
                </div>
              </>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
