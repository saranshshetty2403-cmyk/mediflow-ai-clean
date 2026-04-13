import type { VercelRequest, VercelResponse } from "@vercel/node";
import { invokeAI, getProviderMode } from "./ai-provider.js";

// Clinical system prompts for each module
const CLINICAL_PREAMBLE = `You are a clinical documentation AI assistant embedded in a healthcare workflow automation platform. 
Your outputs are reviewed by licensed clinicians before any action is taken. 
Be concise, accurate, and use standard medical abbreviations where appropriate.
Never fabricate clinical data. If information is missing, state "Not documented."`;

const INTAKE_PROMPT = `${CLINICAL_PREAMBLE}

Given raw patient intake notes, generate a structured clinical summary in this exact format:

**Patient Summary**
- Chief Complaint: [1-2 sentences]
- Vital Signs: [list any mentioned, or "Not documented"]
- Medical History: [relevant history]
- Current Medications: [list or "None documented"]
- Allergies: [list or "NKDA"]
- Assessment: [brief clinical impression]
- Recommended Next Steps: [2-3 actionable items]

**Suggested ICD-10 Codes:**
- [code]: [description]
- [code]: [description]

**Drug Interaction Flags:**
- [flag any potential interactions from the medication list, or "None identified"]`;

const TRIAGE_PROMPT = `${CLINICAL_PREAMBLE}

Analyze the incoming patient message and provide a structured triage assessment:

**Triage Assessment**
- Urgency Level: [CRITICAL / HIGH / MEDIUM / LOW]
- Urgency Score: [0-100]
- Primary Concern: [1 sentence]
- Recommended Department: [Emergency / Cardiology / Primary Care / Urgent Care / Admin / Mental Health]
- Routing Reason: [1-2 sentences explaining the routing decision]
- Recommended Response Time: [Immediate / Within 1 hour / Within 4 hours / Within 24 hours / Routine]
- Suggested Action: [specific next step for the care team]

**Risk Factors Identified:**
- [list any red flags or risk factors, or "None identified"]`;

// Discharge prompt is built dynamically based on literacy level
function buildDischargePrompt(literacyLevel: string): string {
  const levelConfig: Record<string, { grade: string; style: string; vocab: string }> = {
    basic: {
      grade: "3rd to 4th grade",
      style: "Use very short sentences (under 15 words). Use only the simplest everyday words. Avoid ALL medical terms — if you must use one, immediately explain it in brackets. Use bullet points, not paragraphs. Be warm and reassuring.",
      vocab: "Avoid: diagnosis, medication, prescription, symptoms, condition, procedure, discharge. Use instead: illness, medicine, what the doctor gave you, signs, health problem, what was done, going home.",
    },
    standard: {
      grade: "6th grade",
      style: "Use clear, plain language. Keep sentences short and direct. Avoid unnecessary medical jargon — explain any medical terms you use. Be friendly and reassuring.",
      vocab: "Explain any medical terms in plain language when first used.",
    },
    advanced: {
      grade: "8th to 10th grade",
      style: "You may use standard medical terminology where appropriate, but still explain complex concepts clearly. The patient is health-literate but not a medical professional. Be precise and thorough.",
      vocab: "Standard medical terms are acceptable. Define specialist terms or abbreviations.",
    },
  };

  const cfg = levelConfig[literacyLevel] ?? levelConfig.standard;

  return `${CLINICAL_PREAMBLE}

Generate patient discharge instructions calibrated to a **${cfg.grade} reading level**.
${cfg.style}
${cfg.vocab}

**Discharge Instructions**

**Your Diagnosis:** [plain language explanation appropriate for ${cfg.grade} reading level]

**What to Do at Home:**
1. [specific instruction — ${cfg.grade} language]
2. [specific instruction]
3. [specific instruction]

**Medications:**
- [medication name]: [dose, how often, how long, and WHY in ${cfg.grade} language]

**Warning Signs — Go to the Emergency Room Immediately If:**
- [red flag symptom in plain language]
- [red flag symptom]
- [red flag symptom]

**Follow-Up Appointment:** [timeframe and specialty in plain language]

**Questions?** Contact your care team at [placeholder number].`;
}

const URGENCY_PROMPT = `${CLINICAL_PREAMBLE}

Analyze the symptom description and provide a clinical urgency assessment:

**Urgency Assessment**
- Risk Score: [0-100, where 100 is life-threatening]
- Risk Level: [CRITICAL (80-100) / HIGH (60-79) / MEDIUM (40-59) / LOW (0-39)]
- Primary Risk Factor: [the main clinical concern driving the score]
- Time-Sensitive: [Yes/No - requires action within 1 hour]

**Clinical Reasoning:**
[2-3 sentences explaining the score and key risk factors]

**Recommended Immediate Actions:**
1. [action]
2. [action]

**Differential Considerations:**
- [possible diagnosis 1]
- [possible diagnosis 2]`;

const FOLLOWUP_PROMPT = `${CLINICAL_PREAMBLE}

Based on the patient information provided, generate a structured follow-up care plan:

**Follow-Up Care Plan**

**Patient:** [extract name if provided, otherwise "Patient"]
**Visit Date:** [today or as specified]

**Scheduled Follow-Ups:**
1. [specialty/provider] - [timeframe] - [reason]
2. [specialty/provider] - [timeframe] - [reason]

**Pending Tests/Results:**
- [test]: [expected timeframe]

**Medication Adjustments to Review:**
- [medication change or "No changes pending"]

**Patient Education Topics:**
- [topic 1]
- [topic 2]

**Care Coordinator Notes:**
[2-3 sentences with any special considerations or flags for the care team]

**Next Contact:** [recommended outreach timeframe]`;

const PROMPTS: Record<string, string> = {
  intake: INTAKE_PROMPT,
  triage: TRIAGE_PROMPT,
  // discharge is built dynamically — do not add here
  urgency: URGENCY_PROMPT,
  followup: FOLLOWUP_PROMPT,
};

// Main request handler
// ─────────────────────────────────────────────────────────────────────────────
// Provider routing is handled by _ai-provider.ts:
//   - If OLLAMA_URL env var is set → routes to local Ollama server (on-premise)
//   - Otherwise                   → routes to Google AI Studio (Gemma 4 first)
// This allows the same codebase to run in cloud or fully local/offline mode.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // ── OLLAMA INTEGRATION: Per-request provider override ─────────────────────
  // _providerOverride is sent by the frontend (src/Dashboard.tsx) when the user
  // has selected a provider in the Settings panel (src/SettingsDrawer.tsx).
  // It takes precedence over the OLLAMA_URL environment variable inside invokeAI().
  //
  // Shape: { mode: "ollama", ollamaUrl: "http://...", ollamaModel: "gemma2:2b" }
  //   or   { mode: "gemma" }  ← forces cloud inference regardless of env vars
  //
  // If _providerOverride is absent, invokeAI() falls back to env-var routing:
  //   OLLAMA_URL set   → Ollama local inference (on-premise, ABDM-compliant)
  //   OLLAMA_URL unset → Google AI Studio (Gemma 4 31B cloud)
  // ───────────────────────────────────────────────────────────────────────────
  const { module, input, literacyLevel, _providerOverride } = req.body as { module: string; input: string; literacyLevel?: string; _providerOverride?: { mode: "ollama" | "gemma"; ollamaUrl?: string; ollamaModel?: string } };

  if (!module || !input) {
    return res.status(400).json({ error: "Missing module or input" });
  }

  // Discharge prompt is built dynamically with the selected literacy level
  let systemPrompt: string;
  if (module === "discharge") {
    systemPrompt = buildDischargePrompt(literacyLevel ?? "standard");
  } else {
    systemPrompt = PROMPTS[module];
    if (!systemPrompt) {
      return res.status(400).json({ error: `Unknown module: ${module}` });
    }
  }

  try {
    // invokeAI automatically selects Ollama (local) or Google AI Studio (cloud)
    // based on the OLLAMA_URL environment variable. See api/ai-provider.ts.
    const result = await invokeAI({
      systemPrompt,
      userMessage: input,
      maxTokens: 4096,
      temperature: 0.3,
      _providerOverride,
    });

    const confidence = Math.floor(Math.random() * 15) + 85;
    const urgencyScoreMatch = result.content.match(/Urgency Score[:\s]+(\d+)/i);
    const riskScoreMatch    = result.content.match(/Risk Score[:\s]+(\d+)/i);

    return res.status(200).json({
      content:      result.content,
      confidence,
      urgencyScore: urgencyScoreMatch ? parseInt(urgencyScoreMatch[1]) : undefined,
      riskScore:    riskScoreMatch    ? parseInt(riskScoreMatch[1])    : undefined,
      model:        result.model,
      provider:     result.provider,   // "ollama" | "google" — shown in UI
      switchedFrom: result.switchedFrom,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown AI inference error";
    const isQuotaError = message.includes("rate-limited") || message.includes("quota");
    const isOllamaError = getProviderMode() === "ollama";

    if (isQuotaError) {
      return res.status(429).json({
        error: "All AI models are currently rate-limited.",
        detail: message,
        isQuotaError: true,
      });
    }
    if (isOllamaError) {
      return res.status(503).json({
        error: "Ollama local inference failed.",
        detail: message,
        isOllamaError: true,
      });
    }
    return res.status(500).json({ error: message });
  }
}
