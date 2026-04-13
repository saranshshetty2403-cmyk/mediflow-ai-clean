# Security Policy — MediFlow AI

---

## Responsible Disclosure

If you discover a security vulnerability in MediFlow AI, please report it by opening a GitHub issue with the label `security`. For vulnerabilities involving potential exposure of patient data or API keys, please contact the repository maintainer directly before public disclosure to allow time for remediation.

We aim to acknowledge security reports within 48 hours and to provide a remediation timeline within 7 days.

---

## Data Handling

### What data is processed

MediFlow AI processes clinical text inputs entered by users into the six workflow modules. This includes patient notes, symptom descriptions, prescription photographs, and voice transcripts. In the live demo deployment, this data is:

- Transmitted over HTTPS to the Vercel-hosted Express server.
- Sent to Google AI Studio for inference (for cloud deployment) or to a local Ollama endpoint (for local deployment).
- Stored in Neon PostgreSQL only when the user explicitly saves a case to the queue.

### What data is NOT stored

- Prescription photographs are not stored. They are processed in memory and discarded after the AI response is returned.
- Voice recordings are not transmitted to any server. The Web Speech API processes audio entirely within the browser; only the resulting text transcript is sent to the server for cleanup.
- No patient identifiers are collected, stored, or transmitted by the platform.

### Google AI Studio data handling

When using the cloud deployment, clinical text inputs are sent to Google AI Studio for inference. Google's data handling policies for AI Studio are described at [https://ai.google.dev/gemini-api/terms](https://ai.google.dev/gemini-api/terms). Healthcare organisations with strict data-residency requirements should use the local model deployment option (see [README.md](README.md#local-model-support-ollama--llamacpp)).

### Local deployment and HIPAA

For healthcare organisations that require HIPAA compliance, MediFlow AI supports fully local inference via Ollama. When `OLLAMA_URL` is set, no patient data is transmitted to external APIs. The OpenFDA and RxNorm API calls in the MediScan module query only drug names (not patient identifiers) and are made to public government APIs.

**Important:** MediFlow AI has not been independently audited for HIPAA compliance. Healthcare organisations deploying this platform in a clinical setting are responsible for conducting their own compliance assessment and implementing appropriate technical and administrative safeguards.

---

## API Key Security

The `GOOGLE_AI_STUDIO_API_KEY` is used both server-side (for clinical module inference) and client-side (for the MediScan direct browser-to-AI call). For the client-side use, the key is embedded in the browser bundle. To minimise risk:

- Scope the API key to the "Generative Language API" only.
- Set usage quotas in Google AI Studio to limit potential abuse.
- Rotate the key regularly.
- For production deployments, consider implementing a server-side proxy for the MediScan vision call to avoid exposing the key in the browser.

---

## Disclaimer

MediFlow AI is a research and demonstration tool. It is not FDA-cleared and is not intended for use in actual patient care. The platform should not be used to make clinical decisions without appropriate review by a licensed clinician. The maintainers of this repository accept no liability for clinical outcomes resulting from use of this software.
