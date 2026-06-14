import { analyzeEvent } from "../lib/meetmap-ai.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const payload = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const data = await analyzeEvent(payload);
    res.status(200).json(data);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message || "Request failed" });
  }
}
