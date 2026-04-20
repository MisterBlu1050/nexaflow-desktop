import { employees } from '@/data/employees';
import { payrollData } from '@/data/payroll';
import { NEXAFLOW_SYSTEM_CONTEXT } from '@/lib/nexaflow-context';
export { shouldUseGemini } from '@/lib/gemini-client';

/** Which LLM engine handles this request */
export type LLMEngine = 'ollama' | 'gemini';

export type HandlerResult = {
  cardColor: string;
  title: string;
  systemPrompt: string;
  contextData: string;
  chips: string[];
  skill?: string;
  /** Fixed footer rendered by UI independently of LLM output */
  footer?: string;
  /** When true, UI will try to extract and render Excalidraw JSON from the response */
  diagramMode?: boolean;
  /** Resolved engine for this route — drives badge + dispatch in UI */
  engine: LLMEngine;
};

/**
 * Route a slash-command to the correct HandlerResult.
 * `engine` is set per-route: Gemini for /cas-* and --deep, Ollama for everything else.
 */
export async function routeCommand(input: string): Promise<HandlerResult | null> {
  const isDeep = input.includes('--deep');
  const cmd = input.trim().toLowerCase();

  if (cmd.startsWith('/comp-analysis')) {
    const dept = input.replace(/\/comp-analysis/i, '').trim() || 'Engineering';

    // ── Field name adapters ────────────────────────────────────────────────
    // DB (SQLite via IPC) uses snake_case French: salaire, risque_depart, genre, departement
    // employees.ts (fallback) uses camelCase English: salary, flightRisk, gender, department
    const getSalary  = (e: any): number => Number(e.salaire   ?? e.salary)    || 0;
    const getRisk    = (e: any): string  => (e.risque_depart  ?? e.flightRisk  ?? '').toLowerCase();
    const getGender  = (e: any): string  => (e.genre          ?? e.gender      ?? e.Genre ?? '').toUpperCase();
    const getDept    = (e: any): string  => (e.departement    ?? e.department   ?? '').toLowerCase();

    // ── Fetch data — IPC first, fallback to in-memory ─────────────────────
    let employeesList: any[] = [];
    let usedIPC = false;
    try {
      if (typeof window !== 'undefined' && (window as any).electron?.getCompByDept) {
        const remote = await (window as any).electron.getCompByDept(dept);
        if (Array.isArray(remote) && remote.length > 0) {
          employeesList = remote;
          usedIPC = true;
          console.log(`[IPC] getCompByDept(${dept}): ${remote.length} rows from SQLite`);
        }
      }
    } catch (err) {
      console.error('IPC getCompByDept failed, using local employees:', err);
    }

    if (!usedIPC) {
      // Fallback: filter in-memory employees by department
      const deptFilter = dept.toLowerCase();
      employeesList = deptFilter === 'all'
        ? (employees as any[])
        : (employees as any[]).filter((e: any) => getDept(e) === deptFilter);
    }
    // When using IPC, data is already pre-filtered by SQL WHERE — no client-side filter needed

    const n = employeesList.length;

    // Compute median salary from real data
    const salaries = employeesList
      .map(getSalary)
      .filter((s: number) => s > 0)
      .sort((a: number, b: number) => a - b);
    const medianSalary = salaries.length ? salaries[Math.floor(salaries.length / 2)] : 0;
    const medianDisplay = medianSalary > 0 ? medianSalary.toLocaleString('fr-BE') : 'N/A';

    // Flight risk breakdown
    const highRisk = employeesList.filter((e: any) => getRisk(e) === 'high').length;
    const medRisk  = employeesList.filter((e: any) => getRisk(e) === 'medium').length;

    // Gender split
    const femaleCount = employeesList.filter((e: any) => getGender(e) === 'F').length;
    const genderGapFlag = n > 0 && (femaleCount / n) < 0.4 ? 'Déséquilibre H/F détecté' : 'Répartition H/F acceptable';

    // Turnover note (18% Engineering, no per-dept breakdown in static data)
    const turnoverNote = deptFilter === 'engineering' ? '18% (source: Company Bible Day 1)' : 'données non disponibles — à collecter';

    // Real headcounts from Company Bible (authoritative source)
    // employees.ts is only a representative sample — override with ground truth when IPC is unavailable
    const REAL_HEADCOUNTS: Record<string, number> = {
      engineering: 34,
      sales: 12,
      'customer success': 10,
      product: 8,
      marketing: 6,
      finance: 5,
      operations: 4,
      'people & culture': 3,
      legal: 2,
      'c-suite': 3,
    };
    const realN = REAL_HEADCOUNTS[deptFilter] ?? n;

    // Build the HRIS context block injected into the LLM prompt
    const sirhBlock = `
=== REAL HRIS DATA — Department: ${dept} ===
Source: NexaFlow_SIRH_500.xlsx | Extracted: ${new Date().toLocaleDateString('en-BE')}
Company: NexaFlow SA | HQ: Brussels (Avenue Louise 54) | Total headcount: 87
Department headcount: ${realN}
Gross annual median salary: €${medianDisplay}
Flight risk: ${highRisk} High, ${medRisk} Medium
Gender balance: ${genderGapFlag}
Turnover: ${turnoverNote}
Collective agreement: CP 200 (CPNAE/ANPCB)
Active HR cases for this department:
  - CAS-001: Interpersonal conflict in Engineering (Wouter Janssens vs Stijn Leclercq)
  - CAS-002: Conventional termination request — Jonas Goossens (Senior Backend, confirmed flight risk)
  - CAS-005: 3 misclassified contractors in Engineering — significant ONSS liability

STRICT RULES:
- Use ONLY the data provided above. Never fabricate figures.
- NexaFlow has ONE site: Brussels HQ. Never mention Amsterdam, Berlin, Lisbon.
- Only CAS-001 to CAS-005 exist. Never invent additional cases.
- If data is missing, state it explicitly rather than guessing.
- Always respond in English.
`.trim();

    return {
      skill: 'comp-analysis',
      cardColor: 'from-emerald-900/40 to-teal-900/40',
      title: `Compensation Analysis — ${dept}`,
      systemPrompt: `${NEXAFLOW_SYSTEM_CONTEXT}

=== TASK ===
You are NexaAI, CHRO assistant to Bruno Mineo at NexaFlow SA. Produce a structured compensation analysis for the ${dept} department.
Format: CHRO memo — Executive Summary, HRIS Metrics, Identified Risks, Recommendations, Legal Footer.
The UI will display the footer separately — do not repeat it in your response.`,
      contextData: sirhBlock,
      chips: [`CP200`, dept, `N=${realN}`, `Median €${medianDisplay}`, `/people-report`, `/policy-lookup BE`],
      footer: `CP200 | ${dept} | N=${realN} | Median €${medianDisplay} | ${usedIPC ? 'SQLite live' : 'demo data'} · ${new Date().toLocaleDateString('en-BE')}`,
      engine: isDeep ? 'gemini' : 'ollama',
    };
  }

  if (cmd.startsWith('/draft-offer')) {
    const name = input.replace(/\/draft-offer/i, '').trim() || 'Candidat';
    return {
      cardColor: '#3B82F6',
      title: `Offer Letter — ${name}`,
      systemPrompt: `${NEXAFLOW_SYSTEM_CONTEXT}

=== TASK ===
You are a CHRO at NexaFlow SA. Draft a complete Belgian CDI offer letter for ${name}. Include: gross salary, CP200 classification, notice period (law Eenheidsstatuut), non-compete clause (max 12m, capped), meal vouchers €8/day, eco-vouchers, hospitalization insurance DKV. Format as formal letter.`,
      contextData: '',
      chips: ['Adjust salary', 'Add NDA clause', 'Dutch version', 'Send via DocuSign'],
      engine: isDeep ? 'gemini' : 'ollama',
    };
  }

  if (cmd.startsWith('/onboarding')) {
    const name = input.replace(/\/onboarding/i, '').trim() || 'New hire';
    return {
      cardColor: '#10B981',
      title: `Onboarding — ${name}`,
      systemPrompt: `${NEXAFLOW_SYSTEM_CONTEXT}

=== TASK ===
Create a detailed 30/60/90 day onboarding plan for ${name} joining NexaFlow SA IT dept. Day 1-7: admin setup, badge, tools, team intros. Week 2-4: buddy system, shadow sessions, first deliverable. Day 31-60: own project, 1:1 cadence. Day 61-90: KPI review, probation assessment.`,
      contextData: '',
      chips: ['Generate IT checklist', 'Schedule 1:1s', 'Assign buddy', 'Create ITSM ticket'],
      engine: isDeep ? 'gemini' : 'ollama',
    };
  }

  if (cmd.startsWith('/people-report')) {
    const focus = cmd.includes('attrition') ? 'attrition' : 'overview';
    const promptFocus = focus === 'attrition'
      ? 'Focus on turnover: 12-month attrition rate, top 5 high flight-risk profiles, cost-to-replace analysis (benchmark: 1.5x annual salary).'
      : 'Overview: headcount by department, gender ratio, average tenure, open positions, active cases.';

    // Fetch live people stats from SQLite via IPC
    let peopleStats: any = null;
    let statsSource = 'employees.ts (fallback)';
    try {
      if (typeof window !== 'undefined' && (window as any).electron?.getPeopleStats) {
        const remote = await (window as any).electron.getPeopleStats();
        if (remote && !remote.error) {
          peopleStats = remote;
          statsSource = 'SQLite (live)';
          console.log('[IPC] getPeopleStats: live data from DB');
        }
      }
    } catch (err) {
      console.error('IPC getPeopleStats failed:', err);
    }

    // Build context from live DB data or fallback
    const contextPayload = peopleStats
      ? {
          source: statsSource,
          totalEmployees: peopleStats.total,
          byDept: peopleStats.byDept,
          topFlightRisk: peopleStats.topFlightRisk,
          activeCases: ['CAS-001','CAS-002','CAS-003','CAS-004','CAS-005'],
        }
      : {
          source: statsSource,
          totalEmployees: 87,
          site: 'Brussels HQ',
          byDept: groupBy(employees as any[], 'department'),
          activeCases: ['CAS-001','CAS-002','CAS-003','CAS-004','CAS-005'],
        };

    return {
      cardColor: '#8B5CF6',
      title: 'People Report — ' + (focus === 'attrition' ? 'Attrition Focus' : 'April 2026'),
      systemPrompt: `${NEXAFLOW_SYSTEM_CONTEXT}

=== TASK ===
Generate a People Report for NexaFlow SA. ${promptFocus}
Data source: ${statsSource}.
Active cases: CAS-001 (Engineering conflict), CAS-002 (conventional termination), CAS-003 (Sales harassment), CAS-004 (Product burn-out), CAS-005 (misclassified contractors).
Never fabricate missing data — explicitly flag HRIS gaps.
Always respond in English.`,
      contextData: JSON.stringify(contextPayload, null, 2),
      chips: ['Top flight risks', 'Turnover cost analysis', 'Sector benchmark', 'Export PowerBI'],
      engine: isDeep ? 'gemini' : 'ollama',
    };
  }

  if (cmd.startsWith('/performance-review')) {
    const name = input.replace(/\/performance-review/i, '').trim() || 'Collaborateur';
    return {
      cardColor: '#EAB308',
      title: `Performance Review — ${name}`,
      systemPrompt: `${NEXAFLOW_SYSTEM_CONTEXT}

=== TASK ===
Generate an AI-assisted performance review for ${name} at NexaFlow SA. Use 4-level grid (I=Below expectations, II=Meets, III=Exceeds, IV=Outstanding). Assess: delivery, collaboration, AI competency (Vlaamse Overheid framework), innovation. Include calibration recommendation and development plan.`,
      contextData: '',
      chips: ['Detailed grid', 'Development plan', 'Committee calibration', 'Review history'],
      engine: isDeep ? 'gemini' : 'ollama',
    };
  }

  if (cmd.startsWith('/policy-lookup')) {
    const country = cmd.replace('/policy-lookup', '').trim().toUpperCase() || 'BE';
    // NexaFlow operates in Belgium only — BE is the only relevant jurisdiction
    const frameworks: Record<string, string> = {
      BE: 'Belgian employment law: CP 200 (CPNAE/ANPCB), Employment Contracts Act 03/07/1978, Single Status Act 2014, GDPR (DPA/GBA), structural telework (CBA 149), Wellbeing Act 04/08/1996, DIMONA (Royal Decree 05/11/2002), Social Elections Act 04/12/2007, Gender Pay Gap Act 22/04/2012, Renault Act 13/02/1998',
    };
    const framework = frameworks[country] ?? frameworks['BE'];
    const jurisdictionNote = country !== 'BE'
      ? `Note: NexaFlow SA operates exclusively from Brussels (BE). Jurisdiction ${country} is not applicable — defaulting to Belgian law.`
      : '';
    return {
      cardColor: '#EF4444',
      title: `Policy Lookup — ${country === 'BE' ? 'Belgium (BE)' : `${country} → redirected to BE`}`,
      systemPrompt: `${NEXAFLOW_SYSTEM_CONTEXT}

=== TASK ===
As CHRO at NexaFlow SA (Brussels, BE), provide a structured HR policy brief. ${jurisdictionNote}
Applicable legal framework: ${framework}
Cover: hiring obligations, notice periods, remote work rules, data protection, collective rights, social elections (threshold of 50 reached).
Always respond in English.`,
      contextData: '',
      chips: ['Download policy PDF', 'Compare jurisdictions', 'Legal change alerts', 'Contact CLO'],
      engine: isDeep ? 'gemini' : 'ollama',
    };
  }

  // /cas-001 à /cas-005 — toujours Gemini (analyse juridique/disciplinaire)
  if (cmd.startsWith('/cas-')) {
    const caseId = cmd.split(' ')[0].replace('/cas-', '').toUpperCase();

    // Fiches des cas réels NexaFlow
    const caseDescriptions: Record<string, string> = {
      '001': 'Interpersonal conflict in Engineering between Wouter Janssens and Stijn Leclercq — escalated for 3 weeks. Formal mediation required.',
      '002': 'Conventional termination request from Jonas Goossens (Senior Backend) — confirmed flight risk. Negotiation of terms, risk of voluntary departure.',
      '003': 'Anonymous harassment complaint in Sales — CRITICAL. Formal investigation mandatory (Wellbeing Act 04/08/1996, Art. 32). Strict confidentiality required.',
      '004': 'Burn-out and long-term absence — Camille Laurent (Product Design), on sick leave for 3 weeks. Incapacity obligations and reintegration pathway.',
      '005': '3 misclassified contractors (reclassifiable as permanent employees) in Engineering — significant ONSS liability. Analysis under the Nature of Employment Relationships Act.',
    };

    const caseDesc = caseDescriptions[caseId] ?? `Unknown case. Active cases at NexaFlow are CAS-001 to CAS-005 only.`;

    return {
      cardColor: '#DC2626',
      title: `CAS-${caseId} — Legal Analysis`,
      systemPrompt: `${NEXAFLOW_SYSTEM_CONTEXT}

=== TASK ===
You are an expert Belgian employment law advisor. Analyse case CAS-${caseId} at NexaFlow SA.
Case description: ${caseDesc}
Structure your response: Executive Summary | Applicable Legal Framework (Belgian law only) | Risk Matrix | Action Plan | Required Approvals (CHRO, CLO, CEO).
Never invent facts not provided. Always respond in English.`,
      contextData: input.replace(/\/cas-\S+/i, '').trim(),
      chips: ['Full legal report', 'Involve CLO Isabelle Thiry', 'Create timeline', 'Notify CPPT'],
      engine: 'gemini',
    };
  }

  // ── /diagram [topic] ─────────────────────────────────────────────────────
  // Generates Excalidraw JSON for an HR visual. Always uses deep/Gemini for quality.
  if (cmd.startsWith('/diagram')) {
    const topic = input.replace(/\/diagram/i, '').trim() || 'org-chart';

    // Map common shortcuts to descriptive topics
    const topicAliases: Record<string, string> = {
      'org':        'NexaFlow organizational chart (87 employees, departments, reporting lines)',
      'org-chart':  'NexaFlow organizational chart (87 employees, departments, reporting lines)',
      'attrition':  'Engineering attrition timeline and flight-risk heatmap (18% turnover, CAS-001/002)',
      'comp':       'Compensation structure analysis — Engineering department (N=34, CP200 bands)',
      'onboarding': '30/60/90-day onboarding journey map for NexaFlow new hires',
      'cas-001':    'CAS-001 mediation flow — Wouter Janssens vs Stijn Leclercq conflict resolution steps',
      'cas-003':    'CAS-003 harassment investigation process — anonymous complaint in Sales (Wellbeing Act)',
      'cas-005':    'CAS-005 contractor reclassification risk map — 3 misclassified engineers, ONSS liability',
      'roadmap':    'NexaFlow People & Culture 12-month HR roadmap (April 2026 → March 2027)',
    };

    const resolvedTopic = topicAliases[topic.toLowerCase()] ?? topic;

    const diagramSystemPrompt = `${NEXAFLOW_SYSTEM_CONTEXT}

=== TASK: GENERATE EXCALIDRAW DIAGRAM ===
You are a visual HR strategist. Generate a professional Excalidraw diagram for: "${resolvedTopic}"

CRITICAL JSON RULES — read before writing a single character:
- The ONLY valid element "type" values are: "rectangle", "ellipse", "diamond", "text", "arrow", "line"
  NEVER write "type": "excalidraw" on an element — "excalidraw" is only the document root type.
- Keep the total element count to 20 or fewer. Prefer text over shapes where possible.
- Omit optional fields (groupIds, boundElements, link, locked, versionNonce) to reduce size.
- Do NOT pretty-print: write compact single-line JSON with no extra whitespace.
- Output ONLY the JSON block — zero text before or after it.

ELEMENT TYPE GUIDE:
  "rectangle" → boxes, containers, cards, process steps
  "ellipse"   → start/end nodes, highlights
  "diamond"   → decisions, forks
  "text"      → labels, titles, annotations (no border)
  "arrow"     → connections between elements
  "line"      → dividers, timelines

REQUIRED FIELDS per element (minimal valid set):
  rectangle/ellipse/diamond: { "type", "id", "x", "y", "width", "height", "strokeColor", "backgroundColor", "fillStyle", "strokeWidth", "strokeStyle", "roughness", "opacity", "angle", "seed", "version", "isDeleted" }
  text: add "text", "originalText", "fontSize", "fontFamily", "textAlign", "verticalAlign", "containerId", "lineHeight"
  arrow: add "points" (array of [x,y] pairs), "startBinding": null, "endBinding": null

DESIGN RULES:
1. Diagrams must ARGUE, not just display. Show relationships and causality.
2. Shape meanings: ellipse=start/end, diamond=decision, rectangle=action/process, text=labels.
3. Colors: primary fill #3b82f6 stroke #1e3a5f | risk fill #fee2e2 stroke #dc2626 | success fill #a7f3d0 stroke #047857 | decision fill #fef3c7 stroke #b45309
4. roughness: 0, opacity: 100, fontFamily: 1, fontSize: 16 for body text.
5. Only reference real NexaFlow data: 87 employees, Brussels HQ, CAS-001 to CAS-005 only.

OUTPUT FORMAT:
\`\`\`excalidraw
{"type":"excalidraw","version":2,"source":"https://excalidraw.com","elements":[...your elements here...],"appState":{"viewBackgroundColor":"#ffffff"},"files":{}}
\`\`\`

Write the entire JSON on ONE LINE inside the code fence. No explanation. No prose. JSON only.`;

    return {
      cardColor: '#6366f1',
      title: `Diagram — ${topic}`,
      systemPrompt: diagramSystemPrompt,
      contextData: '',
      chips: ['/diagram org-chart', '/diagram attrition', '/diagram roadmap', '/diagram cas-003'],
      diagramMode: true,
      engine: 'gemini', // always use best model for diagram quality
    };
  }

  return null; // not a slash-command → direct LLM dispatch (Ollama)
}

function groupBy<T>(arr: T[], key: keyof T) {
  return arr.reduce((acc, item) => {
    const k = String(item[key]);
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}
