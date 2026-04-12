import type { VercelRequest, VercelResponse } from "@vercel/node";

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

type ModelDef =
  | { type: "gemini-native"; model: string; label: string }
  | { type: "openai-compat"; model: string; label: string };

const MODELS: ModelDef[] = [
  { type: "openai-compat", model: "models/gemma-4-31b-it", label: "Gemma 4 31B"           },
  { type: "gemini-native", model: "gemini-2.5-flash",      label: "Gemini 2.5 Flash"      },
  { type: "gemini-native", model: "gemini-2.5-flash-lite", label: "Gemini 2.5 Flash-Lite" },
];

async function callCleanup(
  def: ModelDef,
  apiKey: string,
  rawText: string,
  signal: AbortSignal
): Promise<{ text: string | null; status: number; label: string }> {
  try {
    if (def.type === "gemini-native") {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${def.model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal,
          body: JSON.stringify({
            contents: [{ parts: [{ text: CLEANUP_PROMPT + "\n\nRAW PRESCRIPTION TEXT:\n\n" + rawText }] }],
            generationConfig: { maxOutputTokens: 4096, temperature: 0 },
          }),
        }
      );
      if (!res.ok) return { text: null, status: res.status, label: def.label };
      const data = await res.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? null;
      return { text, status: text ? 200 : 204, label: def.label };
    }

    // openai-compat (Gemma)
    const res = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        signal,
        body: JSON.stringify({
          model: def.model,
          messages: [
            { role: "system", content: CLEANUP_PROMPT },
            { role: "user", content: `RAW PRESCRIPTION TEXT:\n\n${rawText}` },
          ],
          max_tokens: 4096,
          temperature: 0,
        }),
      }
    );
    if (!res.ok) return { text: null, status: res.status, label: def.label };
    const data = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
    let text = data.choices?.[0]?.message?.content?.trim() ?? null;
    if (text) {
      text = text.replace(/<thought>[\s\S]*?<\/thought>/gi, "").trim();
      text = text.replace(/<thinking>[\s\S]*?<\/thinking>/gi, "").trim();
    }
    return { text, status: text ? 200 : 204, label: def.label };
  } catch (err) {
    const isAbort = err instanceof Error && err.name === "AbortError";
    return { text: null, status: isAbort ? 499 : 503, label: def.label };
  }
}

async function raceCleanup(apiKey: string, rawText: string): Promise<{ text: string | null; usedModel: string; allFailed: boolean }> {
  const controllers = MODELS.map(() => new AbortController());
  const promises = MODELS.map((def, i) =>
    callCleanup(def, apiKey, rawText, controllers[i].signal).then(r => ({ ...r, index: i }))
  );

  return new Promise((resolve) => {
    let pending = promises.length;
    let resolved = false;

    promises.forEach((p) => {
      p.then((result) => {
        pending--;
        if (result.status === 200 && result.text && !resolved) {
          resolved = true;
          controllers.forEach((c, i) => { if (i !== result.index) c.abort(); });
          resolve({ text: result.text, usedModel: result.label, allFailed: false });
          return;
        }
        if (pending === 0 && !resolved) {
          resolve({ text: null, usedModel: "", allFailed: true });
        }
      });
    });
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const apiKey = process.env.GOOGLE_AI_STUDIO_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "API key not configured" });

  const { extractedText } = req.body as { extractedText?: string };
  if (!extractedText) return res.status(400).json({ error: "extractedText is required" });

  const { text, allFailed } = await raceCleanup(apiKey, extractedText);

  if (allFailed || !text) {
    // Return original text if all models fail — client will parse it as-is
    return res.status(200).json({ cleanedText: extractedText, usedModel: "raw-fallback" });
  }

  return res.status(200).json({ cleanedText: text });
}
