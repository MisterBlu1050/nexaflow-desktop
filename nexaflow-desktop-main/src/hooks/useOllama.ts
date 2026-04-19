import { useState } from 'react';
import { MODELS, DEFAULT_CONTEXT, DEEP_CONTEXT } from '../config/llmConfig';

export const useOllama = () => {
  const [model, setModel] = useState<string>(MODELS.FAST);
  const [deepMode, setDeepMode] = useState<boolean>(false);

  const generate = async (prompt: string, systemPrompt?: string) => {
    const ctx = deepMode ? DEEP_CONTEXT : DEFAULT_CONTEXT;
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        system: systemPrompt,
        prompt,
        options: { num_ctx: ctx },
        stream: false
      })
    });
    return response.json();
  };

  return { model, setModel, deepMode, setDeepMode, generate };
};
