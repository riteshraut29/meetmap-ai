# MeetMap AI

Know who to meet. What to say. When to follow up.

MeetMap AI is a live event networking dashboard. A user enters their profile, startup context, and event URL. The server researches the event with OpenAI and returns personalized opportunity cards. After a meeting, the user adds raw notes and gets a follow-up message plus next action.

## Core Flow

1. Enter profile and startup context.
2. Paste an event URL.
3. Generate 5-8 AI opportunity cards.
4. Select a card and use the suggested opener.
5. Add raw meeting notes.
6. Generate a follow-up.
7. Track event ROI metrics.

## API

- `POST /api/analyze-event`
  - Body: `{ "profile": {}, "eventUrl": "https://..." }`
  - Returns event summary, strategy, and opportunity cards.
- `POST /api/generate-followup`
  - Body: `{ "profile": {}, "person": {}, "note": "...", "event": {} }`
  - Returns message, next action, due date, tag, and status.

`OPENAI_API_KEY` is used server-side only. The browser never receives the key.

## Local Development

```bash
npm install
npm run dev
```

For production-style local testing:

```bash
npm run build
npm start
```

Open `http://127.0.0.1:4174`.

## Environment

```text
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-5.5
PORT=4174
NODE_VERSION=20.19.0 or newer
```

If `OPENAI_API_KEY` is not configured, the UI shows clearly labeled demo-safe fallback content instead of pretending fallback text is AI-generated.

## Deploy on Render

This repo includes `render.yaml`.

- Build command: `npm install && npm run build`
- Start command: `npm start`
- Required secret: `OPENAI_API_KEY`
- Optional model override: `OPENAI_MODEL`

Demo event URL:

```text
https://luma.com/d4srtk7l?tk=kLvzJe
```

## Live Deployment

Current live demo:

```text
https://meetmap-ai.vercel.app
```

The Vercel deployment uses `vercel.json` plus serverless API functions in `api/`. Add `OPENAI_API_KEY` in the Vercel project environment variables, then redeploy, to enable real AI responses in production.
