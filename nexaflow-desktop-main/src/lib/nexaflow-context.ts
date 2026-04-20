// ─────────────────────────────────────────────────────────────────────────────
// nexaflow-context.ts — Single source of truth for NexaFlow SA ground facts.
// Import from here. NEVER hardcode NexaFlow metrics in individual handlers.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Normalize a raw user-supplied label for display.
 * Capitalises the first letter of each word; preserves intra-word casing
 * (so "mcFadden" → "McFadden", "O'Brien" → "O'Brien").
 *
 * Use for: department names, candidate names, topics — anything shown in
 * titles, footers, chips, or system prompts.
 *
 * @example
 *   normalizeDisplayLabel('engineering')        → 'Engineering'
 *   normalizeDisplayLabel('customer success')   → 'Customer Success'
 *   normalizeDisplayLabel('JONAS GOOSSENS')     → 'JONAS GOOSSENS'  // first-letter already caps
 *   normalizeDisplayLabel('jonas goossens')     → 'Jonas Goossens'
 */
export function normalizeDisplayLabel(raw: string): string {
  return raw
    .trim()
    .split(/\s+/)
    .map(w => (w.length > 0 ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(' ');
}

/**
 * External market benchmark medians (CP 200 sector, April 2026 — Hay Group / Robert Half).
 * Used in /comp-analysis to compute the NexaFlow vs market gap.
 * Keys are lowercase (match REAL_HEADCOUNTS keys).
 */
export const MARKET_MEDIANS: Record<string, number> = {
  engineering:        82_000,
  sales:              58_000,
  'customer success': 52_000,
  product:            75_000,
  marketing:          55_000,
  finance:            65_000,
  operations:         50_000,
  'people & culture': 55_000,
  legal:              72_000,
  'c-suite':         140_000,
};

/**
 * Canonical gross annual median salaries from the NexaFlow Company Bible.
 * Keys are lowercase (match REAL_HEADCOUNTS keys).
 *
 * When a canonical value exists, it overrides the sample-computed median
 * in /comp-analysis. Departments not listed here fall back to computed value.
 *
 * Source: NexaFlow_Company_Bible.docx, April 2026.
 */
export const CANONICAL_MEDIANS: Record<string, number> = {
  engineering: 79_500,
  // Other departments: no canonical value yet — will be collected in M2 (People Analytics)
};

/**
 * Real headcounts from the NexaFlow Company Bible (Day 1, April 2026).
 * Used by all command handlers to prevent hallucinated N= values.
 * Keys are lowercase for easy normalisation of user input.
 */
export const REAL_HEADCOUNTS: Record<string, number> = {
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
  // Total: 87
};

/**
 * Compact ground-truth block injected into every LLM call as a data anchor.
 * Prevents hallucinations about headcounts, sites, and active cases.
 */
export const NEXAFLOW_GROUND_TRUTH = `
=== NEXAFLOW GROUND TRUTH (authoritative — override any conflicting prior knowledge) ===
Company: NexaFlow SA | HQ: Avenue Louise 54, 1050 Brussels | SINGLE SITE — no other offices
Total headcount: 87 | Target end-2026: 140
Headcount by dept: Engineering=34 | Sales=12 | Customer Success=10 | Product=8 | Marketing=6 | Finance=5 | Operations=4 | People & Culture=3 | Legal=2 | C-Suite=3
Engineering gross median salary: €79,500 (CP 200, source: SIRH 500 sample)
Engineering turnover: 18% (12 months)
Active HR cases — EXACTLY 5, no others:
  CAS-001 | Engineering conflict | Wouter Janssens vs Stijn Leclercq | 3 weeks escalated
  CAS-002 | Conventional termination | Jonas Goossens (Senior Backend) | confirmed flight risk
  CAS-003 | Anonymous harassment complaint | Sales dept | CRITICAL — Wellbeing Act 04/08/1996
  CAS-004 | Burn-out / long-term absence | Camille Laurent (Product Design) | 3 weeks sick leave
  CAS-005 | 3 misclassified contractors | Engineering | significant ONSS liability
Applicable law: CP 200 (CPNAE/ANPCB) | Employment Contracts Act 03/07/1978 | Wellbeing Act 04/08/1996
Social secretariat: Securex | Series B €18M | ARR €4.2M | Burn ~€600K/mo | Runway ~30 months
`.trim();

// ─────────────────────────────────────────────────────────────────────────────
// Data Gap Matrix — canonical taxonomy of missing HR data
//
// Inspired by missing-data classification methodology (Hair et al., 2019):
// distinguish between gaps caused by SIRH design (fixable), computed proxies
// (partially reliable), or absent tracking (requires new process).
//
// Severity levels:
//   HIGH   → regulatory or strategic risk; COMEX escalation required
//   MEDIUM → operational risk; head-of-function decision
//   LOW    → quality improvement; HR team action
//
// Gap types:
//   SIRH_DESIGN_GAP      → field never collected; requires process change
//   COMPUTED_FROM_SAMPLE → data exists partially; proxy available
//   NO_TRACKING_SYSTEM   → no system at all; requires tool acquisition
// ─────────────────────────────────────────────────────────────────────────────

export type DataGapSeverity = 'HIGH' | 'MEDIUM' | 'LOW';
export type DataGapType = 'SIRH_DESIGN_GAP' | 'COMPUTED_FROM_SAMPLE' | 'NO_TRACKING_SYSTEM';

export type DataGapEntry = {
  metric: string;
  gapType: DataGapType;
  cause: string;
  proxyEstimate: string;
  severity: DataGapSeverity;
  remediationAction: string;
  owner: string;
  dueDate: string;
  kpiTarget: string;
  riskIfNoAction: string;
};

/**
 * Build the canonical Data Gap Matrix for /people-report.
 * Accepts runtime-computed tenure values (from startDate sample).
 *
 * @param avgTenureYears   - computed mean, or null if sample too small
 * @param medianTenureYears - computed median, or null if sample too small
 * @param sampleN          - number of employees with a valid startDate
 */
export function buildDataGapMatrix(params: {
  avgTenureYears: string | null;
  medianTenureYears: string | null;
  sampleN: number;
}): DataGapEntry[] {
  const { avgTenureYears, medianTenureYears, sampleN } = params;
  const tenureProxy = avgTenureYears && medianTenureYears
    ? `Mean: ${avgTenureYears} yrs · Median: ${medianTenureYears} yrs (N=${sampleN} employees, ref: April 2026)`
    : `Insufficient sample data (N=${sampleN}) — complete SIRH startDate coverage required before using this proxy`;

  return [
    {
      metric: 'Gender ratio',
      gapType: 'SIRH_DESIGN_GAP',
      cause: 'Gender field absent from Securex SIRH import — never collected at onboarding',
      proxyEstimate: 'Not estimable without self-declaration — name inference is unreliable and non-compliant (GDPR)',
      severity: 'HIGH',
      remediationAction: 'Add voluntary gender self-declaration to SIRH onboarding form (Securex) + anonymous survey for current staff',
      owner: 'Anke Willems, HR Coordinator',
      dueDate: '2026-05-31',
      kpiTarget: '≥90% gender data completion in SIRH by June 2026',
      riskIfNoAction: 'Non-compliance with Gender Pay Gap Act (22/04/2012) — mandatory biennial reporting for companies ≥50 employees; IEFH audit risk',
    },
    {
      metric: 'Average tenure',
      gapType: 'COMPUTED_FROM_SAMPLE',
      cause: `startDate available in ${sampleN}-profile SIRH sample — full 87-employee coverage pending Securex data completion`,
      proxyEstimate: tenureProxy,
      severity: 'LOW',
      remediationAction: 'Complete SIRH with all 87 employee start dates from Securex contract archive',
      owner: 'Yasmina El Idrissi, Talent Acquisition',
      dueDate: '2026-05-15',
      kpiTarget: '100% startDate coverage → accurate attrition cohort analysis enabled by M2',
      riskIfNoAction: 'Tenure-based retention segmentation impossible → flight risk clusters underestimated in Series B growth plan',
    },
    {
      metric: 'Open positions',
      gapType: 'NO_TRACKING_SYSTEM',
      cause: 'No ATS integrated with SIRH — vacancies tracked informally in spreadsheets (Yasmina El Idrissi)',
      proxyEstimate: 'Est. 8 open roles (M3 recruitment plan: 8 hires targeted by Q3 2026 per Company Bible)',
      severity: 'HIGH',
      remediationAction: 'Activate Workable ATS integration → SIRH; define weekly vacancy snapshot process; present at next COMEX',
      owner: 'Yasmina El Idrissi + Amit Patel (Engineering headcount)',
      dueDate: '2026-06-30',
      kpiTarget: 'ATS live + 100% vacancy tracking → time-to-fill KPI active by M3 (June 2026)',
      riskIfNoAction: 'Time-to-fill untracked → Series B 140-employee target by Dec 2026 is at risk; Engineering capacity gap widens',
    },
  ];
}

/**
 * Full NexaFlow system context — prepended to every LLM call by NexaAIWindow.
 * Handlers in use-command-router.ts set TASK-SPECIFIC prompts only; they must NOT
 * include this block (NexaAIWindow always prepends it).
 */
export const NEXAFLOW_SYSTEM_CONTEXT = `You are NexaAI, CHRO assistant at NexaFlow SA (FinTech, Brussels HQ only).
CHRO: Bruno Mineo | CEO: Lena Verstraete | CFO: Marc Dujardin | CLO: Isabelle Thiry | CTO: Amit Patel
VP Sales: Sarah Claessens | Head of CS: Pieter De Smedt | Head of Product: Elena Voss | Head of Marketing: Julie Fontaine
87 employees — Brussels HQ (Avenue Louise 54, 1050 Brussels) — single site
Collective agreement: CP 200 (CPNAE/ANPCB) | Social secretariat: Securex | Corporate language: EN / FR-NL admin
Series B €18M (Oct 2025) | ARR €4.2M (+85% YoY) | Burn rate ~€600K/month | Runway ~30 months
Target: 140 employees by end of 2026
Departments: Engineering (34) | Sales (12) | Customer Success (10) | Product (8) | Marketing (6) | Finance (5) | Operations (4) | People & Culture (3) | Legal (2) | C-Suite (3)
HR team: Anke Willems (Office & HR Coordinator, 4y) | Yasmina El Idrissi (Talent Acquisition Specialist, 7mo)
Active HR cases:
  CAS-001: Interpersonal conflict in Engineering — Wouter Janssens vs Stijn Leclercq (escalated 3 weeks)
  CAS-002: Conventional termination request — Jonas Goossens, Senior Backend (confirmed flight risk)
  CAS-003: Anonymous harassment complaint in Sales — CRITICAL, formal investigation required (Wellbeing Act 04/08/1996)
  CAS-004: Burn-out / long-term absence — Camille Laurent, Product Design (3 weeks sick leave)
  CAS-005: 3 false independents (misclassified contractors) in Engineering — significant ONSS liability
Engineering turnover: 18% | Engineering gross median salary: €79,500 (CP 200)
Date: April 2026 — Day 1 of Bruno Mineo as CHRO (no predecessor — HR was managed by Anke Willems + CEO)
Applicable law: CP 200 | Belgian Employment Contracts Act 03/07/1978 | Wellbeing Act 04/08/1996 | DIMONA (Royal Decree 05/11/2002) | Gender Pay Gap Act 22/04/2012 | Social Elections Act 04/12/2007
CRITICAL RULES:
- NexaFlow operates from Brussels only. NEVER mention other sites (no Amsterdam, Berlin, Lisbon).
- Only reference the 5 active cases above. NEVER invent additional cases.
- Always use exact employee names from the data provided.
- ALWAYS respond in English regardless of the language the user writes in.
- If data is missing, state it explicitly — never fabricate figures.
- GDPR-compliant outputs only.
- Headcounts are fixed: Engineering=34, Sales=12, CS=10, Product=8. Never use other values.`.trim();
