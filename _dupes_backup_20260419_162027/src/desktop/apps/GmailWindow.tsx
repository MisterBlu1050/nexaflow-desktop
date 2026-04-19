import { useDesktop } from "../store";
import Window from "../Window";
import { Sparkles, Reply, Forward, Inbox, Star, Send, Folder, Search, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

type Email = {
  id: string;
  from: string;
  fromAddr: string;
  role?: string;
  subject: string;
  preview: string;
  body: string;
  time: string;
  priority: "red" | "orange" | "white";
  unread?: boolean;
  tag?: string;
};

const EMAILS: Email[] = [
  {
    id: "isabelle",
    from: "Isabelle Thiry",
    fromAddr: "isabelle.thiry@nexaflow.io",
    role: "CLO",
    subject: "CAS-008 — GDPR Notification URGENT",
    preview: "CAS-008 — GDPR notification to DPA due by Apr 20, 8PM — I need your sign-off",
    time: "09:14",
    priority: "red",
    unread: true,
    tag: "URGENT",
    body: `Sophie,

Following yesterday's data breach (salary file exposed for 48h), we are legally required to notify the Belgian DPA (APD/GBA) within 72h of discovery — deadline: Apr 20 at 8PM.

I've drafted the notification but need your validation as CHRO before submission.

I also recommend informing all 500 employees given the high-risk nature of salary data.

Can you review and sign off ASAP?

Isabelle Thiry
Chief Legal Officer · NexaFlow SA`,
  },
  {
    id: "lena",
    from: "Lena Verstraete",
    fromAddr: "lena.verstraete@nexaflow.io",
    role: "CEO",
    subject: "Board deck M1",
    preview: "Board deck M1 — can you send the people report before 5PM today?",
    time: "08:47",
    priority: "red",
    unread: true,
    body: `Sophie,

I need the April People Report before 5PM for the M1 board deck. Headcount, attrition, open reqs, comp benchmarking summary.

Lena`,
  },
  {
    id: "ravi",
    from: "Ravi Singh",
    fromAddr: "ravi.singh@nexaflow.io",
    role: "VP Eng. AMS",
    subject: "Works Council Amsterdam",
    preview: "Works Council Amsterdam — meeting tomorrow 10AM — can you prep our position?",
    time: "08:31",
    priority: "orange",
    unread: true,
    body: `Hi Sophie, can we align on our position for the Works Council meeting tomorrow at 10AM? The team is asking about the reorg timeline. — Ravi`,
  },
  {
    id: "workable",
    from: "Workable ATS",
    fromAddr: "noreply@workable.com",
    subject: "7 candidates awaiting review",
    preview: "7 candidates awaiting review — 3 urgent Engineering roles",
    time: "07:55",
    priority: "white",
    body: `You have 7 candidates awaiting your review across 3 Engineering roles. Log into Workable to take action.`,
  },
  {
    id: "securex",
    from: "Securex",
    fromAddr: "no-reply@securex.be",
    subject: "April 2026 payroll confirmed",
    preview: "April 2026 payroll confirmed — 250 staff",
    time: "yesterday",
    priority: "white",
    body: `April 2026 payroll has been validated for 250 employees. Total gross: €1,847,320. Payment date: April 25, 2026.`,
  },
];

function PriorityDot({ p }: { p: Email["priority"] }) {
  const cls = p === "red" ? "bg-status-red" : p === "orange" ? "bg-status-orange" : "bg-white border border-gmail-muted";
  return <div className={cn("w-2.5 h-2.5 rounded-full flex-shrink-0", cls)} />;
}

export default function GmailWindow() {
  const selectedId = useDesktop((s) => s.gmailSelectedEmail);
  const setEmail = useDesktop((s) => s.setGmailEmail);
  const openWindow = useDesktop((s) => s.openWindow);
  const setNexaPrefill = useDesktop((s) => s.setNexaPrefill);
  const setNexaActiveConv = useDesktop((s) => s.setNexaActiveConv);

  const selected = EMAILS.find((e) => e.id === selectedId) ?? EMAILS[0];

  function askNexa(e: Email) {
    setNexaActiveConv(e.id === "isabelle" ? "cas-008" : null);
    setNexaPrefill(
      `About this email from ${e.from} (${e.role ?? ""}): "${e.subject}" — what should I do?`,
      e.body
    );
    openWindow("nexaai");
  }

  return (
    <Window id="gmail" noPadding>
      <div className="h-full bg-gmail-bg text-gmail-text flex">
        {/* Sidebar */}
        <aside className="w-[230px] bg-gmail-sidebar flex-shrink-0 p-3 flex flex-col gap-1">
          <button className="self-start mb-3 flex items-center gap-3 bg-white shadow-sm rounded-2xl px-4 py-3 hover:shadow-md transition">
            <Plus className="w-4 h-4" />
            <span className="text-sm font-medium">Compose</span>
          </button>
          <SideItem icon={<Inbox className="w-4 h-4" />} label="Inbox" count={4} active />
          <SideItem icon={<Star className="w-4 h-4" />} label="Starred" />
          <SideItem icon={<Send className="w-4 h-4" />} label="Sent" />
          <div className="mt-3 text-[11px] uppercase tracking-wider text-gmail-muted px-3">Labels</div>
          <SideItem icon={<Folder className="w-4 h-4" />} label="NexaFlow HR" />
          <SideItem icon={<Folder className="w-4 h-4" />} label="Recruitment" />
          <SideItem icon={<Folder className="w-4 h-4" />} label="Legal" />
        </aside>

        {/* List + reading pane */}
        <div className="flex-1 flex min-w-0">
          {/* Email list */}
          <div className="w-[360px] border-r border-gmail-hover flex flex-col flex-shrink-0">
            <div className="h-12 border-b border-gmail-hover flex items-center px-3 gap-2 bg-white">
              <Search className="w-4 h-4 text-gmail-muted" />
              <input className="flex-1 outline-none text-sm" placeholder="Search mail" />
            </div>
            <div className="flex-1 overflow-y-auto scrollbar-light">
              {EMAILS.map((e) => (
                <button
                  key={e.id}
                  onClick={() => setEmail(e.id)}
                  className={cn(
                    "w-full text-left px-3 py-3 border-b border-gmail-hover hover:bg-gmail-hover transition",
                    selectedId === e.id && "bg-blue-50",
                    e.unread && "font-semibold"
                  )}
                >
                  <div className="flex items-start gap-2">
                    <PriorityDot p={e.priority} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[13px] truncate">
                          {e.from} {e.role && <span className="font-normal text-gmail-muted">({e.role})</span>}
                        </span>
                        <span className="text-[11px] text-gmail-muted whitespace-nowrap">{e.time}</span>
                      </div>
                      <div className="text-[12px] text-gmail-text mt-0.5 truncate">
                        {e.tag && <span className="bg-status-red text-white text-[9px] px-1.5 py-0.5 rounded mr-1.5 align-middle">{e.tag}</span>}
                        {e.subject}
                      </div>
                      <div className="text-[11px] text-gmail-muted mt-0.5 line-clamp-1">{e.preview}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Reading pane */}
          <div className="flex-1 overflow-y-auto scrollbar-light bg-white">
            <div className="p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h1 className="text-xl font-medium mb-1">{selected.subject}</h1>
                  <div className="flex items-center gap-2">
                    {selected.tag && <span className="bg-status-red text-white text-[10px] px-2 py-0.5 rounded font-semibold">{selected.tag}</span>}
                    <span className="text-[11px] text-gmail-muted">Inbox</span>
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3 pb-4 border-b border-gmail-hover">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-status-blue to-status-orange grid place-items-center text-white font-semibold text-sm flex-shrink-0">
                  {selected.from.split(" ").map((p) => p[0]).slice(0, 2).join("")}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium">{selected.from} {selected.role && <span className="font-normal text-gmail-muted">({selected.role})</span>}</div>
                  <div className="text-[12px] text-gmail-muted">From: {selected.fromAddr}</div>
                  <div className="text-[12px] text-gmail-muted">To: sophie.lefevre@nexaflow.io</div>
                </div>
                <div className="text-[11px] text-gmail-muted">{selected.time}</div>
              </div>
              <div className="py-6 text-[14px] leading-relaxed whitespace-pre-line">{selected.body}</div>
              <div className="flex flex-wrap gap-2 mt-4">
                <button className="flex items-center gap-2 px-4 py-2 border border-gmail-hover rounded-full hover:bg-gmail-hover text-[13px]">
                  <Reply className="w-4 h-4" /> Reply
                </button>
                <button className="flex items-center gap-2 px-4 py-2 border border-gmail-hover rounded-full hover:bg-gmail-hover text-[13px]">
                  <Forward className="w-4 h-4" /> Forward
                </button>
                <button
                  onClick={() => askNexa(selected)}
                  className="flex items-center gap-2 px-4 py-2 rounded-full text-[13px] text-white bg-gradient-to-r from-claude-accent to-status-orange hover:opacity-90 shadow"
                >
                  <Sparkles className="w-4 h-4" /> Ask NexaAI about this
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Window>
  );
}

function SideItem({ icon, label, count, active }: { icon: React.ReactNode; label: string; count?: number; active?: boolean }) {
  return (
    <button className={cn(
      "flex items-center gap-3 h-8 rounded-full pl-3 pr-3 text-[13px] hover:bg-gmail-hover transition w-full",
      active && "bg-red-50 text-gmail-red font-semibold"
    )}>
      {icon}
      <span className="flex-1 text-left">{label}</span>
      {count !== undefined && <span className="text-[11px]">{count}</span>}
    </button>
  );
}
