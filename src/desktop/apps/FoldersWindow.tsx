import Window from "../Window";
import { useDesktop, AppId } from "../store";
import { Folder, FileSpreadsheet, FileText, FileWarning, ChevronRight } from "lucide-react";

const ITEMS: { id: AppId; icon: React.ReactNode; name: string; type: string; modified: string; size: string }[] = [
  { id: "sirh", icon: <FileSpreadsheet className="w-5 h-5 text-[hsl(150_60%_40%)]" />, name: "SIRH_500.xlsx", type: "Excel", modified: "Today 09:12", size: "2.3 MB" },
  { id: "doc-bible", icon: <FileText className="w-5 h-5 text-status-blue" />, name: "Company_Bible_500.docx", type: "Word", modified: "Apr 17", size: "1.8 MB" },
  { id: "doc-cas008", icon: <FileWarning className="w-5 h-5 text-status-red" />, name: "CAS-008_GDPR_URGENT.docx", type: "Word", modified: "Today 08:55", size: "412 KB" },
];

export default function FoldersWindow() {
  const openWindow = useDesktop((s) => s.openWindow);
  return (
    <Window id="folders" noPadding>
      <div className="h-full bg-white text-[hsl(220_15%_18%)] flex flex-col">
        <header className="h-10 border-b flex items-center px-3 text-[12px] text-[hsl(220_9%_46%)]">
          <span>This PC</span><ChevronRight className="w-3 h-3 mx-1" />
          <span>Documents</span><ChevronRight className="w-3 h-3 mx-1" />
          <span className="text-[hsl(220_15%_18%)] font-medium">NexaFlow HR Folders</span>
        </header>
        <div className="flex-1 flex">
          <aside className="w-52 border-r bg-[hsl(220_14%_98%)] p-2 text-[12px]">
            {["📂 Quick access","📁 NexaFlow HR","   ↳ Recruitment","   ↳ Legal","   ↳ Payroll","   ↳ CAS Investigations","☁️ OneDrive"].map((s,i)=>(
              <div key={i} className="px-2 py-1.5 rounded hover:bg-[hsl(220_14%_94%)] cursor-pointer whitespace-pre">{s}</div>
            ))}
          </aside>
          <div className="flex-1 p-3 overflow-y-auto scrollbar-light">
            <div className="grid grid-cols-[24px_1fr_140px_140px_100px] gap-2 px-2 py-2 text-[11px] uppercase tracking-wider text-[hsl(220_9%_46%)] border-b">
              <span></span><span>Name</span><span>Date modified</span><span>Type</span><span>Size</span>
            </div>
            {ITEMS.map((it) => (
              <button
                key={it.id}
                onDoubleClick={() => openWindow(it.id)}
                className="grid grid-cols-[24px_1fr_140px_140px_100px] gap-2 items-center px-2 py-2 hover:bg-[hsl(220_14%_96%)] rounded text-[13px] w-full text-left"
              >
                {it.icon}
                <span>{it.name}</span>
                <span className="text-[12px] text-[hsl(220_9%_46%)]">{it.modified}</span>
                <span className="text-[12px] text-[hsl(220_9%_46%)]">{it.type}</span>
                <span className="text-[12px] text-[hsl(220_9%_46%)]">{it.size}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </Window>
  );
}
