// ─────────────────────────────────────────────────────────────────────────────
// use-command-router.ts — NexaAI slash-command router
//
// CONTRACT (critical):
//   • Each handler's `systemPrompt` contains ONLY the task-specific instructions.
//   • NexaAIWindow.tsx ALWAYS prepends NEXAFLOW_SYSTEM_CONTEXT before calling the LLM.
//   • Never include NEXAFLOW_SYSTEM_CONTEXT inside a handler's systemPrompt — it would
//     be injected twice, wasting tokens and diluting the grounding rules.
//   • For headcounts, always use REAL_HEADCOUNTS from nexaflow-context.ts.
// ─────────────────────────────────────────────────────────────────────────────

import { employees } from '@/data/employees';
import {
  REAL_HEADCOUNTS,
  CANONICAL_MEDIANS,
  MARKET_MEDIANS,
  NEXAFLOW_GROUND_TRUTH,
  normalizeDisplayLabel,
} from '@/lib/nexaflow-context';
export { shouldUseGemini } from '@/lib/gemini-client';

/** Which LLM engine handles this request */
export type LLMEngine = 'ollama' | 'gemini';

// ─────────────────────────────────────────────────────────────────────────────
// Chart types — deterministic data computed by handlers, rendered by ChartCard
// ─────────────────────────────────────────────────────────────────────────────

/** A single data point for any chart type */
export type ChartDataPoint = {
  label: string;
  /** Primary value (y-axis for bar, slice size for donut, severity 1-5 for cases) */
  value: number;
  /** Optional benchmark reference (shown as dashed line on bar charts) */
  benchmark?: number;
  color?: string;
};

/**
 * Chart specification — type-safe descriptor passed from handler → UI renderer.
 *
 * - `bar`    : vertical bar chart (value on Y). Add `benchmark` on a data point
 *              to draw a dashed reference line at that value.
 * - `donut`  : pie chart with inner hole (headcount distributions, gender split…)
 * - `cases`  : custom severity track — one row per active HR case, colored by risk level.
 */
export type ChartSpec = {
  type: 'bar' | 'donut' | 'cases';
  title: string;
  subtitle?: string;
  /** Unit label shown in tooltip (e.g. '€', '%', 'employees') */
  unit?: string;
  data: ChartDataPoint[];
};

export type HandlerResult = {
  cardColor: string;
  title: string;
  /** Task-specific prompt ONLY — NexaAIWindow prepends NEXAFLOW_SYSTEM_CONTEXT */
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
  /**
   * Pre-computed chart data rendered ABOVE the LLM narrative.
   * Values come from ground-truth constants (REAL_HEADCOUNTS, CANONICAL_MEDIANS…),
   * never from the LLM — so they are always correct regardless of model quality.
   */
  chartData?: ChartSpec[];
};

/**
 * Route a slash-command to the correct HandlerResult.
 * `engine` is set per-route: Gemini for /cas-* and --deep, Ollama for everything else.
 */
export async function routeCommand(input: string): Promise<HandlerResult | null> {
  const isDeep = input.includes('--deep');
  const cmd = input.trim().toLowerCase();

  // Strip --deep flag before argument extraction — it is captured in `isDeep` above.
  // Without this, "/comp-analysis Engineering --deep" produces dept="Engineering --deep",
  // which misses REAL_HEADCOUNTS → N=0 and a malformed title.
  const cleanInput = input.replace(/--deep/gi, '').replace(/\s{2,}/g, ' ').trim();

  // ── /comp-analysis [dept] ────────────────────────────────────────────────
  if (cmd.startsWith('/comp-analysis')) {
    const deptRaw    = cleanInput.replace(/\/comp-analysis/i, '').trim() || 'Engineering';
    const deptFilter = deptRaw.toLowerCase();
    const dept       = normalizeDisplayLabel(deptRaw); // "engineering" → "Engineering"

    // Field name adapters (DB uses snake_case French, fallback uses camelCase English)
    const getSalary = (e: any): number => Number(e.salaire   ?? e.salary)   || 0;
    const getRisk   = (e: any): string  => (e.risque_depart  ?? e.flightRisk ?? '').toLowerCase();
    const getGender = (e: any): string  => (e.genre          ?? e.gender     ?? e.Genre ?? '').toUpperCase();
    const getDept   = (e: any): string  => (e.departement    ?? e.department  ?? '').toLowerCase();

    // Fetch data — IPC first, fallback to in-memory sample
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
      employeesList = deptFilter === 'all'
        ? (employees as any[])
        : (employees as any[]).filter((e: any) => getDept(e) === deptFilter);
    }

    const n = employeesList.length;

    // Compute median salary from real data
    const salaries = employeesList
      .map(getSalary)
      .filter((s: number) => s > 0)
      .sort((a: number, b: number) => a - b);
    const medianSalary = salaries.length ? salaries[Math.floor(salaries.length / 2)] : 0;
    // medianDisplay resolved below after CANONICAL_MEDIANS lookup

    // Flight risk & gender from sample data
    const highRisk    = employeesList.filter((e: any) => getRisk(e) === 'high').length;
    const medRisk     = employeesList.filter((e: any) => getRisk(e) === 'medium').length;
    const femaleCount = employeesList.filter((e: any) => getGender(e) === 'F').length;
    const genderGapFlag = n > 0 && (femaleCount / n) < 0.4
      ? 'Déséquilibre H/F détecté'
      : 'Répartition H/F acceptable';

    const turnoverNote = deptFilter === 'engineering'
      ? '18% (source: Company Bible Day 1)'
      : 'données non disponibles — à collecter';

    // Use centralised ground-truth headcount (overrides sample-derived n)
    const realN = REAL_HEADCOUNTS[deptFilter] ?? n;

    // Canonical median from Company Bible — takes priority over sample-computed value.
    // Only Engineering has a canonical value (€79,500) at Day 1.
    // Other departments fall back to computed median (displayed as "demo data").
    const canonicalMedian = CANONICAL_MEDIANS[deptFilter];
    const medianFinal   = canonicalMedian ?? medianSalary;
    const medianDisplay = medianFinal > 0 ? medianFinal.toLocaleString('fr-BE') : 'N/A';
    const medianSource  = canonicalMedian ? 'Company Bible' : (usedIPC ? 'SQLite live' : 'demo data');

    const sirhBlock = `
=== REAL HRIS DATA — Department: ${dept} ===
Source: NexaFlow_SIRH_500.xlsx | Extracted: ${new Date().toLocaleDateString('en-BE')}
Company: NexaFlow SA | HQ: Brussels (Avenue Louise 54) | Total headcount: 87
Department headcount (ground truth): ${realN}
Gross annual median salary: €${medianDisplay}
Flight risk: ${highRisk} High, ${medRisk} Medium
Gender balance: ${genderGapFlag}
Turnover: ${turnoverNote}
Collective agreement: CP 200 (CPNAE/ANPCB)
Active HR cases relevant to this department:
  - CAS-001: Interpersonal conflict in Engineering (Wouter Janssens vs Stijn Leclercq)
  - CAS-002: Conventional termination — Jonas Goossens (Senior Backend, confirmed flight risk)
  - CAS-005: 3 misclassified contractors in Engineering — significant ONSS liability

GUARDRAILS — violation = incorrect output:
- Use ONLY the data provided above. Never fabricate salary figures.
- Department headcount is ${realN}. Never use any other N value for this department.
- NexaFlow operates from Brussels HQ exclusively. No foreign offices exist.
- Only CAS-001 to CAS-005 exist. Never invent additional cases.
`.trim();

    // ── Chart data (deterministic — ground truth only, never from LLM) ─────────
    const marketMedian = MARKET_MEDIANS[deptFilter] ?? 0;
    const gapPct = marketMedian > 0
      ? ((medianFinal - marketMedian) / marketMedian * 100).toFixed(1)
      : null;
    const gapLabel = gapPct
      ? `Gap: ${Number(gapPct) >= 0 ? '+' : ''}${gapPct}% vs market`
      : 'Market benchmark unavailable';

    const compCharts: ChartSpec[] = [
      // Chart 1 — Salary vs market benchmark
      {
        type: 'bar',
        title: 'Salary vs Market Benchmark',
        subtitle: gapLabel,
        unit: '€',
        data: [
          {
            label: `NexaFlow\n${dept}`,
            value: medianFinal,
            // No benchmark field: the Market bar below already serves as the reference.
            // Using benchmark here would draw a redundant dashed line at Market height.
            color: Number(gapPct ?? 0) >= 0 ? '#10b981' : '#ef4444',
          },
          ...(marketMedian > 0 ? [{
            label: 'Market\n(CP 200)',
            value: marketMedian,
            color: '#6366f1',
          }] : []),
        ],
      },
    ];

    // Chart 2 — Flight risk distribution (only if we have sample data)
    if (n > 0) {
      const lowRisk = Math.max(0, n - highRisk - medRisk);
      compCharts.push({
        type: 'bar',
        title: 'Flight Risk Distribution',
        subtitle: `${dept} · N=${realN}`,
        unit: 'employees',
        data: [
          { label: 'High', value: highRisk, color: '#dc2626' },
          { label: 'Medium', value: medRisk, color: '#f59e0b' },
          { label: 'Low / None', value: lowRisk, color: '#10b981' },
        ],
      });
    }

    return {
      skill: 'comp-analysis',
      cardColor: 'from-emerald-900/40 to-teal-900/40',
      title: `Compensation Analysis — ${dept}`,
      systemPrompt: `You are NexaAI, CHRO assistant to Bruno Mineo at NexaFlow SA.
Produce a structured compensation analysis for the ${dept} department (N=${realN}).
Format: CHRO memo with four sections — Executive Summary, HRIS Metrics, Identified Risks, Recommendations.
Stop after the Recommendations section. Do not add a Legal Footer, signature, or closing line — the UI renders the footer independently.
Always respond in English.`,
      contextData: sirhBlock,
      chips: [`CP200`, dept, `N=${realN}`, `Median €${medianDisplay}`, `/people-report`, `/policy-lookup BE`],
      footer: `CP200 | ${dept} | N=${realN} | Median €${medianDisplay} | ${medianSource} · ${new Date().toLocaleDateString('en-BE')}`,
      engine: isDeep ? 'gemini' : 'ollama',
      chartData: compCharts,
    };
  }

  // ── /draft-offer [candidate name] ────────────────────────────────────────
  if (cmd.startsWith('/draft-offer')) {
    const name = normalizeDisplayLabel(cleanInput.replace(/\/draft-offer/i, '').trim() || 'Candidat');
    return {
      cardColor: '#3B82F6',
      title: `Offer Letter — ${name}`,
      systemPrompt: `Draft a complete Belgian CDI offer letter for ${name} at NexaFlow SA.
Include: gross salary, CP200 classification, notice period (Eenheidsstatuut), non-compete clause (max 12m, capped), meal vouchers €8/day, eco-vouchers, hospitalization insurance DKV.
Format as a formal letter. Always respond in English.`,
      contextData: '',
      chips: ['Adjust salary', 'Add NDA clause', 'Dutch version', 'Send via DocuSign'],
      engine: isDeep ? 'gemini' : 'ollama',
    };
  }

  // ── /onboarding [name] ───────────────────────────────────────────────────
  if (cmd.startsWith('/onboarding')) {
    const name = normalizeDisplayLabel(cleanInput.replace(/\/onboarding/i, '').trim() || 'New Hire');
    return {
      cardColor: '#10B981',
      title: `Onboarding — ${name}`,
      systemPrompt: `Create a detailed 30/60/90-day onboarding plan for ${name} joining NexaFlow SA.
Day 1–7: admin setup, badge, tools, team intros.
Week 2–4: buddy system, shadow sessions, first deliverable.
Day 31–60: own project, 1:1 cadence.
Day 61–90: KPI review, probation assessment.
Always respond in English.`,
      contextData: '',
      chips: ['Generate IT checklist', 'Schedule 1:1s', 'Assign buddy', 'Create ITSM ticket'],
      engine: isDeep ? 'gemini' : 'ollama',
    };
  }

  // ── /people-report [attrition?] ──────────────────────────────────────────
  if (cmd.startsWith('/people-report')) {
    const focus = cmd.includes('attrition') ? 'attrition' : 'overview';
    const promptFocus = focus === 'attrition'
      ? 'Focus on turnover: 12-month attrition rate, top high flight-risk profiles, cost-to-replace (benchmark: 1.5× annual salary).'
      : 'Overview: headcount by department, gender ratio, average tenure, open positions, active cases.';

    // Fetch live people stats from SQLite via IPC
    let peopleStats: any = null;
    let statsSource = 'Company Bible ground truth (IPC unavailable)';
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

    // Build context — use ground-truth headcounts when IPC is unavailable
    // NEVER use groupBy(employees, 'department') — sample counts are unreliable
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
          site: 'Brussels HQ (single site)',
          byDept: REAL_HEADCOUNTS,   // ← ground-truth headcounts, NOT sample groupBy
          engineeringTurnover: '18%',
          activeCases: ['CAS-001','CAS-002','CAS-003','CAS-004','CAS-005'],
        };

    // ── Chart data — deterministic, from ground-truth constants ───────────────
    const DEPT_COLORS: Record<string, string> = {
      engineering:        '#3b82f6',
      sales:              '#10b981',
      'customer success': '#06b6d4',
      product:            '#8b5cf6',
      marketing:          '#f59e0b',
      finance:            '#ec4899',
      operations:         '#64748b',
      'people & culture': '#f97316',
      legal:              '#dc2626',
      'c-suite':          '#1e293b',
    };

    const peopleCharts: ChartSpec[] = [
      // Chart 1 — Headcount donut by department
      {
        type: 'donut',
        title: 'Headcount by Department',
        subtitle: '87 employees · Brussels HQ · April 2026',
        unit: 'employees',
        data: Object.entries(REAL_HEADCOUNTS).map(([key, count]) => ({
          label: normalizeDisplayLabel(key),
          value: count,
          color: DEPT_COLORS[key] ?? '#94a3b8',
        })),
      },
      // Chart 2 — Active HR cases severity track
      {
        type: 'cases',
        title: 'Active HR Cases — Risk Level',
        subtitle: 'CAS-001 to CAS-005 · Day 1 · April 2026',
        unit: '/5',
        data: [
          { label: 'CAS-001 · Engineering conflict',     value: 3, color: '#f59e0b' },
          { label: 'CAS-002 · Conventional termination', value: 3, color: '#f59e0b' },
          { label: 'CAS-003 · Harassment (CRITICAL)',    value: 5, color: '#dc2626' },
          { label: 'CAS-004 · Burn-out',                 value: 2, color: '#10b981' },
          { label: 'CAS-005 · Misclassified contractors',value: 4, color: '#ef4444' },
        ],
      },
    ];

    return {
      cardColor: '#8B5CF6',
      title: 'People Report — ' + (focus === 'attrition' ? 'Attrition Focus' : 'April 2026'),
      systemPrompt: `Generate a People Report for NexaFlow SA (87 employees, Brussels HQ only). ${promptFocus}
Data source: ${statsSource}.
Active cases: CAS-001 (Engineering conflict), CAS-002 (conventional termination), CAS-003 (Sales harassment), CAS-004 (Product burn-out), CAS-005 (misclassified contractors).
Never fabricate missing data — explicitly flag HRIS gaps.
Always respond in English.`,
      contextData: JSON.stringify(contextPayload, null, 2),
      chips: ['Top flight risks', 'Turnover cost analysis', 'Sector benchmark', 'Export PowerBI'],
      engine: isDeep ? 'gemini' : 'ollama',
      chartData: peopleCharts,
    };
  }

  // ── /performance-review [name] ───────────────────────────────────────────
  if (cmd.startsWith('/performance-review')) {
    const name = normalizeDisplayLabel(cleanInput.replace(/\/performance-review/i, '').trim() || 'Collaborateur');
    return {
      cardColor: '#EAB308',
      title: `Performance Review — ${name}`,
      systemPrompt: `Generate an AI-assisted performance review for ${name} at NexaFlow SA.
Use a 4-level grid (I=Below expectations, II=Meets, III=Exceeds, IV=Outstanding).
Assess: delivery, collaboration, AI competency (Vlaamse Overheid framework v2.1), innovation.
Include calibration recommendation and development plan.
Always respond in English.`,
      contextData: '',
      chips: ['Detailed grid', 'Development plan', 'Committee calibration', 'Review history'],
      engine: isDeep ? 'gemini' : 'ollama',
    };
  }

  // ── /policy-lookup [BE|...] ──────────────────────────────────────────────
  if (cmd.startsWith('/policy-lookup')) {
    const country = cmd.replace('/policy-lookup', '').trim().toUpperCase() || 'BE';
    const framework = 'Belgian employment law: CP 200 (CPNAE/ANPCB), Employment Contracts Act 03/07/1978, Single Status Act 2014, GDPR (DPA/GBA), structural telework (CBA 149), Wellbeing Act 04/08/1996, DIMONA (Royal Decree 05/11/2002), Social Elections Act 04/12/2007, Gender Pay Gap Act 22/04/2012, Renault Act 13/02/1998';
    const jurisdictionNote = country !== 'BE'
      ? `Note: NexaFlow SA operates exclusively from Brussels (BE). Jurisdiction ${country} is not applicable — defaulting to Belgian law.`
      : '';
    return {
      cardColor: '#EF4444',
      title: `Policy Lookup — ${country === 'BE' ? 'Belgium (BE)' : `${country} → redirected to BE`}`,
      systemPrompt: `Provide a structured HR policy brief for NexaFlow SA (Brussels, BE). ${jurisdictionNote}
Applicable legal framework: ${framework}
Cover: hiring obligations, notice periods, remote work rules, data protection, collective rights, social elections (threshold of 50 reached).
Always respond in English.`,
      contextData: '',
      chips: ['Download policy PDF', 'Legal change alerts', 'Contact CLO Isabelle Thiry', 'Social elections prep'],
      engine: isDeep ? 'gemini' : 'ollama',
    };
  }

  // ── /cas-001 to /cas-005 — always Gemini (legal/disciplinary) ───────────
  if (cmd.startsWith('/cas-')) {
    const caseId = cmd.split(' ')[0].replace('/cas-', '').toUpperCase();

    const caseDescriptions: Record<string, string> = {
      '001': 'Interpersonal conflict in Engineering between Wouter Janssens and Stijn Leclercq — escalated for 3 weeks. Formal mediation required.',
      '002': 'Conventional termination request from Jonas Goossens (Senior Backend) — confirmed flight risk. Negotiation of terms, risk of voluntary departure.',
      '003': 'Anonymous harassment complaint in Sales — CRITICAL. Formal investigation mandatory (Wellbeing Act 04/08/1996, Art. 32). Strict confidentiality required.',
      '004': 'Burn-out and long-term absence — Camille Laurent (Product Design), on sick leave for 3 weeks. Incapacity obligations and reintegration pathway.',
      '005': '3 misclassified contractors (reclassifiable as permanent employees) in Engineering — significant ONSS liability. Analysis under the Nature of Employment Relationships Act.',
    };

    const caseDesc = caseDescriptions[caseId]
      ?? 'Unknown case. Active cases at NexaFlow are CAS-001 to CAS-005 only.';

    return {
      cardColor: '#DC2626',
      title: `CAS-${caseId} — Legal Analysis`,
      systemPrompt: `You are an expert Belgian employment law advisor assisting CHRO Bruno Mineo at NexaFlow SA.
Analyse case CAS-${caseId}: ${caseDesc}
Structure your response:
  1. Executive Summary
  2. Applicable Legal Framework (Belgian law only — CP 200, Employment Contracts Act, Wellbeing Act as relevant)
  3. Risk Matrix (likelihood × impact)
  4. Action Plan (immediate / short-term / long-term)
  5. Required Approvals (CHRO, CLO Isabelle Thiry, CEO Lena Verstraete)
Never invent facts not provided. Always respond in English.`,
      contextData: `${NEXAFLOW_GROUND_TRUTH}\n\nAdditional context from user: ${cleanInput.replace(/\/cas-\S+/i, '').trim()}`,
      chips: ['Full legal report', 'Involve CLO Isabelle Thiry', 'Create timeline', 'Notify CPPT'],
      engine: 'gemini',
    };
  }

  // ── /diagram [topic] — always Gemini for quality ─────────────────────────
  if (cmd.startsWith('/diagram')) {
    const topicRaw    = cleanInput.replace(/\/diagram/i, '').trim() || 'org-chart';
    const topic       = normalizeDisplayLabel(topicRaw); // for display in title
    const topicLookup = topicRaw.toLowerCase();          // for alias map lookup

    const topicAliases: Record<string, string> = {
      'org':        'NexaFlow organizational chart (87 employees, departments, reporting lines)',
      'org-chart':  'NexaFlow organizational chart (87 employees, departments, reporting lines)',
      'attrition':  'Engineering attrition timeline and flight-risk heatmap (N=34, 18% turnover, CAS-001/002)',
      'comp':       'Compensation structure analysis — Engineering department (N=34, CP200 bands)',
      'onboarding': '30/60/90-day onboarding journey map for NexaFlow new hires',
      'cas-001':    'CAS-001 mediation flow — Wouter Janssens vs Stijn Leclercq conflict resolution steps',
      'cas-003':    'CAS-003 harassment investigation process — anonymous complaint in Sales (Wellbeing Act)',
      'cas-005':    'CAS-005 contractor reclassification risk map — 3 misclassified engineers, ONSS liability',
      'roadmap':    'NexaFlow People & Culture 12-month HR roadmap (April 2026 → March 2027)',
    };

    const resolvedTopic = topicAliases[topicLookup] ?? topic;

    return {
      cardColor: '#6366f1',
      title: `Diagram — ${topic}`,
      systemPrompt: `You are a visual HR strategist. Generate a professional Excalidraw diagram for: "${resolvedTopic}"

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

Write the entire JSON on ONE LINE inside the code fence. No explanation. No prose. JSON only.`,
      contextData: '',
      chips: ['/diagram org-chart', '/diagram attrition', '/diagram roadmap', '/diagram cas-003'],
      diagramMode: true,
      engine: 'gemini',
    };
  }

  return null; // not a slash-command → direct LLM dispatch (Ollama)
}
