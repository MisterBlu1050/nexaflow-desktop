import { useDesktop, AppId } from "./store";
import { cn } from "@/lib/utils";

const ICONS: { id: AppId; icon: string; label: string; badge?: string }[] = [
  { id: "folders", icon: "📁", label: "HR Folders" },
  { id: "sirh", icon: "📊", label: "SIRH_500.xlsx" },
  { id: "doc-bible", icon: "📄", label: "Company_Bible_500.docx" },
  { id: "doc-cas008", icon: "🗂️", label: "CAS-008_GDPR_URGENT.docx", badge: "URGENT" },
];

export default function DesktopIcons() {
  const selected = useDesktop((s) => s.selectedDesktopIcon);
  const setSelected = useDesktop((s) => s.setSelectedDesktopIcon);
  const openWindow = useDesktop((s) => s.openWindow);

  return (
    <div
      className="absolute top-4 left-4 grid gap-1 z-[1]"
      style={{ gridTemplateColumns: "repeat(1, 100px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) setSelected(null); }}
    >
      {ICONS.map((it) => (
        <div
          key={it.id}
          className={cn("desktop-icon relative", selected === it.id && "selected")}
          onClick={(e) => { e.stopPropagation(); setSelected(it.id); }}
          onDoubleClick={() => openWindow(it.id)}
        >
          <div className="relative text-4xl">
            {it.icon}
            {it.badge && (
              <span className="absolute -top-1 -right-2 px-1.5 py-0.5 rounded text-[9px] font-bold bg-status-red text-white shadow">
                {it.badge}
              </span>
            )}
          </div>
          <div className="desktop-icon-label">{it.label}</div>
        </div>
      ))}
    </div>
  );
}
