# Contributing to MediFlow AI

Thank you for your interest in contributing to MediFlow AI. This document describes how to set up a development environment, the conventions used in this codebase, and the process for submitting contributions.

---

## Development Setup

### Prerequisites

- Node.js 18 or higher
- pnpm (install with `npm install -g pnpm`)
- A Google AI Studio API key (free at [aistudio.google.com](https://aistudio.google.com))
- A Neon PostgreSQL database (free tier at [neon.tech](https://neon.tech))

### Local Installation

```bash
git clone https://github.com/saranshshetty2403-cmyk/mediflow-ai-clean.git
cd mediflow-ai-clean
pnpm install
cp .env.example .env
# Edit .env with your API keys (see .env.example for descriptions)
pnpm db:push
pnpm dev
```

The application will be available at `http://localhost:3000`.

---

## Project Structure

```
mediflow-ai-clean/
├── api/                    # Vercel serverless functions (backend)
│   ├── gemma.ts            # Core Gemma 4 router — edit this to change AI prompts
│   ├── check-ddi.ts        # OpenFDA drug interaction checker
│   ├── extract-from-image.ts  # Vision OCR endpoint
│   ├── scan-prescription.ts   # Structured medication parser
│   ├── clean-transcript.ts    # Voice transcript cleanup
│   ├── generate-sample.ts     # Demo case generator
│   ├── generate-handoff.ts    # SBAR handoff report generator
│   ├── generate-medication-pdf.ts  # PDFKit medication summary
│   └── queue-db.ts         # Neon PostgreSQL case queue
├── src/
│   ├── Dashboard.tsx       # Main dashboard — all 6 modules, browser APIs
│   ├── Home.tsx            # Landing page
│   └── components/         # Shared UI components
├── public/                 # Static assets
└── vercel.json             # Vercel deployment configuration
```

---

## Conventions

### TypeScript

All new code must be written in TypeScript. Avoid using `any` types, particularly for clinical data structures where type safety is important. Define explicit interfaces for all API request and response shapes.

### Prompt Engineering

When modifying Gemma 4 prompts in `api/gemma.ts` or other API files, follow these conventions established in the codebase:

- Begin every system prompt with a specific clinical role assignment (e.g., "You are a clinical documentation assistant").
- For structured outputs, include the exact JSON schema in the prompt.
- For clinical safety modules (urgency scoring, triage), include explicit conservative bias instructions.
- Always include a "do not add information not present in the input" instruction for summarisation modules to prevent hallucination.

### Thinking Tag Stripping

Gemma 4 sometimes produces chain-of-thought reasoning traces enclosed in `<think>`, `<thought>`, or `<reasoning>` tags. All API endpoints must strip these before returning responses:

```typescript
const cleaned = raw
  .replace(/<think>[\s\S]*?<\/think>/gi, '')
  .replace(/<thought>[\s\S]*?<\/thought>/gi, '')
  .replace(/<reasoning>[\s\S]*?<\/reasoning>/gi, '')
  .trim();
```

### Error Handling

All API endpoints must implement the two-tier fallback pattern: Gemma 4 primary, Gemini Flash fallback, then a graceful error message. Never let an AI service failure produce a silent error or partial clinical document.

---

## Submitting Changes

1. Fork the repository and create a branch from `main`.
2. Make your changes, following the conventions above.
3. Test your changes locally with `pnpm dev`.
4. Submit a pull request with a clear description of what was changed and why.

For significant changes to clinical module prompts or AI integration logic, please open an issue first to discuss the proposed change before submitting a pull request.

---

## Clinical Accuracy

MediFlow AI is a research and demonstration tool. If you identify a case where the AI produces clinically inaccurate or potentially harmful output, please open an issue immediately with the input that produced the problematic output (anonymised if necessary). Clinical accuracy issues are treated as high-priority bugs.

---

## Disclaimer

All contributors should note that MediFlow AI is not FDA-cleared and is not intended for use in actual patient care. Contributions that expand the platform's clinical capabilities should include appropriate disclaimers and should not imply regulatory approval.
