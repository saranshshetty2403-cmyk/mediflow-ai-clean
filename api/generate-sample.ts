import type { VercelRequest, VercelResponse } from "@vercel/node";
import { invokeAI, getProviderMode } from "./ai-provider.js";
// Provider routing (Ollama local vs Google AI Studio cloud) is handled by _ai-provider.ts.
// Set OLLAMA_URL env var to route all inference to a local Ollama server.

const MODULE_SAMPLE_PROMPTS: Record<string, string> = {
  intake: `Generate a realistic, filled-in patient intake note for a clinical AI demo.
ALWAYS start the note with: "Patient: [Full Name], [Age][M/F]" on the first line (e.g. "Patient: Maria Santos, 58F").
Then include: chief complaint, vital signs (BP, HR, Temp, SpO2, RR), presenting symptoms with duration, relevant past medical history, current medications, allergies, and brief social history.
Make it medically realistic and varied each time. Return ONLY the clinical note text. 2-4 paragraphs.`,

  triage: `Generate a realistic patient triage message or complaint as it would arrive in a hospital messaging system.
ALWAYS start with: "Patient: [Full Name], [Age][M/F]" on the first line (e.g. "Patient: James Lee, 45M").
Then include: chief complaint, symptom onset and duration, severity (1-10), any associated symptoms, and brief context.
Make it varied and medically realistic. Return ONLY the patient message text.`,

  discharge: `Generate realistic clinical discharge information for a patient.
ALWAYS start with: "Patient: [Full Name], [Age][M/F]" on the first line (e.g. "Patient: James Chen, 45M").
Then include: diagnosis, procedures performed, hospital course summary, discharge medications with doses, activity restrictions, diet instructions, follow-up appointments, and warning signs to watch for.
Make it medically realistic. Return ONLY the clinical text.`,

  urgency: `Generate a realistic symptom description that a nurse would enter for urgency scoring.
ALWAYS start with: "Patient: [Full Name], [Age][M/F]" on the first line (e.g. "Patient: Robert Kim, 67M").
Then include: chief complaint, vital signs, symptom onset, severity, associated symptoms, and relevant history. Vary the urgency level (some critical, some low).
Return ONLY the symptom description text.`,

  followup: `Generate realistic patient information for a follow-up care plan.
ALWAYS start with: "Patient: [Full Name], [Age][M/F]" on the first line (e.g. "Patient: Sarah Mitchell, 52F").
Then include: recent diagnosis or procedure, current medications, pending tests or results, outstanding referrals, and any special care considerations.
Make it medically realistic. Return ONLY the patient information text.`,
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { module, previousSample, existingNames } = req.body as {
    module: string;
    previousSample?: string;
    existingNames?: string[];
  };

  if (!module) return res.status(400).json({ error: "Missing module" });

  const basePrompt = MODULE_SAMPLE_PROMPTS[module];
  if (!basePrompt) return res.status(400).json({ error: `Unknown module: ${module}` });

  // Build the exclusion clause if there are already-used names in the queue
  const exclusionClause =
    existingNames && existingNames.length > 0
      ? `\n\nCRITICAL: The following patient names are already in the queue. You MUST NOT use any of them or any variation of them. Generate a completely different name:\n${existingNames.map((n) => `- ${n}`).join("\n")}`
      : "";

  const userPrompt = previousSample
    ? `${basePrompt}${exclusionClause}\n\nIMPORTANT: Generate a DIFFERENT scenario from this previous sample:\n"${previousSample.slice(0, 200)}..."`
    : `${basePrompt}${exclusionClause}`;

  const systemPrompt =
    "You are a medical education assistant that generates realistic clinical sample data for training purposes. All data is fictional and for demo use only.";

  try {
    // invokeAI routes to Ollama (local) or Google AI Studio (cloud) based on OLLAMA_URL env var.
    const result = await invokeAI({
      systemPrompt,
      userMessage: userPrompt,
      maxTokens: 800,
      temperature: 0.9, // Higher temperature for varied sample generation
    });

    return res.status(200).json({
      sample:   result.content,
      model:    result.model,
      provider: result.provider,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown AI error";
    const isOllamaError = getProviderMode() === "ollama";
    return res.status(isOllamaError ? 503 : 502).json({ error: message });
  }
}
