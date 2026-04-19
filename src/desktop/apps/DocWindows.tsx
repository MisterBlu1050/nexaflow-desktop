import Window from "../Window";
import { useDesktop, AppId } from "../store";

type Props = { id: Extract<AppId, "doc-bible" | "doc-cas008">; title: string; subtitle: string; body: React.ReactNode; danger?: boolean };

function DocShell({ id, title, subtitle, body, danger }: Props) {
  return (
    <Window id={id} noPadding>
      <div className="h-full bg-white text-[hsl(220_15%_18%)] flex flex-col">
        <header className={`h-10 ${danger ? "bg-status-red" : "bg-status-blue"} text-white flex items-center px-4`}>
          <div className="text-sm font-semibold">📄 Word</div>
          <div className="ml-3 text-[12px] opacity-90 truncate">{title}</div>
        </header>
        <div className="px-3 py-1.5 border-b text-[11px] text-[hsl(220_9%_46%)] flex gap-3">
          <span>File</span><span>Home</span><span>Insert</span><span>References</span><span>Review</span>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-light bg-[hsl(220_14%_98%)] py-6 px-6">
          <div className="max-w-2xl mx-auto bg-white shadow rounded p-10 min-h-[600px] text-[14px] leading-relaxed">
            <h1 className="text-2xl font-semibold mb-1">{title}</h1>
            <p className="text-[12px] text-[hsl(220_9%_46%)] mb-6">{subtitle}</p>
            {body}
          </div>
        </div>
      </div>
    </Window>
  );
}

export function DocBibleWindow() {
  return (
    <DocShell
      id="doc-bible"
      title="Company Bible — NexaFlow SA (500)"
      subtitle="Internal · Last updated Apr 17, 2026"
      body={
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">1. About NexaFlow</h2>
          <p>NexaFlow SA is a Belgian-headquartered FinTech operating across 4 EU sites: Brussels (HQ), Amsterdam, Paris, and Luxembourg. We employ 500 people across Engineering, Sales, Ops, G&A and Executive functions.</p>
          <h2 className="text-lg font-semibold">2. Legal frameworks per site</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Brussels (BE):</strong> CP 200 — Auxiliary Joint Committee for Employees, governing wages and working conditions in Belgium.</li>
            <li><strong>Amsterdam (NL):</strong> Works Council under <em>BetrVG-equivalent</em> Dutch WOR (Wet op de Ondernemingsraden).</li>
            <li><strong>Paris (FR):</strong> Code du Travail · CSE (Comité Social et Économique).</li>
            <li><strong>Luxembourg (LU):</strong> Code du Travail luxembourgeois · Délégation du Personnel.</li>
          </ul>
          <h2 className="text-lg font-semibold">3. People principles</h2>
          <p>Pay equity reviewed semi-annually. Remote work allowed up to 3 days/week per Belgian Law 30/07/2018 framework. All employees have access to NexaAI for HR self-service.</p>
        </div>
      }
    />
  );
}

export function DocCas008Window() {
  return (
    <DocShell
      id="doc-cas008"
      danger
      title="CAS-008 — GDPR Notification (URGENT)"
      subtitle="Confidential · Draft · Awaiting CHRO sign-off · Deadline: Apr 20, 2026 — 8:00 PM"
      body={
        <div className="space-y-4">
          <div className="bg-red-50 border-l-4 border-status-red p-3 text-[13px]">
            <strong>Status:</strong> Draft — to be submitted to APD/GBA (Belgian Data Protection Authority) within 72 hours of discovery (GDPR Art. 33).
          </div>
          <h2 className="text-lg font-semibold">1. Incident summary</h2>
          <p>On April 17, 2026, a payroll spreadsheet (250 BE employees) was inadvertently published on a publicly accessible URL of the company's Drive. Exposure duration: ~48 hours. Discovered: April 18, 2026 at 20:00 CET.</p>
          <h2 className="text-lg font-semibold">2. Data categories affected</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>Identification data (name, employee ID)</li>
            <li>Compensation data (gross/net salary, bonus)</li>
            <li>Bank account number (IBAN)</li>
          </ul>
          <h2 className="text-lg font-semibold">3. Risk assessment</h2>
          <p>HIGH RISK. Per GDPR Art. 34, communication to data subjects is mandatory.</p>
          <h2 className="text-lg font-semibold">4. Mitigation measures</h2>
          <p>File access revoked, audit logs preserved, IT security investigation opened. Employees to be notified in writing within 48h of submission to APD/GBA.</p>
          <p className="text-[12px] text-[hsl(220_9%_46%)] italic">Reference legal frameworks (kept in original language): RGPD/GDPR Art. 33-34; Loi belge 30/07/2018 sur la protection des personnes physiques.</p>
        </div>
      }
    />
  );
}
