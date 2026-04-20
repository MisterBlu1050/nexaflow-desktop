import { useEffect, useState } from "react";
import { useDesktop, AppId, WindowState } from "./store";
import { Search, Wifi, Volume2, Battery, Bell } from "lucide-react";
import { cn } from "@/lib/utils";

type TaskbarApp = {
  id: AppId;
  icon: string;
  label: string;
  badge?: { count: number; color: string };
};

const APPS: TaskbarApp[] = [
  { id: "gmail", icon: "📧", label: "Gmail", badge: { count: 4, color: "bg-status-red" } },
  { id: "calendar", icon: "📅", label: "Calendar" },
  { id: "folders", icon: "📁", label: "Drive" },
  { id: "nexaai", icon: "✦", label: "NexaAI", badge: { count: 1, color: "bg-status-orange" } },
  { id: "workable", icon: "🎯", label: "ATS", badge: { count: 7, color: "bg-status-blue" } },
  { id: "sirh", icon: "📊", label: "SIRH" },
  { id: "teams", icon: "📞", label: "Teams", badge: { count: 3, color: "bg-status-red" } },
  { id: "securex", icon: "🔒", label: "Payroll" },
];

function useNow() {
  const [now, setNow] = useState(new Date(2026, 3, 19, 9, 31));
  useEffect(() => {
    const t = setInterval(() => setNow((d) => new Date(d.getTime() + 60000)), 60000);
    return () => clearInterval(t);
  }, []);
  return now;
}

function TaskbarButton({ app }: { app: TaskbarApp }) {
  const win = useDesktop((s) => s.windows[app.id]);
  const openWindow = useDesktop((s) => s.openWindow);
  const minimizeWindow = useDesktop((s) => s.minimizeWindow);
  const focusWindow = useDesktop((s) => s.focusWindow);
  const [hover, setHover] = useState(false);

  const active = win.open && !win.minimized;
  const isOpen = win.open;

  function onClick() {
    if (!win.open) openWindow(app.id);
    else if (win.minimized) focusWindow(app.id);
    else minimizeWindow(app.id);
  }

  return (
    <div className="relative" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      <button
        onClick={onClick}
        className={cn(
          "relative w-10 h-10 grid place-items-center rounded hover:bg-white/10 transition",
          active && "bg-white/10"
        )}
        aria-label={app.label}
      >
        <span className="text-[18px] leading-none">{app.icon}</span>
        {app.badge && (
          <span className={cn("absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full text-[10px] font-bold text-white grid place-items-center", app.badge.color)}>
            {app.badge.count}
          </span>
        )}
        {isOpen && (
          <span className={cn("absolute bottom-0.5 h-0.5 rounded-full transition-all", active ? "w-4 bg-win-blue" : "w-1.5 bg-white/60")} />
        )}
      </button>

      {/* Hover preview (Win11 thumbnail) */}
      {hover && isOpen && (
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-56 bg-[hsl(220_8%_14%/0.95)] backdrop-blur-xl rounded-lg shadow-2xl border border-white/10 p-2 animate-slide-up pointer-events-none">
          <div className="text-xs text-white/90 mb-1.5 px-1">{app.label}</div>
          <div className="aspect-video rounded bg-gradient-to-br from-white/10 to-white/5 grid place-items-center text-2xl">
            {app.icon}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Taskbar() {
  const setStartMenu = useDesktop((s) => s.setStartMenu);
  const startMenuOpen = useDesktop((s) => s.startMenuOpen);
  const setNotif = useDesktop((s) => s.setNotif);
  const notifOpen = useDesktop((s) => s.notifOpen);
  const now = useNow();
  const time = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
  const date = now.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }).toUpperCase();

  return (
    <div className="fixed bottom-0 left-0 right-0 h-12 taskbar-glass z-[9999] flex items-center px-2">
      {/* Center cluster */}
      <div className="flex-1 flex justify-center items-center gap-1">
        {/* NexaFlow Start Button — NF monogram */}
        <button
          onClick={() => setStartMenu(!startMenuOpen)}
          className={cn("w-10 h-10 grid place-items-center rounded hover:bg-white/10 transition-all", startMenuOpen && "bg-white/10")}
          aria-label="NexaFlow Start"
          title="NexaFlow"
        >
          <svg width="26" height="26" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* N stroke */}
            <polyline points="28,168 28,32 88,132 88,32" stroke="#16D5C0" strokeWidth="22" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            {/* Connection dot */}
            <circle cx="88" cy="132" r="10" fill="#16D5C0"/>
            {/* F strokes */}
            <polyline points="108,168 108,32 172,32" stroke="#16D5C0" strokeWidth="22" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            <line x1="108" y1="100" x2="162" y2="100" stroke="#16D5C0" strokeWidth="18" strokeLinecap="round"/>
          </svg>
        </button>
        <button className="w-10 h-10 grid place-items-center rounded hover:bg-white/10" aria-label="Search">
          <Search className="w-4 h-4 text-white/85" />
        </button>
        <div className="w-px h-6 bg-white/10 mx-1" />
        {APPS.map((a) => <TaskbarButton key={a.id} app={a} />)}
      </div>

      {/* System tray */}
      <div className="flex items-center gap-1 pr-1">
        <div className="flex items-center gap-2 px-3 h-10 rounded hover:bg-white/10 cursor-pointer">
          <Volume2 className="w-3.5 h-3.5 text-white/85" />
          <Wifi className="w-3.5 h-3.5 text-white/85" />
          <div className="flex items-center gap-1">
            <Battery className="w-4 h-4 text-white/85" />
            <span className="text-[11px] text-white/85">100%</span>
          </div>
        </div>
        <div className="px-3 h-10 grid place-content-center rounded hover:bg-white/10 cursor-pointer">
          <div className="text-[11px] text-white/95 leading-tight text-right">{time}</div>
          <div className="text-[10px] text-white/70 leading-tight text-right">{date}</div>
        </div>
        <button
          onClick={() => setNotif(!notifOpen)}
          className={cn("relative w-10 h-10 grid place-items-center rounded hover:bg-white/10", notifOpen && "bg-white/10")}
        >
          <Bell className="w-4 h-4 text-white/85" />
          <span className="absolute top-1.5 right-1.5 min-w-[14px] h-3.5 px-1 rounded-full text-[9px] font-bold text-white grid place-items-center bg-status-red">5</span>
        </button>
        <div className="px-2 h-10 grid place-content-center text-[11px] text-white/85">EN</div>
      </div>
    </div>
  );
}
