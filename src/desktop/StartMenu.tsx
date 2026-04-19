import { useDesktop, AppId } from "./store";
import { Search, Power, Lock } from "lucide-react";

const PINNED: { id: AppId; icon: string; label: string }[] = [
  { id: "gmail", icon: "📧", label: "Gmail" },
  { id: "nexaai", icon: "✦", label: "NexaAI" },
  { id: "sirh", icon: "📊", label: "SIRH" },
  { id: "workable", icon: "🎯", label: "Workable" },
  { id: "teams", icon: "📞", label: "Teams" },
  { id: "calendar", icon: "📅", label: "Calendar" },
  { id: "securex", icon: "🔒", label: "Securex" },
  { id: "folders", icon: "📁", label: "Drive" },
];

export default function StartMenu() {
  const open = useDesktop((s) => s.startMenuOpen);
  const setStartMenu = useDesktop((s) => s.setStartMenu);
  const openWindow = useDesktop((s) => s.openWindow);
  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-[9990]" onClick={() => setStartMenu(false)} />
      <div className="fixed bottom-14 left-1/2 -translate-x-1/2 w-[640px] menu-glass rounded-xl shadow-2xl border border-white/10 z-[9995] p-6 animate-slide-up">
        <div className="flex items-center bg-white/5 rounded-md px-3 h-9 mb-5 border border-white/10">
          <Search className="w-4 h-4 text-white/60 mr-2" />
          <input className="bg-transparent flex-1 text-sm outline-none text-white/90 placeholder-white/40" placeholder="Search Windows" />
        </div>

        <div className="text-xs uppercase tracking-wider text-white/60 mb-3">Pinned</div>
        <div className="grid grid-cols-6 gap-2 mb-6">
          {PINNED.map((a) => (
            <button
              key={a.id}
              onClick={() => { openWindow(a.id); setStartMenu(false); }}
              className="flex flex-col items-center gap-1.5 p-3 rounded-lg hover:bg-white/10 transition"
            >
              <span className="text-2xl">{a.icon}</span>
              <span className="text-[11px] text-white/85 leading-tight text-center">{a.label}</span>
            </button>
          ))}
        </div>

        <div className="border-t border-white/10 pt-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-win-blue to-status-orange grid place-items-center text-white font-semibold text-sm">SL</div>
            <div>
              <div className="text-sm text-white/95">Sophie Lefèvre</div>
              <div className="text-[11px] text-white/60">CHRO · NexaFlow SA</div>
            </div>
          </div>
          <div className="flex gap-1">
            <button className="w-9 h-9 grid place-items-center rounded hover:bg-white/10" title="Lock"><Lock className="w-4 h-4 text-white/80" /></button>
            <button className="w-9 h-9 grid place-items-center rounded hover:bg-white/10" title="Shut down"><Power className="w-4 h-4 text-white/80" /></button>
          </div>
        </div>
      </div>
    </>
  );
}
