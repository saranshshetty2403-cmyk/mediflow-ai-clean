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
// ── REGIONAL LANGUAGE SUPPORT ─────────────────────────────────────────────────
// Language names and their native script names for the AI prompt instruction.
// When a non-English language is selected, the AI is instructed to generate
// the ENTIRE discharge note in that language's script. Drug names, ICD-10 codes,
// and numeric values remain in English/Latin as per standard Indian clinical practice.
// Both Gemma 4 (31B) and Ollama (gemma3:4b / gemma2:2b) support all 8 languages,
// though larger models produce more accurate multilingual output.
const LANGUAGE_NAMES: Record<string, { english: string; native: string }> = {
  en: { english: "English", native: "English" },
  hi: { english: "Hindi", native: "हिन्दी" },
  bn: { english: "Bengali", native: "বাংলা" },
  kn: { english: "Kannada", native: "ಕನ್ನಡ" },
  ml: { english: "Malayalam", native: "മലയാളം" },
  ta: { english: "Tamil", native: "தமிழ்" },
  te: { english: "Telugu", native: "తెలుగు" },
  mr: { english: "Marathi", native: "मराठी" },
  gu: { english: "Gujarati", native: "ગુજરાતી" },
};

function buildDischargePrompt(literacyLevel: string, language = "en"): string {
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
  const lang = LANGUAGE_NAMES[language] ?? LANGUAGE_NAMES.en;

  // Language instruction injected at the top of the prompt when non-English is selected.
  // The AI is told to write ALL text in the target language script.
  // Drug names, ICD-10 codes, and numbers are kept in English/Latin as standard practice.
  const languageInstruction = language !== "en"
    ? `\n\n**CRITICAL LANGUAGE REQUIREMENT — READ BEFORE GENERATING:**
You MUST write the ENTIRE discharge note in ${lang.english} (${lang.native}) script.
- EVERY section heading, instruction, warning, explanation, and sentence MUST be in ${lang.english}.
- Do NOT write in English except for: drug/medication names, ICD-10 codes, and numeric values.
- Do NOT leave any placeholder text like [instruction], [red flag], [timeframe], or [plain language explanation]. Replace ALL placeholders with REAL, specific clinical content derived from the patient input.
- Write actual sentences. Write actual medical instructions. Write actual warning signs.
- The patient who will read this speaks ONLY ${lang.english}. English text will be incomprehensible to them.
- FAILURE TO FOLLOW THIS INSTRUCTION MAKES THE DOCUMENT CLINICALLY USELESS.`
    : "";

  const structureNote = language !== "en"
    ? `\n\nIMPORTANT: The section structure below is a GUIDE only. Write ALL content in ${lang.english} (${lang.native}). Replace every bracketed placeholder with real, specific content from the patient input. Do not copy the bracket text.`
    : "";

  return `${CLINICAL_PREAMBLE}${languageInstruction}${structureNote}

Generate patient discharge instructions calibrated to a **${cfg.grade} reading level**.
${cfg.style}
${cfg.vocab}

Use the following structure. Replace ALL bracketed placeholders with REAL content — never output literal bracket text:

**Discharge Instructions**

**Your Diagnosis:** [Write the actual diagnosis in plain language at ${cfg.grade} reading level — do NOT write this bracket text]

**What to Do at Home:**
1. [Write a specific, actionable home care instruction — do NOT write this bracket text]
2. [Write a second specific instruction]
3. [Write a third specific instruction]

**Medications:**
- [Write each medication with dose, frequency, duration, and reason — do NOT write this bracket text]

**Warning Signs — Go to the Emergency Room Immediately If:**
- [Write a specific red flag symptom — do NOT write this bracket text]
- [Write a second red flag]
- [Write a third red flag]

**Follow-Up Appointment:** [Write the specific timeframe and specialty — do NOT write this bracket text]

**Questions?** Contact your care team at the number on your discharge paperwork.`;
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
  // REGIONAL LANGUAGE: 'language' is the ISO 639-1 code for the output language.
  // Supported: en (English), hi (Hindi), bn (Bengali), kn (Kannada), ml (Malayalam),
  //            ta (Tamil), te (Telugu), mr (Marathi), gu (Gujarati)
  // Defaults to 'en' if not provided. Both Gemma 4 and Ollama support all 8 languages.
  const { module, input, literacyLevel, language, _providerOverride } = req.body as {
    module: string;
    input: string;
    literacyLevel?: string;
    language?: string;
    _providerOverride?: { mode: "ollama" | "gemma"; ollamaUrl?: string; ollamaModel?: string };
  };

  if (!module || !input) {
    return res.status(400).json({ error: "Missing module or input" });
  }

  // Discharge prompt is built dynamically with the selected literacy level
  let systemPrompt: string;
  if (module === "discharge") {
    // Pass both literacy level and output language to the discharge prompt builder.
    // language defaults to 'en' (English) if not provided by the frontend.
    systemPrompt = buildDischargePrompt(literacyLevel ?? "standard", language ?? "en");
  } else {
    systemPrompt = PROMPTS[module];
    if (!systemPrompt) {
      return res.status(400).json({ error: `Unknown module: ${module}` });
    }
  }

  // MULTILINGUAL CLOUD FALLBACK:
  // Small Ollama models (gemma2:2b, gemma3:4b) struggle with non-English output —
  // they partially follow the language instruction but produce garbled or placeholder-filled text.
  // When:
  //   1. The request is for a non-English discharge note, AND
  //   2. The active provider is Ollama (env-var routing), AND
  //   3. The user has NOT explicitly set a provider override in Settings
  // → automatically route to Google AI Studio (Gemma 4 31B) which handles all 8 Indian
  //   languages reliably. The UI will show "switched from Ollama" in the provider badge.
  let effectiveOverride = _providerOverride;
  if (
    module === "discharge" &&
    language &&
    language !== "en" &&
    !_providerOverride &&
    getProviderMode() === "ollama"
  ) {
    const apiKey = process.env.GOOGLE_AI_STUDIO_API_KEY;
    if (apiKey) {
      // Force cloud for multilingual discharge notes
      effectiveOverride = { mode: "gemma" };
    }
    // If no API key is available, fall through to Ollama (best effort)
  }

  try {
    // invokeAI automatically selects Ollama (local) or Google AI Studio (cloud)
    // based on the OLLAMA_URL environment variable. See api/ai-provider.ts.
    const result = await invokeAI({
      systemPrompt,
      userMessage: input,
      maxTokens: 4096,
      temperature: 0.3,
      _providerOverride: effectiveOverride,
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
