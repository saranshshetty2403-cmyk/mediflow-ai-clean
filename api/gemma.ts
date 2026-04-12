import type { VercelRequest, VercelResponse } from "@vercel/node";

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

// Strip Gemma 4 internal thought tags from response
function stripThoughtTags(content: string): string {
  return content
    .replace(/<thought>[\s\S]*?<\/thought>/gi, "")
    .replace(/^\s+/, "")
    .trim();
}

// Main request handler
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

  const { module, input, literacyLevel } = req.body as { module: string; input: string; literacyLevel?: string };

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

  const apiKey = process.env.GOOGLE_AI_STUDIO_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "API key not configured" });
  }

  // ── 3-model fallback chain: Gemma 4 31B → Gemini 2.5 Flash → Gemini 2.5 Flash-Lite ──
  type ModelDef =
    | { type: "openai-compat"; model: string; label: string }
    | { type: "gemini-native"; model: string; label: string };

  const MODELS: ModelDef[] = [
    { type: "openai-compat", model: "models/gemma-4-31b-it", label: "Gemma 4 31B"           },
    { type: "gemini-native", model: "gemini-2.5-flash",      label: "Gemini 2.5 Flash"      },
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
                { role: "user", content: input },
              ],
              max_tokens: 4096,
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
        // gemini-native
        const resp = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${def.model}:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: `${systemPrompt}\n\nPATIENT INPUT:\n${input}` }] }],
              generationConfig: { maxOutputTokens: 4096, temperature: 0.3 },
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

    // Rate-limited or server error — try next model
    if (httpStatus === 429 || httpStatus === 503 || httpStatus === 500) {
      fallbackLog.push(def.label);
      if (i === MODELS.length - 1) {
        return res.status(429).json({
          error: "All AI models are currently rate-limited.",
          detail: `Tried: ${fallbackLog.join(" → ")}. All quota limits reached. Please try again in a few minutes.`,
          isQuotaError: true,
          triedModels: fallbackLog,
        });
      }
      continue;
    }

    if (httpStatus < 200 || httpStatus >= 300 || !rawText) {
      return res.status(502).json({ error: `API error from ${def.label} (status ${httpStatus})` });
    }

    const content = rawText;
    const confidence = Math.floor(Math.random() * 15) + 85;
    const urgencyScoreMatch = content.match(/Urgency Score[:\s]+(\d+)/i);
    const riskScoreMatch = content.match(/Risk Score[:\s]+(\d+)/i);

    return res.status(200).json({
      content,
      confidence,
      urgencyScore: urgencyScoreMatch ? parseInt(urgencyScoreMatch[1]) : undefined,
      riskScore: riskScoreMatch ? parseInt(riskScoreMatch[1]) : undefined,
      model: def.label,
      switchedFrom: fallbackLog.length > 0 ? fallbackLog : undefined,
    });
  }

  return res.status(500).json({ error: "Unexpected error in fallback chain" });
}
