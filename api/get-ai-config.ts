import type { VercelRequest, VercelResponse } from "@vercel/node";

// Lightweight endpoint that returns:
//   key      - AI API key for browser-side direct calls (bypasses Vercel 10s timeout)
//   provider - "ollama" | "google" — which AI backend is currently active
//   model    - the model name in use (e.g. "gemma2:2b", "gemma-4-31b-it")
//
// Provider selection mirrors api/ai-provider.ts:
//   OLLAMA_URL set   → Ollama is active
//   OLLAMA_URL unset → Google AI (Gemma 4) is active
export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const key = process.env.GOOGLE_AI_STUDIO_API_KEY;
  if (!key) return res.status(500).json({ error: "API key not configured" });

  const ollamaUrl = (process.env.OLLAMA_URL || "").trim();
  const isOllama = ollamaUrl.length > 0;
  const provider = isOllama ? "ollama" : "google";
  const model = isOllama
    ? (process.env.OLLAMA_MODEL || "gemma3:4b")
    : "gemma-4-31b-it";

  return res.status(200).json({
    key,
    provider,
    model,
    ...(isOllama ? { ollamaUrl } : {}),
  });
}
