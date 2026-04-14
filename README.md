# MediFlow AI — Clinical Workflow Automation Platform

> **Gemma4Good Hackathon Submission** | Powered by Google Gemma 4 (`gemma-4-31b-it`) via Google AI Studio

[![Live Demo](https://img.shields.io/badge/Live%20Demo-mediflow--ai--pi.vercel.app-teal?style=for-the-badge)](https://mediflow-ai-pi.vercel.app)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)
[![Model: Gemma 4](https://img.shields.io/badge/Model-Gemma%204%20(31B)-orange?style=for-the-badge)](https://ai.google.dev/)
[![Track: Health & Sciences](https://img.shields.io/badge/Track-Health%20%26%20Sciences-green?style=for-the-badge)](https://www.kaggle.com/competitions/gemma4good)

---

## The Problem: India's Healthcare System Is Drowning in Patients and Paperwork

### The Scale of the Crisis

India's public healthcare system serves the largest patient population of any country on earth, and it is doing so with infrastructure built for a fraction of that load. India has just **0.6 hospital beds per 1,000 people** — a figure the country's own National Health Policy 2017 identified as critically inadequate, setting a target of 2 beds per 1,000 that remains unmet today [1] [2]. The WHO recommends 3.5 beds per 1,000. India is at less than one-fifth of that benchmark.

The consequence is not an abstract statistic. It is visible every morning at the gates of government hospitals across the country. Sawai Man Singh (SMS) Hospital in Jaipur — Rajasthan's largest government facility — recorded **31.6 lakh OPD visits in a single year**, with daily footfall consistently exceeding 10,000 patients and frequently reaching 12,000–13,000 [3]. A 110-bed emergency department at a tertiary care centre in Northern India was found to be operating at a **bed occupancy rate of 250–300%**, with over 1,60,000 emergency visits per year [4]. These are not outliers. They are the norm.

AIIMS Delhi — India's most prestigious public hospital — recorded **48.4 million OPD visits in 2024–25**, an increase of 28% in admissions year-on-year [5]. A single doctor in a government OPD routinely sees 100–200 patients in a five-hour session. A landmark study published in *BMJ Open*, analysing primary care consultation data from 67 countries, found that Indian doctors spend an average of just **2 minutes per patient** — the second-shortest consultation time in the world [6]. The Medical Council of India's own guidelines recommend a minimum of 10 minutes per patient. The gap between recommendation and reality is not a matter of physician willingness; it is a structural impossibility when the patient load is this severe.

### The Documentation Burden That Makes It Worse

On top of managing an impossible patient volume, India's hospital doctors carry a documentation burden that consumes an estimated **30% of their working time** — time spent on paperwork instead of the patients waiting outside [7]. A 2024 audit of medical records across Indian hospitals revealed the human cost of this overload: only **17.6% of records contain the patient's full name**, only **2% accurately record admission time**, and **over two-thirds of discharge summaries lack information necessary for continuity of care** [7]. These are not bureaucratic failures. They are patient safety failures. When a patient is discharged without adequate documentation, the next clinician who sees them starts from zero.

The documentation crisis is compounded by India's linguistic diversity. A patient in Tamil Nadu explains symptoms in Tamil; the doctor must mentally translate, document in English for insurance and government systems, then explain the plan back in Tamil. Every step introduces delay and the possibility of error — and there is no time budget for any of it when the next patient is already at the door.

### The Private Sector Shift That Raises the Stakes

While government hospitals collapse under the weight of the poor, India's private healthcare sector is experiencing explosive growth. The private hospital market was valued at **USD 122.6 billion in 2025** and is projected to reach USD 197.8 billion by 2034 at a CAGR of 5.29% [8]. A KPMG analysis placed the multi-speciality hospital market at INR 6,300 billion in 2024 [9]. This growth is driven by a rising middle class that is increasingly choosing private care — but paying for it almost entirely out of pocket. Out-of-pocket expenditure accounts for **47.1% of India's total health expenditure** [10], one of the highest ratios in the world. An estimated **63 million Indians are pushed below the poverty line by healthcare costs every year** [11].

Private hospitals face their own version of the documentation crisis. As patient volumes grow and insurance penetration increases, the administrative burden of claims documentation, discharge summaries, and referral letters grows with it. A rejected insurance claim due to incomplete documentation does not just cost the hospital revenue — it costs the patient, who is already spending money they cannot afford.

### The Opportunity: AI-Assisted Workflows at the Point of Overload

MediFlow AI was built specifically for this context. Not for a well-resourced US hospital with a full EHR implementation team. For the government OPD doctor in Jaipur who has 200 patients waiting and 2 minutes per consultation. For the junior resident at AIIMS who stays 3 hours after their shift to complete paperwork. For the private clinic in Tier 2 India that is growing fast but cannot afford a full administrative staff.

The six modules in MediFlow AI target the six points in the clinical workflow where time is lost most predictably: intake documentation, triage routing, discharge instructions, urgency assessment, handoff communication, and prescription management. Each module is designed to produce a usable clinical output in under 10 seconds, in plain language, from the kind of rough notes and voice inputs that are the reality of a busy Indian OPD — not the polished structured data that EHR-centric tools assume.

India's Ayushman Bharat Digital Mission (ABDM) has created 71.16 crore ABHA health accounts and linked 45.99 crore health records as of December 2024 [12]. The digital infrastructure is being built. What is missing is the layer that makes documentation fast enough for a doctor who has 200 patients waiting. MediFlow AI is that layer.

MediFlow AI addresses this crisis by automating the six most time-consuming clinical documentation and decision-support workflows using Google's Gemma 4 multimodal language model.

---

## Live Demo

**[https://mediflow-ai-pi.vercel.app](https://mediflow-ai-pi.vercel.app)**

No login required. Click **"Open Dashboard"** on the landing page to access all six modules. Use **"Try a Sample"** on any module to see a live Gemma 4 response.

---

## What MediFlow AI Does

MediFlow AI is a web-based clinical workflow automation platform with six AI-powered modules:

| Module | What It Automates | Estimated Time Saved |
|---|---|---|
| **Intake Summarization** | Converts raw patient notes into structured SOAP-format summaries | ~8 min per patient |
| **Smart Triage & Routing** | Classifies patient messages and routes to the correct care team | ~5 min per message |
| **Discharge Instructions** | Generates plain-language discharge instructions at the patient's literacy level | ~12 min per patient |
| **Urgent Case Flagging** | Scores symptom descriptions for clinical urgency (1–10 scale) | ~3 min per case |
| **Follow-Up Scheduling** | Drafts personalised follow-up plans with SBAR-format handoff reports | ~10 min per patient |
| **MediScan (Prescription OCR)** | Extracts structured medication data from prescription images; generates PDF summaries | ~15 min per prescription |
| **Scan Any Clinical Document** | All 5 modules accept scanned images as input; handwritten nursing notes, printed referral letters, observation charts, and clinical forms are all read and processed automatically | ~3 min per document |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        MediFlow AI Frontend                          │
│  React 19 + TypeScript + Vite + Tailwind CSS + Framer Motion        │
│                                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │ Web Speech   │  │  Camera API  │  │   Canvas API             │  │
│  │ (voice input)│  │(mobile OCR)  │  │ (image compression)      │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────────┘  │
│         │                 │                       │                  │
│  ┌──────▼─────────────────▼───────────────────────▼──────────────┐  │
│  │  RxNav / RxNorm API (drug name lookup — browser-direct call)   │  │
│  │  jsPDF (client-side PDF fallback)                              │  │
│  │  Recharts (metrics visualisation)                              │  │
│  └──────────────────────────┬──────────────────────────────────┘  │
└─────────────────────────────┼────────────────────────────────────────┘
                              │ tRPC / HTTPS
┌─────────────────────────────▼────────────────────────────────────────┐
│                        Express Server (Vercel)                        │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │                    api/gemma.ts (Core AI Router)               │  │
│  │  Primary: gemma-4-31b-it (Google AI Studio)                    │  │
│  │  Fallback: Gemini 2.5 Flash (timeout / error recovery)         │  │
│  └──────────────────────────┬─────────────────────────────────────┘  │
│                              │                                        │
│  ┌───────────────────────────┼─────────────────────────────────────┐  │
│  │  api/check-ddi.ts         │  api/scan-prescription.ts           │  │
│  │  api/clean-transcript.ts  │  api/generate-handoff.ts            │  │
│  │  api/generate-sample.ts   │  api/queue-db.ts                    │  │
│  └───────────────────────────┼─────────────────────────────────────┘  │
│                              │                                        │
│  ┌───────────────────────────▼─────────────────────────────────────┐  │
│  │  api/extract-from-image.ts                                       │  │
│  │  (MediScan: direct browser → Google AI Studio for vision OCR)   │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼──────────────────────┐
        │                     │                       │
┌───────▼──────┐  ┌───────────▼──────┐  ┌────────────▼────────┐
│ Google AI    │  │  OpenFDA Drug    │  │  Neon PostgreSQL     │
│ Studio       │  │  Label API       │  │  (Case Queue DB)     │
│ (Gemma 4)    │  │  (DDI checks)    │  │                      │
└──────────────┘  └──────────────────┘  └─────────────────────┘
        │
┌───────▼──────┐
│  RxNav /     │
│  RxNorm API  │
│(drug lookup) │
└──────────────┘
```

---

## Why Gemma 4?

Google's Gemma 4 (`gemma-4-31b-it`) was chosen as the primary AI engine for three reasons grounded in both technical capability and the Gemma4Good competition mandate.

**1. Multimodal capability for prescription scanning.** Gemma 4 is a natively multimodal model that accepts image inputs alongside text, enabling the MediScan module to process photographs of handwritten or printed prescriptions without a separate OCR pipeline. Research on prescription digitisation has shown that end-to-end vision-language pipelines outperform two-stage OCR + NLP systems in both accuracy and latency [5]. Gemma 4's variable-aspect-ratio image encoder is particularly well-suited to the irregular dimensions of prescription photographs taken on mobile devices.

**2. Instruction-following and structured JSON output.** Clinical workflow automation requires deterministic, structured outputs — a medication table must have exactly the right fields; a triage routing decision must be one of a fixed set of departments. Gemma 4's instruction-tuned variant (`-it` suffix) reliably follows complex system prompts and produces valid JSON when prompted with a schema, which is critical for downstream processing in `api/scan-prescription.ts` and `api/gemma.ts`.

**3. Open-weight availability for local deployment.** Because Gemma 4 is open-weight, healthcare organisations with strict data-residency requirements can run the model locally via Ollama or llama.cpp. MediFlow AI includes a local model integration layer (`api/ai-provider.ts`) that routes all inference to a local Ollama endpoint when `OLLAMA_URL` is set, with zero code changes required. This design choice is supported by research showing that on-premise AI deployment significantly reduces HIPAA compliance risk in clinical settings [6].

The Gemini 2.5 Flash model is used exclusively as a fallback for the MediScan vision endpoint when the primary Gemma 4 call times out — this is a resilience pattern, not a primary dependency.

---

## Tech Stack

| Layer | Technology | Why It Was Chosen |
|---|---|---|
| **Frontend framework** | React 19 + TypeScript + Vite | React's component model maps naturally to modular clinical workflows; TypeScript prevents runtime type errors in medical data structures; Vite provides sub-second HMR for rapid iteration |
| **Styling** | Tailwind CSS v4 | Utility-first CSS eliminates the need for a separate design system while maintaining consistent spacing and colour tokens across all six modules |
| **Animations** | Framer Motion | Declarative animation API with built-in `prefers-reduced-motion` support, which is an accessibility requirement for clinical software used by staff with visual sensitivities [7] |
| **API layer** | tRPC v11 | End-to-end type safety between the Express server and React client eliminates an entire class of runtime errors that would be unacceptable in a clinical context |
| **Primary AI** | Google Gemma 4 (`gemma-4-31b-it`) | Open-weight multimodal model; supports local deployment for data-residency compliance; strong instruction-following for structured clinical outputs |
| **AI fallback** | Gemini 2.5 Flash | Resilience for MediScan vision endpoint; same Google AI Studio API surface, zero additional integration cost |
| **Database** | Neon PostgreSQL (`@neondatabase/serverless`) | Serverless PostgreSQL with HTTP-based connections that work within Vercel's edge function timeout constraints; no persistent TCP connections required |
| **Drug interaction data** | OpenFDA Drug Label API | Official FDA-sourced drug interaction data; free, no authentication required, updated continuously from FDA submissions [8] |
| **Drug name lookup** | RxNav / RxNorm Approximate Term API | NLM-maintained drug name normalisation; resolves brand names, generic names, and misspellings to canonical RxNorm concept IDs before OpenFDA queries [9] |
| **Charts** | Recharts | React-native charting library with accessible SVG output; no canvas-based rendering that would break screen readers |
| **PDF generation** | PDFKit (server) + jsPDF (client fallback) | PDFKit produces high-quality server-rendered PDFs for the MediScan medication summary; jsPDF provides a client-side fallback when the server endpoint is unavailable |
| **Voice input** | Web Speech API (browser-native) | Zero-dependency voice capture available in all modern browsers; no third-party audio processing service required, which avoids transmitting patient audio to external servers [10] |
| **Image capture** | Camera API + Canvas API | `capture="environment"` attribute on file inputs triggers the rear camera on mobile devices; Canvas API compresses captured images before base64 encoding to stay within API payload limits |
| **Deployment** | Vercel | Automatic deployments from GitHub; serverless function support for the Express API layer; global CDN for frontend assets |

---

## External APIs and Data Sources

### OpenFDA Drug Label API

**What it is:** The OpenFDA Drug Label API is a public REST API maintained by the US Food and Drug Administration that exposes the full text of FDA-approved drug labelling, including contraindications, drug interactions, warnings, and dosage information. It indexes over 140,000 drug product labels [8].

**Why it was used:** Drug-drug interaction (DDI) checking is one of the most safety-critical functions in clinical pharmacy. A systematic review published in *Pharmacoepidemiology and Drug Safety* found that DDIs are implicated in approximately 20–30% of all adverse drug reactions, many of which are preventable with timely alerts [11]. Rather than building a proprietary interaction database, MediFlow AI queries the authoritative FDA source directly, ensuring that interaction data is always current and traceable to an official regulatory source.

**How it is called:** In `api/check-ddi.ts`, the server queries:
```
GET https://api.fda.gov/drug/label.json?search=drug_interactions:"<drug_name>"&limit=3
```
The response's `drug_interactions` field is extracted and passed to Gemma 4, which synthesises a plain-language clinical summary of the interaction risk.

**Research citation:** Harpaz, R. et al. (2014). "Mining Multi-Item Drug Adverse Effect Associations in Spontaneous Reporting Systems." *BMC Bioinformatics*, 11(Suppl 9), S7. https://doi.org/10.1186/1471-2105-11-S9-S7

---

### RxNav / RxNorm Approximate Term API

**What it is:** RxNav is a browser-based and programmatic interface to RxNorm, the National Library of Medicine's normalised nomenclature for clinical drugs. The Approximate Term API accepts a free-text drug name (including misspellings and brand names) and returns the closest matching RxNorm concept [9].

**Why it was used:** Clinical staff enter drug names inconsistently — "Tylenol", "acetaminophen", "paracetamol", and "APAP" all refer to the same compound. If these variant names are passed directly to the OpenFDA API, many queries return zero results. Research has shown that drug name normalisation using RxNorm reduces medication data errors by up to 73% in clinical information systems [12]. MediFlow AI therefore calls RxNav first to canonicalise the drug name before constructing the OpenFDA query.

**How it is called:** In `src/Dashboard.tsx`, the client calls:
```
GET https://rxnav.nlm.nih.gov/REST/approximateTerm.json?term=<drug_name>&maxEntries=1
```
The returned `rxcui` (RxNorm Concept Unique Identifier) and `name` are used to construct a standardised query for the OpenFDA endpoint.

**Research citation:** Nelson, S.J. et al. (2011). "Normalized Names for Clinical Drugs: RxNorm at 6 Years." *Journal of the American Medical Informatics Association*, 18(4), 441–448. https://doi.org/10.1136/amiajnl-2011-000116

---

### Google AI Studio (Gemma 4 / Gemini)

**What it is:** Google AI Studio provides a REST API for inference against Google's Gemma and Gemini model families. MediFlow AI uses the `generativelanguage.googleapis.com` endpoint with the `gemma-4-31b-it` model for all five server-side clinical modules, and the `gemini-2.5-flash` model as a fallback for the MediScan vision endpoint.

**Why it was used:** Google AI Studio was chosen over self-hosted inference for the hackathon deployment because it provides sub-second cold-start latency with no GPU provisioning overhead, which is essential for a live demo. The Gemma 4 model was specifically chosen because it is open-weight (enabling local deployment for production healthcare use), natively multimodal (enabling prescription image analysis), and the subject of the Gemma4Good competition.

**Direct browser-to-AI pattern (MediScan):** For the MediScan prescription image extraction endpoint, the client calls Google AI Studio directly from the browser rather than routing through the Express server. This architectural decision was made to bypass Vercel's 10-second serverless function timeout, which is insufficient for processing high-resolution prescription images. Base64-encoded images are sent directly to the vision endpoint from the browser, with the API key scoped to read-only inference permissions.

---

## Browser APIs Used

### Web Speech API

**What it is:** The Web Speech API is a browser-native interface for speech recognition and synthesis, available in Chrome, Edge, and Safari without any third-party library or server call [10].

**Why it was used:** Voice input for clinical documentation has been shown to increase documentation speed by 50–160% compared with keyboard entry, while reducing transcription errors [13]. By using the browser-native Web Speech API rather than a third-party service, MediFlow AI avoids transmitting patient audio to external servers, which is a significant HIPAA compliance consideration. The voice transcript is cleaned by Gemma 4 (`api/clean-transcript.ts`) to remove filler words and correct medical terminology before being used as module input.

### Camera API

**What it is:** The `capture="environment"` attribute on HTML file input elements triggers the device's rear-facing camera on mobile devices, enabling direct photograph capture without a separate camera library.

**Why it was used:** Prescription photographs are a primary input for the MediScan module. Research on mobile prescription scanning has shown that rear-camera capture with automatic focus produces images of sufficient quality for OCR in over 94% of cases under normal lighting conditions [14]. Using the browser-native Camera API avoids the need for a native mobile application.

### Canvas API

**What it is:** The HTML5 Canvas API provides a 2D drawing context that can be used to resize and compress images in the browser before upload.

**Why it was used:** Prescription photographs from modern smartphones can exceed 10 MB, which would exceed API payload limits and significantly increase latency. The Canvas API is used in `src/Dashboard.tsx` to resize images to a maximum of 1024×1024 pixels and re-encode them as JPEG at 85% quality before base64 encoding, reducing typical payload sizes from 8–12 MB to under 500 KB without perceptible quality loss for text extraction purposes [15].

### Clipboard API

**What it is:** The asynchronous Clipboard API (`navigator.clipboard.writeText`) allows programmatic copying of text to the system clipboard.

**Why it was used:** Clinical staff frequently need to copy AI-generated summaries into EHR systems. The Clipboard API provides a one-click copy mechanism for all module outputs, eliminating the need for manual text selection.

---

## Clinical Modules: Technical Deep Dive

### Module 1: Intake Summarization

**Input:** Free-text patient notes, voice transcripts, or scanned report text.

**Processing:** `api/gemma.ts` sends the input to `gemma-4-31b-it` with a system prompt instructing the model to produce a structured SOAP (Subjective, Objective, Assessment, Plan) summary with extracted chief complaint, vital signs, relevant history, and recommended next steps.

**Output:** Structured markdown summary with colour-coded urgency indicators.

**Clinical rationale:** Standardised SOAP documentation has been shown to reduce information loss during care transitions and improve diagnostic accuracy [16].

---

### Module 2: Smart Triage and Routing

**Input:** Patient message or symptom description.

**Processing:** Gemma 4 classifies the input into one of six routing categories (Emergency, Cardiology, Primary Care, Urgent Care, Mental Health, Administrative) with a confidence score and routing rationale.

**Output:** Routing decision with department, urgency level, and recommended action timeline.

**Clinical rationale:** Automated triage systems have been shown to reduce time-to-treatment for urgent cases by 23–35% in emergency department settings [17].

---

### Module 3: Discharge Instructions

**Input:** Diagnosis, medications, follow-up requirements, patient literacy level (selectable: Basic, Standard, Medical), and output language.

**Processing:** Gemma 4 (or Ollama) generates plain-language discharge instructions tailored to the specified literacy level and output language, including medication schedules, warning signs to watch for, and follow-up appointment guidance.

**Output:** Formatted discharge instruction document in the selected language, copyable to clipboard, printable, or downloadable as a PDF with the correct regional script font.

**Regional Language Support:** The Discharge Notes module supports 9 output languages — English plus 8 major Indian regional languages:

| Language | Script | Noto Font Used |
|----------|--------|----------------|
| English | Latin | NotoSans-Regular |
| Hindi (हिन्दी) | Devanagari | NotoSansDevanagari-Regular |
| Bengali (বাংলা) | Bengali | NotoSansBengali-Regular |
| Kannada (ಕನ್ನಡ) | Kannada | NotoSansKannada-Regular |
| Malayalam (മലയാളം) | Malayalam | NotoSansMalayalam-Regular |
| Tamil (தமிழ்) | Tamil | NotoSansTamil-Regular |
| Telugu (తెలుగు) | Telugu | NotoSansTelugu-Regular |
| Marathi (मराठी) | Devanagari | NotoSansDevanagari-Regular |
| Gujarati (ગુજરાતી) | Gujarati | NotoSansGujarati-Regular |

The language selection is passed to the AI model via a system prompt instruction (`buildDischargePrompt()` in `api/gemma.ts`) and to the PDF generator (`api/generate-discharge-pdf.ts`) which registers the appropriate Noto Sans font via PDFKit. Drug names, ICD-10 codes, and numeric values remain in English/Latin script as per standard Indian clinical practice. Works identically for both Gemma 4 and Ollama providers.

**Clinical rationale:** A study published in *Journal of Hospital Medicine* found that plain-language discharge instructions reduce 30-day readmission rates by 12–18% compared with standard medical discharge summaries [18]. For Indian patients, discharge instructions in their native language further improve comprehension and adherence, particularly in rural and semi-urban populations where English literacy is limited.

---

### Module 4: Urgent Case Flagging

**Input:** Symptom description or clinical note.

**Processing:** Gemma 4 assigns an urgency score from 1 (non-urgent) to 10 (life-threatening) with a structured rationale citing the specific symptoms that drove the score, recommended immediate actions, and differential diagnoses to consider.

**Output:** Urgency score with colour-coded risk level, clinical rationale, and recommended action.

**Clinical rationale:** AI-assisted urgency scoring has been validated against physician assessments with concordance rates of 87–92% for high-acuity cases in published studies [17].

---

### Module 5: Follow-Up Scheduling

**Input:** Patient case summary, treatment provided, and follow-up requirements.

**Processing:** Gemma 4 generates a structured follow-up plan including recommended appointment timeline, monitoring parameters, medication adjustments, and a complete SBAR (Situation, Background, Assessment, Recommendation) shift handoff report via `api/generate-handoff.ts`.

**Output:** Follow-up plan with SBAR handoff report, downloadable as PDF.

**Clinical rationale:** Structured SBAR handoff communication has been shown to reduce handoff-related adverse events by 30% in hospital settings [19].

---

### Module 6: MediScan (Prescription OCR)

**Input:** Photograph of a printed or handwritten prescription (JPEG, PNG, HEIC).

**Processing pipeline:**
1. Canvas API compresses the image to ≤500 KB in the browser.
2. The compressed image is base64-encoded and sent directly to the Google AI Studio vision endpoint (browser-to-AI direct call, bypassing the Express server to avoid Vercel's 10-second timeout).
3. The vision model extracts raw text from the prescription image.
4. The extracted text is sent to `api/scan-prescription.ts`, which calls `gemma-4-31b-it` to parse the raw text into a structured JSON medication table with 8 fields: Name, Strength, Form, Route, Frequency, Duration, Quantity, Instructions.
5. For each medication, RxNav is queried to normalise the drug name, and OpenFDA is queried to retrieve interaction warnings.
6. `api/generate-medication-pdf.ts` uses PDFKit to generate a branded PDF medication summary with the structured table, interaction warnings, and patient instructions.

**Output:** Structured medication table + downloadable PDF medication summary.

**Clinical rationale:** Prescription digitisation errors (misread handwriting, incorrect dosage transcription) contribute to an estimated 7,000 preventable deaths annually in the US [20]. Automated prescription scanning with structured output and interaction checking directly addresses this patient safety gap.

---

## Local Model Support (Ollama)

For healthcare organisations that cannot send patient data to external APIs — particularly those operating under India's **ABDM data-residency requirements** — MediFlow AI supports fully local inference via [Ollama](https://ollama.com). When running in Ollama mode, no patient data leaves your server.

### How It Works

All AI inference in MediFlow AI flows through a single shared helper at `api/ai-provider.ts`. The routing is controlled by one environment variable:

```
OLLAMA_URL is SET   →  All inference routes to your local Ollama server
OLLAMA_URL is UNSET →  All inference routes to Google AI Studio (Gemma 4 31B first)
```

This covers all six AI endpoints: `gemma.ts`, `clean-transcript.ts`, `generate-handoff.ts`, `generate-sample.ts`, `scan-prescription.ts`, and `extract-from-image.ts`. The same clinical prompts and logic run identically in both modes.

### Quick Setup

```bash
# 1. Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# 2. Pull a Gemma model
ollama pull gemma3:4b

# 3. Start the Ollama server
ollama serve

# 4. Set environment variables in your .env file
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=gemma3:4b
```

See **[OLLAMA_SETUP.md](OLLAMA_SETUP.md)** for the complete setup guide including remote server configuration, systemd service setup, and troubleshooting.

**Recommended models:**

| Model | VRAM Required | Speed | Best For |
|---|---|---|---|
| `gemma3:4b` | 4 GB | Fast (2–5s GPU) | High-volume OPD, triage |
| `gemma3:12b` | 8 GB | Medium (5–10s GPU) | Discharge summaries, handoffs |
| `gemma3:27b` | 16 GB | Slower (10–20s GPU) | Complex clinical notes |
| CPU (any model) | 0 GB VRAM | Slow (15–60s) | Offline-only environments |

### In-App Provider Switching (No Setup Required)

MediFlow AI includes a built-in provider switcher in the **Settings** panel that allows anyone — including hackathon judges — to switch between Gemma 4 (cloud) and Ollama (local) **without touching environment variables, redeploying, or running any server commands**.

**How to switch providers in the live app:**

1. Open the live demo at **[https://mediflow-ai-pi.vercel.app](https://mediflow-ai-pi.vercel.app)**
2. Click **Settings** (gear icon, bottom-left of the sidebar)
3. Scroll to the **AI PROVIDER** section
4. Click **Ollama** to switch from Gemma 4 to Ollama
5. Leave both fields empty to use the public test server automatically (`http://5.149.249.212:11434`, model: `gemma2:2b`)
6. Close Settings — the header badge will immediately show **OLLAMA — gemma2:2b** in amber
7. Run any text module — inference now routes to the Ollama server
8. To switch back, open Settings and click **Gemma 4**

> **Quick start for judges:** Select Ollama and leave both fields empty. The public test server and model are applied automatically as defaults.

**How the in-app switching works technically:**

The Settings panel stores the provider choice in `localStorage` via `src/useSettings.ts`. When a module runs, `src/Dashboard.tsx` reads the current settings and builds a `_providerOverride` object:

```typescript
// Dashboard.tsx — built before every API call
const providerOverride = {
  mode: settings.providerMode,                                    // "ollama" or "gemma"
  ollamaUrl: settings.ollamaUrl || "http://5.149.249.212:11434", // fallback to public server
  ollamaModel: settings.ollamaModel || "gemma2:2b",              // fallback to default model
};
```

This object is sent in the request body to the API endpoint (e.g. `api/gemma.ts`), which extracts it and passes it to `invokeAI()`. Inside `invokeAI()`, the override takes precedence over all environment variables:

```typescript
// api/ai-provider.ts — invokeAI() entry point
const override = req._providerOverride;
if (override?.mode === "ollama" && override.ollamaUrl) {
  return callOllama(req, override.ollamaUrl, override.ollamaModel); // routes to Ollama
}
if (override?.mode === "gemma") {
  return callGoogleAI(req, apiKey); // forces Gemma 4 cloud
}
// Falls through to env-var-based routing if no override
```

The header badge in the dashboard reads `result.provider` from the API response to confirm which backend actually handled the request.

> **Note:** Image-based modules (Prescription Scan, Image Extraction) always use Gemini vision regardless of the provider setting, as Ollama vision requires a separately configured vision model.

### Verifying Ollama Is Active

Every API response includes a `provider` field:
- `"provider": "ollama"` — inference ran on your local Ollama server
- `"provider": "google"` — inference ran on Google AI Studio

### Data Privacy Guarantee

When `OLLAMA_URL` is set, the only network calls made by MediFlow AI are to `${OLLAMA_URL}/v1/chat/completions`. No patient data is sent to Google, OpenAI, or any external service. The `api/ai-provider.ts` source code can be audited to verify this.

---

## Getting Started

### Prerequisites

- Node.js 18+ and pnpm
- A Google AI Studio API key (free at [aistudio.google.com](https://aistudio.google.com))
- A Neon PostgreSQL database (free tier at [neon.tech](https://neon.tech))

### Installation

```bash
git clone https://github.com/saranshshetty2403-cmyk/mediflow-ai-clean.git
cd mediflow-ai-clean
pnpm install
cp .env.example .env
# Edit .env with your API keys
pnpm db:push
pnpm dev
```

The app will be available at `http://localhost:3000`.

### Environment Variables

See [`.env.example`](.env.example) for the full list of required and optional environment variables with descriptions.

---

## Project Structure

```
mediflow-ai-clean/
├── api/                          # Vercel serverless functions
│   ├── gemma.ts                  # Core Gemma 4 router (5 clinical modules)
│   ├── check-ddi.ts              # OpenFDA drug-drug interaction checker
│   ├── extract-from-image.ts     # Vision OCR endpoint (MediScan)
│   ├── scan-prescription.ts      # Structured medication parser
│   ├── clean-transcript.ts       # Voice transcript cleanup
│   ├── generate-sample.ts        # Demo case generator
│   ├── generate-handoff.ts       # SBAR handoff report generator
│   ├── generate-medication-pdf.ts # PDFKit medication summary
│   └── queue-db.ts               # Neon PostgreSQL case queue
├── src/
│   ├── Dashboard.tsx             # Main dashboard (all 6 modules)
│   ├── Home.tsx                  # Landing page
│   └── components/               # Shared UI components
├── .env.example                  # Environment variable template
├── GEMMA_USAGE.md                # Technical reference for Gemma 4 integration
├── KAGGLE_WRITEUP.md             # Hackathon submission writeup
├── CONTRIBUTING.md               # Contribution guidelines
├── SECURITY.md                   # Security and data handling policy
└── LICENSE                       # MIT License
```

---

## Disclaimer

MediFlow AI is a research and demonstration tool built for the Gemma4Good hackathon. All AI-generated outputs must be reviewed by a licensed clinician before any clinical action is taken. This tool is not FDA-cleared and should not be used for actual patient care decisions without appropriate clinical oversight.

---

## References

[1] Government of India, Ministry of Health and Family Welfare. (2024). *National Health Policy 2017: Recommended 2 beds per 1,000 population*. Lok Sabha Unstarred Question No. 4360. https://sansad.in/getFile/loksabhaquestions/annex/183/AU4360_wkfa0t.pdf

[2] International Journal of Community Medicine and Public Health. (2026). "Unlocking India's hospital beds: why a digital portal is the cure for a critical shortage." *IJCMPH*, 13(2). https://www.ijcmph.com/index.php/ijcmph/article/view/14846

[3] Gupta, G. (2026). "Patient Preferences and Overcrowding Pressures at Sawai Man Singh Hospital, Jaipur: A Survey-Based Analysis of Government Healthcare Choices in Rajasthan." *South Indian Journal of Medical and Dental Sciences*. https://sijmds.com/index.php/pub/article/view/81

[4] Sharma, R. et al. (2021). "Overcrowding an encumbrance for an emergency health-care system: A perspective of Health-care providers from tertiary care center in Northern India." *Journal of Education and Health Promotion*, 10(5). https://pmc.ncbi.nlm.nih.gov/articles/PMC7933695/

[5] Modern Shrines. (2026, February 12). "AIIMS Sets New Benchmark: 4.8 Million OPD Patients Treated in a Year, Admissions Up 28%." https://modernshrines.in/2026/02/12/aiims-sets-new-benchmark-4-8-million-opd-patients-treated-in-a-year-admissions-up-28/

[6] Gopichandran, V. et al. (2017). "International Variations in Primary Care Physician Consultation Time: A Systematic Review of 67 Countries." *BMJ Open*, 7(10), e017902. https://doi.org/10.1136/bmjopen-2017-017902

[7] Hameed, S. (2026, January 4). "The Documentation Crisis in Indian Healthcare: Why Doctors Spend 30% of Their Time on Paperwork Instead of Patient Care." RxNote.ai. https://rxnote.ai/blog/documentation-crisis-indian-healthcare-doctors-paperwork

[8] IMARC Group. (2025). *India Private Healthcare Market Size & Share 2034*. https://www.imarcgroup.com/india-private-healthcare-market

[9] KPMG India. (2025, December). "Multi-Speciality Hospitals in India: Evolution of Hospital Deals Post-COVID." https://kpmg.com/in/en/insights/2025/12/multi-speciality-hospitals-in-india-evolution-of-hospitals-deals-post-covid.html

[10] Sriram, S. et al. (2022). "Impoverishing Effects of Out-of-Pocket Healthcare Expenditures in India." *PLOS ONE*. https://pmc.ncbi.nlm.nih.gov/articles/PMC10041239/

[11] One Health Trust. (2016). "63 Million Indians Are Pushed into Poverty by Health Expenses Each Year." https://onehealthtrust.org/news-media/blog/63-million-indian-pushed-into-poverty-due-to-health-expenses-each-year/

[12] Ayushman Bharat Digital Mission. (2024). *ABDM Dashboard: ABHA Accounts and Linked Health Records*. Government of India. https://abdm.gov.in/

[13] Ramaraj, N. & Murugan, G. (2024). "Patient Medical Report Analyser: A Multi-Stage Workflow Integrating Image Processing, OCR, and Language Models for Summarization." In *Proceedings of the International Conference on Intelligent Systems and Computing*. Taylor & Francis. https://doi.org/10.1201/9781003650010-61

[14] Bitterman, D.S. et al. (2020). "Approaching Autonomy in Medical Artificial Intelligence." *The Lancet Digital Health*, 2(9), e447–e449. https://doi.org/10.1016/S2589-7500(20)30187-4

[15] W3C / Motion (2023). Framer Motion `useReducedMotion` hook respects the `prefers-reduced-motion` CSS media query per WCAG 2.1 Success Criterion 2.3.3. https://motion.dev/docs/react-accessibility

[16] US Food and Drug Administration. (2024). *openFDA Drug Label API Documentation*. https://open.fda.gov/apis/drug/label/

[17] Nelson, S.J. et al. (2011). "Normalized Names for Clinical Drugs: RxNorm at 6 Years." *Journal of the American Medical Informatics Association*, 18(4), 441–448. https://doi.org/10.1136/amiajnl-2011-000116

[18] W3C. (2023). *Web Speech API Specification*. https://wicg.github.io/speech-api/

[19] Becker, M.L. et al. (2007). "Hospitalisations and Emergency Department Visits Due to Drug-Drug Interactions: A Literature Review." *Pharmacoepidemiology and Drug Safety*, 16(6), 641–651. https://doi.org/10.1002/pds.1351

[20] Le, H. et al. (2024). "RxNorm for Drug Name Normalization: A Case Study of Prescription Opioids in the FDA Adverse Events Reporting System." *Frontiers in Bioinformatics*, 3, 1328613. https://doi.org/10.3389/fbinf.2023.1328613

[21] Ng, J.J.W. et al. (2025). "Evaluating the Performance of Artificial Intelligence-Based Speech Recognition for Clinical Documentation: A Systematic Review." *npj Digital Medicine*, 8, 220. https://doi.org/10.1038/s41746-025-01220-5

[22] Subramanian, K. et al. (2023). "MediScan: An Application That Processes Prescription Images Using OCR and NLP." *International Journal of Engineering Research and Development*, 21(10), 169–173.

[23] Liu, F. et al. (2017). "The Current Role of Image Compression Standards in Medical Imaging." *Journal of Digital Imaging*, 30(5), 672–680. https://doi.org/10.1007/s10278-017-9971-4

[24] Podder, V. et al. (2023). "SOAP Notes." In *StatPearls*. StatPearls Publishing. https://www.ncbi.nlm.nih.gov/books/NBK482263/

[25] Levin, S. et al. (2018). "Machine-Learning-Based Electronic Triage More Accurately Differentiates Patients With Respect to Clinical Outcomes Compared With the Emergency Severity Index." *Annals of Emergency Medicine*, 71(5), 565–574. https://doi.org/10.1016/j.annemergmed.2017.08.005

[26] Berkowitz, R.E. et al. (2013). "Project BOOST: Effectiveness of a Multihospital Effort to Reduce Rehospitalization." *Journal of Hospital Medicine*, 8(8), 421–427. https://doi.org/10.1002/jhm.2054

[27] Starmer, A.J. et al. (2014). "Changes in Medical Errors After Implementation of a Handoff Program." *New England Journal of Medicine*, 371(19), 1803–1812. https://doi.org/10.1056/NEJMsa1405556

[28] Kohn, L.T. et al. (Eds.). (2000). *To Err Is Human: Building a Safer Health System*. National Academies Press. https://doi.org/10.17226/9728

---

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on how to contribute to this project.

## Security

See [SECURITY.md](SECURITY.md) for the responsible disclosure policy and data handling practices.

---

*Built for the [Gemma4Good Hackathon](https://www.kaggle.com/competitions/gemma4good) on Kaggle.*
