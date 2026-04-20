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
  buildDataGapMatrix,
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
  /**
   * Deterministic markdown appended AFTER the LLM narrative in NexaAIWindow.
   * Used for sections whose content must be 100% reliable (action plan, scenarios).
   * The LLM is instructed NOT to generate these sections — they come from here.
   */
  lockedSections?: string;
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

    // Flight risk from sample data
    const highRisk = employeesList.filter((e: any) => getRisk(e) === 'high').length;
    const medRisk  = employeesList.filter((e: any) => getRisk(e) === 'medium').length;

    // Gender status — SIRH gender field is absent from Securex import.
    // femaleCount comes from demo sample data only (not official SIRH).
    // Never flag as confirmed imbalance — always report as data gap requiring remediation.
    const femaleCount = employeesList.filter((e: any) => getGender(e) === 'F').length;
    const genderStatusNote = femaleCount > 0 && n > 0
      ? `Potential imbalance flagged in sample (${femaleCount}F / ${n} employees, ${Math.round(femaleCount/n*100)}%) — UNCONFIRMED: SIRH gender field absent from Securex import. Formal audit requires gender data completion first.`
      : 'Gender data unavailable — SIRH gender field absent from Securex import. Formal gender pay audit not yet possible.';

    const turnoverNote = deptFilter === 'engineering'
      ? '18% (source: Company Bible Day 1)'
      : 'not tracked — ATS/SIRH integration required';

    // Use centralised ground-truth headcount (overrides sample-derived n)
    const realN = REAL_HEADCOUNTS[deptFilter] ?? n;

    // Canonical median from Company Bible — takes priority over sample-computed value.
    const canonicalMedian = CANONICAL_MEDIANS[deptFilter];
    const medianFinal   = canonicalMedian ?? medianSalary;
    const medianDisplay = medianFinal > 0 ? medianFinal.toLocaleString('fr-BE') : 'N/A';
    const medianSource  = canonicalMedian ? 'Company Bible' : (usedIPC ? 'SQLite live' : 'demo data');

    // Market benchmark — computed before sirhBlock so it can be injected as a data anchor
    // (prevents the LLM from writing "Data Gap Needs Assessment" while the chart has the figure)
    const marketMedianEarly = MARKET_MEDIANS[deptFilter] ?? 0;
    const gapPctEarly = marketMedianEarly > 0
      ? ((medianFinal - marketMedianEarly) / marketMedianEarly * 100).toFixed(1)
      : null;
    const benchmarkLine = gapPctEarly
      ? `Market benchmark (CP200 sector, Hay Group / Robert Half April 2026): €${marketMedianEarly.toLocaleString('fr-BE')} — Gap: ${Number(gapPctEarly) >= 0 ? '+' : ''}${gapPctEarly}% vs market`
      : 'Market benchmark: not available for this department — use industry proxy if needed';

    const sirhBlock = `
=== REAL HRIS DATA — Department: ${dept} ===
Source: NexaFlow_SIRH_500.xlsx | Extracted: ${new Date().toLocaleDateString('en-BE')}
Company: NexaFlow SA | HQ: Brussels (Avenue Louise 54) | Total headcount: 87
Department headcount (ground truth): ${realN}
Gross annual median salary: €${medianDisplay} (source: ${medianSource})
${benchmarkLine}
Flight risk: ${highRisk} High, ${medRisk} Medium
Turnover: ${turnoverNote}

CP200 (CPNAE/ANPCB) — salary minimums only:
  Obligation: all salaries must be >= CP200 barema (index revised April 2026)
  Status: to verify with Securex — annual barema review due June 2026
  NOTE: CP200 governs salary floors, NOT gender quotas or diversity reporting.

Gender Pay Gap Act (22/04/2012) — reporting obligation:
  Status: ${genderStatusNote}
  Obligation: biennial gender pay report mandatory for companies >= 50 employees (IEFH)
  Blocker: SIRH gender field must be completed before any formal audit

Active HR cases relevant to this department:
  - CAS-001: Interpersonal conflict in Engineering (Wouter Janssens vs Stijn Leclercq)
  - CAS-002: Conventional termination — Jonas Goossens (Senior Backend, confirmed flight risk)
  - CAS-005: 3 misclassified contractors in Engineering — significant ONSS liability

GUARDRAILS — violation = incorrect output:
- Use ONLY the data provided above. Never fabricate salary figures.
- Market benchmark is provided above — use it; do NOT write "Data Gap" for benchmark.
- CP200 = salary minimums (barema) only. Do NOT link CP200 to gender compliance.
- Gender pay risk belongs under "Gender Pay Gap Act (22/04/2012)", not CP200.
- Department headcount is ${realN}. Never use any other N value for this department.
- NexaFlow operates from Brussels HQ exclusively. No foreign offices exist.
- Only CAS-001 to CAS-005 exist. Never invent additional cases.
- Never prefix text or percentages with the euro sign (€). Use € before numbers only.
`.trim();

    // ── Chart data (deterministic — ground truth only, never from LLM) ─────────
    // Use values already computed above (marketMedianEarly / gapPctEarly) so the
    // benchmark figure stays consistent between sirhBlock and charts.
    const marketMedian = marketMedianEarly;
    const gapPct       = gapPctEarly;
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

    // ── Locked sections 5 & 6 — deterministic, dept-aware ─────────────────────
    const replaceCostK = Math.round(medianFinal * 1.5 / 1000);
    const totalRiskK   = Math.round(highRisk * medianFinal * 1.5 / 1000);
    const deptHead     = deptFilter === 'engineering' ? 'Amit Patel, CTO'
                       : deptFilter === 'sales'       ? 'Sarah Claessens, VP Sales'
                       : deptFilter === 'product'     ? 'Elena Voss, Head of Product'
                       : 'department head';

    const cas002Row = deptFilter === 'engineering'
      ? `| **CAS-002** · Jonas Goossens (Senior Backend) | Counter-offer or structured exit package — define compensation ceiling before negotiation | Bruno Mineo + CLO Isabelle Thiry | 2026-05-15 | Decision made; exit package or retention bonus signed | Uncontrolled voluntary departure — no handover, Engineering sprint continuity at risk |`
      : '';

    const compActionPlanMd = `
## 5. Compensation Equity — Action Plan

> **P&L exposure:** Cost-to-replace one ${dept} employee = est. **€${replaceCostK}K** (1.5× gross median, Robert Half benchmark). ${highRisk} high-risk employee${highRisk !== 1 ? 's' : ''} in ${dept} = **€${totalRiskK}K** potential replacement liability if unaddressed.

| Profile / Issue | Action | Owner | Due Date | KPI Target | Risk if Delayed |
|---|---|---|---|---|---|
${cas002Row}
| **High flight-risk cohort** · ${dept} (N=${highRisk}) | Identify top performers at risk; propose targeted retention bonus envelope | CFO Marc Dujardin + ${deptHead} | 2026-06-30 | Retention packages signed for top-3 at-risk profiles | Cascade attrition at €${replaceCostK}K/departure — sprint delays + knowledge loss |
| **Gender pay equity audit** | Cannot audit — gender field absent from SIRH. Activate voluntary self-declaration form (Securex) first | Anke Willems | 2026-05-31 | ≥90% SIRH gender completion | Gender Pay Gap Act (22/04/2012) IEFH audit — mandatory biennial reporting ≥50 employees |
| **CP200 barema compliance** | Verify all ${dept} gross salaries ≥ CP200 minimum barema (index 1.04 — April 2026 revision) | Bruno Mineo + Securex | 2026-06-15 | 100% ${dept} salaries above CP200 barema | ONSS penalty + back pay obligation; Social Inspection audit risk |
`.trim();

    const compScenarioMd = `
## 6. Retention Scenario — 90 Days

> **Hypothesis:** No compensation or retention action taken between April 20 and July 20, 2026.

| Scenario | Trigger | Headcount Impact | Salary Cost | Recruitment Cost | Legal Exposure |
|---|---|---|---|---|---|
| **Worst case** | ${deptFilter === 'engineering' ? 'CAS-002 voluntary exit; 2 high-risk follow departures' : `${highRisk} high-risk employees depart simultaneously`} | −${deptFilter === 'engineering' ? 3 : highRisk} HC ${dept} | €${Math.round(medianFinal * (deptFilter === 'engineering' ? 3 : highRisk) / 1000)}K salary gap | €${Math.round(replaceCostK * (deptFilter === 'engineering' ? 3 : highRisk))}K replacement | Possible unfair pay claim if gender equity not documented |
| **Expected case** | ${deptFilter === 'engineering' ? 'CAS-002 negotiated exit; no cascade' : '1 high-risk departure, others retained'} | −1 HC | €${Math.round(medianFinal / 1000)}K salary gap | €${replaceCostK}K (severance + recruitment) | None if CP200 compliance confirmed |
| **Best case** | Counter-offer accepted; retention bonuses locked in before Q3 | 0 HC loss | +€${Math.round(highRisk * 5)}K bonus cost | €0 | Zero risk if gender data and barema documented |

${gapPct && Number(gapPct) < 0
  ? `**Compensation gap risk:** ${dept} median is ${Math.abs(Number(gapPct))}% below market (CP200 benchmark). This is the primary structural flight-risk driver — candidates can negotiate upward at interview. Closing the gap to ≤5% below market requires a €${Math.round((marketMedian - medianFinal) * realN / 1000)}K total payroll adjustment for the department.`
  : `**Compensation position:** ${dept} median is ${gapPct ? `${Number(gapPct) >= 0 ? '+' : ''}${gapPct}% vs market` : 'at or above market benchmark'}. Retention risk is driven by career growth and case dynamics (see People Report) rather than base salary gap.`
}
`.trim();

    return {
      skill: 'comp-analysis',
      cardColor: 'from-emerald-900/40 to-teal-900/40',
      title: `Compensation Analysis — ${dept}`,
      systemPrompt: `Generate a CHRO-to-COMEX Compensation Analysis for the ${dept} department at NexaFlow SA (N=${realN}, Brussels HQ).
Data source: ${medianSource}.

═══════════════════════════════════════════
OUTPUT STRUCTURE — MANDATORY
Output EXACTLY these four sections with these EXACT headers, in this order.
No other sections. No "Next Steps". No conclusion. No sign-off.
═══════════════════════════════════════════

## 1. Executive Summary

3 bullets. Format: [Finding] → COMEX decision: [action] → P&L consequence: [impact].
Bullet 3 MUST link compensation gap (or retention risk) to product delivery or ARR.

## 2. Compensation Metrics

Table: Metric | NexaFlow ${dept} | Market Benchmark (CP200) | Gap | Status
Include: gross median salary, flight-risk distribution, gender balance status.
Use ONLY figures from the HRIS data block. Never invent salary figures.

## 3. Risk Assessment

Sub-sections:
- Flight Risk: name the risk profiles by severity (High/Medium), reference CAS numbers where relevant
- Equity Risk: gender pay gap status (data gap → remediation required), CP200 barema compliance
- Market Position: is NexaFlow competitive? What is the retention implication?

## 4. Recommendations

3–5 concrete actions tied to named owners and timelines. No generic advice.

═══════════════════════════════════════════
MANDATORY STOP — after ## 4., stop immediately.
Sections 5 (Action Plan) and 6 (Retention Scenario) are pre-computed and appended by the system.
DO NOT write them. DO NOT add Next Steps, Conclusion, or any additional section.
═══════════════════════════════════════════

TERMINOLOGY: "SIRH" not "SIRI". Active cases: CAS-001 to CAS-005 only. NexaFlow Brussels HQ only.
Always respond in English.`,
      contextData: sirhBlock,
      chips: [`CP200`, dept, `N=${realN}`, `Median €${medianDisplay}`, `/people-report`, `/social-elections`],
      footer: `CP200 | ${dept} | N=${realN} | Median €${medianDisplay} | ${medianSource} · ${new Date().toLocaleDateString('en-BE')}`,
      engine: isDeep ? 'gemini' : 'ollama',
      chartData: compCharts,
      lockedSections: compActionPlanMd + '\n\n' + compScenarioMd,
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

    // ── Tenure computation — from startDate in employee sample ────────────────
    // Guard clauses: filter invalid dates, require minimum sample for reliability.
    // If sample is too small (< MIN_RELIABLE_SAMPLE), tenure is reported as
    // "insufficient data" in the prompt rather than injecting null/NaN.
    const MIN_RELIABLE_SAMPLE = 3;
    const REF_DATE = new Date('2026-04-20');

    const tenureYearsArr = employees
      .filter(e => e.status !== 'notice-period' && e.startDate)
      .map(e => {
        const ms = REF_DATE.getTime() - new Date(e.startDate as string).getTime();
        return ms / (1000 * 60 * 60 * 24 * 365.25);
      })
      .filter(v => Number.isFinite(v) && v >= 0); // guard against future dates or NaN

    const tenureReliable = tenureYearsArr.length >= MIN_RELIABLE_SAMPLE;

    const avgTenureYears = tenureReliable
      ? (tenureYearsArr.reduce((a, b) => a + b, 0) / tenureYearsArr.length).toFixed(1)
      : null;

    const medianTenureYears = (() => {
      if (!tenureReliable) return null;
      const sorted = [...tenureYearsArr].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      return sorted.length % 2 === 0
        ? ((sorted[mid - 1] + sorted[mid]) / 2).toFixed(1)
        : sorted[mid].toFixed(1);
    })();

    // Safe display string for the system prompt — never injects "null years"
    const tenurePromptLine = tenureReliable && avgTenureYears && medianTenureYears
      ? `Mean: ${avgTenureYears} yrs · Median: ${medianTenureYears} yrs (N=${tenureYearsArr.length}, SIRH sample — USE THESE FIGURES)`
      : `Insufficient data (N=${tenureYearsArr.length} < ${MIN_RELIABLE_SAMPLE} minimum) — apply DATA GAP PROTOCOL: mark as gap, do NOT invent a figure`;

    // Guard: count only active employees with a valid flightRisk value
    const flightRiskHigh = employees.filter(
      e => e.status === 'active' && (e.flightRisk ?? '').toLowerCase() === 'high'
    ).length;

    // ── Data Gap Matrix — from canonical factory (nexaflow-context.ts) ────────
    const dataGapMatrix = buildDataGapMatrix({
      avgTenureYears,
      medianTenureYears,
      sampleN: tenureYearsArr.length,
    });

    // ── Build context payload ─────────────────────────────────────────────────
    // NEVER use groupBy(employees, 'department') — sample counts are unreliable
    const contextPayload = peopleStats
      ? {
          source: statsSource,
          totalEmployees: peopleStats.total,
          byDept: peopleStats.byDept,
          topFlightRisk: peopleStats.topFlightRisk,
          tenureProxy: { avgYears: avgTenureYears, medianYears: medianTenureYears, sampleN: tenureYearsArr.length },
          flightRiskHighCount: flightRiskHigh,
          dataGapMatrix,
          activeCases: ['CAS-001','CAS-002','CAS-003','CAS-004','CAS-005'],
        }
      : {
          source: statsSource,
          totalEmployees: 87,
          site: 'Brussels HQ (single site)',
          byDept: REAL_HEADCOUNTS,
          engineeringTurnover: '18%',
          tenureProxy: { avgYears: avgTenureYears, medianYears: medianTenureYears, sampleN: tenureYearsArr.length },
          flightRiskHighCount: flightRiskHigh,
          dataGapMatrix,
          activeCases: ['CAS-001','CAS-002','CAS-003','CAS-004','CAS-005'],
        };

    // ── Locked sections 5 & 6 — pre-computed, never from LLM ────────────────
    // The LLM is instructed to stop after section 4. These two sections are
    // appended by NexaAIWindow after the LLM response, guaranteeing:
    //  • Each CAS is referenced by number with a named owner and a fixed date
    //  • Scenario figures (headcount, €, legal) are deterministic ground truth
    const actionPlanMarkdown = `
## 5. Consolidated Action Plan

> **P&L & Roadmap exposure:** CAS-002 (Engineering departure) + 8 untracked open Engineering roles = estimated −10 to −15% product velocity in Q3 2026. At NexaFlow's current ARR trajectory, one delayed sprint cycle represents €40K–€80K in deferred revenue recognition. CAS-005 ONSS liability (est. €120K–€180K) would consume 60–90% of the Series B working-capital buffer earmarked for Q2. Without Workable ATS live by June 2026, the board-committed 140 FTE target by December 2026 is structurally at risk.

| Case / Issue | Immediate Action | Owner | Due Date | KPI Target | Risk if Delayed |
|---|---|---|---|---|---|
| **CAS-001** · Engineering conflict | Formal mediation session — Wouter Janssens / Stijn Leclercq | Anke Willems + external mediator | 2026-04-30 | Signed mediation agreement | Escalation to formal Art. 32 complaint (Wellbeing Act) |
| **CAS-002** · Conventional termination | Draft termination agreement + knowledge transfer plan (Jonas Goossens) | Bruno Mineo + CLO Isabelle Thiry | 2026-05-15 | CDI termination signed or counter-offer accepted | Voluntary departure without handover — engineering capacity gap widens |
| **CAS-003** · Sales harassment (CRITICAL) | Appoint independent investigator within 24h — strict confidentiality protocol | CLO Isabelle Thiry + CPPT advisor | **2026-04-24** | External investigator mandated | Criminal exposure Art. 32ter + labour court claim — no statute immunity |
| **CAS-004** · Burn-out (Camille Laurent) | Reintegration assessment + mutuelle contact + occupational physician coordination | Anke Willems + occupational physician | 2026-05-05 | Formal reintegration plan submitted | Extended absence → long-term disability cost; no legal protection without plan |
| **CAS-005** · Misclassified contractors | Legal audit of 3 contractor contracts + ONSS regularisation plan | CLO Isabelle Thiry + RSZ/ONSS advisor | 2026-05-31 | Audit report + ONSS regularisation plan filed | ONSS fine + est. €120K–€180K back contributions if discovered by audit |
| **Data gap** · Gender ratio | Add voluntary gender self-declaration to SIRH onboarding (Securex) + anonymous survey for current staff | Anke Willems | 2026-05-31 | ≥90% SIRH gender completion | Gender Pay Gap Act audit risk (IEFH) — mandatory biennial reporting for companies ≥50 employees |
| **Data gap** · ATS / Open positions | Activate Workable ATS integration to SIRH; define weekly vacancy snapshot; present at next COMEX | Yasmina El Idrissi + Amit Patel | 2026-06-30 | 100% vacancy tracking live; time-to-fill KPI active | Series B 140-HC target by Dec 2026 at risk — 53 hires in 6 months without pipeline tracking is infeasible |
`.trim();

    const scenarioMarkdown = `
## 6. Scenario: Status Quo in 90 Days

> **Hypothesis:** No CHRO action taken between April 20 and July 20, 2026.

| Scenario | Trigger Event | 90-Day Outcome | Headcount Impact | Financial Risk | Legal Exposure |
|---|---|---|---|---|---|
| **Worst case** | CAS-003 complaint goes public; CAS-005 ONSS audit triggered externally | Reputational damage in Brussels market; 2+ voluntary departures cascade from Engineering | −5 HC (CAS-002 + cascade) | €180K ONSS + €50K legal fees + €80K emergency recruitment | Labour court claim + IEFH audit + potential criminal referral Art. 32ter |
| **Expected case** | CAS-003 contained internally; CAS-005 negotiated before audit | Controlled attrition: Jonas Goossens departs; ATS still not live; gender data still incomplete | −1 to −2 HC | €30K severance + €40K replacement recruitment | No immediate litigation; ONSS risk unresolved; IEFH audit risk persists |
| **Best case** | All action plan items executed on schedule | Engineering stabilised; SIRH complete; Workable ATS live by June 2026 | Neutral (replacement hired Q3) | €15K mediation + standard severance | Zero litigation risk if CAS-003 investigator mandated by 2026-04-24 |

**Series B milestone at risk (all scenarios):** Without Workable ATS live by June 2026, reaching the 140-employee target by December 2026 requires hiring **53 people in 6 months** — infeasible without structured pipeline tracking. CAS-002 departure in Engineering amplifies the capacity gap.
`.trim();

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
      systemPrompt: `Generate a CHRO-to-COMEX People Report for NexaFlow SA (87 employees, Brussels HQ). ${promptFocus}
Data source: ${statsSource}.

TENURE: ${tenurePromptLine}

DATA GAP PROTOCOL — for each gap in dataGapMatrix:
  1. State the gap and its cause (do not just write "Data Unavailable")
  2. Use the proxyEstimate where provided
  3. Add a brief DECISION BLOCK:
     → Owner: [named person]
     → Due date: [specific date]
     → KPI target: [measurable outcome]
     → Risk if no action: [business consequence with timeline]

═══════════════════════════════════════════
OUTPUT STRUCTURE — MANDATORY
You MUST output EXACTLY these four sections, with these EXACT headers, in this exact order.
No other sections. No section 5. No "Next Steps". No conclusion. No sign-off.
═══════════════════════════════════════════

## 1. Executive Summary

Write 3 bullets. Each bullet MUST follow this format:
[Finding] → COMEX decision: [specific action required] → P&L / roadmap consequence: [business impact].

Example of correct bullet:
"CAS-003 harassment complaint unresolved → COMEX must mandate independent investigator by 2026-04-24 → failure to act triggers criminal exposure (Art. 32ter) AND reputational damage that will raise Series B due diligence risk with investors."

The third bullet MUST reference headcount risk and its link to product velocity or revenue:
"Engineering departure risk (CAS-002 + 18% turnover) combined with 8 untracked open roles → product roadmap delivery estimated at −10 to −15% velocity in Q3 2026 → at NexaFlow's ARR trajectory, each delayed sprint cycle = €40K–€80K deferred revenue recognition."

## 2. Workforce Snapshot

Headcount table (Department | Headcount | % of total), then:
- Tenure: ${tenurePromptLine}
- High flight-risk employees: ${flightRiskHigh} active
- Engineering turnover: 18% (Company Bible Day 1)

## 3. Data Gaps — Classified and Remediated

One sub-section per gap from dataGapMatrix. Apply DATA GAP PROTOCOL above.
Do NOT write a "Next Steps" list here — use the DECISION BLOCK format only.

## 4. Active HR Cases — Priority Matrix

Table with columns: Case | Description | Severity (/5) | Legal Exposure | Immediate Action Required
One row per CAS-001 to CAS-005. Use exact case descriptions from the active cases list below.

═══════════════════════════════════════════
MANDATORY STOP — after completing ## 4., stop immediately.
DO NOT add: "Next Steps", "Conclusion", "Recommendations", section 5, section 6,
a signature, a closing sentence, or any additional content.
Sections 5 and 6 (Action Plan + Scenario) are pre-computed and appended by the system.
═══════════════════════════════════════════

Active cases: CAS-001 (Engineering conflict Wouter Janssens / Stijn Leclercq, Medium),
CAS-002 (conventional termination Jonas Goossens, Medium),
CAS-003 (Sales harassment complaint anonymous, CRITICAL — 5/5),
CAS-004 (burn-out Camille Laurent Product Design, Low-Med),
CAS-005 (3 misclassified contractors Engineering, High — ONSS liability).

TERMINOLOGY: Always write "SIRH" — never "SIRI". Never invent cases beyond CAS-001 to CAS-005.
Always respond in English. Format: structured markdown with tables where specified.`,
      contextData: JSON.stringify(contextPayload, null, 2),
      chips: ['Top flight risks', 'Turnover cost analysis', 'Sector benchmark', 'Export PowerBI'],
      engine: isDeep ? 'gemini' : 'ollama',
      chartData: peopleCharts,
      lockedSections: actionPlanMarkdown + '\n\n' + scenarioMarkdown,
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

  // ── /social-elections ────────────────────────────────────────────────────
  // Belgian social elections are mandatory for companies ≥50 employees.
  // NexaFlow (87 HC) crossed the CPPT threshold; CE threshold (100) approaches.
  // Next elections: May 2028 (cycle every 4 years — last held May 2024).
  if (cmd.startsWith('/social-elections')) {
    const CURRENT_HC  = 87;
    const CPPT_THRESHOLD = 50;
    const CE_THRESHOLD   = 100;
    const SERIES_B_TARGET = 140;
    const hiresUntilCE = CE_THRESHOLD - CURRENT_HC; // 13

    // ── Chart data ───────────────────────────────────────────────────────────
    const electionsCharts: ChartSpec[] = [
      // Chart 1 — Headcount vs. legal thresholds
      {
        type: 'bar',
        title: 'Headcount vs. Legal Thresholds',
        subtitle: 'Brussels HQ · April 2026 · Social Elections Act 04/12/2007',
        unit: 'employees',
        data: [
          { label: 'CPPT\nthreshold', value: CPPT_THRESHOLD, color: '#10b981' },
          { label: 'NexaFlow\ncurrent',   value: CURRENT_HC,    color: '#16D5C0' },
          { label: 'CE\nthreshold',       value: CE_THRESHOLD,  color: '#f59e0b' },
          { label: 'Series B\ntarget',    value: SERIES_B_TARGET, color: '#3b82f6' },
        ],
      },
      // Chart 2 — Current compliance status (cases severity track)
      {
        type: 'cases',
        title: 'Social Compliance Status',
        subtitle: 'NexaFlow SA · April 2026',
        unit: '/5',
        data: [
          { label: 'CPPT constituted 2024',   value: 1, color: '#10b981' },
          { label: 'CPPT Q2 2026 meeting',    value: 2, color: '#f59e0b' },
          { label: 'CAS-003: CPPT notif.',    value: 5, color: '#dc2626' },
          { label: `CE: ${hiresUntilCE} hires away`, value: 4, color: '#f97316' },
          { label: '2028 elections prep',     value: 1, color: '#10b981' },
        ],
      },
    ];

    // ── Locked sections 5 & 6 — deterministic ───────────────────────────────
    const electionsActionPlanMd = `
## 5. Compliance Calendar — Immediate Actions

| Obligation | Legal Basis | Status | Action Required | Owner | Due Date | Risk if Ignored |
|---|---|---|---|---|---|---|
| **CAS-003: CPPT notification** | Wellbeing Act Art. 32quater | [URGENT] | Notify CPPT formally within 24h of investigator mandate. CLO drafts notification letter. | CLO Isabelle Thiry | **2026-04-24** | Procedure invalidated if notification late. Personal liability for CHRO under Art. 32quater. |
| **CPPT Q2 2026 meeting** | Wellbeing Act Art. 65bis | [PENDING] | Schedule Q2 meeting. Agenda: CAS-003 status, annual prevention program, mandate check. | Anke Willems + CPPT chair | 2026-06-30 | Failure to hold meeting = Wellbeing Act violation. CPPT may lodge complaint with Social Inspection. |
| **CPPT mandate verification** | Social Elections Act 04/12/2007 | [PENDING] | Verify with Securex that May 2024 mandates are valid and correctly registered. | Anke Willems | 2026-05-15 | Irregular composition makes all CPPT decisions legally challengeable. |
| **Gender pay gap reporting** | Gender Pay Gap Act 22/04/2012 | [GAP] | Launch voluntary gender self-declaration in Securex onboarding (field currently absent from SIRH). | Anke Willems | 2026-05-31 | Biennial report mandatory >=50 HC. IEFH audit risk if gap persists. |
| **CE pre-planning brief** | Social Elections Act (CE threshold: 100 HC) | [PROACTIVE] | Brief CFO Marc Dujardin and CLO Isabelle Thiry on CE obligations. NexaFlow is ${hiresUntilCE} hires from threshold. | Bruno Mineo | 2026-08-31 | Decisions on restructuring or profit-sharing made without CE may be annulled retroactively. |
| **2028 elections: headcount baseline** | Social Elections Act Art. 14 | [PROACTIVE] | Reference period = calendar year 2026. Start headcount audit now (FTEs + temps included). | Yasmina El Idrissi | 2026-12-31 | Faulty electoral rolls force full procedure restart. 2028 timeline at risk. |
`.trim();

    const electionsRoadmapMd = `
## 6. Series B HR Legal Roadmap — Social Thresholds

| Milestone | Trigger | Est. Date | Legal Consequence | Preparation Required |
|---|---|---|---|---|
| **100 employees crossed** | Hire #${hiresUntilCE + 1} (est. Q3 2026 at current pace) | ~Sep 2026 | **CE (Conseil d'Entreprise) becomes mandatory** — new social elections required within 6 months | Begin CE pre-planning: information rights framework, financial disclosure calendar (Art. 96 Companies Code), employee representative training |
| **CE first meeting** | Within 3 months of CE elections | ~Q1 2027 | Annual information rights: financial data, employment projections, restructuring plans must be shared with CE | Prepare financial disclosure templates; CLO to draft information protocol with CFO |
| **2028 elections -- X-60 day** | ~March 2028 | Mar 2028 | Official initiation of electoral procedure (posting of notices, voter lists) | Headcount audit complete; CPPT and CE candidate lists prepared |
| **2028 elections -- X-Day** | May 2028 | May 2028 | Full electoral procedure (ballots, counting, mandate assignment) | Electoral bureau constituted; Securex mandate |
| **150+ employees** | Est. 2027 if Series B growth on track | 2027 | Expanded CE information rights; additional obligations depend on sectoral CBA and commission paritaire — **requires legal audit when 130 HC reached** | Brief CLO Isabelle Thiry + CFO Marc Dujardin at 130 HC — do not wait for threshold crossing |

**Key principle:** Every threshold crossing requires **advance preparation of 6–12 months**, not a reactive response. The CE threshold (~${hiresUntilCE} hires away) is the most critical: once crossed, any unilateral HR decision made without CE consultation can be challenged and annulled.
`.trim();

    return {
      cardColor: '#DC2626',
      title: 'Social Elections & Compliance — April 2026',
      systemPrompt: `Generate a CHRO-to-COMEX Social Elections & Workers' Representation compliance report for NexaFlow SA (87 employees, Brussels HQ).

COMPANY STATUS:
  - 87 employees: above CPPT threshold (50), CPPT constituted since May 2024 elections
  - ${hiresUntilCE} hires from CE threshold (100): CE not yet mandatory, but approaching
  - Last social elections: May 2024 | Next: May 2028
  - CAS-003 (harassment): CPPT must be notified under Art. 32quater Wellbeing Act — CRITICAL

APPLICABLE LAW: Social Elections Act 04/12/2007 | Wellbeing Act 04/08/1996 | Gender Pay Gap Act 22/04/2012 | Companies Code Art. 96

TERMINOLOGY — CRITICAL:
  CPPT = Comite pour la Prevention et la Protection au Travail (safety/wellbeing committee, threshold: 50 HC).
         Constituted since May 2024. Do NOT call it "Works Council" — that is the CE.
  CE   = Conseil d'Entreprise / Ondernemingsraad (economic works council, threshold: 100 HC).
         NexaFlow does NOT yet have a CE. It does not exist until threshold is crossed AND elections are held.
  CPPT and CE are entirely separate bodies with different thresholds, roles, and legal bases.
  Never write "Works Council (CPPT)". Never conflate these two bodies in any table, sentence, or cell.

WRITING STYLE FOR COMEX:
  - Short sentences. One idea per sentence. Do not repeat the same noun in consecutive sentences.
  - No double spaces. No "—" after which the same word restates what precedes.
  - Tables preferred over prose paragraphs wherever possible.
  - No preamble, no "In conclusion", no sign-off.

CP200 PRECISION — MANDATORY:
  CP200 (CPNAE/ANPCB) is a commission paritaire (joint labour-management committee), not a law.
  CP200 sets sectoral minimum wages and working conditions — it does NOT regulate prevention, CPPT, or social elections.
  When referencing Internal Prevention Advisor obligations, cite ONLY the Wellbeing Act 04/08/1996 (Art. 32 et seq.).
  Never write "CP200 / Law compliance" for prevention obligations — write "Wellbeing Act (Art. 32 et seq.)".

═══════════════════════════════════════════
OUTPUT STRUCTURE — MANDATORY
Output EXACTLY these four sections with these EXACT headers, in this order.
No other sections. No "Next Steps". No Threshold Roadmap. No conclusion. No sign-off.
═══════════════════════════════════════════

## 1. Executive Summary

Exactly 3 bullets. COMEX-decision format for each:
  [Legal finding] -> COMEX decision: [action required] -> Risk if no action: [consequence + timeline]
Bullet 1: CAS-003 x CPPT — the most urgent legal obligation with personal liability exposure.
Bullet 2: CE threshold — how many hires away, what it triggers, what COMEX must decide now.
  RISK LANGUAGE for bullet 2: use "unilateral decisions on restructuring or profit-sharing may be annulled by labour court" — never use vague expressions like "wasted opportunity" or "missed chance".
Bullet 3: Governance gap — the highest-urgency compliance gap (gender pay gap reporting or mandate verification).
No prose before or between bullets. No section title explanation.

## 2. Legal Status Assessment

TABLE — columns: Body | Legal Basis | Threshold | NexaFlow Status | Key Obligations Summary | Next Trigger.
EXACTLY 2 rows. Use these EXACT values in the Body and Legal Basis cells — do not abbreviate or invent:
  Row 1 — Body: "CPPT (Comite pour la Prevention et la Protection au Travail)"
           Legal Basis: "Wellbeing Act 04/08/1996"
           Threshold: "50 HC"
           NexaFlow Status: "CONSTITUTED — May 2024 elections"
           Key Obligations: "Quarterly meetings, annual prevention program, Art. 32quater notifications (incl. CAS-003)"
           Next Trigger: "Q2 2026 meeting due"
  Row 2 — Body: "CE (Conseil d'Entreprise / Ondernemingsraad)"
           Legal Basis: "Social Elections Act 04/12/2007 + Companies Code Art. 96"
           Threshold: "100 HC"
           NexaFlow Status: "NOT YET CONSTITUTED — 87 HC (${hiresUntilCE} hires away)"
           Key Obligations: "N/A until constituted"
           Next Trigger: "Hire #${CE_THRESHOLD - CURRENT_HC + 1} triggers mandatory CE elections"
CRITICAL: Row 2 Body cell = "CE (Conseil d'Entreprise / Ondernemingsraad)" — NEVER "CETBD", "CE TBD", or any variant.
Include one sentence after the table: what the CE crossing means in terms of annulment risk for NexaFlow decisions.

## 3. Current CPPT Obligations

TABLE — columns: Obligation | Frequency | Legal Basis | Current Status | Responsible.
EXACTLY 5 rows, in this order:
  (1) Quarterly CPPT meetings — Wellbeing Act Art. 65bis
  (2) Annual prevention program review — Wellbeing Act Art. 10 et seq.
  (3) Accident/incident reporting to CPPT — Wellbeing Act Art. 94bis
  (4) CAS-003 notification under Art. 32quater — URGENT — Wellbeing Act 04/08/1996
  (5) Internal Prevention Advisor mandate verification — Wellbeing Act Art. 32 et seq. (NOT CP200 — CP200 covers wages only)
One short phrase per cell. Do not use double spaces. No expanded prose.

## 4. CAS-003 x CPPT Intersection

Write EXACTLY 3 bullets, each starting with a bold label:
  **Notification** — what Art. 32quater requires, exact deadline.
  **Joint action plan** — what the CPPT prevention advisor and the external investigator must do together.
  **COMEX liability** — who bears personal legal responsibility and what the consequence is if action is delayed.
No prose paragraph. No background. No repetition of CAS facts. One short sentence per bullet.

═══════════════════════════════════════════
MANDATORY STOP — after ## 4., stop immediately.
Sections 5 (Compliance Calendar) and 6 (Series B HR Legal Roadmap) are pre-computed and appended automatically.
DO NOT write section 5. DO NOT write section 6. DO NOT add Next Steps or any additional section.
═══════════════════════════════════════════

Always respond in English. Cite exact Belgian legal references (article numbers, law dates).
Never invent cases beyond CAS-001 to CAS-005. NexaFlow Brussels HQ only.`,
      contextData: `${NEXAFLOW_GROUND_TRUTH}\n\nSocial elections context: CPPT constituted (2024 elections). Next elections: May 2028. Threshold to CE: ${hiresUntilCE} hires. CAS-003 requires CPPT notification under Art. 32quater.`,
      chips: ['/cas-003', '/people-report', '/policy-lookup BE', 'CE threshold brief', '2028 elections prep'],
      engine: 'gemini', // legal precision requires Gemini
      chartData: electionsCharts,
      lockedSections: electionsActionPlanMd + '\n\n' + electionsRoadmapMd,
    };
  }

  return null; // not a slash-command → direct LLM dispatch (Ollama)
}
