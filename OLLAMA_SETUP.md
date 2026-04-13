# Running MediFlow AI Locally with Ollama

This guide explains how to run MediFlow AI entirely on your own hardware using [Ollama](https://ollama.com) — no internet connection required after the initial model download, and no patient data ever leaves your server.

This configuration is recommended for:
- Government hospitals operating under ABDM data-residency requirements
- Private clinics that cannot share patient data with cloud providers
- Offline or low-connectivity environments (rural hospitals, disaster response)
- Any deployment where data sovereignty is a hard requirement

---

## How the Provider Routing Works

All AI inference in MediFlow AI flows through a single shared helper at `api/ai-provider.ts`. The routing decision is made at startup based on one environment variable:

```
OLLAMA_URL is SET   →  All inference routes to your local Ollama server
OLLAMA_URL is UNSET →  All inference routes to Google AI Studio (Gemma 4 31B first)
```

This means the same codebase, the same prompts, and the same clinical logic run identically in both modes. There is no feature difference between the two — only where the computation happens.

The affected endpoints are:

| Endpoint | Module |
|---|---|
| `api/gemma.ts` | Intake summarization, triage, discharge, urgency scoring, follow-up |
| `api/clean-transcript.ts` | Voice transcript cleaning |
| `api/generate-handoff.ts` | SBAR shift handoff report |
| `api/generate-sample.ts` | Demo sample data generation |
| `api/scan-prescription.ts` | Prescription text cleanup |
| `api/extract-from-image.ts` | Image OCR extraction (vision) |

---

## Prerequisites

| Requirement | Minimum | Recommended |
|---|---|---|
| RAM | 8 GB | 16 GB |
| VRAM (GPU) | 4 GB (gemma3:4b) | 16 GB (gemma3:27b) |
| Disk space | 5 GB | 20 GB |
| OS | Linux, macOS, Windows | Linux (Ubuntu 22.04+) |
| Node.js | 18+ | 20+ |

Ollama runs on CPU if no GPU is available. CPU inference is slower (~10–30 seconds per response) but fully functional.

---

## Step 1 — Install Ollama

**Linux (recommended for hospital servers):**
```bash
curl -fsSL https://ollama.com/install.sh | sh
```

**macOS:**
```bash
brew install ollama
```

**Windows:** Download the installer from [https://ollama.com/download](https://ollama.com/download)

Verify the installation:
```bash
ollama --version
```

---

## Step 2 — Pull the Gemma Model

Choose the model based on your available hardware:

```bash
# Minimum — 4 GB VRAM, fast, suitable for most clinical text tasks
ollama pull gemma3:4b

# Balanced — 8 GB VRAM, better accuracy for complex clinical notes
ollama pull gemma3:12b

# High quality — 16 GB VRAM, matches cloud performance
ollama pull gemma3:27b
```

The model download is a one-time operation. After that, inference is fully offline.

---

## Step 3 — Start the Ollama Server

```bash
ollama serve
```

By default, Ollama listens on `http://localhost:11434`. You can verify it is running:

```bash
curl http://localhost:11434/api/tags
```

You should see a JSON response listing the models you have pulled.

**For hospital server deployments**, run Ollama as a systemd service so it starts automatically:

```bash
sudo systemctl enable ollama
sudo systemctl start ollama
```

---

## Step 4 — Configure MediFlow AI

Set the following environment variables before starting the MediFlow AI server:

```bash
# Required: tells MediFlow AI to use Ollama instead of Google AI Studio
OLLAMA_URL=http://localhost:11434

# Optional: which model to use (defaults to gemma3:4b if not set)
OLLAMA_MODEL=gemma3:4b

# Leave GOOGLE_AI_STUDIO_API_KEY unset for fully offline operation
# Or set it as a fallback for when Ollama is unavailable
```

For a `.env` file (local development):
```
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=gemma3:4b
```

For a remote hospital server where Ollama runs on a different machine:
```
OLLAMA_URL=http://192.168.1.100:11434
OLLAMA_MODEL=gemma3:12b
```

---

## Step 5 — Start MediFlow AI

```bash
npm install
npm run dev
```

When you open the application and run any AI module, the response will include:

```json
{
  "provider": "ollama",
  "model": "gemma3:4b (Ollama local)"
}
```

This confirms that inference is running locally.

---

## Verifying Ollama Is Being Used

Every API response from MediFlow AI includes a `provider` field:

- `"provider": "ollama"` — inference ran on your local Ollama server
- `"provider": "google"` — inference ran on Google AI Studio

You can also check the server logs. When Ollama is active, you will see:

```
[AI Provider] Mode: ollama → http://localhost:11434 (model: gemma3:4b)
```

---

## Troubleshooting

**"Ollama local inference failed" error in the UI**

1. Check that Ollama is running: `curl http://localhost:11434/api/tags`
2. Check that the model is pulled: `ollama list`
3. If the model is not listed, pull it: `ollama pull gemma3:4b`
4. Check the OLLAMA_URL matches exactly where Ollama is listening

**Slow responses (>30 seconds)**

This is normal on CPU-only machines. For clinical use, a GPU with at least 4 GB VRAM is recommended. The `gemma3:4b` model on a modern GPU responds in 2–5 seconds.

**"Connection refused" on a remote server**

By default, Ollama only listens on localhost. To allow remote connections:

```bash
OLLAMA_HOST=0.0.0.0 ollama serve
```

Then set `OLLAMA_URL=http://<server-ip>:11434` in MediFlow AI's environment.

**Vision/image extraction not working with Ollama**

Ensure you are using a vision-capable model. `gemma3:4b` supports vision. If you pulled a text-only variant, pull the full model:

```bash
ollama pull gemma3:4b
```

---

## Model Comparison

| Model | VRAM | Speed | Quality | Best For |
|---|---|---|---|---|
| `gemma3:4b` | 4 GB | Fast (2–5s GPU) | Good | High-volume OPD, triage |
| `gemma3:12b` | 8 GB | Medium (5–10s GPU) | Better | Discharge summaries, handoffs |
| `gemma3:27b` | 16 GB | Slower (10–20s GPU) | Best | Complex clinical notes |
| CPU (any) | 0 GB VRAM | Slow (15–60s) | Same as GPU | Low-volume, offline-only |

---

## Data Privacy Guarantee

When `OLLAMA_URL` is set:

- Patient data is processed entirely on your server
- No data is sent to Google, OpenAI, or any external service
- The only network calls made are to your local Ollama endpoint
- This satisfies ABDM data-residency requirements for Indian healthcare providers

The `api/ai-provider.ts` source code can be audited to verify this claim. The Ollama path calls only `${process.env.OLLAMA_URL}/v1/chat/completions` — no other external URLs.

---

## References

- Ollama documentation: [https://github.com/ollama/ollama/blob/main/docs/api.md](https://github.com/ollama/ollama/blob/main/docs/api.md)
- Gemma 3 model card: [https://ai.google.dev/gemma/docs/model_card_3](https://ai.google.dev/gemma/docs/model_card_3)
- ABDM data governance: [https://abdm.gov.in/publications/policies_regulations](https://abdm.gov.in/publications/policies_regulations)
