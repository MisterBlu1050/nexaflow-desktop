/**
 * gemini-client.ts
 * Thin wrapper around Gemini 2.5 Flash REST API.
 * Uses GEMINI_API_KEY from env (Vite: import.meta.env.VITE_GEMINI_API_KEY)
 * Kept minimal — no SDK dependency, pure fetch.
 */

const GEMINI_MODEL = 'gemini-2.5-flash-preview-04-17';
const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

export interface GeminiRequest {
  system: string;
  prompt: string;
}

export interface GeminiResponse {
  text: string;
  model: 'gemini';
  latencyMs: number;
}

function getApiKey(): string {
  // Vite exposes env vars through import.meta.env
  const key = (import.meta as any).env?.VITE_GEMINI_API_KEY as string | undefined;
  if (!key) {
    throw new Error(
      'VITE_GEMINI_API_KEY is not set. Add it to your .env file:\nVITE_GEMINI_API_KEY=your_key_here'
    );
  }
  return key;
}

/**
 * Call Gemini 2.5 Flash (non-streaming, single turn).
 * Throws on network error or API error — caller must catch and fall back.
 */
export async function callGemini(req: GeminiRequest): Promise<GeminiResponse> {
  const apiKey = getApiKey();
  const t0 = performance.now();

  const url = `${GEMINI_BASE}/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  const body = {
    system_instruction: {
      parts: [{ text: req.system }],
    },
    contents: [
      {
        role: 'user',
        parts: [{ text: req.prompt }],
      },
    ],
    generationConfig: {
      temperature: 0.4,
      maxOutputTokens: 2048,
      topP: 0.95,
    },
    safetySettings: [
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
    ],
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errBody = await res.text().catch(() => '');
    throw new Error(`Gemini API error ${res.status}: ${errBody}`);
  }

  const data = await res.json();
  const text: string =
    data?.candidates?.[0]?.content?.parts?.[0]?.text ??
    data?.candidates?.[0]?.output ??
    JSON.stringify(data);

  return { text, model: 'gemini', latencyMs: Math.round(performance.now() - t0) };
}

/** ────────────────────────────────────────────────────
 *  Routing logic — kept pure so it can be used anywhere
 * ──────────────────────────────────────────────────── */

/**
 * Returns true when the command should be routed to Gemini instead of Ollama.
 *
 * Rules:
 *  - Any command starting with /cas-   → Gemini  (legal/disciplinary cases)
 *  - Any command containing --deep     → Gemini  (explicit deep-analysis flag)
 *  - Free-text (no slash cmd)          → Ollama  (standard assistant)
 *  - /comp-analysis, /onboarding, /people-report, etc. → Ollama (pipeline commands)
 */
export function shouldUseGemini(input: string): boolean {
  const cmd = input.trim().toLowerCase();

  // Explicit deep flag on any command
  if (cmd.includes('--deep')) return true;

  // Case commands (/cas-001, /cas-002, …)
  if (cmd.startsWith('/cas-')) return true;

  // Free-text that mentions a specific case number
  if (/\bcas-\d{3}\b/.test(cmd)) return true;

  return false;
}
