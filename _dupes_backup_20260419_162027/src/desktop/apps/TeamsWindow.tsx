import Window from "../Window";
import { useDesktop } from "../store";
import { Search, Sparkles, Hash, Send } from "lucide-react";

const MESSAGES = [
  { from: "Lena Verstraete", role: "CEO", time: "09:22", text: "people report ready for board? need it by 5PM 🙏", urgent: true },
  { from: "Amit Patel", role: "Site Lead AMS", time: "09:05", text: "any update on CAS-001? Amsterdam team is nervous" },
  { from: "Yasmina El Idrissi", role: "Talent Lead", time: "08:48", text: "2 offer letters to send today — can NexaAI draft them?", action: "draft-offer" },
];

export default function TeamsWindow() {
  const openWindow = useDesktop((s) => s.openWindow);
  const setNexaPrefill = useDesktop((s) => s.setNexaPrefill);

  function draftOffers() {
    setNexaPrefill("/draft-offer Please draft 2 offer letters for the candidates Yasmina mentioned.");
    openWindow("nexaai");
  }

  return (
    <Window id="teams" noPadding>
      <div className="h-full flex bg-[hsl(220_15%_95%)] text-[hsl(220_15%_18%)]">
        <aside className="w-16 bg-[hsl(255_45%_30%)] flex flex-col items-center py-3 gap-3">
          {["💬","👥","📞","📅","📁","⚙️"].map((i,k) => (
            <button key={k} className="w-10 h-10 grid place-items-center rounded text-white/90 hover:bg-white/10">{i}</button>
          ))}
        </aside>

        <aside className="w-64 bg-white border-r flex flex-col">
          <div className="p-3">
            <div className="flex items-center bg-[hsl(220_14%_94%)] rounded-md px-3 h-8">
              <Search className="w-3.5 h-3.5 text-[hsl(220_9%_46%)] mr-2" />
              <input className="bg-transparent flex-1 text-sm outline-none" placeholder="Search" />
            </div>
          </div>
          <div className="px-2 text-[11px] uppercase tracking-wider text-[hsl(220_9%_46%)] mb-1">Recent</div>
          <div className="flex-1 overflow-y-auto scrollbar-light">
            {MESSAGES.map((m,i) => (
              <div key={i} className={`px-3 py-2.5 border-l-2 ${i===0?"border-[hsl(255_45%_55%)] bg-[hsl(255_45%_97%)]":"border-transparent"} hover:bg-[hsl(220_14%_97%)] cursor-pointer`}>
                <div className="flex items-center justify-between">
                  <div className="text-[13px] font-semibold truncate">{m.from}</div>
                  <div className="text-[10px] text-[hsl(220_9%_46%)]">{m.time}</div>
                </div>
                <div className="text-[11px] text-[hsl(220_9%_46%)] truncate">{m.text}</div>
              </div>
            ))}
          </div>
        </aside>

        <div className="flex-1 flex flex-col">
          <header className="h-14 border-b bg-white px-5 flex items-center gap-3">
            <Hash className="w-4 h-4 text-[hsl(220_9%_46%)]" />
            <div>
              <div className="text-sm font-semibold">Lena Verstraete</div>
              <div className="text-[11px] text-[hsl(220_9%_46%)]">CEO · NexaFlow SA · Active</div>
            </div>
          </header>
          <div className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-light bg-[hsl(220_14%_98%)]">
            {MESSAGES.map((m,i) => (
              <div key={i} className="flex gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[hsl(255_45%_55%)] to-[hsl(280_60%_55%)] grid place-items-center text-white font-semibold text-xs flex-shrink-0">
                  {m.from.split(" ").map(p=>p[0]).slice(0,2).join("")}
                </div>
                <div className="flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-[13px] font-semibold">{m.from}</span>
                    <span className="text-[11px] text-[hsl(220_9%_46%)]">{m.role} · {m.time}</span>
                  </div>
                  <div className="bg-white border rounded-md rounded-tl-none p-3 mt-1 text-[13px]">
                    {m.text}
                    {m.action === "draft-offer" && (
                      <button onClick={draftOffers} className="mt-2 flex items-center gap-1.5 text-[12px] text-[hsl(255_45%_45%)] hover:underline">
                        <Sparkles className="w-3.5 h-3.5" /> Open NexaAI to draft them
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="p-3 border-t bg-white">
            <div className="flex items-center gap-2 border rounded-md px-3 py-2">
              <input className="flex-1 outline-none text-sm" placeholder="Type a new message" />
              <button className="w-8 h-8 grid place-items-center rounded text-[hsl(255_45%_45%)] hover:bg-[hsl(255_45%_95%)]">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </Window>
  );
}
