export type LlmPresetKey = 'fast' | 'deep';

export interface LlmPreset {
  label: string;
  preferredModel: string;
  fallbackModel: string;
  context: number;
}

export const LLM_PRESETS: Record<LlmPresetKey, LlmPreset> = {
  fast: {
    label: 'Gemma 4 · Rapide',
    preferredModel: 'gemma4:latest', // From user's ollama list
    fallbackModel: 'llama3.2:3b',    // Light fallback
    context: 4096,
  },
  deep: {
    label: 'Gemma 4 · Profond',
    preferredModel: 'gemma4:26b',    // Heavy model for deep analysis
    fallbackModel: 'gemma3:27b',    // Alternative heavy model
    context: 32768,
  },
};

export const DEFAULT_PRESET: LlmPresetKey = 'fast';
