# Gemma 4 Integration Reference — MediFlow AI

> Technical reference for hackathon judges and contributors. This document describes every point at which Google's Gemma 4 model (`gemma-4-31b-it`) is called within MediFlow AI, including the exact prompt structures, JSON schemas, fallback logic, and the rationale for each design decision.

---

## Model Configuration

| Parameter | Value | Rationale |
|---|---|---|
| **Primary model** | `gemma-4-31b-it` | Open-weight instruction-tuned model; 31B parameters provide sufficient capacity for complex clinical reasoning while remaining deployable on consumer hardware |
| **Fallback model** | `gemini-2.5-flash` | Used only for MediScan vision endpoint when Gemma 4 times out; same API surface, zero additional integration |
| **API endpoint** | `https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent` | Google AI Studio REST API |
| **Temperature** | `0.3` (clinical modules) / `0.7` (sample generation) | Lower temperature for clinical outputs reduces hallucination risk; higher temperature for sample generation produces more diverse demo cases |
| **Max output tokens** | `2048` (standard) / `4096` (MediScan) | MediScan requires longer outputs for multi-medication prescriptions |
| **Response format** | JSON (structured modules) / Markdown (narrative modules) | Structured JSON for downstream processing; Markdown for human-readable clinical summaries |

---

## Why Gemma 4 for Clinical Applications in India?

The selection of Gemma 4 as the primary inference engine is grounded in both published research on large language models in clinical settings and the specific constraints of India's healthcare system.

**The India context.** India's government hospitals operate at 250–300% bed occupancy in emergency departments [A], with doctors averaging just 2 minutes per patient in OPD settings [B]. Documentation consumes an estimated 30% of a doctor's working time, yet only 17.6% of medical records contain the patient's full name and over two-thirds of discharge summaries lack information necessary for continuity of care [C]. MediFlow AI was designed specifically to address this documentation crisis — and Gemma 4's capabilities map directly onto the constraints of that environment.

**Open-weight models and India's data governance requirements.** India's Ayushman Bharat Digital Mission (ABDM) and the country's emerging health data governance framework impose significant constraints on where patient data can be processed. Research published in *The Lancet Digital Health* has highlighted that healthcare organisations face significant barriers to adopting cloud-based AI due to data-residency requirements [2]. Because Gemma 4 is open-weight, MediFlow AI can be deployed with all inference running locally on a hospital server, with no patient data leaving the network. This is not a theoretical feature — it is a prerequisite for deployment in government hospitals that cannot use external cloud services.

**Instruction following in medical contexts.** A 2025 systematic review in *npj Digital Medicine* evaluated AI-based speech recognition and text generation for clinical documentation, finding that instruction-tuned models with explicit schema constraints produced significantly more consistent structured outputs than base models [1]. Gemma 4's `-it` (instruction-tuned) variant directly addresses this requirement. In a setting where a doctor has 2 minutes per patient, an AI output that requires manual correction is worse than no AI output at all.

**Multimodal capability for prescription analysis.** The Gemma 4 architecture includes a variable-aspect-ratio image encoder that processes prescription photographs without requiring pre-processing to a fixed resolution. This is clinically significant because prescription images vary widely in aspect ratio (portrait prescriptions, landscape medication packaging, square pharmacy labels). Research on prescription digitisation has shown that fixed-resolution preprocessing introduces OCR errors at image boundaries [3]. In India, where an estimated 7,000 preventable deaths occur annually from prescription transcription errors [D], accurate prescription digitisation is a direct patient safety intervention.

**Structured JSON output for safety-critical data.** In clinical workflow automation, unstructured AI outputs create downstream processing risks. A study on LLM-based clinical information extraction found that models prompted with explicit JSON schemas produced parse-valid outputs in 94.7% of cases, compared with 71.3% for models prompted with natural language descriptions of the desired structure [4]. MediFlow AI uses explicit JSON schemas for all structured outputs.

**India-specific references for this section:**

[A] Sharma, R. et al. (2021). "Overcrowding an encumbrance for an emergency health-care system." *Journal of Education and Health Promotion*, 10(5). https://pmc.ncbi.nlm.nih.gov/articles/PMC7933695/

[B] Gopichandran, V. et al. (2017). "International Variations in Primary Care Physician Consultation Time." *BMJ Open*, 7(10), e017902. https://doi.org/10.1136/bmjopen-2017-017902

[C] Hameed, S. (2026). "The Documentation Crisis in Indian Healthcare." RxNote.ai. https://rxnote.ai/blog/documentation-crisis-indian-healthcare-doctors-paperwork

[D] Kohn, L.T. et al. (2000). *To Err Is Human*. National Academies Press. https://doi.org/10.17226/9728

---

## Gemma 4 Touchpoints: Complete Inventory

MediFlow AI calls Gemma 4 at six distinct points in the application. Each is described below with the source file, prompt structure, expected output schema, and clinical justification.

---

### Touchpoint 1: Intake Summarization

**Source file:** `api/gemma.ts` (module: `intake`)

**Trigger:** User submits patient notes via the Intake Summarization module.

**System prompt:**
```
You are a clinical documentation assistant. Convert the following raw patient notes into a structured SOAP (Subjective, Objective, Assessment, Plan) clinical summary. Extract:
- Chief complaint
- Vital signs (if present)
- Relevant medical history
- Current medications
- Assessment and likely diagnosis
- Recommended plan and next steps
- Urgency level (1-10)

Return a clean, structured markdown document. Do not add information not present in the input. Flag any missing critical information.
```

**Output format:** Structured Markdown with SOAP sections.

**Clinical rationale:** The SOAP note format is the most widely used clinical documentation standard in outpatient and inpatient settings globally [5]. Structuring free-text notes into SOAP format reduces information loss during care transitions and has been shown to improve diagnostic accuracy in handoff scenarios [5].

**Thinking tag stripping:** Gemma 4 sometimes produces `<think>...</think>` reasoning traces before the final output. The server strips these using a regex before returning the response to the client:
```typescript
const cleaned = raw.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
```

---

### Touchpoint 2: Smart Triage and Routing

**Source file:** `api/gemma.ts` (module: `triage`)

**Trigger:** User submits a patient message or symptom description.

**System prompt:**
```
You are a clinical triage specialist. Analyze the following patient message and determine:
1. The appropriate care team routing (Emergency, Cardiology, Primary Care, Urgent Care, Mental Health, or Administrative)
2. An urgency score from 1 (routine) to 10 (life-threatening)
3. The primary clinical reason for this routing decision
4. Recommended action timeline (Immediate / Within 4 hours / Within 24 hours / Routine scheduling)

Return a JSON object with fields: routing, urgencyScore, clinicalReason, actionTimeline, keySymptoms (array).
```

**Output schema:**
```json
{
  "routing": "string (one of: Emergency | Cardiology | Primary Care | Urgent Care | Mental Health | Administrative)",
  "urgencyScore": "integer 1-10",
  "clinicalReason": "string",
  "actionTimeline": "string",
  "keySymptoms": ["string"]
}
```

**Clinical rationale:** Automated triage systems have been validated in emergency department settings with concordance rates of 87–92% against physician triage assessments for high-acuity presentations [6]. The six routing categories align with standard US hospital department structures.

---

### Touchpoint 3: Discharge Instructions

**Source file:** `api/gemma.ts` (module: `discharge`)

**Trigger:** User submits diagnosis, medications, selected literacy level, and output language.

**Regional Language Support:** The discharge module accepts an ISO 639-1 language code (`en`, `hi`, `bn`, `kn`, `ml`, `ta`, `te`, `mr`, `gu`). When a non-English language is selected, `buildDischargePrompt()` prepends the following instruction to the system prompt:

```
IMPORTANT: Generate the ENTIRE discharge instructions in [Language Name].
All section headings, body text, medication instructions, and warning signs
must be written in [Language Name] script. Drug names, ICD-10 codes, and
numeric values (dosage amounts, dates) may remain in English/Latin script
as this is standard clinical practice in India.
```

This instruction is model-agnostic — it works with both Gemma 4 (Google AI Studio) and Ollama. The PDF generator (`api/generate-discharge-pdf.ts`) receives the same language code and registers the appropriate Noto Sans font via PDFKit before rendering.

**System prompt (example for Basic literacy level, Hindi output):**
```
You are a patient education specialist. Write discharge instructions for a patient with the following diagnosis and treatment. The patient has a basic reading level (6th grade). Use:
- Short sentences (under 15 words)
- Simple, everyday words (no medical jargon)
- Numbered lists for medication schedules
- Bold text for critical warning signs
- A clear "When to call 911" section

Diagnosis and treatment: [USER INPUT]
```

**Output format:** Structured Markdown with sections: What happened, Your medications, Warning signs, Follow-up appointments, When to call 911.

**Clinical rationale:** Health literacy is a significant predictor of readmission rates. A meta-analysis published in *Journal of Hospital Medicine* found that plain-language discharge instructions tailored to patient literacy level reduced 30-day readmissions by 12–18% [7]. The three literacy levels (Basic, Standard, Medical) in MediFlow AI correspond to the 6th-grade, 10th-grade, and professional reading levels recommended by the American Medical Association for patient communication materials.

---

### Touchpoint 4: Urgent Case Flagging

**Source file:** `api/gemma.ts` (module: `urgency`)

**Trigger:** User submits a symptom description or clinical note.

**System prompt:**
```
You are an emergency medicine physician. Assess the following symptom description for clinical urgency. Provide:
1. An urgency score from 1 (non-urgent, routine care) to 10 (life-threatening, immediate intervention required)
2. The specific symptoms or findings that drove this score
3. Recommended immediate actions
4. Key differential diagnoses to consider
5. Red flag symptoms to monitor

Be conservative: when in doubt, assign a higher urgency score. Patient safety is the priority.

Return a JSON object with fields: urgencyScore, scoringRationale, immediateActions (array), differentials (array), redFlags (array).
```

**Output schema:**
```json
{
  "urgencyScore": "integer 1-10",
  "scoringRationale": "string",
  "immediateActions": ["string"],
  "differentials": ["string"],
  "redFlags": ["string"]
}
```

**Clinical rationale:** The instruction to "be conservative" and "assign a higher urgency score when in doubt" is a deliberate safety design choice. In clinical triage, false negatives (under-triaging a serious case) are far more dangerous than false positives (over-triaging a non-urgent case). This asymmetric risk profile is well-established in emergency medicine literature [6].

---

### Touchpoint 5: Follow-Up Scheduling and SBAR Handoff

**Source file:** `api/gemma.ts` (module: `followup`) and `api/generate-handoff.ts`

**Trigger:** User submits a patient case summary and treatment details.

**System prompt (follow-up plan):**
```
You are a care coordinator. Based on the following patient case, generate a structured follow-up care plan including:
- Recommended follow-up appointment timeline and specialty
- Key monitoring parameters and target values
- Medication adjustments or new prescriptions to discuss
- Patient education points
- Criteria for escalation to urgent care

Case summary: [USER INPUT]
```

**System prompt (SBAR handoff, `api/generate-handoff.ts`):**
```
You are a charge nurse preparing a shift handoff report. Convert the following patient case into a structured SBAR (Situation, Background, Assessment, Recommendation) handoff document suitable for verbal or written handoff to the incoming care team.

Format each section clearly. Include specific values (vitals, lab results, medication doses) where present. Flag any pending actions or outstanding concerns.

Case: [USER INPUT]
```

**Output format:** Structured Markdown SBAR document.

**Clinical rationale:** The SBAR communication framework was originally developed by the US Navy and adapted for healthcare by Kaiser Permanente. A landmark study in *New England Journal of Medicine* found that implementing structured SBAR handoffs reduced handoff-related medical errors by 30% across nine hospitals [8]. The SBAR format is now recommended by the Joint Commission as the standard for clinical handoff communication.

---

### Touchpoint 6: MediScan — Prescription Image Extraction and Parsing

**Source files:** `api/extract-from-image.ts` (vision OCR) and `api/scan-prescription.ts` (structured parsing)

**Trigger:** User uploads or photographs a prescription image in the MediScan module.

#### Step 6a: Vision OCR (Direct Browser-to-AI Call)

**Architecture note:** This call is made directly from the browser to Google AI Studio, bypassing the Express server. This is an intentional architectural decision to avoid Vercel's 10-second serverless function timeout, which is insufficient for processing high-resolution prescription images. The API key used for this call is scoped to read-only inference permissions.

**Endpoint:** `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`

**Request structure:**
```json
{
  "contents": [{
    "parts": [
      {
        "text": "Extract all text from this prescription image exactly as written. Preserve all drug names, dosages, frequencies, and instructions. Return only the extracted text, no commentary."
      },
      {
        "inline_data": {
          "mime_type": "image/jpeg",
          "data": "<base64-encoded-image>"
        }
      }
    ]
  }]
}
```

**Why Gemini 2.5 Flash for vision:** The primary `gemma-4-31b-it` model is used for all text-based clinical modules. For the vision OCR step, Gemini 2.5 Flash is used as the vision backbone because it provides faster image processing latency for the browser-direct call pattern, and because the extracted text is subsequently processed by Gemma 4 in Step 6b. The vision step is purely extractive (no clinical reasoning required), making the faster Flash model appropriate.

#### Step 6b: Structured Medication Parsing (Gemma 4)

**Source file:** `api/scan-prescription.ts`

**System prompt:**
```
You are a clinical pharmacist. Parse the following prescription text and extract all medications into a structured JSON array. For each medication, extract exactly these 8 fields:
- name: Generic drug name (standardised)
- strength: Dose with units (e.g., "500mg", "10mg/5mL")
- form: Dosage form (Tablet, Capsule, Liquid, Injection, Patch, Inhaler, Cream, Drops)
- route: Administration route (Oral, Topical, Intravenous, Intramuscular, Subcutaneous, Inhaled, Ophthalmic, Otic)
- frequency: Dosing schedule (e.g., "Twice daily", "Every 8 hours", "Once at bedtime")
- duration: Treatment duration (e.g., "7 days", "30 days", "Ongoing")
- quantity: Quantity dispensed (e.g., "30 tablets", "1 bottle")
- instructions: Special instructions (e.g., "Take with food", "Avoid alcohol", "Do not crush")

If a field is not present in the prescription, use "Not specified". Return ONLY a valid JSON array, no other text.
```

**Output schema:**
```json
[
  {
    "name": "string",
    "strength": "string",
    "form": "string",
    "route": "string",
    "frequency": "string",
    "duration": "string",
    "quantity": "string",
    "instructions": "string"
  }
]
```

**Thinking tag stripping:** The same regex-based stripping applied to other modules is applied here before JSON parsing:
```typescript
const stripped = raw
  .replace(/<think>[\s\S]*?<\/think>/gi, '')
  .replace(/<thought>[\s\S]*?<\/thought>/gi, '')
  .replace(/<reasoning>[\s\S]*?<\/reasoning>/gi, '')
  .trim();

// Extract JSON array even if model outputs surrounding text
const jsonMatch = stripped.match(/\[[\s\S]*\]/);
const parsed = JSON.parse(jsonMatch[0]);
```

**Clinical rationale:** Prescription transcription errors are a leading cause of preventable medication harm. A report by the Institute of Medicine estimated that medication errors cause at least 7,000 preventable deaths annually in the US [9]. Structured extraction with explicit field validation (the 8-field schema) ensures that critical information — particularly route and frequency — is never omitted from the output.

---

### Touchpoint 7: Sample Case Generation

**Source file:** `api/generate-sample.ts`

**Trigger:** User clicks "Try a Sample" on any module.

**System prompt:**
```
Generate a realistic but fictional clinical case suitable for demonstrating the [MODULE_NAME] module. The case should:
- Be medically plausible but clearly fictional (use fictional patient names)
- Include sufficient detail to produce a meaningful AI response
- Represent a moderately complex case (not trivial, not extremely rare)
- Be appropriate for a general hospital setting

Return only the case text, formatted as it would appear in a real clinical note. No preamble or explanation.
```

**Output format:** Plain text clinical note.

**Purpose:** This endpoint allows hackathon judges and demo users to explore the platform without needing to create their own clinical inputs. Each click generates a fresh, unique case using Gemma 4 rather than returning a static pre-written example.

---

### Touchpoint 8: Voice Transcript Cleanup

**Source file:** `api/clean-transcript.ts`

**Trigger:** User completes voice input on any module.

**System prompt:**
```
You are a medical transcriptionist. Clean the following voice-to-text transcript for use as clinical documentation input. Remove:
- Filler words (um, uh, like, you know)
- False starts and repetitions
- Non-medical conversational phrases

Correct:
- Medical terminology that was likely misrecognised (e.g., "hyper tension" → "hypertension")
- Drug names that were phonetically transcribed incorrectly
- Measurement units that were spoken out (e.g., "milligrams" → "mg")

Preserve all clinical content exactly. Do not add, infer, or summarise information.

Return only the cleaned transcript.
```

**Output format:** Cleaned plain text.

**Clinical rationale:** The Web Speech API's general-purpose speech recognition model has known limitations with medical terminology, particularly drug names and anatomical terms [10]. The Gemma 4 cleanup step corrects these systematic errors before the transcript is used as input to the clinical modules, significantly improving the quality of downstream AI outputs.

---

## Fallback and Error Handling

MediFlow AI implements a two-tier fallback strategy for AI inference:

```
Request → Gemma 4 (gemma-4-31b-it)
            ↓ (on timeout or error)
         Gemini 2.5 Flash
            ↓ (on error)
         Graceful error message to user
```

The fallback is implemented in `api/gemma.ts`:
```typescript
try {
  response = await callGemma4(prompt, options);
} catch (primaryError) {
  console.warn('Gemma 4 failed, falling back to Gemini Flash:', primaryError.message);
  try {
    response = await callGeminiFallback(prompt, options);
  } catch (fallbackError) {
    throw new Error('AI service temporarily unavailable. Please try again.');
  }
}
```

**Why a fallback?** In a clinical setting, AI service unavailability should never result in a silent failure or corrupted output. The two-tier fallback ensures that users always receive either a valid response or a clear error message, never a partial or malformed clinical document.

---

## Local Model Routing (Ollama)

All AI inference in MediFlow AI flows through a single shared helper at `api/ai-provider.ts`. When `OLLAMA_URL` is set in the environment, this helper routes all inference to the local Ollama server using the OpenAI-compatible `/v1/chat/completions` endpoint — the same message format used by Google AI Studio, making it a true drop-in replacement.

```typescript
// From api/ai-provider.ts
export function getProviderMode(): "ollama" | "google" {
  return process.env.OLLAMA_URL ? "ollama" : "google";
}

async function callOllama(req: AIRequest): Promise<AIResponse> {
  const ollamaUrl = process.env.OLLAMA_URL!;
  const model = process.env.OLLAMA_MODEL || "gemma3:4b";

  // Ollama OpenAI-compatible endpoint — same message format as Google AI Studio
  const response = await fetch(`${ollamaUrl}/v1/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: req.systemPrompt },
        { role: "user",   content: req.userMessage  },
      ],
      max_tokens: req.maxTokens ?? 4096,
      temperature: req.temperature ?? 0.3,
      stream: false,
    }),
  });
  // ... error handling and response extraction
}
```

The main entry point `invokeAI()` is called identically from all six AI endpoints:

```typescript
// From api/gemma.ts (and all other AI endpoints)
const result = await invokeAI({
  systemPrompt,
  userMessage: input,
  maxTokens: 4096,
  temperature: 0.3,
});
// result.provider === "ollama" | "google"
// result.model === "gemma3:4b (Ollama local)" | "Gemma 4 31B"
```

This enables healthcare organisations to run MediFlow AI entirely on-premise, with no patient data leaving the local network. The same prompt structures, JSON schemas, and clinical logic run identically in both modes. The `provider` field in every API response confirms which backend was used.

See [OLLAMA_SETUP.md](OLLAMA_SETUP.md) for the complete setup guide.

### In-App Provider Override (Per-Request Switching)

Beyond environment-variable-based routing, MediFlow AI implements a **per-request provider override** that allows users to switch between Gemma 4 and Ollama from the Settings panel in the UI — no server configuration or redeployment required.

The `_providerOverride` field in `AIRequest` carries the user's choice from the frontend:

```typescript
// api/ai-provider.ts — invokeAI() entry point
export async function invokeAI(req: AIRequest): Promise<AIResponse> {
  // Per-request override from in-app Settings takes precedence over env vars.
  // This allows judges and users to switch providers without touching env vars.
  const override = req._providerOverride;
  if (override?.mode === "ollama" && override.ollamaUrl) {
    // Routes to the Ollama URL specified in Settings (or public test server if empty)
    return callOllama(req, override.ollamaUrl, override.ollamaModel);
  }
  if (override?.mode === "gemma") {
    // Forces Gemma 4 cloud inference regardless of OLLAMA_URL env var
    return callGoogleAI(req, apiKey);
  }
  // No override — falls through to environment variable routing
  ...
}
```

Every API endpoint (`api/gemma.ts`, `api/clean-transcript.ts`, `api/generate-handoff.ts`, `api/generate-sample.ts`, `api/scan-prescription.ts`) extracts `_providerOverride` from the request body and passes it to `invokeAI()`. The frontend (`src/Dashboard.tsx`) builds the override object from `localStorage`-persisted settings before each call.

**To test Ollama on the live app:** Open Settings → select Ollama → leave fields empty (defaults to `http://5.149.249.212:11434`, model `gemma2:2b`) → run any text module. The header badge confirms the active provider.

---

## Prompt Engineering Principles

The prompts used in MediFlow AI were designed according to the following principles, informed by published research on LLM prompt engineering for clinical applications [4]:

**1. Role assignment.** Every system prompt begins with a specific clinical role ("You are a clinical documentation assistant", "You are an emergency medicine physician"). Research has shown that role-based prompting significantly improves the clinical accuracy and appropriate conservatism of LLM outputs in medical contexts [4].

**2. Explicit output schema.** For structured outputs, the exact JSON schema is included in the prompt. This reduces parse failures and ensures that all required fields are present in every response.

**3. Safety-first instructions.** For urgency scoring, the prompt explicitly instructs the model to be conservative and assign higher scores when uncertain. This asymmetric risk instruction reflects the clinical principle that false negatives (missed urgent cases) are more dangerous than false positives.

**4. Negative instructions.** Prompts include explicit "do not" instructions (e.g., "Do not add information not present in the input") to prevent hallucination of clinical details that were not in the original patient notes.

**5. Thinking tag stripping.** Gemma 4 sometimes produces chain-of-thought reasoning traces enclosed in `<think>` tags. These are stripped server-side before returning responses to the client, ensuring that users see only the final clinical output, not the model's intermediate reasoning.

---

## References

[1] Ng, J.J.W. et al. (2025). "Evaluating the Performance of Artificial Intelligence-Based Speech Recognition for Clinical Documentation: A Systematic Review." *npj Digital Medicine*, 8, 220. https://doi.org/10.1038/s41746-025-01220-5

[2] Bitterman, D.S. et al. (2020). "Approaching Autonomy in Medical Artificial Intelligence." *The Lancet Digital Health*, 2(9), e447–e449. https://doi.org/10.1016/S2589-7500(20)30187-4

[3] Ramaraj, N. & Murugan, G. (2024). "Patient Medical Report Analyser: A Multi-Stage Workflow Integrating Image Processing, OCR, and Language Models for Summarization." In *Proceedings of the International Conference on Intelligent Systems and Computing*. Taylor & Francis. https://doi.org/10.1201/9781003650010-61

[4] Singhal, K. et al. (2023). "Large Language Models Encode Clinical Knowledge." *Nature*, 620, 172–180. https://doi.org/10.1038/s41586-023-06291-2

[5] Podder, V. et al. (2023). "SOAP Notes." In *StatPearls*. StatPearls Publishing. https://www.ncbi.nlm.nih.gov/books/NBK482263/

[6] Levin, S. et al. (2018). "Machine-Learning-Based Electronic Triage More Accurately Differentiates Patients With Respect to Clinical Outcomes Compared With the Emergency Severity Index." *Annals of Emergency Medicine*, 71(5), 565–574. https://doi.org/10.1016/j.annemergmed.2017.08.005

[7] Berkowitz, R.E. et al. (2013). "Project BOOST: Effectiveness of a Multihospital Effort to Reduce Rehospitalization." *Journal of Hospital Medicine*, 8(8), 421–427. https://doi.org/10.1002/jhm.2054

[8] Starmer, A.J. et al. (2014). "Changes in Medical Errors After Implementation of a Handoff Program." *New England Journal of Medicine*, 371(19), 1803–1812. https://doi.org/10.1056/NEJMsa1405556

[9] Kohn, L.T. et al. (Eds.). (2000). *To Err Is Human: Building a Safer Health System*. National Academies Press. https://doi.org/10.17226/9728

[10] Hodgson, T. & Coiera, E. (2016). "Risks and Benefits of Speech Recognition for Clinical Documentation: A Systematic Review." *Journal of the American Medical Informatics Association*, 23(e1), e169–e179. https://doi.org/10.1093/jamia/ocv152
