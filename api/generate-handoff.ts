import type { VercelRequest, VercelResponse } from "@vercel/node";

function stripThoughtTags(text: string): string {
  return text.replace(/<thinking>[\s\S]*?<\/thinking>/gi, "").trim();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { caseSummaries, totalActive } = req.body as {
    caseSummaries: string;
    totalActive: number;
  };

  if (!caseSummaries) {
    return res.status(400).json({ error: "Missing caseSummaries" });
  }

  const apiKey = process.env.GOOGLE_AI_STUDIO_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "API key not configured" });
  }

  const systemPrompt = `You are a senior charge nurse preparing a structured shift handoff report using the SBAR format (Situation, Background, Assessment, Recommendation). Be concise, clinical, and actionable. Keep the report under 450 words.`;

  const userPrompt = `Active queue cases (${totalActive} total):\n\n${caseSummaries}\n\nGenerate a structured SBAR handoff report for the incoming shift team. Include:\n- SITUATION: Overall status of the unit and active case count\n- BACKGROUND: Brief context on case distribution by urgency and department\n- ASSESSMENT: Cases requiring immediate attention (Critical/High urgency), highlight top 3-5 priority patients\n- RECOMMENDATION: Recommended priorities and actions for the incoming team\n\nUse clear clinical language. Format with bold section headers.`;

  type ModelDef =
    | { type: "openai-compat"; model: string; label: string }
    | { type: "gemini-native"; model: string; label: string };

  const MODELS: ModelDef[] = [
    { type: "openai-compat", model: "models/gemma-4-31b-it", label: "Gemma 4 31B" },
    { type: "gemini-native", model: "gemini-2.5-flash", label: "Gemini 2.5 Flash" },
    { type: "gemini-native", model: "gemini-2.5-flash-lite", label: "Gemini 2.5 Flash-Lite" },
  ];

  const fallbackLog: string[] = [];

  for (let i = 0; i < MODELS.length; i++) {
    const def = MODELS[i];
    let rawText: string | null = null;
    let httpStatus = 500;

    try {
      if (def.type === "openai-compat") {
        const resp = await fetch(
          "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
          {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
            body: JSON.stringify({
              model: def.model,
              messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt },
              ],
              max_tokens: 1024,
              temperature: 0.3,
            }),
          }
        );
        httpStatus = resp.status;
        if (resp.ok) {
          const data = await resp.json() as { choices: Array<{ message: { content: string } }> };
          rawText = data.choices?.[0]?.message?.content ?? null;
          if (rawText) rawText = stripThoughtTags(rawText);
        }
      } else {
        const resp = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${def.model}:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
              generationConfig: { maxOutputTokens: 1024, temperature: 0.3 },
            }),
          }
        );
        httpStatus = resp.status;
        if (resp.ok) {
          const data = await resp.json() as {
            candidates: Array<{ content: { parts: Array<{ text: string }> } }>;
          };
          rawText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? null;
        }
      }
    } catch {
      fallbackLog.push(def.label);
      continue;
    }

    if (httpStatus === 429 || httpStatus === 503 || httpStatus === 500) {
      fallbackLog.push(def.label);
      if (i === MODELS.length - 1) {
        return res.status(429).json({ error: "All AI models are currently rate-limited. Please try again in a few minutes." });
      }
      continue;
    }

    if (httpStatus < 200 || httpStatus >= 300 || !rawText) {
      return res.status(502).json({ error: `API error from ${def.label} (status ${httpStatus})` });
    }

    return res.status(200).json({ content: rawText, model: def.label });
  }

  return res.status(500).json({ error: "Unexpected error in fallback chain" });
}
