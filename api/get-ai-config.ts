import type { VercelRequest, VercelResponse } from "@vercel/node";

// Lightweight endpoint that returns the AI API key for browser-side direct calls.
// This bypasses Vercel's 10s function timeout for image processing by letting the
// browser call the Google AI API directly (no timeout limit on browser fetch).
export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const key = process.env.GOOGLE_AI_STUDIO_API_KEY;
  if (!key) return res.status(500).json({ error: "API key not configured" });

  return res.status(200).json({ key });
}
