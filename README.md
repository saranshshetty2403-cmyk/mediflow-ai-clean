# MediFlow AI — Clinical Workflow Automation Platform

> Reducing administrative burden in healthcare through intelligent automation of clinical documentation, patient triage, and care coordination.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-mediflow--ai--pi.vercel.app-teal?style=for-the-badge)](https://mediflow-ai-pi.vercel.app)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

---

## Overview

MediFlow AI is a clinical workflow automation platform built for healthcare teams. It addresses one of the most persistent problems in modern medicine: **administrative overload**. Clinicians spend up to 40% of their working hours on documentation, triage coordination, and care communication — time that should be spent with patients.

MediFlow AI automates six core clinical workflows, enabling staff to process patient cases in seconds rather than minutes.

---

## Live Demo

**[https://mediflow-ai-pi.vercel.app](https://mediflow-ai-pi.vercel.app)**

No login required to explore the platform. Click **"Try Live Demo"** on the landing page to access the full dashboard.

---

## Features

### 1. Intake Summarization
Paste raw patient notes — handwritten transcripts, voice-to-text output, or EHR exports — and receive a structured clinical summary with chief complaint, vitals, relevant history, current medications, and ICD-10 code suggestions in under two seconds.

### 2. Smart Triage and Routing
Analyzes incoming patient messages and automatically routes them to the appropriate care team: cardiology, primary care, urgent care, or administration. Includes urgency scoring and recommended action flags.

### 3. Discharge Instructions
Generates plain-language discharge instructions tailored to the patient's diagnosis, literacy level, and language. Produces patient-ready documents that reduce readmission rates by improving comprehension.

### 4. Urgency Scoring
Real-time risk assessment from symptom descriptions. Critical cases are flagged immediately with a numerical urgency score (1–10) and a recommended escalation pathway.

### 5. Follow-Up Planner
Generates structured follow-up care plans with appointment scheduling recommendations, medication adherence reminders, and specialist referral criteria based on the patient's discharge summary.

### 6. MediScan — Prescription Scanning
Upload or photograph a prescription label or medication packaging. The platform extracts structured medication data — drug name, strength, dosage form, frequency, duration, route, and special instructions — and generates a branded PDF medication summary for the patient's record.

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   React Frontend                     │
│  (Vite + TypeScript + Tailwind CSS + shadcn/ui)     │
└──────────────────────┬──────────────────────────────┘
                       │ tRPC (type-safe API)
┌──────────────────────▼──────────────────────────────┐
│                 Express Backend                      │
│         (Node.js + tRPC + Drizzle ORM)              │
└──────────────────────┬──────────────────────────────┘
                       │
        ┌──────────────┴──────────────┐
        │                             │
┌───────▼────────┐          ┌────────▼────────┐
│  Google AI     │          │   MySQL / TiDB  │
│  Studio API    │          │   (Drizzle ORM) │
│  (LLM engine)  │          │   (Queue, Users)│
└────────────────┘          └─────────────────┘
```

**Stack:**

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, TypeScript, Tailwind CSS 4, shadcn/ui |
| Backend | Node.js, Express 4, tRPC 11 |
| Database | MySQL (Drizzle ORM) |
| AI | Google AI Studio |
| Deployment | Vercel |

---

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (`npm install -g pnpm`)
- A MySQL database (local or cloud — [PlanetScale](https://planetscale.com), [TiDB Cloud](https://tidbcloud.com), or [Railway](https://railway.app) all work)
- A Google AI Studio API key ([Get one free](https://aistudio.google.com/app/apikey))

### Installation

```bash
# Clone the repository
git clone https://github.com/saranshshetty2403-cmyk/mediflow-ai-clean.git
cd mediflow-ai-clean

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env
# Edit .env with your credentials (see Environment Variables section below)

# Push database schema
pnpm db:push

# Start development server
pnpm dev
```

The app will be available at `http://localhost:3000`.

### Environment Variables

Create a `.env` file in the project root with the following variables:

```env
# Database
DATABASE_URL=mysql://user:password@host:3306/mediflow

# Authentication
JWT_SECRET=your-jwt-secret-here
VITE_APP_ID=your-app-id

# AI
GOOGLE_AI_STUDIO_API_KEY=your-google-ai-studio-key
```

### Deployment

The project is configured for one-click deployment on Vercel:

1. Fork this repository
2. Connect it to your Vercel account at [vercel.com/new](https://vercel.com/new)
3. Add the environment variables in Vercel's project settings
4. Deploy — Vercel handles the build automatically

---

## Project Structure

```
├── client/                 # React frontend
│   ├── src/
│   │   ├── pages/          # Dashboard, Home, NotFound
│   │   ├── components/     # Reusable UI components
│   │   └── lib/trpc.ts     # tRPC client binding
├── server/                 # Express backend
│   ├── routers.ts          # tRPC procedures (all API endpoints)
│   ├── db.ts               # Database query helpers
│   └── _core/              # Auth, LLM, storage helpers
├── drizzle/                # Database schema and migrations
│   └── schema.ts           # Table definitions
└── shared/                 # Shared types and constants
```

---

## Clinical Standards and Data Sources

MediFlow AI references established clinical frameworks and publicly available health data standards:

| Standard / Resource | Purpose |
|---|---|
| ICD-10-CM (WHO/CDC) | Diagnosis code suggestions in intake summaries |
| RxNorm (NIH NLM) | Medication normalization in MediScan |
| SNOMED CT | Clinical terminology for triage routing |
| HL7 FHIR R4 | Output format compatibility for EHR integration |
| NHS Digital Medicines | Dosage and frequency reference data |
| FDA Drug Label API | Medication safety and interaction flags |

---

## Disclaimer

MediFlow AI is a demonstration tool. All AI-generated outputs must be reviewed by a licensed clinician before any clinical action is taken. This tool is not FDA-cleared and should not be used for actual patient care decisions.

---

## License

MIT License — see [LICENSE](LICENSE) for details.

---

## Contact

Built by [Saransh Shetty](https://github.com/saranshshetty2403-cmyk).
