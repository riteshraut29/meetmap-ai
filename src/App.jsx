import React from "react";

const demoEventUrl = "https://luma.com/d4srtk7l?tk=kLvzJe";

const emptyProfile = {
  name: "",
  role: "",
  startup: "",
  startupContext: "",
  eventGoal: "",
  lookingFor: "",
  challenge: "",
};

const emptyFollowup =
  "Your follow-up will appear here after you select a card, add notes, and run the AI follow-up agent.";

const starterProfile = {
  name: "Your name",
  role: "Founder",
  startup: "Your startup",
  startupContext: "Describe what you are building, who it helps, and why this event matters.",
  eventGoal: "Find useful conversations, feedback, intros, or customers",
  lookingFor: "founders, customers, partners, investors, mentors",
  challenge: "I do not know who to prioritize and follow-ups get missed after events.",
};

const fallbackCard = {
  name: "New random meet",
  role: "Person you just met",
  company: "Add details in notes",
  type: "Random meet",
  score: 70,
  why: "Capture the conversation now and let AI turn the raw notes into next steps.",
  opener: "What are you hoping to get from this event?",
  outcome: "Decide whether this person needs a follow-up.",
  source: "Created manually from your live notes.",
  confidence: "High",
};

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

function EmptyState({ title, text, action }) {
  return (
    <div className="empty-state">
      <strong>{title}</strong>
      <span>{text}</span>
      {action}
    </div>
  );
}

function App() {
  const profileRef = React.useRef(null);
  const eventRef = React.useRef(null);
  const cardsRef = React.useRef(null);
  const followupRef = React.useRef(null);

  const [profile, setProfile] = React.useState(emptyProfile);
  const [eventUrl, setEventUrl] = React.useState("");
  const [event, setEvent] = React.useState(null);
  const [strategy, setStrategy] = React.useState(null);
  const [cards, setCards] = React.useState([]);
  const [selectedIndex, setSelectedIndex] = React.useState(-1);
  const [note, setNote] = React.useState("");
  const [followup, setFollowup] = React.useState(emptyFollowup);
  const [status, setStatus] = React.useState({
    label: "Ready",
    tone: "active",
    message: "Fill your context, paste any public event URL, and click Analyze Event.",
  });
  const [loading, setLoading] = React.useState("");
  const [randomCount, setRandomCount] = React.useState(0);
  const [metCount, setMetCount] = React.useState(0);
  const [followCount, setFollowCount] = React.useState(0);
  const [activeSection, setActiveSection] = React.useState("Profile Context");

  const selected = selectedIndex >= 0 ? cards[selectedIndex] : null;
  const warmCount = followCount;
  const profileComplete = Boolean(
    profile.name.trim() &&
      profile.role.trim() &&
      profile.startup.trim() &&
      profile.startupContext.trim() &&
      profile.eventGoal.trim()
  );
  const canAnalyze = profileComplete && eventUrl.trim();

  function updateProfile(key, value) {
    setProfile((current) => ({ ...current, [key]: value }));
  }

  function goTo(label, ref) {
    setActiveSection(label);
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
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
      source: card.source || "AI event analysis",
      confidence: card.confidence || "Medium",
    }));
  }

  function useDemoEvent() {
    setEventUrl(demoEventUrl);
    setStatus({
      label: "Demo event loaded",
      tone: "good",
      message: "Event URL added. Add your own profile context, then run Analyze Event.",
    });
  }

  function useQuickProfile() {
    setProfile(starterProfile);
    setStatus({
      label: "Starter profile added",
      tone: "good",
      message: "This is only a quick-start template. Edit it before pitching or sharing.",
    });
  }

  function clearBoard() {
    setProfile(emptyProfile);
    setEventUrl("");
    setEvent(null);
    setStrategy(null);
    setCards([]);
    setSelectedIndex(-1);
    setNote("");
    setFollowup(emptyFollowup);
    setRandomCount(0);
    setMetCount(0);
    setFollowCount(0);
    setStatus({ label: "Cleared", tone: "active", message: "Fresh workspace ready for the next user." });
    goTo("Profile Context", profileRef);
  }

  async function analyzeEvent() {
    if (loading) return;

    if (!canAnalyze) {
      setStatus({
        label: "Needs context",
        tone: "warn",
        message: "Add name, role, startup, startup context, event goal, and event URL before analysis.",
      });
      goTo("Profile Context", profileRef);
      return;
    }

    setLoading("analyze");
    setCards([]);
    setSelectedIndex(-1);
    setFollowup(emptyFollowup);
    setStatus({
      label: "Researching event",
      tone: "active",
      message: "Fetching public event context, matching it with your goals, then ranking opportunities.",
    });

    try {
      const data = await postJson("/api/analyze-event", { profile, eventUrl });
      const nextCards = normalizeCards(data.cards || []);

      if (nextCards.length < 5) {
        throw new Error("AI returned fewer than 5 opportunity cards. Try again with more event/profile context.");
      }

      setEvent(data.event || null);
      setStrategy(data.strategy || null);
      setCards(nextCards);
      setSelectedIndex(0);
      setStatus({
        label: "AI analyzed",
        tone: "good",
        message: `${nextCards.length} opportunity cards generated. Pick one, meet them, then add raw notes.`,
      });
      setTimeout(() => goTo("Opportunity Radar", cardsRef), 120);
    } catch (error) {
      setStatus({
        label: "Analysis failed",
        tone: "warn",
        message: `Real AI could not finish: ${error.message}. Check the URL/context and try again.`,
      });
    } finally {
      setLoading("");
    }
  }

  function addRandomMeet() {
    const nextCard = {
      ...fallbackCard,
      name: `Random meet ${randomCount + 1}`,
      score: Math.max(60, 74 - randomCount),
    };
    setCards((current) => [nextCard, ...current]);
    setSelectedIndex(0);
    setRandomCount((count) => count + 1);
    setNote("");
    setFollowup(emptyFollowup);
    setStatus({
      label: "Random meet ready",
      tone: "good",
      message: "Add the person's name and conversation details in raw notes, then generate follow-up.",
    });
    setTimeout(() => goTo("Follow-up Desk", followupRef), 120);
  }

  async function generateFollowup() {
    if (loading) return;

    if (!selected) {
      setStatus({
        label: "Pick a card",
        tone: "warn",
        message: "Analyze an event or add a random meet before generating a follow-up.",
      });
      goTo("Opportunity Radar", cardsRef);
      return;
    }

    if (!note.trim()) {
      setStatus({
        label: "Needs notes",
        tone: "warn",
        message: "Paste rough meeting notes first. Even messy notes are enough.",
      });
      goTo("Follow-up Desk", followupRef);
      return;
    }

    setLoading("followup");
    setStatus({
      label: "Writing follow-up",
      tone: "active",
      message: "Extracting the relationship signal, next action, due date, and message.",
    });

    try {
      const data = await postJson("/api/generate-followup", { profile, person: selected, note, event });
      setFollowup(
        `${data.message}\n\nNext action: ${data.nextAction}\nDue: ${data.dueDate}\nTag: ${data.relationshipTag}\nStatus: ${data.status}`
      );
      setMetCount((count) => count + 1);
      setFollowCount((count) => count + 1);
      setStatus({ label: "Follow-up ready", tone: "good", message: "Real AI generated a send-ready follow-up." });
    } catch (error) {
      setStatus({
        label: "Follow-up failed",
        tone: "warn",
        message: `Real AI could not finish: ${error.message}. Try shorter notes or retry once.`,
      });
    } finally {
      setLoading("");
    }
  }

  async function copyFollowup() {
    if (!followup || followup === emptyFollowup) {
      setStatus({ label: "Nothing to copy", tone: "warn", message: "Generate a follow-up first, then copy it." });
      return;
    }

    await navigator.clipboard?.writeText(followup);
    setStatus({ label: "Copied", tone: "good", message: "Follow-up copied to clipboard." });
  }

  const processSteps = [
    { label: "Profile", done: profileComplete, active: !profileComplete },
    { label: "Event", done: Boolean(event), active: loading === "analyze" },
    { label: "Cards", done: cards.length > 0, active: loading === "analyze" },
    { label: "Notes", done: Boolean(note.trim()), active: selected && !note.trim() },
    { label: "Follow-up", done: followCount > 0, active: loading === "followup" },
  ];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <img className="brand-mark" src="/meetmap-logo.svg" alt="MeetMap AI logo" />
          <div>
            <h1>MeetMap AI</h1>
            <p>Opportunity pipeline</p>
          </div>
        </div>
        <nav className="nav" aria-label="Dashboard sections">
          {[
            ["Profile Context", profileRef],
            ["Event Intelligence", eventRef],
            ["Opportunity Radar", cardsRef],
            ["Follow-up Desk", followupRef],
          ].map(([label, ref]) => (
            <button key={label} className={activeSection === label ? "active" : ""} onClick={() => goTo(label, ref)}>
              {label}
            </button>
          ))}
        </nav>
        <div className="proof-card">
          <strong>Pitch</strong>
          <span>MeetMap AI turns event attendance into a real-time opportunity pipeline.</span>
        </div>
      </aside>

      <main className="main">
        <section className="hero">
          <div>
            <p className="eyebrow">Live event AI dashboard</p>
            <h2>Know who to meet. What to say. When to follow up.</h2>
            <p>
              A fresh workspace for every attendee: add context, paste any event link, generate meeting cards,
              capture rough notes, and send stronger follow-ups.
            </p>
          </div>
          <div className="event-box">
            <label htmlFor="eventUrl">Event URL</label>
            <div>
              <input
                id="eventUrl"
                value={eventUrl}
                placeholder="Paste a public event URL"
                onChange={(e) => setEventUrl(e.target.value)}
              />
              <button onClick={analyzeEvent}>{loading === "analyze" ? "Analyzing..." : "Analyze Event"}</button>
            </div>
            <div className="quick-actions">
              <button type="button" onClick={useDemoEvent}>Use demo event</button>
              <button type="button" onClick={useQuickProfile}>Quick profile</button>
              <button type="button" onClick={clearBoard}>Clear</button>
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

        <div className="process-strip" aria-label="MeetMap process">
          {processSteps.map((step) => (
            <span key={step.label} className={step.done ? "done" : step.active ? "active" : ""}>{step.label}</span>
          ))}
        </div>

        <div className={`status ${status.tone}`}>
          <strong>{status.label}</strong>
          <span>{status.message}</span>
        </div>

        <section className="panel profile-panel" ref={profileRef}>
          <div className="panel-head">
            <div>
              <h3>Profile & Startup Context</h3>
              <p>Blank by default so every attendee gets their own strategy.</p>
            </div>
            <span className="pill">Server-side AI</span>
          </div>
          <div className="form-grid">
            <Field label="Name"><input value={profile.name} placeholder="Your name" onChange={(e) => updateProfile("name", e.target.value)} /></Field>
            <Field label="Role"><input value={profile.role} placeholder="Founder, PM, investor, student..." onChange={(e) => updateProfile("role", e.target.value)} /></Field>
            <Field label="Startup / company"><input value={profile.startup} placeholder="Company, project, or team" onChange={(e) => updateProfile("startup", e.target.value)} /></Field>
            <Field label="Event goal"><input value={profile.eventGoal} placeholder="What would make this event successful?" onChange={(e) => updateProfile("eventGoal", e.target.value)} /></Field>
            <Field label="Startup context" wide>
              <textarea value={profile.startupContext} placeholder="What are you building? Who is it for? Why now?" onChange={(e) => updateProfile("startupContext", e.target.value)} />
            </Field>
            <Field label="Looking for" wide>
              <input value={profile.lookingFor} placeholder="Users, customers, investors, partners, mentors..." onChange={(e) => updateProfile("lookingFor", e.target.value)} />
            </Field>
            <Field label="Challenge" wide>
              <input value={profile.challenge} placeholder="What is hard about this event or your current workflow?" onChange={(e) => updateProfile("challenge", e.target.value)} />
            </Field>
          </div>
        </section>

        <section className="panel event-panel" ref={eventRef}>
          <div className="panel-head">
            <div>
              <h3>Event Intelligence Summary</h3>
              <p>{strategy?.primaryGoal || "AI summary appears after analysis."}</p>
            </div>
            <span className="pill dark">{loading === "analyze" ? "Researching" : "Research + match"}</span>
          </div>
          {event ? (
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
                <span>{strategy?.networkingThesis}</span>
                <strong>Follow-up angle</strong>
                <span>{strategy?.followupAngle || "Tie every message to the conversation and ask for one clear next step."}</span>
              </div>
            </div>
          ) : (
            <EmptyState
              title={loading === "analyze" ? "Research in progress" : "No event analyzed yet"}
              text={loading === "analyze" ? "MeetMap is reading the event and ranking who matters." : "Paste an event URL and run Analyze Event to generate this section."}
            />
          )}
        </section>

        <section className="workbench" ref={cardsRef}>
          <div className="panel radar">
            <div className="panel-head">
              <div>
                <h3>Opportunity Cards</h3>
                <p>AI-ranked cards plus random-meet capture.</p>
              </div>
              <button className="secondary" onClick={addRandomMeet}>Add Random Meet</button>
            </div>
            <div className="card-list">
              {cards.length ? cards.map((card, index) => (
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
              )) : (
                <EmptyState
                  title="Cards will appear here"
                  text="Analyze an event for ranked opportunities, or add a random meet during live networking."
                  action={<button className="secondary" onClick={addRandomMeet}>Capture random meet</button>}
                />
              )}
            </div>
          </div>

          <div className="panel detail-panel" ref={followupRef}>
            {selected ? (
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
                  <textarea value={note} placeholder="Paste messy notes: name, what you discussed, what they cared about, next step..." onChange={(e) => setNote(e.target.value)} />
                </label>
                <button className="primary" onClick={generateFollowup}>
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
            ) : (
              <EmptyState
                title="Select a card to start follow-up"
                text="This panel becomes your meeting prep, note capture, and send-ready follow-up desk."
                action={<button className="secondary" onClick={addRandomMeet}>Add first contact</button>}
              />
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
