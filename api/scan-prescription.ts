import type { VercelRequest, VercelResponse } from "@vercel/node";
import { invokeAI, getProviderMode } from "./ai-provider";
// Provider routing (Ollama local vs Google AI Studio cloud) is handled by _ai-provider.ts.
// Set OLLAMA_URL env var to route all inference to a local Ollama server.

// This endpoint takes raw OCR-extracted prescription text and:
// 1. Resolves [illegible: best guess = X] markers using pharmacological context
// 2. Cleans up formatting and expands abbreviations
// 3. Returns a clean structured medication list ready for client-side parsing

const CLEANUP_PROMPT = `You are a senior clinical pharmacist AI. You have been given a raw OCR transcription of a prescription that may contain:
- [illegible: best guess = X] markers where text was unclear
- Abbreviated drug names, dosages, or instructions
- Inconsistent formatting

Your task:
1. Resolve ALL [illegible: best guess = X] markers — use the pharmacological context (drug class, dosage, form) to confirm or correct the best guess. Replace the marker with just the resolved text.
2. Expand all prescription abbreviations to full English: OD/QD=once daily, BD/BID=twice daily, TDS/TID=three times daily, QID=four times daily, SOS/PRN=as needed, AC=before meals, PC=after meals, HS=at bedtime, stat=immediately, tabs=tablets, cap=capsule, syr=syrup, inj=injection, susp=suspension, oint=ointment.
3. Correct obvious drug name misspellings using pharmacological knowledge.
4. IMPORTANT: Do NOT invent or add any information not present in the original text. Only clean and clarify what is already there.

Return the cleaned prescription in this EXACT format:

**MEDICATION LIST**

**1. [Drug Name]**
- Strength: [dosage/strength]
- Form: [tablet/capsule/syrup/injection/cream/drops/etc.]
- Frequency: [full English — e.g. "Once daily" not "OD"]
- Duration: [how long]
- Route: [oral/topical/inhaled/etc.]
- Quantity: [amount prescribed]
- Instructions: [special instructions or "None"]

[repeat for each medication]

**PRESCRIPTION DETAILS**
- Prescribing Doctor: [name or "Not visible"]
- Date: [date or "Not visible"]
- Patient: [name or "Not visible"]
- Clinic/Hospital: [name or "Not visible"]

**PHARMACIST NOTES**
[Any drug interaction warnings or "No significant interactions noted."]`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { extractedText } = req.body as { extractedText?: string };
  if (!extractedText) return res.status(400).json({ error: "extractedText is required" });

  try {
    // invokeAI routes to Ollama (local) or Google AI Studio (cloud) based on OLLAMA_URL env var.
    // temperature: 0 for prescription cleanup — we want deterministic, factual output.
    const result = await invokeAI({
      systemPrompt: CLEANUP_PROMPT,
      userMessage:  `RAW PRESCRIPTION TEXT:\n\n${extractedText}`,
      maxTokens:    4096,
      temperature:  0,
    });

    return res.status(200).json({
      cleanedText: result.content,
      usedModel:   result.model,
      provider:    result.provider,
    });
  } catch {
    // If AI cleanup fails for any reason, return the original OCR text so the
    // client can still parse it as-is rather than showing a hard error.
    const isOllamaMode = getProviderMode() === "ollama";
    return res.status(200).json({
      cleanedText: extractedText,
      usedModel:   isOllamaMode ? "raw-fallback (ollama-unavailable)" : "raw-fallback",
    });
  }
}
