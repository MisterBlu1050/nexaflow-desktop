import Window from "../Window";
import { Search } from "lucide-react";

const ROWS = Array.from({length: 24}, (_, i) => {
  const sites = ["Brussels", "Amsterdam", "Paris", "Luxembourg"];
  const depts = ["Engineering", "Sales", "Operations", "G&A", "Marketing"];
  const ctypes = ["CDI", "Permanent", "CDI", "CDI"];
  const legal = ["CP 200 (BE)", "BetrVG (NL)", "Code du Travail (FR)", "Code du Travail (LU)"];
  const site = sites[i % 4];
  return {
    id: `EMP-${(1000 + i).toString()}`,
    name: ["Adèle J.","Marc H.","Lien V.","Tomás G.","Anna B.","Priya S.","Nikolai P.","Élise D."][i%8] + " " + (i+1),
    site,
    dept: depts[i % depts.length],
    role: ["Backend Eng.","Account Exec.","Ops Manager","Recruiter","Data Analyst"][i%5],
    contract: ctypes[i%4],
    legal: legal[i%4],
    salary: 45000 + (i*1200),
    start: `202${i%5}-0${(i%9)+1}-15`,
  };
});

export default function SirhWindow() {
  return (
    <Window id="sirh" noPadding onClose={() => {
      return window.confirm("Close SIRH? Unsaved filters will be lost.");
    }}>
      <div className="h-full bg-white text-[hsl(220_15%_18%)] flex flex-col">
        <header className="h-12 bg-[hsl(150_50%_30%)] text-white flex items-center px-4 gap-4">
          <div className="font-semibold">SIRH NexaFlow</div>
          <div className="text-[12px] opacity-80">SIRH_500.xlsx · 500 employees · 4 sites</div>
        </header>
        <div className="px-4 py-3 border-b flex items-center gap-2">
          <div className="flex items-center bg-[hsl(220_14%_96%)] rounded px-3 h-8 w-72">
            <Search className="w-3.5 h-3.5 text-[hsl(220_9%_46%)] mr-2" />
            <input className="bg-transparent flex-1 outline-none text-sm" placeholder="Search employee, site, dept…" />
          </div>
          <div className="text-[12px] text-[hsl(220_9%_46%)]">Filters: All sites · All depts · Active</div>
        </div>
        <div className="flex-1 overflow-auto scrollbar-light">
          <table className="w-full text-[12px]">
            <thead className="sticky top-0 bg-[hsl(220_14%_94%)] text-[hsl(220_9%_46%)] uppercase text-[10px] tracking-wider">
              <tr>
                {["ID","Name","Site","Dept","Role","Contract","Legal framework","Salary (gross/yr)","Start"].map(h=>(
                  <th key={h} className="text-left p-2.5 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((r) => (
                <tr key={r.id} className="border-t hover:bg-[hsl(220_14%_98%)]">
                  <td className="p-2.5 font-mono">{r.id}</td>
                  <td className="p-2.5">{r.name}</td>
                  <td className="p-2.5">{r.site}</td>
                  <td className="p-2.5">{r.dept}</td>
                  <td className="p-2.5">{r.role}</td>
                  <td className="p-2.5">{r.contract}</td>
                  <td className="p-2.5"><span className="text-[10px] px-1.5 py-0.5 rounded bg-[hsl(220_14%_94%)]">{r.legal}</span></td>
                  <td className="p-2.5">€{r.salary.toLocaleString()}</td>
                  <td className="p-2.5">{r.start}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <footer className="border-t px-4 py-2 text-[11px] text-[hsl(220_9%_46%)]">
          Showing 24 of 500 · CP 200 (BE) = Belgian Auxiliary Joint Committee · BetrVG (NL/DE) = Works Council statute
        </footer>
      </div>
    </Window>
  );
}
