import type { VercelRequest, VercelResponse } from "@vercel/node";

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

  const { rawTranscript, module } = req.body as {
    rawTranscript: string;
    module: string;
  };

  if (!rawTranscript || rawTranscript.trim().length < 5) {
    return res.status(400).json({ error: "Transcript too short" });
  }

  const systemPrompt = MODULE_FORMAT_PROMPTS[module] ?? MODULE_FORMAT_PROMPTS.intake;
  const apiKey = process.env.GOOGLE_AI_STUDIO_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "API key not configured" });

  // Try Gemma 4 31B first, fall back to Gemini 2.5 Flash
  const models = [
    { type: "openai-compat", model: "models/gemma-4-31b-it", label: "Gemma 4 31B" },
    { type: "gemini-native", model: "gemini-2.5-flash", label: "Gemini 2.5 Flash" },
  ];

  for (const def of models) {
    try {
      let responseText: string | null = null;

      if (def.type === "gemini-native") {
        const resp = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${def.model}:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    { text: `${systemPrompt}\n\nRAW TRANSCRIPT:\n${rawTranscript}` },
                  ],
                },
              ],
              generationConfig: { maxOutputTokens: 1024, temperature: 0.2 },
            }),
          }
        );
        if (!resp.ok) {
          if (resp.status === 429 || resp.status === 404) continue;
          const err = await resp.text();
          return res.status(502).json({ error: `API error ${resp.status}`, detail: err.slice(0, 300) });
        }
        const data = await resp.json() as {
          candidates: Array<{ content: { parts: Array<{ text: string }> } }>;
        };
        responseText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? null;
      } else {
        // OpenAI-compat (Gemma)
        const resp = await fetch(
          "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model: def.model,
              messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: `RAW TRANSCRIPT:\n${rawTranscript}` },
              ],
              max_tokens: 1024,
              temperature: 0.2,
            }),
          }
        );
        if (!resp.ok) {
          if (resp.status === 429) continue;
          const err = await resp.text();
          return res.status(502).json({ error: `API error ${resp.status}`, detail: err.slice(0, 300) });
        }
        const data = await resp.json() as {
          choices: Array<{ message: { content: string } }>;
        };
        let text = data.choices?.[0]?.message?.content ?? null;
        if (text) {
          // Strip Gemma thought tags
          text = text.replace(/<thought>[\s\S]*?<\/thought>/gi, "").trim();
        }
        responseText = text;
      }

      if (responseText) {
        return res.status(200).json({
          cleanedNote: responseText,
          usedModel: def.label,
          switchedFrom: fallbackLog.length > 0 ? [...fallbackLog] : undefined,
        });
      }
    } catch {
      continue;
    }
  }

  return res.status(429).json({
    error: "All AI models are currently unavailable. Please try again shortly.",
  });
}
