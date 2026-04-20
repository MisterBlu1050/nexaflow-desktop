import { useEffect, useRef, useState } from "react";
import { useDesktop } from "../store";
import Window from "../Window";
import { Plus, ChevronDown, Paperclip, ArrowUp, ThumbsUp, ThumbsDown, RefreshCw, Copy, Sparkles, Zap, Bot, FileText, BarChart2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { routeCommand, type LLMEngine } from '@/hooks/use-command-router';
import { callGemini } from '@/lib/gemini-client';
import { NEXAFLOW_SYSTEM_CONTEXT } from '@/lib/nexaflow-context';
import { useOllama } from '@/hooks/useOllama';
import { exportMemoPdf } from '@/utils/pdfExporter';
import { LLM_PRESETS, type LlmPresetKey } from '@/config/llmConfig';
import DiagramBubble, { extractDiagramJson } from './DiagramBubble';

type ChatMsg = { role: "user" | "assistant"; content: React.ReactNode; raw?: string; engine?: LLMEngine; title?: string; diagramJson?: string };

/** Pill badge shown in each assistant card */
function EngineBadge({ engine }: { engine: LLMEngine }) {
  if (engine === 'gemini') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide bg-gradient-to-r from-blue-500 to-violet-500 text-white shadow-sm">
        <Zap className="w-2.5 h-2.5" />
        Gemini 2.5
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide bg-emerald-100 text-emerald-800 border border-emerald-200">
      <Bot className="w-2.5 h-2.5" />
      Ollama
    </span>
  );
}

const HISTORY = [
  { group: "Today", items: [
    { id: "cas-003", icon: "🔴", label: "CAS-003 — Sales harassment complaint" },
    { id: "people-april", icon: "📊", label: "People Report — April 2026" },
  ]},
  { group: "This week", items: [
    { id: "cas-005", icon: "⚠️", label: "CAS-005 — Misclassified contractors (Engineering)" },
    { id: "remote-be", icon: "⚖️", label: "Remote work policy — Belgian law" },
    { id: "cas-004", icon: "🏥", label: "CAS-004 — Burn-out Camille Laurent" },
  ]},
  { group: "April 2026", items: [
    { id: "comp-eng", icon: "📋", label: "Comp analysis — Engineering" },
    { id: "cas-001", icon: "🗂️", label: "CAS-001 — Conflict Wouter / Stijn" },
  ]},
];

const SUGGESTIONS = [
  { icon: "📊", title: "Generate the April 2026 People Report" },
  { icon: "📄", title: "Draft a permanent contract offer letter" },
  { icon: "🔴", title: "CAS-003 — How to handle a harassment complaint?" },
  { icon: "⚖️", title: "Belgian employment law overview — CP 200" },
  { icon: "🗂️", title: "/diagram org-chart — Visualize the NexaFlow org structure" },
  { icon: "📋", title: "Performance review framework" },
];

const SHORTCUTS = ["/comp-analysis", "/draft-offer", "/onboarding", "/people-report", "/performance-review", "/policy-lookup BE", "/diagram org-chart", "/cas-001", "/cas-003", "/cas-005"];

const MODELS = [
  { id: "fast", icon: "✦", label: LLM_PRESETS.fast.label, badge: "default" },
  { id: "deep", icon: "✦", label: LLM_PRESETS.deep.label },
  { id: "gemini", icon: "◆", label: "Gemini 2.5 Flash · Cloud" },
  { id: "offline", icon: "○", label: "Offline mode" },
];

function Cas008Reply() {
  return (
    <div className="space-y-4 text-[14px] leading-relaxed">
      <h2 className="text-lg font-semibold">GDPR Breach Response — CAS-008 NexaFlow</h2>
      <p><strong>Situation:</strong> Personal data breach (salary data) · Exposure duration: 48h · 500 employees affected</p>

      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h3 className="font-semibold text-red-900 mb-1">⏱️ Legal Deadline</h3>
        <p className="text-red-900">You have <strong>72 hours</strong> from discovery to notify the Belgian DPA (APD/GBA).</p>
        <p className="text-red-900 font-bold mt-1">Deadline: Apr 20, 2026 — 8:00 PM</p>
      </div>

      <div>
        <h3 className="font-semibold mb-2">Immediate Action Checklist</h3>
        <ul className="space-y-1.5">
          {[
            "Document the incident (who, what, when, how many people affected)",
            "Assess risk level → salary data = HIGH RISK → employee notification is mandatory (GDPR Art. 34)",
            "Submit DPA notification via notification.apd-gba.be",
            "Notify all 500 employees in writing",
            "Alert legal & finance leads immediately",
            "File internal IT incident report",
            "Preserve all system logs",
          ].map((t, i) => (
            <li key={i} className="flex items-start gap-2">
              <input type="checkbox" className="mt-1.5 accent-claude-accent" />
              <span>{t}</span>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="font-semibold mb-1">Potential Sanctions if Non-Compliant</h3>
        <p>Up to <strong>4% of global annual turnover</strong> or €20M — whichever is higher (GDPR Art. 83)</p>
      </div>

      <div className="border-t border-claude-border pt-3 space-y-1.5 text-[13px]">
        <div className="flex items-center gap-2">📎 DPA Notification Template <button className="text-claude-accent hover:underline">[Download DOCX]</button></div>
        <div className="flex items-center gap-2">📎 Employee Communication Draft <button className="text-claude-accent hover:underline">[Download DOCX]</button></div>
        <div>✅ Requires CLO validation before submission</div>
        <div className="text-claude-muted">📌 GDPR Art. 33-34 · Belgian Law 30/07/2018</div>
        <div className="text-claude-muted">🕐 Generated in 1.8s · Gemma 4 · Local</div>
      </div>
    </div>
  );
}

export default function NexaAIWindow() {
  const activeConv = useDesktop((s) => s.nexaActiveConv);
  const setActiveConv = useDesktop((s) => s.setNexaActiveConv);
  const prefill = useDesktop((s) => s.nexaPrefill);
  const ctx = useDesktop((s) => s.nexaContext);
  const setPrefill = useDesktop((s) => s.setNexaPrefill);

  const { 
    preset, 
    setPreset, 
    deepMode, 
    setDeepMode, 
    activeModel, 
    activeContext, 
    isResolving,
    generate: generateOllama 
  } = useOllama();
  
  const [model, setModelState] = useState(MODELS[0]);
  const [modelOpen, setModelOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load conversation when activeConv changes
  useEffect(() => {
    if (activeConv === "cas-008") {
      setMessages([
        {
          role: "user",
          content: "We had a data breach yesterday — a salary file was publicly accessible for 48h. What is our legal obligation and what should I do right now?",
        },
        { role: "assistant", content: <Cas008Reply /> },
      ]);
    } else if (activeConv === null) {
      setMessages([]);
    } else {
      setMessages([
        { role: "user", content: `Open conversation: ${activeConv}` },
        { role: "assistant", content: <p>This conversation is archived. Continue chatting below.</p> },
      ]);
    }
  }, [activeConv]);

  // Apply prefill from external (e.g. Gmail "Ask NexaAI")
  useEffect(() => {
    if (prefill) {
      setInput(prefill);
      setPrefill(null, null);
    }
  }, [prefill, setPrefill]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  async function send() {
    const text = input.trim();
    if (!text) return;

    setMessages((m) => [...m, { role: "user", content: text, raw: text }]);
    setInput("");
    setTyping(true);

    let routed = null;
    try {
      routed = await routeCommand(text);
    } catch (err) {
      console.error('routeCommand failed:', err);
    }

    // Determine which engine to use
    const targetEngine: LLMEngine = routed?.engine ?? 'ollama';
    let reply = '';
    let usedEngine: LLMEngine = targetEngine;

    const systemPrompt = routed
      ? `${NEXAFLOW_SYSTEM_CONTEXT}\n\n=== TASK ===\n${routed.systemPrompt}`
      : NEXAFLOW_SYSTEM_CONTEXT;
    const userPrompt = routed?.contextData
      ? `${routed.contextData}\n\nExecute the HR action.`
      : text;

    try {
      if (targetEngine === 'gemini') {
        // ── Gemini path ──────────────────────────────────────
        try {
          const geminiRes = await callGemini({ system: systemPrompt, prompt: userPrompt });
          reply = geminiRes.text;
          usedEngine = 'gemini';
        } catch (geminiErr) {
          console.warn('Gemini failed, falling back to Ollama:', geminiErr);
          // Graceful fallback to Ollama
          const res = await fetch('http://localhost:11434/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              model: activeModel, 
              system: systemPrompt, 
              prompt: userPrompt, 
              stream: false,
              options: { num_ctx: activeContext }
            }),
          });
          const data = await res.json();
          reply = data.response ?? JSON.stringify(data);
          usedEngine = 'ollama';
        }
      } else {
        // ── Ollama path ───────────────────────────────────────
        try {
          const res = await fetch('http://localhost:11434/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              model: activeModel, 
              system: systemPrompt, 
              prompt: userPrompt, 
              stream: false,
              options: { num_ctx: activeContext }
            }),
          });
          const data = await res.json();
          reply = data.response ?? JSON.stringify(data);
          usedEngine = 'ollama';
        } catch (ollamaErr) {
          console.warn('Ollama failed, trying Gemini fallback:', ollamaErr);
          const geminiRes = await callGemini({ system: systemPrompt, prompt: userPrompt });
          reply = geminiRes.text;
          usedEngine = 'gemini';
        }
      }

      const engine = usedEngine;
      // Extract Excalidraw diagram JSON if this is a diagram command
      const diagramJson = routed?.diagramMode ? extractDiagramJson(reply) ?? undefined : undefined;

      // Build display text: strip the raw JSON block from diagram replies to avoid double-render
      const displayText = (() => {
        if (!routed?.diagramMode) return reply;
        if (diagramJson) {
          // Remove the code fence (closed or open) from the visible text
          return reply
            .replace(/```excalidraw[\s\S]*/g, '')   // open or closed fence
            .replace(/```json[\s\S]*?```/g, '')       // closed json fence
            .trim() || null; // null → render nothing (diagram-only response)
        }
        // Extraction failed: warn the user instead of dumping raw JSON
        if (engine === 'ollama') {
          return '⚠️ Ollama cannot reliably generate Excalidraw JSON. Make sure your VITE_GEMINI_API_KEY is set — diagram commands always need Gemini.';
        }
        return '⚠️ Could not parse the diagram — Gemini may have truncated the output. Try again.';
      })();

      setMessages((m) => [...m, {
        role: 'assistant',
        engine,
        title: routed?.title,
        raw: reply,
        diagramJson,
        content: (
          <div className="space-y-3">
            {routed && (
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: routed.cardColor }} />
                <span className="font-semibold text-sm flex-1">{routed.title}</span>
                <EngineBadge engine={engine} />
              </div>
            )}
            {displayText && <p className="text-[14px] whitespace-pre-wrap">{displayText}</p>}
            {routed && (
              <div className="flex flex-wrap gap-2 mt-3">
                {routed.chips.map((chip) => (
                  <button
                    key={chip}
                    onClick={() => setInput(chip)}
                    className="px-3 py-1 rounded-full text-xs border hover:opacity-80 transition"
                    style={{ borderColor: routed.cardColor, color: routed.cardColor }}
                  >
                    {chip}
                  </button>
                ))}
              </div>
            )}
            {routed?.footer && (
              <p className="text-[11px] font-mono text-claude-muted mt-3 pt-2 border-t border-claude-border tracking-wide">
                📌 {routed.footer}
              </p>
            )}
            <p className="text-[11px] text-claude-muted flex items-center gap-1.5 mt-2">
              <EngineBadge engine={engine} />
              <span>GDPR-safe · NexaFlow SA</span>
            </p>
          </div>
        ),
      }]);
    } catch (err) {
      console.error('All engines failed:', err);
      setMessages((m) => [...m, {
        role: 'assistant',
        content: (
          <div className="text-red-500 space-y-1">
            <p>⚠️ Both Ollama and Gemini are unavailable.</p>
            <p className="text-[12px]">Check localhost:11434 or your VITE_GEMINI_API_KEY.</p>
          </div>
        ),
      }]);
    } finally {
      setTyping(false);
    }
  }

  const isEmpty = messages.length === 0;

  return (
    <Window id="nexaai" noPadding>
      <div className="h-full flex bg-claude-bg text-claude-text">
        {/* Sidebar */}
        <aside className="w-[260px] bg-claude-sidebar border-r border-claude-border flex-shrink-0 flex flex-col">
          <div className="p-3">
            <button
              onClick={() => setActiveConv(null)}
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg bg-white border border-claude-border hover:border-claude-accent text-[13px] font-medium transition"
            >
              <Plus className="w-4 h-4" />
              New conversation
            </button>
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-light px-2 pb-3">
            {HISTORY.map((g) => (
              <div key={g.group} className="mb-3">
                <div className="text-[11px] uppercase tracking-wider text-claude-muted px-2 mb-1">{g.group}</div>
                {g.items.map((it) => (
                  <button
                    key={it.id}
                    onClick={() => setActiveConv(it.id)}
                    className={cn(
                      "w-full flex items-center gap-2 px-2 py-1.5 rounded text-[13px] text-left hover:bg-white/70 transition",
                      activeConv === it.id && "bg-white shadow-sm"
                    )}
                  >
                    <span className="text-sm flex-shrink-0">{it.icon}</span>
                    <span className="truncate">{it.label}</span>
                  </button>
                ))}
              </div>
            ))}
          </div>
        </aside>

        {/* Main */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top bar with model selector */}
          <div className="h-12 flex items-center justify-between px-4 border-b border-claude-border bg-claude-bg">
            <div className="flex items-center gap-2 text-[13px] text-claude-muted">
              <Sparkles className="w-4 h-4 text-claude-accent" />
              <span>NexaAI · People Assistant</span>
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-[12px] cursor-pointer hover:opacity-80 transition">
                <input
                  type="checkbox"
                  checked={deepMode}
                  onChange={(e) => setDeepMode(e.target.checked)}
                  className="w-3.5 h-3.5 accent-claude-accent"
                />
                <span className={cn(deepMode && "font-bold text-claude-accent")}>Deep mode</span>
              </label>
              <div className="relative">
                <button
                  onClick={() => setModelOpen((v) => !v)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-claude-border bg-white hover:bg-claude-sidebar text-[12px] min-w-[140px]"
                  disabled={isResolving}
                >
                  {isResolving ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <span>{model.icon}</span>
                  )}
                  <span className="flex-1 text-left">{isResolving ? "Resolving..." : model.label}</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
                {modelOpen && (
                  <div className="absolute right-0 top-10 w-64 bg-white border border-claude-border rounded-md shadow-lg z-10 py-1">
                    <div className="px-3 py-1.5 text-[10px] text-claude-muted border-b border-claude-border mb-1">
                      Target: {activeModel}
                    </div>
                    {MODELS.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => { 
                          setModelState(m); 
                          if (m.id === "fast" || m.id === "deep") setPreset(m.id as LlmPresetKey);
                          setModelOpen(false); 
                        }}
                        className="w-full text-left px-3 py-2 text-[12px] hover:bg-claude-sidebar flex items-center gap-2"
                      >
                        <span>{m.icon}</span>
                        <span className="flex-1">{m.label}</span>
                        {m.badge && <span className="text-[10px] text-claude-muted">{m.badge}</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Conversation */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-light">
            {isEmpty ? (
              <div className="max-w-2xl mx-auto px-6 py-16">
                <div className="text-center mb-10">
                  <div className="text-5xl mb-4 text-claude-accent">✦</div>
                  <h1 className="text-3xl font-serif font-medium mb-2">Good morning, CHRO.</h1>
                  <p className="text-[13px] text-claude-muted">People Assistant · NexaFlow SA · 87 employees · Brussels HQ · Apr 2026</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s.title}
                      onClick={() => setInput(s.title)}
                      className="text-left bg-white border border-claude-border rounded-xl p-4 hover:border-claude-accent hover:shadow-sm transition"
                    >
                      <div className="text-2xl mb-2">{s.icon}</div>
                      <div className="text-[14px] font-medium">{s.title}</div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="max-w-3xl mx-auto px-6 py-6 space-y-6">
                {messages.map((m, i) => (
                  <div key={i} className="flex gap-3">
                    <div className={cn(
                      "w-8 h-8 rounded-full grid place-items-center text-white text-[12px] font-semibold flex-shrink-0",
                      m.role === "user" ? "bg-gradient-to-br from-status-blue to-status-orange" : "bg-claude-accent"
                    )}>
                      {m.role === "user" ? "SL" : "✦"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[12px] text-claude-muted mb-1">{m.role === "user" ? "CHRO Persona" : "NexaAI"}</div>
                      <div className="text-[14px]">{m.content}</div>
                      {m.diagramJson && (
                        <DiagramBubble
                          jsonString={m.diagramJson}
                          label={m.title ? m.title.toLowerCase().replace(/\s+/g, '-') : 'nexaflow-diagram'}
                          onSave={(json, filename) => (window as any).electron?.saveDiagram(json, filename)}
                        />
                      )}
                      {m.role === "assistant" && (
                        <div className="flex gap-1 mt-3 text-claude-muted">
                          <button className="p-1.5 rounded hover:bg-white"><ThumbsUp className="w-3.5 h-3.5" /></button>
                          <button className="p-1.5 rounded hover:bg-white"><ThumbsDown className="w-3.5 h-3.5" /></button>
                          <button className="p-1.5 rounded hover:bg-white"><RefreshCw className="w-3.5 h-3.5" /></button>
                          <button className="p-1.5 rounded hover:bg-white"><Copy className="w-3.5 h-3.5" /></button>
                          <button 
                            onClick={() => exportMemoPdf({ title: m.title || "NexaFlow Memo", content: m.raw || "" })} 
                            className="p-1.5 rounded hover:bg-white text-claude-accent flex items-center gap-1"
                            title="Export PDF COMEX"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span className="text-[10px] font-medium">PDF</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {typing && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full grid place-items-center text-white bg-claude-accent flex-shrink-0">✦</div>
                    <div className="flex items-center gap-1.5 h-8">
                      <span className="typing-dot w-2 h-2 rounded-full bg-claude-muted" />
                      <span className="typing-dot w-2 h-2 rounded-full bg-claude-muted" />
                      <span className="typing-dot w-2 h-2 rounded-full bg-claude-muted" />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Input bar */}
          <div className="border-t border-claude-border bg-claude-bg p-4">
            <div className="max-w-3xl mx-auto">
              <div className="bg-white rounded-2xl border border-claude-border shadow-sm p-2 flex items-end gap-2">
                <button className="w-9 h-9 grid place-items-center rounded-lg hover:bg-claude-sidebar text-claude-muted">
                  <Paperclip className="w-4 h-4" />
                </button>
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                  rows={1}
                  className="flex-1 resize-none outline-none text-[14px] py-2 px-1 max-h-32"
                  placeholder="Ask NexaAI anything about HR..."
                />
                <button
                  onClick={send}
                  className="w-9 h-9 grid place-items-center rounded-lg bg-claude-accent text-white hover:opacity-90 disabled:opacity-40"
                  disabled={!input.trim()}
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {SHORTCUTS.map((s) => {
                  const isGemini = s.startsWith('/cas-') || s.startsWith('/diagram');
                  return (
                    <button
                      key={s}
                      onClick={() => setInput(s + ' ')}
                      className={cn(
                        "text-[11px] px-2 py-1 rounded-md border transition flex items-center gap-1",
                        isGemini
                          ? "bg-gradient-to-r from-blue-50 to-violet-50 border-violet-200 text-violet-700 hover:border-violet-400"
                          : "bg-white border-claude-border text-claude-muted hover:text-claude-text hover:border-claude-accent"
                      )}
                    >
                      {isGemini && <Zap className="w-2.5 h-2.5" />}
                      {s}
                    </button>
                  );
                })}
              </div>
              <div className="text-[11px] text-claude-muted text-center mt-3 flex items-center justify-center gap-2">
                <span>NexaAI · GDPR compliant · Brussels HQ ·</span>
                <EngineBadge engine="ollama" />
                <span className="font-mono text-[10px] bg-slate-100 px-1 rounded border overflow-hidden truncate max-w-[100px]" title={activeModel}>
                  {activeModel}
                </span>
                <span className="opacity-40">|</span>
                <EngineBadge engine="gemini" />
                <span>deep analysis (/cas-001…005, --deep)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Window>
  );
}
