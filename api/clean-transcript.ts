import type { VercelRequest, VercelResponse } from "@vercel/node";
import { invokeAI, getProviderMode } from "./ai-provider.js";
// Provider routing (Ollama local vs Google AI Studio cloud) is handled by _ai-provider.ts.
// Set OLLAMA_URL env var to route all inference to a local Ollama server.

const MODULE_FORMAT_PROMPTS: Record<string, string> = {
  intake: `You are a clinical documentation assistant. You will receive a raw voice transcript that may contain repeated phrases, filler words, and speech artifacts.

Your job is to:
1. Remove ALL duplicate or repeated sentences/phrases (keep only one occurrence)
2. Remove filler words (um, uh, like, you know, etc.)
3. Organize the content into a clean clinical intake note with these sections where applicable:
   - Patient: [Name, Age, Sex if mentioned]
   - Chief Complaint:
   - History of Present Illness:
   - Vital Signs: (if mentioned)
   - Medications: (if mentioned)
   - Allergies: (if mentioned)
   - Medical History: (if mentioned)
4. Use professional clinical language
5. Keep it concise but complete

Return ONLY the formatted note, no explanations.`,

  triage: `You are a clinical documentation assistant. You will receive a raw voice transcript that may contain repeated phrases, filler words, and speech artifacts.

Your job is to:
1. Remove ALL duplicate or repeated sentences/phrases (keep only one occurrence)
2. Remove filler words (um, uh, like, you know, etc.)
3. Organize the content into a clean triage note with these sections where applicable:
   - Patient: [Name, Age, Sex if mentioned]
   - Chief Complaint:
   - Symptom Description:
   - Onset & Duration:
   - Severity (1-10):
   - Associated Symptoms:
4. Use professional clinical language
5. Keep it concise but complete

Return ONLY the formatted note, no explanations.`,

  discharge: `You are a clinical documentation assistant. You will receive a raw voice transcript that may contain repeated phrases, filler words, and speech artifacts.

Your job is to:
1. Remove ALL duplicate or repeated sentences/phrases (keep only one occurrence)
2. Remove filler words (um, uh, like, you know, etc.)
3. Organize the content into a clean discharge note with these sections where applicable:
   - Patient: [Name, Age, Sex if mentioned]
   - Diagnosis:
   - Procedures Performed:
   - Discharge Medications:
   - Follow-up Instructions:
   - Warning Signs to Watch For:
4. Use professional clinical language

Return ONLY the formatted note, no explanations.`,

  urgency: `You are a clinical documentation assistant. You will receive a raw voice transcript that may contain repeated phrases, filler words, and speech artifacts.

Your job is to:
1. Remove ALL duplicate or repeated sentences/phrases (keep only one occurrence)
2. Remove filler words (um, uh, like, you know, etc.)
3. Organize the content into a clean urgency assessment note with these sections where applicable:
   - Patient: [Name, Age, Sex if mentioned]
   - Presenting Symptoms:
   - Onset & Duration:
   - Severity:
   - Vital Signs: (if mentioned)
   - Relevant History:
4. Use professional clinical language

Return ONLY the formatted note, no explanations.`,

  followup: `You are a clinical documentation assistant. You will receive a raw voice transcript that may contain repeated phrases, filler words, and speech artifacts.

Your job is to:
1. Remove ALL duplicate or repeated sentences/phrases (keep only one occurrence)
2. Remove filler words (um, uh, like, you know, etc.)
3. Organize the content into a clean follow-up note with these sections where applicable:
   - Patient: [Name, Age, Sex if mentioned]
   - Reason for Follow-up:
   - Current Status:
   - Medications:
   - Pending Tests/Referrals:
   - Next Steps:
4. Use professional clinical language

Return ONLY the formatted note, no explanations.`,
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  # ── OLLAMA INTEGRATION: Per-request provider override ─────────────────────
  # _providerOverride is injected by src/Dashboard.tsx from the user's Settings
  # panel choice (src/SettingsDrawer.tsx). It overrides OLLAMA_URL env var.
  # { mode: "ollama", ollamaUrl: "...", ollamaModel: "..." }  → Ollama path
  # { mode: "gemma" }                                          → Gemma 4 cloud
  # undefined                                                   → env-var routing
  # ───────────────────────────────────────────────────────────────────────────
  const { rawTranscript, module, _providerOverride } = req.body as {
    rawTranscript: string;
    module: string;
  };

  if (!rawTranscript || rawTranscript.trim().length < 5) {
    return res.status(400).json({ error: "Transcript too short" });
  }

  const systemPrompt = MODULE_FORMAT_PROMPTS[module] ?? MODULE_FORMAT_PROMPTS.intake;

  try {
    // invokeAI routes to Ollama (local) or Google AI Studio (cloud) based on OLLAMA_URL env var.
    const result = await invokeAI({
      systemPrompt,
      userMessage: `RAW TRANSCRIPT:\n${rawTranscript}`,
      maxTokens: 1024,
      temperature: 0.2,
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
