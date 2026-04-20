// src/desktop/apps/DiagramBubble.tsx
// Renders an Excalidraw JSON diagram inline in the NexaAI chat bubble.
// View-only mode — no editing. Includes Save and Fullscreen buttons.

import { useEffect, useRef, useState, lazy, Suspense } from 'react';
import { Download, Maximize2, Minimize2, AlertTriangle } from 'lucide-react';

// Lazy-load Excalidraw to avoid bloating the initial bundle
const Excalidraw = lazy(() =>
  import('@excalidraw/excalidraw').then((m) => ({ default: m.Excalidraw }))
);

interface DiagramBubbleProps {
  /** Raw Excalidraw JSON string extracted from the LLM response */
  jsonString: string;
  /** Label shown in the save filename, e.g. "org-chart" */
  label?: string;
  /** Triggered by the IPC save button — optional */
  onSave?: (json: string, filename: string) => void;
}

/** Map Ollama/Gemma capitalised, aliased, or shorthand element types → valid Excalidraw types */
const TYPE_MAP: Record<string, string> = {
  Rectangle: 'rectangle', Rect: 'rectangle', rect: 'rectangle', box: 'rectangle',
  Ellipse: 'ellipse', Circle: 'ellipse', ellipse: 'ellipse', circle: 'ellipse',
  Text: 'text', Label: 'text', label: 'text',
  Arrow: 'arrow', arrow: 'arrow',
  Line: 'line', line: 'line',
  Diamond: 'diamond', diamond: 'diamond', rhombus: 'diamond',
  // "Group" is not a drawable element — normaliseElements drops it
};

const VALID_TYPES = new Set(['rectangle', 'ellipse', 'diamond', 'text', 'arrow', 'line', 'freedraw', 'image']);

/**
 * When the model writes "type": "excalidraw" on an element (copying the outer
 * document type), infer the real element type from its properties.
 */
function inferElementType(el: any): string {
  if (el.points) return 'arrow';              // has points array → arrow/line
  if (typeof el.text === 'string' && el.text) return 'text';
  if (el.rx !== undefined || el.ry !== undefined) return 'ellipse';
  return 'rectangle';                         // safest default for shaped containers
}

/** Required scalar fields every Excalidraw element must have */
const ELEMENT_DEFAULTS: Record<string, unknown> = {
  x: 0, y: 0, width: 120, height: 60,
  strokeColor: '#1e293b', backgroundColor: 'transparent',
  fillStyle: 'solid', strokeWidth: 2, strokeStyle: 'solid',
  roughness: 0, opacity: 100, angle: 0,
  seed: 1, version: 1, versionNonce: 0,
  isDeleted: false, groupIds: [], boundElements: [], link: null, locked: false,
};

/** Translate Ollama-style shorthand properties to valid Excalidraw property names */
function remapProps(el: any): any {
  const out: any = { ...el };
  // fill → backgroundColor (Ollama often uses CSS-style names)
  if (out.fill !== undefined && out.backgroundColor === undefined) {
    out.backgroundColor = out.fill;
  }
  // stroke → strokeColor
  if (out.stroke !== undefined && out.strokeColor === undefined) {
    out.strokeColor = out.stroke;
  }
  // label/content → text
  if (out.label !== undefined && out.text === undefined) {
    out.text = out.label;
  }
  return out;
}

function normalizeElements(raw: any[]): any[] {
  return raw
    .map((el, idx) => {
      const remapped = remapProps(el);
      const rawType: string = remapped.type ?? '';
      let type = TYPE_MAP[rawType] ?? rawType.toLowerCase();

      // Model wrote "excalidraw" (outer doc type) on the element → infer from props
      if (type === 'excalidraw') {
        type = inferElementType(remapped);
      } else if (!VALID_TYPES.has(type)) {
        return null; // truly unrecognised (e.g. "group", "frame") — drop silently
      }

      // Normalize opacity: CSS-style 0–1 → Excalidraw 0–100
      // (opacity:1 from a model = "fully opaque" in CSS but = "1% visible" in Excalidraw)
      const rawOpacity = remapped.opacity ?? 100;
      const opacity = rawOpacity > 0 && rawOpacity <= 1
        ? Math.round(rawOpacity * 100)
        : rawOpacity;

      const base: any = {
        ...ELEMENT_DEFAULTS,
        ...remapped,
        type,
        opacity,
        id: remapped.id ?? `el_${idx}`,
      };

      if (type === 'text') {
        return {
          ...base,
          text: remapped.text ?? remapped.label ?? '',
          originalText: remapped.originalText ?? remapped.text ?? remapped.label ?? '',
          fontSize: remapped.fontSize ?? 16,
          fontFamily: remapped.fontFamily ?? 1,
          textAlign: remapped.textAlign ?? 'center',
          verticalAlign: remapped.verticalAlign ?? 'middle',
          containerId: remapped.containerId ?? null,
          lineHeight: remapped.lineHeight ?? 1.25,
        };
      }
      return base;
    })
    .filter(Boolean);
}

/**
 * Walk the raw string character-by-character to extract every syntactically
 * complete JSON object `{…}` that appears inside the "elements" array.
 * Robust against any truncation point — only the final incomplete element is lost.
 */
function extractElementsFromRaw(raw: string): any[] {
  const elemStart = raw.indexOf('"elements"');
  if (elemStart < 0) return [];
  const arrOpen = raw.indexOf('[', elemStart);
  if (arrOpen < 0) return [];

  const elements: any[] = [];
  let depth = 0;
  let objStart = -1;
  let inString = false;
  let escape = false;

  for (let i = arrOpen + 1; i < raw.length; i++) {
    const ch = raw[i];
    if (escape) { escape = false; continue; }
    if (ch === '\\' && inString) { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;

    if (ch === '{') {
      if (depth === 0) objStart = i;
      depth++;
    } else if (ch === '}') {
      depth--;
      if (depth === 0 && objStart >= 0) {
        try { elements.push(JSON.parse(raw.slice(objStart, i + 1))); } catch { /* skip malformed */ }
        objStart = -1;
      }
    } else if (ch === ']' && depth === 0) {
      break; // end of elements array
    }
  }
  return elements;
}

/**
 * Try to parse potentially truncated JSON.
 * Cascade: direct → append endings → lastBrace repair → character-walk extractor.
 */
function tryParse(raw: string): any | null {
  // 0. Direct parse (fast path — valid JSON from Gemini)
  try { return JSON.parse(raw); } catch { /* continue */ }

  const trimmed = raw.trimEnd();

  // 1. Append common missing endings (least invasive first)
  const endings = [
    '}',
    ']}',
    ']},"appState":{"viewBackgroundColor":"#ffffff"},"files":{}}',
    ']},"appState":{"viewBackgroundColor":"#ffffff"},"version":2,"files":{}}',
  ];
  for (const end of endings) {
    try { return JSON.parse(trimmed + end); } catch { /* next */ }
  }

  // 2. Truncate at last complete element (last `}`) then close
  const lastBrace = trimmed.lastIndexOf('}');
  if (lastBrace > 0) {
    const upto = trimmed.slice(0, lastBrace + 1);
    for (const end of [']}', ']},"appState":{"viewBackgroundColor":"#ffffff"},"files":{}}']) {
      try { return JSON.parse(upto + end); } catch { /* next */ }
    }
  }

  // 3. Last resort: last complete key-value pair
  const lastComma = trimmed.lastIndexOf(',');
  if (lastComma > 0) {
    const upto = trimmed.slice(0, lastComma);
    for (const end of [']}', ']},"appState":{"viewBackgroundColor":"#ffffff"},"files":{}}']) {
      try { return JSON.parse(upto + end); } catch { /* next */ }
    }
  }

  // 4. Character-walk: extract any complete element objects we can find
  //    and reconstruct a minimal valid Excalidraw document
  const recovered = extractElementsFromRaw(trimmed);
  if (recovered.length > 0) {
    return {
      type: 'excalidraw',
      version: 2,
      source: 'https://excalidraw.com',
      elements: recovered,
      appState: { viewBackgroundColor: '#ffffff' },
      files: {},
    };
  }

  return null;
}

function parseDiagramJson(raw: string): { elements: any[]; appState: any } | null {
  const parsed = tryParse(raw.trim());
  if (!parsed) return null;
  const rawElements = parsed.elements;
  if (!Array.isArray(rawElements) || rawElements.length === 0) return null;
  const elements = normalizeElements(rawElements);
  if (elements.length === 0) return null; // all elements were invalid types
  return {
    elements,
    appState: {
      viewBackgroundColor: parsed.appState?.viewBackgroundColor ?? '#ffffff',
      // Do NOT set gridSize or scrollX/scrollY — let Excalidraw position itself
    },
  };
}

export default function DiagramBubble({ jsonString, label = 'nexaflow-diagram', onSave }: DiagramBubbleProps) {
  const [fullscreen, setFullscreen] = useState(false);
  const [parsed, setParsed] = useState<ReturnType<typeof parseDiagramJson>>(null);
  const [error, setError] = useState<string | null>(null);
  const [excalidrawAPI, setExcalidrawAPI] = useState<any>(null);
  const filename = `${label}-${new Date().toISOString().slice(0, 10)}.excalidraw`;

  // Scroll to fit all elements in view once the API is ready
  useEffect(() => {
    if (!excalidrawAPI || !parsed?.elements?.length) return;
    // Give the canvas one frame to paint before scrolling
    const raf = requestAnimationFrame(() => {
      try {
        excalidrawAPI.scrollToContent(excalidrawAPI.getSceneElements(), {
          fitToContent: true,
          viewportZoomFactor: 0.85,
        });
      } catch { /* API may not support all options in this version */ }
    });
    return () => cancelAnimationFrame(raf);
  }, [excalidrawAPI, parsed]);

  useEffect(() => {
    const result = parseDiagramJson(jsonString);
    if (!result) {
      // Log the raw string to console for debugging
      console.warn('[DiagramBubble] parse failed. Raw JSON (first 500 chars):', jsonString.slice(0, 500));
      const reason = !jsonString.trim().startsWith('{')
        ? 'JSON does not start with { — extraction may have captured surrounding text.'
        : jsonString.includes('"elements"')
          ? 'elements array could not be parsed — JSON may be too heavily truncated.'
          : '"elements" key not found — model may have used a non-standard structure.';
      setError(`Could not render diagram: ${reason} Check the browser console for details.`);
    } else {
      setParsed(result);
      setError(null);
    }
  }, [jsonString]);

  function handleSave() {
    if (onSave) {
      onSave(jsonString, filename);
      return;
    }
    // Fallback: browser download
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (error) {
    return (
      <div className="flex items-start gap-2 text-[13px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3 mt-2">
        <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <span>{error}</span>
      </div>
    );
  }

  if (!parsed) return null;

  const containerClass = fullscreen
    ? 'fixed inset-0 z-50 bg-white flex flex-col'
    : 'relative mt-3 rounded-xl border border-claude-border overflow-hidden bg-white';

  const height = fullscreen ? 'flex-1' : 'h-[420px]';

  return (
    <div className={containerClass}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-claude-border bg-claude-sidebar text-[11px] text-claude-muted">
        <span className="font-mono truncate">{filename}</span>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={handleSave}
            title="Save .excalidraw file"
            className="flex items-center gap-1 px-2 py-1 rounded hover:bg-white transition text-claude-accent hover:text-claude-accent"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Save</span>
          </button>
          <button
            onClick={() => setFullscreen((v) => !v)}
            title={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            className="p-1 rounded hover:bg-white transition"
          >
            {fullscreen
              ? <Minimize2 className="w-3.5 h-3.5" />
              : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Excalidraw canvas */}
      <div className={height}>
        <Suspense fallback={
          <div className="h-full flex items-center justify-center text-[13px] text-claude-muted">
            Loading diagram...
          </div>
        }>
          <Excalidraw
            excalidrawAPI={(api: any) => setExcalidrawAPI(api)}
            initialData={parsed}
            viewModeEnabled={true}
            zenModeEnabled={false}
            gridModeEnabled={false}
            theme="light"
          />
        </Suspense>
      </div>
    </div>
  );
}

/**
 * Extracts an Excalidraw JSON block from LLM response text.
 * Handles:
 *  - ```excalidraw ... ``` (closed fence)
 *  - ```excalidraw ...   (unclosed fence — Ollama truncation)
 *  - ```json { "type": "excalidraw" ... }```
 *  - Bare JSON object containing "type": "excalidraw"
 */
export function extractDiagramJson(text: string): string | null {
  // 1. Properly closed ```excalidraw ... ``` fence
  const closedFence = text.match(/```excalidraw\s*([\s\S]+?)\s*```/);
  if (closedFence) return closedFence[1].trim();

  // 2. Unclosed ```excalidraw ... (Ollama truncates without closing fence)
  const openFence = text.match(/```excalidraw\s*([\s\S]+)$/);
  if (openFence) return openFence[1].trim();

  // 3. Closed ```json block containing "type": "excalidraw"
  const jsonFence = text.match(/```json\s*([\s\S]+?)\s*```/);
  if (jsonFence) {
    const candidate = jsonFence[1].trim();
    if (candidate.includes('"type": "excalidraw"') || candidate.includes('"type":"excalidraw"')) {
      return candidate;
    }
  }

  // 4. Bare JSON object starting with { "type": "excalidraw" (greedy — grab everything to end)
  const bareMatch = text.match(/(\{[\s\S]*?"type"\s*:\s*"excalidraw"[\s\S]+)/);
  if (bareMatch) return bareMatch[1].trim();

  return null;
}
