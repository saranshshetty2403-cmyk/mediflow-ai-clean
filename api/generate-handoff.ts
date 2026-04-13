import type { VercelRequest, VercelResponse } from "@vercel/node";
import { invokeAI, getProviderMode } from "./ai-provider.js";
// Provider routing (Ollama local vs Google AI Studio cloud) is handled by _ai-provider.ts.
// Set OLLAMA_URL env var to route all inference to a local Ollama server.

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { caseSummaries, totalActive, _providerOverride } = req.body as {
    caseSummaries: string;
    totalActive: number;
  };

  if (!caseSummaries) {
    return res.status(400).json({ error: "Missing caseSummaries" });
  }

  const systemPrompt = `You are a senior charge nurse preparing a structured shift handoff report using the SBAR format (Situation, Background, Assessment, Recommendation). Be concise, clinical, and actionable. Keep the report under 450 words.`;

  const userPrompt = `Active queue cases (${totalActive} total):\n\n${caseSummaries}\n\nGenerate a structured SBAR handoff report for the incoming shift team. Include:\n- SITUATION: Overall status of the unit and active case count\n- BACKGROUND: Brief context on case distribution by urgency and department\n- ASSESSMENT: Cases requiring immediate attention (Critical/High urgency), highlight top 3-5 priority patients\n- RECOMMENDATION: Recommended priorities and actions for the incoming team\n\nUse clear clinical language. Format with bold section headers.`;

  try {
    // invokeAI routes to Ollama (local) or Google AI Studio (cloud) based on OLLAMA_URL env var.
    const result = await invokeAI({
      systemPrompt,
      userMessage: userPrompt,
      maxTokens: 1024,
      temperature: 0.3,
      _providerOverride,
    });

    return res.status(200).json({
      content:      result.content,
      model:        result.model,
      provider:     result.provider,
      switchedFrom: result.switchedFrom,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown AI error";
    const isOllamaError = getProviderMode() === "ollama";
    return res.status(isOllamaError ? 503 : 429).json({ error: message });
  }
}
