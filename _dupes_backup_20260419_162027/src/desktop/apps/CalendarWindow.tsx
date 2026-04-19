import Window from "../Window";
import { useDesktop } from "../store";
import { Sparkles } from "lucide-react";

const EVENTS = [
  { time: "09:00", end: "09:30", title: "People & Culture standup", color: "bg-status-blue/80" },
  { time: "10:00", end: "11:00", title: "🔴 Works Council Amsterdam — CAS-001", color: "bg-status-red", urgent: true, openConv: "cas-001" },
  { time: "11:30", end: "12:00", title: "1:1 with CEO — Board prep", color: "bg-status-orange/80" },
  { time: "14:00", end: "15:00", title: "🔴 CAS-002 Investigation — Sales", color: "bg-status-red", urgent: true },
  { time: "16:00", end: "17:00", title: "Engineering candidates review", color: "bg-status-blue/80" },
  { time: "17:00", end: "20:00", title: "⚠️ GDPR notification deadline -3h", color: "bg-status-yellow", urgent: true, openConv: "cas-008" },
];

const HOURS = Array.from({length: 12}, (_, i) => 8 + i); // 8 → 19

export default function CalendarWindow() {
  const openWindow = useDesktop((s) => s.openWindow);
  const setNexaActiveConv = useDesktop((s) => s.setNexaActiveConv);

  function clickEvent(e: typeof EVENTS[number]) {
    if (e.openConv) {
      setNexaActiveConv(e.openConv);
      openWindow("nexaai");
    }
  }

  return (
    <Window id="calendar" noPadding>
      <div className="h-full flex flex-col bg-white text-[hsl(220_15%_18%)]">
        <header className="h-14 border-b flex items-center px-5 gap-4">
          <div className="text-lg font-medium">Calendar</div>
          <div className="text-sm text-[hsl(220_9%_46%)]">Sunday, April 19, 2026</div>
          <div className="ml-auto flex items-center gap-2 text-[12px] text-[hsl(220_9%_46%)]">Today's schedule · 6 events</div>
        </header>

        <div className="flex-1 overflow-y-auto scrollbar-light">
          <div className="relative grid" style={{gridTemplateColumns: "60px 1fr"}}>
            {HOURS.map((h) => (
              <div key={h} className="contents">
                <div className="border-b border-r text-[11px] text-[hsl(220_9%_46%)] p-2 h-16">
                  {String(h).padStart(2,"0")}:00
                </div>
                <div className="border-b h-16 relative">
                  {EVENTS.filter(e => parseInt(e.time.split(":")[0]) === h).map((e,i) => {
                    const startMin = parseInt(e.time.split(":")[1]);
                    const endH = parseInt(e.end.split(":")[0]);
                    const endMin = parseInt(e.end.split(":")[1]);
                    const totalMin = (endH - h) * 60 + (endMin - startMin);
                    return (
                      <button
                        key={i}
                        onClick={() => clickEvent(e)}
                        className={`absolute left-2 right-2 ${e.color} text-white rounded px-2 py-1 text-left shadow-sm hover:opacity-90 cursor-pointer`}
                        style={{
                          top: `${(startMin/60)*100}%`,
                          height: `${(totalMin/60)*64}px`,
                          minHeight: 22,
                        }}
                      >
                        <div className="text-[11px] font-semibold">{e.time} – {e.end}</div>
                        <div className="text-[12px] truncate">{e.title}</div>
                        {e.openConv && (
                          <div className="text-[10px] mt-0.5 flex items-center gap-1 opacity-90">
                            <Sparkles className="w-3 h-3" /> Click to open in NexaAI
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Window>
  );
}
