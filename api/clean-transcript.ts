import type { VercelRequest, VercelResponse } from "@vercel/node";
import { invokeAI, getProviderMode } from "./ai-provider.js";
// Provider routing (Ollama local vs Google AI Studio cloud) is handled by _ai-provider.ts.
// Set OLLAMA_URL env var to route all inference to a local Ollama server.

// IMPORTANT: These prompts are GRAMMAR-ONLY.
// The AI must NEVER add, invent, or infer any medical information not spoken by the user.
// It only fixes grammar, removes filler words, and removes repeated phrases.
const GRAMMAR_ONLY_SYSTEM_PROMPT = `You are a medical transcription editor. Your ONLY job is to clean up a raw voice transcript.

STRICT RULES — you MUST follow all of these:
1. Fix grammar and punctuation errors.
2. Remove filler words (um, uh, like, you know, hmm, er, etc.).
3. Remove exact duplicate sentences or phrases (keep only the first occurrence).
4. Capitalise the first letter of each sentence.
5. DO NOT add any information that was not spoken by the user.
6. DO NOT invent, infer, or suggest any medical terms, diagnoses, medications, symptoms, or clinical details.
7. DO NOT reorganise or reformat the content into sections or headers.
8. DO NOT change the meaning of any sentence.
9. Keep the output in the same language as the input.
10. Return ONLY the cleaned transcript text, nothing else — no explanations, no preamble.

If the user said "patient has chest pain and fever", output exactly that (cleaned) — do NOT add "possible cardiac event" or any other inference.`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  // ── OLLAMA INTEGRATION: Per-request provider override ─────────────────────
  // _providerOverride is injected by src/Dashboard.tsx from the user's Settings
  // panel choice (src/SettingsDrawer.tsx). It overrides OLLAMA_URL env var.
  // { mode: "ollama", ollamaUrl: "...", ollamaModel: "..." }  → Ollama path
  // { mode: "gemma" }                                          → Gemma 4 cloud
  // undefined                                                   → env-var routing
  // ───────────────────────────────────────────────────────────────────────────
  const { rawTranscript, _providerOverride } = req.body as {
    rawTranscript: string;
    module: string;
    _providerOverride?: unknown;
  };

  if (!rawTranscript || rawTranscript.trim().length < 5) {
    return res.status(400).json({ error: "Transcript too short" });
  }

  try {
    // invokeAI routes to Ollama (local) or Google AI Studio (cloud) based on OLLAMA_URL env var.
    const result = await invokeAI({
      systemPrompt: GRAMMAR_ONLY_SYSTEM_PROMPT,
      userMessage: `RAW TRANSCRIPT:\n${rawTranscript}`,
      maxTokens: 1024,
      temperature: 0.1,
      _providerOverride,
    });

    return res.status(200).json({
      cleanedNote:  result.content,
      usedModel:    result.model,
      provider:     result.provider,
      switchedFrom: result.switchedFrom,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown AI error";
    const isOllamaError = getProviderMode() === "ollama";
    return res.status(isOllamaError ? 503 : 429).json({ error: message });
  }
}
