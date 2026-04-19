import { useDesktop } from "./store";
import { X } from "lucide-react";

const NOTIFS = [
  { time: "09:14", color: "bg-status-red", text: "CAS-008 GDPR — 72h deadline critical", app: "Legal" },
  { time: "09:00", color: "bg-status-red", text: "Works Council Amsterdam — call in 1h", app: "Calendar" },
  { time: "08:55", color: "bg-status-orange", text: "7 candidates pending in Workable", app: "Workable" },
  { time: "08:30", color: "bg-status-yellow", text: "Board People Report due at 5PM", app: "Teams" },
  { time: "08:00", color: "bg-status-green", text: "April payroll confirmed by Securex", app: "Securex" },
];

export default function NotificationCenter() {
  const open = useDesktop((s) => s.notifOpen);
  const setNotif = useDesktop((s) => s.setNotif);
  if (!open) return null;
  return (
    <>
      <div className="fixed inset-0 z-[9990]" onClick={() => setNotif(false)} />
      <div className="fixed top-2 bottom-14 right-2 w-[380px] menu-glass rounded-xl shadow-2xl border border-white/10 z-[9995] p-4 animate-slide-right overflow-y-auto scrollbar-thin">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-white/95">Notifications</h2>
          <button onClick={() => setNotif(false)} className="w-7 h-7 grid place-items-center rounded hover:bg-white/10">
            <X className="w-4 h-4 text-white/70" />
          </button>
        </div>
        <div className="space-y-2">
          {NOTIFS.map((n, i) => (
            <div key={i} className="bg-white/5 rounded-lg p-3 border border-white/5 hover:bg-white/10 transition cursor-pointer">
              <div className="flex items-start gap-2">
                <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${n.color}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-white/60">{n.app}</span>
                    <span className="text-[11px] text-white/50">{n.time}</span>
                  </div>
                  <div className="text-[13px] text-white/90 mt-0.5">{n.text}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 bg-white/5 rounded-lg p-3 border border-white/5">
          <div className="text-xs text-white/60 mb-1">Saturday, April 19</div>
          <div className="text-2xl font-light text-white/95">No more events today</div>
        </div>
      </div>
    </>
  );
}
