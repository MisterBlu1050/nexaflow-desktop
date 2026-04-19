import { useState, useEffect } from 'react';
import { DEFAULT_PRESET, LLM_PRESETS, type LlmPresetKey } from '../config/llmConfig';

export function useOllama() {
  const [preset, setPreset] = useState<LlmPresetKey>(DEFAULT_PRESET);
  const [deepMode, setDeepMode] = useState(false);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [resolvedModel, setResolvedModel] = useState<string>(LLM_PRESETS[DEFAULT_PRESET].preferredModel);
  const [isResolving, setIsResolving] = useState(true);

  // Fetch local Ollama models on mount
  useEffect(() => {
    async function fetchModels() {
      try {
        const res = await fetch('http://localhost:11434/api/tags');
        if (!res.ok) throw new Error('Ollama not reachable');
        const data = await res.json();
        const names = data.models?.map((m: any) => m.name) || [];
        setAvailableModels(names);
      } catch (err) {
        console.error('Failed to fetch Ollama models:', err);
      } finally {
        setIsResolving(false);
      }
    }
    fetchModels();
  }, []);

  // Resolve model tag whenever preset or availableModels changes
  useEffect(() => {
    const config = LLM_PRESETS[preset];
    if (availableModels.length === 0) {
      setResolvedModel(config.preferredModel);
      return;
    }

    // Check if preferred exists, otherwise use fallback, otherwise use the first available gemma/llama, or anything
    if (availableModels.includes(config.preferredModel)) {
      setResolvedModel(config.preferredModel);
    } else if (availableModels.includes(config.fallbackModel)) {
      setResolvedModel(config.fallbackModel);
    } else {
      // Emergency: just use the first available model if none of the presets match
      setResolvedModel(availableModels[0] || config.preferredModel);
    }
  }, [preset, availableModels]);

  const activeContext = deepMode ? LLM_PRESETS.deep.context : LLM_PRESETS[preset].context;

  const generate = async (prompt: string, options: Record<string, unknown> = {}) => {
    console.log(`[Ollama] Generating with model: ${resolvedModel}, context: ${activeContext}`);
    
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: resolvedModel,
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
    activeModel: resolvedModel, // UI sees the resolved tag
    activeContext,
    isResolving,
    availableModels,
    generate,
  };
}
