export type LlmPresetKey = 'fast' | 'deep';

export const LLM_PRESETS: Record<LlmPresetKey, {
  label: string;
  ollamaModel: string;
  context: number;
}> = {
  fast: {
    label: 'Gemma 4 · Rapide',
    ollamaModel: 'gemma3:4b',
    context: 4096,
  },
  deep: {
    label: 'Gemma 4 · Profond',
    ollamaModel: 'gemma3:27b',
    context: 32768,
  },
};

export const DEFAULT_PRESET: LlmPresetKey = 'fast';
