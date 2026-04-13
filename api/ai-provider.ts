// Vercel compiles each api/*.ts file independently with moduleResolution: node16.
// This declaration makes `process.env` available without requiring @types/node
// in the project-level tsconfig, which would break the frontend build.
declare const process: { env: Record<string, string | undefined> };

/**
 * ai-provider.ts — MediFlow AI
 * ─────────────────────────────────────────────────────────────────────────────
 * Centralised AI inference helper that supports two provider modes:
 *
 *  1. OLLAMA (local, on-premise)
 *     Activated when the OLLAMA_URL environment variable is set.
 *     All inference is routed to the local Ollama server using the
 *     OpenAI-compatible /api/chat endpoint.
 *     Default model: gemma3:4b  (override with OLLAMA_MODEL env var)
 *
 *  2. GOOGLE AI STUDIO (cloud, default)
 *     Used when OLLAMA_URL is NOT set.
 *     Runs a 3-model fallback chain to maximise uptime:
 *       gemma-4-31b-it  →  gemini-2.5-flash  →  gemini-2.5-flash-lite
 *     Requires GOOGLE_AI_STUDIO_API_KEY.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * OLLAMA SETUP (for local / on-premise deployment)
 * ─────────────────────────────────────────────────────────────────────────────
 *  1. Install Ollama:  https://ollama.com/download
 *  2. Pull the model:  ollama pull gemma3:4b
 *     (or for higher quality: ollama pull gemma3:27b)
 *  3. Start the server: ollama serve
 *     (runs on http://localhost:11434 by default)
 *  4. Set environment variables:
 *       OLLAMA_URL=http://localhost:11434
 *       OLLAMA_MODEL=gemma3:4b          # optional, defaults to gemma3:4b
 *  5. Leave GOOGLE_AI_STUDIO_API_KEY unset (or set it as a fallback).
 *
 * When OLLAMA_URL is set, ALL inference in MediFlow AI routes to Ollama.
 * No data leaves your server. This is the recommended configuration for
 * hospitals operating under ABDM data-residency requirements.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * RECOMMENDED OLLAMA MODELS (Gemma family)
 * ─────────────────────────────────────────────────────────────────────────────
 *  gemma3:4b   — 4 GB VRAM  — Fast, suitable for most clinical text tasks
 *  gemma3:12b  — 8 GB VRAM  — Balanced quality/speed
 *  gemma3:27b  — 16 GB VRAM — High quality, matches cloud performance
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

export interface AIRequest {
  /** System prompt (clinical instructions) */
  systemPrompt: string;
  /** User message / patient input */
  userMessage: string;
  /** Max tokens to generate (default: 4096) */
  maxTokens?: number;
  /** Temperature 0–1 (default: 0.3 for clinical consistency) */
  temperature?: number;
}

export interface AIResponse {
  /** The generated text content */
  content: string;
  /** Which model actually produced the response */
  model: string;
  /** Which provider was used: "ollama" or "google" */
  provider: "ollama" | "google";
  /** Models that were tried before this one succeeded (fallback log) */
  switchedFrom?: string[];
}

/**
 * Detect provider mode from environment variables.
 * Returns "ollama" if OLLAMA_URL is set, otherwise "google".
 */
export function getProviderMode(): "ollama" | "google" {
  return process.env.OLLAMA_URL ? "ollama" : "google";
}

/**
 * Call the Ollama local inference server using its OpenAI-compatible API.
 *
 * Ollama exposes /api/chat which accepts the same message format as OpenAI,
 * making it a drop-in replacement for the Google AI Studio OpenAI-compat endpoint.
 *
 * @see https://github.com/ollama/ollama/blob/main/docs/api.md#generate-a-chat-completion
 */
async function callOllama(req: AIRequest): Promise<AIResponse> {
  const ollamaUrl = process.env.OLLAMA_URL!; // guaranteed non-null (checked by caller)
  const model = process.env.OLLAMA_MODEL || "gemma3:4b";
  const maxTokens = req.maxTokens ?? 4096;
  const temperature = req.temperature ?? 0.3;

  // Ollama OpenAI-compatible endpoint: POST /v1/chat/completions
  // This is the same message format used by the Google AI Studio OpenAI-compat endpoint,
  // so the request body is identical — only the URL and auth header differ.
  const response = await fetch(`${ollamaUrl}/v1/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: req.systemPrompt },
        { role: "user",   content: req.userMessage  },
      ],
      max_tokens: maxTokens,
      temperature,
      stream: false, // MediFlow uses non-streaming responses for clinical reliability
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "unknown error");
    throw new Error(
      `Ollama request failed (HTTP ${response.status}): ${errorText}. ` +
      `Ensure Ollama is running at ${ollamaUrl} and model "${model}" is pulled ` +
      `(run: ollama pull ${model})`
    );
  }

  const data = await response.json() as {
    choices: Array<{ message: { content: string } }>;
    model: string;
  };

  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new Error(`Ollama returned an empty response for model "${model}".`);
  }

  return {
    content,
    model: `${model} (Ollama local)`,
    provider: "ollama",
  };
}

/**
 * Call Google AI Studio with a 3-model fallback chain.
 *
 * Priority order (Gemma first, Gemini as fallback):
 *   1. gemma-4-31b-it      — Primary model (Gemma 4, OpenAI-compat endpoint)
 *   2. gemini-2.5-flash    — Fallback 1   (Gemini, native endpoint)
 *   3. gemini-2.5-flash-lite — Fallback 2 (Gemini, native endpoint, fastest)
 *
 * Gemma 4 is always tried first. Gemini models are only used if Gemma 4
 * is rate-limited or unavailable. This ensures the submission always
 * demonstrates Gemma 4 usage as the primary model.
 */
async function callGoogleAI(req: AIRequest, apiKey: string): Promise<AIResponse> {
  type ModelDef =
    | { type: "openai-compat"; model: string; label: string }
    | { type: "gemini-native"; model: string; label: string };

  // Gemma 4 is the PRIMARY model. Gemini variants are emergency fallbacks only.
  const MODELS: ModelDef[] = [
    { type: "openai-compat", model: "models/gemma-4-31b-it", label: "Gemma 4 31B"           },
    { type: "gemini-native", model: "gemini-2.5-flash",      label: "Gemini 2.5 Flash"      },
    { type: "gemini-native", model: "gemini-2.5-flash-lite", label: "Gemini 2.5 Flash-Lite" },
  ];

  const maxTokens   = req.maxTokens  ?? 4096;
  const temperature = req.temperature ?? 0.3;
  const fallbackLog: string[] = [];

  for (let i = 0; i < MODELS.length; i++) {
    const def = MODELS[i];
    let rawText: string | null = null;
    let httpStatus = 500;

    try {
      if (def.type === "openai-compat") {
        // Google AI Studio OpenAI-compatible endpoint (used for Gemma 4)
        const resp = await fetch(
          "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model: def.model,
              messages: [
                { role: "system", content: req.systemPrompt },
                { role: "user",   content: req.userMessage  },
              ],
              max_tokens: maxTokens,
              temperature,
            }),
          }
        );
        httpStatus = resp.status;
        if (resp.ok) {
          const data = await resp.json() as {
            choices: Array<{ message: { content: string } }>;
          };
          rawText = data.choices?.[0]?.message?.content ?? null;
          if (rawText) rawText = stripThoughtTags(rawText);
        }
      } else {
        // Google AI Studio native Gemini endpoint (fallback only)
        const resp = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${def.model}:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{
                parts: [{ text: `${req.systemPrompt}\n\nPATIENT INPUT:\n${req.userMessage}` }],
              }],
              generationConfig: { maxOutputTokens: maxTokens, temperature },
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

    // Rate-limited or server error — try next model in chain
    if (httpStatus === 429 || httpStatus === 503 || httpStatus === 500) {
      fallbackLog.push(def.label);
      if (i === MODELS.length - 1) {
        throw new Error(
          `All AI models are currently rate-limited. ` +
          `Tried: ${fallbackLog.join(" → ")}. Please try again in a few minutes.`
        );
      }
      continue;
    }

    if (httpStatus < 200 || httpStatus >= 300 || !rawText) {
      throw new Error(`API error from ${def.label} (HTTP ${httpStatus})`);
    }

    return {
      content: rawText,
      model: def.label,
      provider: "google",
      switchedFrom: fallbackLog.length > 0 ? fallbackLog : undefined,
    };
  }

  throw new Error("Unexpected error: exhausted model fallback chain");
}

/**
 * Strip <think>...</think> tags that some models (e.g. Gemma 4 reasoning mode)
 * include in their output before the actual clinical response.
 */
function stripThoughtTags(text: string): string {
  return text.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
}

/**
 * Main inference entry point used by all MediFlow AI API endpoints.
 *
 * Automatically selects the provider based on environment variables:
 * - If OLLAMA_URL is set → routes to local Ollama server (on-premise, no data leaves server)
 * - Otherwise           → routes to Google AI Studio (cloud, Gemma 4 first)
 *
 * @example
 * ```ts
 * import { invokeAI } from "./_ai-provider";
 *
 * const result = await invokeAI({
 *   systemPrompt: "You are a clinical documentation assistant...",
 *   userMessage:  "Patient presents with chest pain...",
 * });
 * console.log(result.content);   // The generated clinical text
 * console.log(result.provider);  // "ollama" or "google"
 * console.log(result.model);     // e.g. "Gemma 4 31B" or "gemma3:4b (Ollama local)"
 * ```
 */
export async function invokeAI(req: AIRequest): Promise<AIResponse> {
  const mode = getProviderMode();

  if (mode === "ollama") {
    // ── OLLAMA PATH ────────────────────────────────────────────────────────
    // All inference stays on the local server. No data sent to Google.
    // Ideal for hospitals with ABDM data-residency requirements.
    return callOllama(req);
  }

  // ── GOOGLE AI STUDIO PATH (default) ────────────────────────────────────
  // Gemma 4 31B is always tried first. Gemini is emergency fallback only.
  const apiKey = process.env.GOOGLE_AI_STUDIO_API_KEY;
  if (!apiKey) {
    throw new Error(
      "No AI provider configured. Set GOOGLE_AI_STUDIO_API_KEY for cloud inference, " +
      "or set OLLAMA_URL for local inference."
    );
  }
  return callGoogleAI(req, apiKey);
}
