import Window from "../Window";
import { useDesktop } from "../store";
import { Search, MoreHorizontal, Plus } from "lucide-react";

const POSITIONS = [
  { title: "Senior Backend Engineer", site: "Brussels (IC4)", candidates: 12, stage: "3 in final round", color: "bg-status-red" },
  { title: "Head of Data", site: "Amsterdam", candidates: 5, stage: "1 at offer stage", color: "bg-status-orange" },
  { title: "Comp & Ben Manager", site: "Brussels", candidates: 8, stage: "screening phase", color: "bg-status-yellow" },
];

const COLUMNS = [
  { name: "Sourced", count: 11, items: ["Adèle Janssens", "Nikolai Petrov", "Mei Lin"] },
  { name: "Screen", count: 7, items: ["Jonas Smets", "Priya Sharma"] },
  { name: "Interview", count: 5, items: ["Tomás García", "Anna Brouwer"] },
  { name: "Offer", count: 1, items: ["Élise Dubois"], highlight: true },
  { name: "✅ Hired", count: 2, items: ["Marc Henry"] },
];

export default function WorkableWindow() {
  return (
    <Window id="workable" noPadding>
      <div className="h-full flex flex-col bg-[hsl(220_14%_96%)] text-[hsl(220_15%_15%)]">
        <header className="h-14 bg-white border-b flex items-center px-5 gap-4">
          <div className="font-bold text-[hsl(150_60%_35%)] text-lg">ATS</div>
          <div className="flex items-center bg-[hsl(220_14%_94%)] rounded-md px-3 h-8 flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 text-[hsl(220_9%_46%)] mr-2" />
            <input className="bg-transparent flex-1 text-sm outline-none" placeholder="Search candidates, jobs..." />
          </div>
          <button className="flex items-center gap-1 px-3 h-8 rounded-md bg-[hsl(150_60%_35%)] text-white text-sm">
            <Plus className="w-4 h-4" /> Add
          </button>
        </header>

        <div className="px-5 pt-4 pb-2">
          <h2 className="text-sm font-semibold mb-3">Open Positions — Urgent (3)</h2>
          <div className="grid grid-cols-3 gap-3">
            {POSITIONS.map((p) => (
              <div key={p.title} className="bg-white rounded-lg p-3 border shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-[13px] font-semibold">{p.title}</div>
                    <div className="text-[11px] text-[hsl(220_9%_46%)]">{p.site}</div>
                  </div>
                  <div className={`w-2.5 h-2.5 rounded-full ${p.color}`} />
                </div>
                <div className="text-[12px] mt-2">{p.candidates} candidates · {p.stage}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-x-auto p-5 pt-3">
          <h2 className="text-sm font-semibold mb-3">Senior Backend Engineer · Brussels</h2>
          <div className="grid grid-cols-5 gap-3 min-w-[820px]">
            {COLUMNS.map((c) => (
              <div key={c.name} className="bg-[hsl(220_14%_92%)] rounded-lg p-2 flex flex-col">
                <div className="flex items-center justify-between px-1 pb-2">
                  <div className="text-[12px] font-semibold">{c.name}</div>
                  <div className="text-[11px] text-[hsl(220_9%_46%)]">{c.count}</div>
                </div>
                <div className="space-y-2 flex-1">
                  {c.items.map((name) => (
                    <div key={name} className={`bg-white rounded p-2 shadow-sm border ${c.highlight ? "border-status-orange" : ""}`}>
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-status-blue to-status-orange grid place-items-center text-white text-[10px] font-semibold">
                          {name.split(" ").map(p=>p[0]).slice(0,2).join("")}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[12px] font-medium truncate">{name}</div>
                          <div className="text-[10px] text-[hsl(220_9%_46%)]">Backend Eng.</div>
                        </div>
                        <MoreHorizontal className="w-3.5 h-3.5 text-[hsl(220_9%_46%)]" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Window>
  );
}
