import type { VercelRequest, VercelResponse } from "@vercel/node";
// NOTE: extract-from-image.ts handles vision/image tasks that require multimodal models.
// Ollama with gemma3:4b supports vision via the same OpenAI-compatible /v1/chat/completions
// endpoint using image_url content blocks — identical to the Google AI Studio format.
// When OLLAMA_URL is set, the callModel function routes to the local Ollama server instead.
import { getProviderMode } from "./ai-provider.js";

// ── Non-medscan module prompts (handwriting-aware) ─────────────────────────
const MODULE_EXTRACT_PROMPTS: Record<string, string> = {
  intake: `You are a clinical OCR assistant with expertise in reading both printed and handwritten medical documents.
Your task is to extract all clinical information from this medical document image — which may be a handwritten nursing note, doctor's note, patient intake form, or any other clinical paperwork.

IMPORTANT: Handwritten documents are fully supported. Even if the handwriting is messy, cursive, or uses medical abbreviations, do your best to transcribe and interpret the content accurately.

Extract everything relevant: patient demographics, chief complaint, vital signs (BP, HR, RR, SpO2, temp), symptoms, medical history, current medications, allergies, and any clinical observations.
Return the extracted text in clean, readable prose suitable for clinical AI processing.
Only say "No clinical text found" if the image is completely blank or contains no medical content whatsoever.`,

  triage: `You are a clinical OCR assistant with expertise in reading both printed and handwritten medical documents.
Your task is to extract triage-relevant information from this medical document image — which may be a handwritten nursing note, patient complaint form, or any clinical paperwork.

IMPORTANT: Handwritten documents are fully supported. Transcribe carefully and use clinical context to resolve ambiguous handwriting.

Extract everything relevant: patient details, chief complaint, symptom description, onset, severity, vital signs, and any urgency indicators or red flags.
Return the extracted text in clean, readable prose.
Only say "No clinical text found" if the image is completely blank or contains no medical content whatsoever.`,

  discharge: `You are a clinical OCR assistant with expertise in reading both printed and handwritten medical documents.
Your task is to extract discharge-relevant information from this medical document image — which may be a handwritten discharge note, summary sheet, or any clinical paperwork.

IMPORTANT: Handwritten documents are fully supported. Transcribe carefully and use clinical context to resolve ambiguous handwriting.

Extract everything relevant: diagnosis, procedures performed, medications prescribed, discharge instructions, follow-up appointments, and warning signs to watch for.
Return the extracted text in clean, readable prose.
Only say "No clinical text found" if the image is completely blank or contains no medical content whatsoever.`,

  urgency: `You are a clinical OCR assistant with expertise in reading both printed and handwritten medical documents.
Your task is to extract urgency-relevant clinical information from this medical document image — which may be a handwritten nursing note, observation chart, or any clinical paperwork.

IMPORTANT: Handwritten documents are fully supported. Transcribe carefully and use clinical context to resolve ambiguous handwriting.

Extract everything relevant: patient details, symptoms, vital signs, onset, severity, relevant history, and any clinical observations indicating urgency or risk.
Return the extracted text in clean, readable prose suitable for urgency scoring.
Only say "No clinical text found" if the image is completely blank or contains no medical content whatsoever.`,

  followup: `You are a clinical OCR assistant with expertise in reading both printed and handwritten medical documents.
Your task is to extract follow-up relevant information from this medical document image — which may be a handwritten care plan, post-visit note, or any clinical paperwork.

IMPORTANT: Handwritten documents are fully supported. Transcribe carefully and use clinical context to resolve ambiguous handwriting.

Extract everything relevant: patient details, diagnosis, current medications, pending tests or investigations, referrals, and follow-up instructions.
Return the extracted text in clean, readable prose.
Only say "No clinical text found" if the image is completely blank or contains no medical content whatsoever.`,
};

// ── MediScan structured JSON prompt with few-shot examples ─────────────────
// Research basis:
//   [1] RxLens (NAACL 2025): structured output + catalog validation = +19-40% Recall@3
//   [2] ICON 2024: 2-3 few-shot examples = +15-25% accuracy on medical NER
//   [3] ACL Insights 2025: sequential entity decomposition reduces hallucination ~20%
//   [4] SMM4H 2025: JSON schema output reduces missing fields ~30%
const MEDSCAN_JSON_SCHEMA = {
  type: "object",
  properties: {
    patientName:   { type: "string", description: "Full name of patient, or null if not found" },
    patientAge:    { type: "string", description: "Age or DOB of patient, or null if not found" },
    patientGender: { type: "string", description: "Gender of patient, or null if not found" },
    doctorName:    { type: "string", description: "Full name of prescribing doctor, or null if not found" },
    doctorQual:    { type: "string", description: "Qualifications/specialty of doctor, or null if not found" },
    clinicName:    { type: "string", description: "Name of clinic or hospital, or null if not found" },
    prescriptionDate: { type: "string", description: "Date of prescription (as written), or null if not found" },
    legibilityScore: { type: "number", description: "Your confidence in the overall legibility of this prescription, 0-100. 100 = perfectly clear printed text, 0 = completely unreadable." },
    medications: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name:         { type: "string", description: "Drug name exactly as written. If partially illegible, write your best guess and append [?]" },
          strength:     { type: "string", description: "Dose/strength e.g. '500mg', '10mg/5ml'. Null if not found." },
          form:         { type: "string", description: "Dosage form: tablet, capsule, syrup, injection, ointment, drops, etc. Null if not found." },
          frequency:    { type: "string", description: "Frequency written out in full: 'Once daily', 'Twice daily', 'Three times daily', 'As needed', etc. Expand all abbreviations." },
          duration:     { type: "string", description: "Duration e.g. '5 days', '1 month', '2 weeks'. Null if not found." },
          route:        { type: "string", description: "Route of administration: Oral, Topical, IV, IM, etc. Null if not found." },
          quantity:     { type: "string", description: "Quantity to dispense e.g. '30 tablets', '1 bottle'. Null if not found." },
          instructions: { type: "string", description: "Special instructions e.g. 'Take with food', 'Apply to affected area'. Null if not found." },
        },
        required: ["name"],
      },
    },
    additionalNotes: { type: "string", description: "Any diagnoses, allergies, or other text on the prescription not captured above. Null if none." },
  },
  required: ["legibilityScore", "medications"],
};

// Sequential decomposition system prompt (Improvement 4)
// Instructs model to work through entity types one at a time to reduce hallucination
const MEDSCAN_SYSTEM_PROMPT = `You are an expert clinical pharmacist and medical OCR specialist with 20 years of experience reading handwritten and printed prescriptions from India, UK, and US healthcare systems.

Your task is to extract prescription data from the image and return it as a single valid JSON object matching the schema provided.

STEP-BY-STEP EXTRACTION PROCESS (follow this order to reduce errors):
Step 1: Scan the entire image and identify ALL drug names visible, even if partially illegible. List them mentally.
Step 2: For each drug name identified in Step 1, find its associated strength/dose.
Step 3: For each drug, find its frequency. Expand ALL abbreviations: OD/QD=Once daily, BD/BID=Twice daily, TDS/TID=Three times daily, QID=Four times daily, SOS/PRN=As needed, AC=Before meals, PC=After meals, HS=At bedtime, stat=Immediately.
Step 4: For each drug, find its duration and quantity.
Step 5: Extract patient and prescriber information.
Step 6: Assign a legibilityScore (0-100) based on overall image clarity.

CRITICAL RULES:
- Write drug names EXACTLY as they appear. If a character is ambiguous, pick the most pharmacologically plausible reading.
- Distinguish carefully: 1 vs 7, 0 vs O vs 6, rn vs m, cl vs d, li vs h.
- NEVER invent medications not visible in the image.
- If a field is not visible or not present, use null — do NOT guess.
- Return ONLY the JSON object. No explanation, no markdown fences, no preamble.

ABBREVIATION REFERENCE:
tab=tablet, cap=capsule, syr=syrup, inj=injection, susp=suspension, oint=ointment, gtts=drops, 
OD/QD=once daily, BD/BID=twice daily, TDS/TID=three times daily, QID=four times daily,
PRN/SOS=as needed, AC=before meals, PC=after meals, HS=at bedtime, stat=immediately,
mg=milligrams, ml=millilitres, mcg=micrograms, IU=international units`;

// Few-shot examples embedded in user message (Improvement 2)
// 2 examples: one printed, one handwritten-style
const MEDSCAN_FEW_SHOT_EXAMPLES = `
EXAMPLE 1 (printed prescription):
Image contains: "Patient: John Smith, 45M | Dr. Priya Sharma MD | Date: 10/04/2026 | 1. Amoxicillin 500mg Cap BD x 7 days #14 | 2. Paracetamol 500mg Tab TDS PRN #21 Take with food"

Expected JSON output:
{
  "patientName": "John Smith",
  "patientAge": "45",
  "patientGender": "Male",
  "doctorName": "Dr. Priya Sharma",
  "doctorQual": "MD",
  "clinicName": null,
  "prescriptionDate": "10/04/2026",
  "legibilityScore": 95,
  "medications": [
    {
      "name": "Amoxicillin",
      "strength": "500mg",
      "form": "Capsule",
      "frequency": "Twice daily",
      "duration": "7 days",
      "route": "Oral",
      "quantity": "14 capsules",
      "instructions": null
    },
    {
      "name": "Paracetamol",
      "strength": "500mg",
      "form": "Tablet",
      "frequency": "Three times daily as needed",
      "duration": null,
      "route": "Oral",
      "quantity": "21 tablets",
      "instructions": "Take with food"
    }
  ],
  "additionalNotes": null
}

EXAMPLE 2 (handwritten prescription, partially illegible):
Image contains handwritten text: "Pt: Ravi K | Dr. Mehta | Metfrmn 500 tab OD | Atorvasttn 10mg hs | Asprin 75mg OD | 30 days"

Expected JSON output:
{
  "patientName": "Ravi K",
  "patientAge": null,
  "patientGender": null,
  "doctorName": "Dr. Mehta",
  "doctorQual": null,
  "clinicName": null,
  "prescriptionDate": null,
  "legibilityScore": 55,
  "medications": [
    {
      "name": "Metformin [?]",
      "strength": "500mg",
      "form": "Tablet",
      "frequency": "Once daily",
      "duration": "30 days",
      "route": "Oral",
      "quantity": null,
      "instructions": null
    },
    {
      "name": "Atorvastatin [?]",
      "strength": "10mg",
      "form": "Tablet",
      "frequency": "At bedtime",
      "duration": "30 days",
      "route": "Oral",
      "quantity": null,
      "instructions": null
    },
    {
      "name": "Aspirin [?]",
      "strength": "75mg",
      "form": "Tablet",
      "frequency": "Once daily",
      "duration": "30 days",
      "route": "Oral",
      "quantity": null,
      "instructions": null
    }
  ],
  "additionalNotes": null
}

NOW extract from the actual prescription image below and return ONLY the JSON object:`;

// ── Model definitions ──────────────────────────────────────────────────────
type ModelDef =
  | { type: "gemini-native"; model: string; label: string }
  | { type: "openai-compat"; model: string; label: string };

// Models listed in priority order. All run in parallel for speed,
// but if multiple succeed, the highest-priority one wins for consistency.
const MODELS: ModelDef[] = [
  { type: "gemini-native", model: "gemini-2.5-flash",      label: "Gemini 2.5 Flash"      },
  { type: "gemini-native", model: "gemini-2.5-flash-lite", label: "Gemini 2.5 Flash-Lite" },
  { type: "openai-compat", model: "models/gemma-4-31b-it", label: "Gemma 4 31B"           },
];

// ── Per-model API call ─────────────────────────────────────────────────────
async function callModel(
  def: ModelDef,
  apiKey: string,
  prompt: string,
  systemPrompt: string | null,
  mimeType: string,
  base64Data: string,
  isMedscan: boolean,
  signal: AbortSignal
): Promise<{ text: string | null; status: number; label: string; errorDetail?: string }> {
  try {
    if (def.type === "gemini-native") {
      const body: Record<string, unknown> = {
        contents: [
          {
            parts: [
              { text: prompt },
              { inline_data: { mime_type: mimeType, data: base64Data } },
            ],
          },
        ],
        generationConfig: {
          maxOutputTokens: isMedscan ? 4096 : 2048,
          temperature: 0,
          ...(isMedscan ? { responseMimeType: "application/json" } : {}),
        },
      };

      // Add system instruction for medscan
      if (systemPrompt) {
        body.systemInstruction = { parts: [{ text: systemPrompt }] };
      }

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${def.model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal,
          body: JSON.stringify(body),
        }
      );
      if (!res.ok) {
        let errorDetail = "";
        try { errorDetail = JSON.stringify(await res.json()); } catch { errorDetail = await res.text().catch(() => ""); }
        return { text: null, status: res.status, label: def.label, errorDetail: errorDetail.slice(0, 300) };
      }
      const data = await res.json() as {
        candidates: Array<{ content: { parts: Array<{ text: string }> } }>;
      };
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? null;
      return { text, status: text ? 200 : 204, label: def.label };
    }

    // openai-compat (Gemma via OpenAI-compatible endpoint)
    const messages: Array<{ role: string; content: unknown }> = [];
    if (systemPrompt) {
      messages.push({ role: "system", content: systemPrompt });
    }
    messages.push({
      role: "user",
      content: [
        { type: "text", text: prompt },
        {
          type: "image_url",
          image_url: {
            url: `data:${mimeType};base64,${base64Data}`,
            detail: isMedscan ? "high" : "auto",
          },
        },
      ],
    });

    const res = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        signal,
        body: JSON.stringify({
          model: def.model,
          messages,
          max_tokens: isMedscan ? 4096 : 2048,
          temperature: 0,
          ...(isMedscan ? { response_format: { type: "json_object" } } : {}),
        }),
      }
    );
    if (!res.ok) {
      let errorDetail = "";
      try { errorDetail = JSON.stringify(await res.json()); } catch { errorDetail = await res.text().catch(() => ""); }
      return { text: null, status: res.status, label: def.label, errorDetail: errorDetail.slice(0, 300) };
    }
    const data = await res.json() as {
      choices: Array<{ message: { content: string } }>;
    };
    let text = data.choices?.[0]?.message?.content ?? null;
    if (text) {
      text = text.replace(/<thought>[\s\S]*?<\/thought>/gi, "").trim();
      text = text.replace(/<thinking>[\s\S]*?<\/thinking>/gi, "").trim();
    }
    return { text, status: text ? 200 : 204, label: def.label };
  } catch (err) {
    const isAbort = err instanceof Error && err.name === "AbortError";
    console.error(`callModel ${def.label} ${isAbort ? "aborted" : "threw"}:`, err);
    return { text: null, status: isAbort ? 499 : 503, label: def.label, errorDetail: String(err) };
  }
}

// ── Handler ────────────────────────────────────────────────────────────────
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { imageDataUrl, module } = req.body as {
    imageDataUrl: string;
    module: string;
  };

  if (!imageDataUrl || !module) {
    return res.status(400).json({ error: "Missing imageDataUrl or module" });
  }

  const isMedscan = module === "medscan";

  // For medscan: use structured JSON prompt with few-shot examples + system prompt
  // For other modules: use the plain text prompts
  const extractPrompt = isMedscan
    ? MEDSCAN_FEW_SHOT_EXAMPLES
    : (MODULE_EXTRACT_PROMPTS[module] ?? MODULE_EXTRACT_PROMPTS.intake);

  const systemPrompt = isMedscan ? MEDSCAN_SYSTEM_PROMPT : null;

  // Route to Ollama (local) or Google AI Studio (cloud) based on OLLAMA_URL env var.
  // When using Ollama, gemma3:4b handles vision tasks via its multimodal capabilities.
  const isOllama = getProviderMode() === "ollama";
  const ollamaUrl = process.env.OLLAMA_URL;
  const ollamaModel = process.env.OLLAMA_MODEL || "gemma3:4b";
  const apiKey = isOllama ? "ollama" : process.env.GOOGLE_AI_STUDIO_API_KEY;
  if (!isOllama && !apiKey) return res.status(500).json({ error: "API key not configured" });

  const mimeType = imageDataUrl.startsWith("data:image/png")
    ? "image/png"
    : imageDataUrl.startsWith("data:image/webp")
    ? "image/webp"
    : imageDataUrl.startsWith("data:image/gif")
    ? "image/gif"
    : "image/jpeg";

  const base64Data = imageDataUrl.split(",")[1];

  if (!base64Data) {
    return res.status(400).json({ error: "Invalid image data URL format" });
  }

  // ── Ollama path: single local model call ──────────────────────────────────
  // When OLLAMA_URL is set, route the vision task to the local Ollama server.
  // gemma3:4b supports multimodal vision via the OpenAI-compatible endpoint.
  if (isOllama && ollamaUrl) {
    try {
      const messages: Array<{ role: string; content: unknown }> = [];
      if (systemPrompt) messages.push({ role: "system", content: systemPrompt });
      messages.push({
        role: "user",
        content: [
          { type: "text", text: extractPrompt },
          { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64Data}`, detail: "high" } },
        ],
      });
      const resp = await fetch(`${ollamaUrl}/v1/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: ollamaModel,
          messages,
          max_tokens: isMedscan ? 4096 : 2048,
          temperature: 0,
          stream: false,
        }),
      });
      if (!resp.ok) throw new Error(`Ollama HTTP ${resp.status}`);
      const data = await resp.json() as { choices: Array<{ message: { content: string } }> };
      const text = data.choices?.[0]?.message?.content?.trim() ?? null;
      if (!text) throw new Error("Ollama returned empty response");
      if (isMedscan) {
        const parsed = JSON.parse(text);
        return res.status(200).json({ structuredData: parsed, usedModel: `${ollamaModel} (Ollama local)`, provider: "ollama" });
      }
      return res.status(200).json({ extractedText: text, usedModel: `${ollamaModel} (Ollama local)`, provider: "ollama" });
    } catch (err) {
      return res.status(503).json({ error: `Ollama vision inference failed: ${err instanceof Error ? err.message : String(err)}` });
    }
  }

  // ── Google AI Studio path (default): race all models in parallel ───────────
  // All models run simultaneously for speed. If multiple succeed, the one with
  // the lowest index in MODELS wins (Gemini 2.5 Flash preferred for consistency).
  const controllers = MODELS.map(() => new AbortController());

  const promises = MODELS.map((def, i) =>
    callModel(def, apiKey!, extractPrompt, systemPrompt, mimeType, base64Data, isMedscan, controllers[i].signal).then(result => ({
      ...result,
      index: i,
    }))
  );

  const errors: string[] = [];
  // Collect all results, then pick the highest-priority success
  const results = await Promise.all(promises);

  // Cancel all controllers (they may already be done)
  controllers.forEach(c => c.abort());

  // Find the highest-priority (lowest index) successful result
  for (const result of results.sort((a, b) => a.index - b.index)) {
    if (result.status === 200 && result.text) {
      if (isMedscan) {
        try {
          const parsed = JSON.parse(result.text);
          if (!Array.isArray(parsed.medications)) {
            errors.push(`${result.label}: returned invalid JSON structure`);
            continue;
          }
          console.log(`[extract-from-image] Using: ${result.label} (priority ${result.index})`);
          res.status(200).json({ structuredData: parsed, usedModel: result.label });
          return;
        } catch {
          errors.push(`${result.label}: returned non-JSON response`);
          continue;
        }
      }

      console.log(`[extract-from-image] Using: ${result.label} (priority ${result.index})`);
      if (!isMedscan && result.text.toLowerCase().includes("no clinical text found")) {
        res.status(200).json({ extractedText: null, usedModel: result.label });
      } else {
        res.status(200).json({ extractedText: result.text, usedModel: result.label });
      }
      return;
    }

    if (result.status !== 499) {
      errors.push(`${result.label}: ${result.status}${result.errorDetail ? ` (${result.errorDetail.slice(0, 80)})` : ""}`);
    }
  }

  // All models failed
  res.status(429).json({
    error: "All AI models failed to process the image.",
    detail: errors.join(" | "),
    isQuotaError: true,
    triedModels: MODELS.map(m => m.label),
  });
}
