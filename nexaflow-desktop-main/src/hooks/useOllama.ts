import { useState } from 'react';
import { DEFAULT_PRESET, LLM_PRESETS, type LlmPresetKey } from '../config/llmConfig';

export function useOllama() {
  const [preset, setPreset] = useState<LlmPresetKey>(DEFAULT_PRESET);
  const [deepMode, setDeepMode] = useState(false);

  const activeModel = LLM_PRESETS[preset].ollamaModel;
  const activeContext = deepMode ? LLM_PRESETS.deep.context : LLM_PRESETS[preset].context;

  const generate = async (prompt: string, options: Record<string, unknown> = {}) => {
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: activeModel,
        prompt,
        stream: false,
        options: {
          num_ctx: activeContext,
          ...options,
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.error || 'Ollama request failed');
    }

    return data;
  };

  return {
    preset,
    setPreset,
    deepMode,
    setDeepMode,
    activeModel,
    activeContext,
    generate,
  };
}
