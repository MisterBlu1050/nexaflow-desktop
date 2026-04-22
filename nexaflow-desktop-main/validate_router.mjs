/**
 * validate_router.mjs — end-to-end validation without vitest/jsdom
 *
 * Run: npx vite-node validate_router.mjs
 * (vite-node resolves @/ aliases via tsconfig)
 *
 * Tests all HandlerResult outputs against ground-truth anchors.
 */

// ── Colour helpers ─────────────────────────────────────────────────────────
const G = (s) => `\x1b[32m${s}\x1b[0m`;
const R = (s) => `\x1b[31m${s}\x1b[0m`;
const B = (s) => `\x1b[34m${s}\x1b[0m`;
const Y = (s) => `\x1b[33m${s}\x1b[0m`;
const DIM = (s) => `\x1b[2m${s}\x1b[0m`;

// ── Test runner ────────────────────────────────────────────────────────────
let passed = 0, failed = 0, warnings = 0;
const results = [];

function assert(name, condition, detail = '') {
  if (condition) {
    passed++;
    results.push({ ok: true, name });
  } else {
    failed++;
    results.push({ ok: false, name, detail });
  }
}

// Shim window.electron to undefined (IPC-OFF)
globalThis.window = { electron: undefined };

// ── Import modules ─────────────────────────────────────────────────────────
const { routeCommand } = await import('./src/hooks/use-command-router.ts');
const {
  REAL_HEADCOUNTS,
  NEXAFLOW_GROUND_TRUTH,
  NEXAFLOW_SYSTEM_CONTEXT,
} = await import('./src/lib/nexaflow-context.ts');

// ── Forbidden patterns (must never appear in any handler output) ───────────
const FORBIDDEN = [
  { rx: /\bN\s*=\s*50\b/i,   label: 'N=50 (sample count)' },
  { rx: /\bN\s*=\s*120\b/i,  label: 'N=120 (wrong Engineering)' },
  { rx: /\bN\s*=\s*185\b/i,  label: 'N=185 (nonexistent)' },
  { rx: /\bN\s*=\s*500\b/i,  label: 'N=500 (full company ref)' },
  // Affirmative site patterns only — "never mention X" or "no X offices" are acceptable guardrail text
  { rx: /\bAmsterdam\s+(office|site|HQ)\b|\bsite\s+in\s+Amsterdam\b|Amsterdam\s*\(/i,
                              label: 'Amsterdam as affirmative site reference' },
  { rx: /\bBerlin\s+(office|site|HQ)\b|\bsite\s+in\s+Berlin\b|Berlin\s*\(/i,
                              label: 'Berlin as affirmative site reference' },
  { rx: /\bLisbon\s+(office|site|HQ)\b|\bsite\s+in\s+Lisbon\b|Lisbon\s*\(/i,
                              label: 'Lisbon as affirmative site reference' },
  { rx: /€\s*68[,\s]?000\b/,  label: '€68,000 (old Engineering median)' },
  { rx: /€\s*70[,\s]?500\b/,  label: '€70,500 (old market median)' },
  { rx: /CAS-006/i,           label: 'CAS-006 (nonexistent)' },
  { rx: /CAS-007/i,           label: 'CAS-007 (nonexistent)' },
  { rx: /CAS-008/i,           label: 'CAS-008 (UI-layer only)' },
  { rx: /You are NexaAI, CHRO assistant at NexaFlow SA/,
                              label: 'system context boilerplate in handler (double injection)' },
];

function checkForbidden(label, ...texts) {
  const combined = texts.filter(Boolean).join('\n');
  const hits = FORBIDDEN.filter(({ rx }) => rx.test(combined));
  hits.forEach(({ label: pattern }) => {
    assert(`${label}: no forbidden pattern "${pattern}"`, false, `Pattern found in output`);
  });
  if (hits.length === 0) {
    assert(`${label}: no forbidden legacy data`, true);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
console.log(B('\n═══════════════════════════════════════════════════════'));
console.log(B('  NexaAI Router — End-to-End Validation Suite'));
console.log(B('═══════════════════════════════════════════════════════\n'));

// ── SECTION 1: Context exports ──────────────────────────────────────────────
console.log(Y('§1  nexaflow-context.ts static checks'));

const total = Object.values(REAL_HEADCOUNTS).reduce((a, b) => a + b, 0);
assert('REAL_HEADCOUNTS sums to 87', total === 87, `got ${total}`);
assert('REAL_HEADCOUNTS engineering = 34', REAL_HEADCOUNTS['engineering'] === 34);
assert('REAL_HEADCOUNTS sales = 12', REAL_HEADCOUNTS['sales'] === 12);
assert('REAL_HEADCOUNTS product = 8', REAL_HEADCOUNTS['product'] === 8);
assert('SYSTEM_CONTEXT: Brussels HQ mentioned', NEXAFLOW_SYSTEM_CONTEXT.includes('Brussels'));
assert('SYSTEM_CONTEXT: Engineering (34)', NEXAFLOW_SYSTEM_CONTEXT.includes('Engineering (34)'));
assert('SYSTEM_CONTEXT: median €79,500', NEXAFLOW_SYSTEM_CONTEXT.includes('79,500'));
assert('SYSTEM_CONTEXT: no multi-site affirmation', !NEXAFLOW_SYSTEM_CONTEXT.match(/Amsterdam \(|Berlin \(|Lisbon \(/));
assert('SYSTEM_CONTEXT: CAS-001..005 all listed', [1,2,3,4,5].every(i => NEXAFLOW_SYSTEM_CONTEXT.includes(`CAS-00${i}`)));
assert('SYSTEM_CONTEXT: no CAS-008', !NEXAFLOW_SYSTEM_CONTEXT.includes('CAS-008'));
assert('GROUND_TRUTH: Engineering=34', NEXAFLOW_GROUND_TRUTH.includes('Engineering=34'));
assert('GROUND_TRUTH: SINGLE SITE', NEXAFLOW_GROUND_TRUTH.includes('SINGLE SITE'));
assert('GROUND_TRUTH: CAS-001 and CAS-005', NEXAFLOW_GROUND_TRUTH.includes('CAS-001') && NEXAFLOW_GROUND_TRUTH.includes('CAS-005'));
assert('GROUND_TRUTH: no CAS-008', !NEXAFLOW_GROUND_TRUTH.includes('CAS-008'));

// ── SECTION 2: /comp-analysis ──────────────────────────────────────────────
console.log(Y('\n§2  /comp-analysis'));
const comp = await routeCommand('/comp-analysis Engineering');
assert('/comp-analysis Engineering: non-null', comp !== null);
assert('/comp-analysis: N=34 in footer', comp?.footer?.includes('N=34'));
assert('/comp-analysis: N=34 in chips', comp?.chips?.includes('N=34'));
assert('/comp-analysis: CP200 in footer', comp?.footer?.includes('CP200'));
assert('/comp-analysis: engine=ollama', comp?.engine === 'ollama');
assert('/comp-analysis: systemPrompt has N=34', comp?.systemPrompt?.includes('N=34'));
assert('/comp-analysis: no double injection', !comp?.systemPrompt?.includes('You are NexaAI, CHRO assistant at NexaFlow SA'));
assert('/comp-analysis: contextData has 34', comp?.contextData?.includes('34'));
checkForbidden('/comp-analysis', comp?.systemPrompt, comp?.contextData, comp?.footer, comp?.chips?.join(' '));

const compDeep = await routeCommand('/comp-analysis Engineering --deep');
assert('/comp-analysis --deep: engine=gemini', compDeep?.engine === 'gemini');

const compSales = await routeCommand('/comp-analysis Sales');
assert('/comp-analysis Sales: N=12 in footer', compSales?.footer?.includes('N=12'));

const compProduct = await routeCommand('/comp-analysis Product');
assert('/comp-analysis Product: N=8 in footer', compProduct?.footer?.includes('N=8'));

// ── SECTION 3: /people-report ──────────────────────────────────────────────
console.log(Y('\n§3  /people-report (IPC=OFF → REAL_HEADCOUNTS fallback)'));
const pr = await routeCommand('/people-report');
assert('/people-report: non-null', pr !== null);

let prCtx;
try {
  prCtx = JSON.parse(pr?.contextData ?? '{}');
} catch {
  assert('/people-report: contextData is valid JSON', false, 'JSON.parse failed');
  prCtx = {};
}

assert('/people-report: totalEmployees=87', prCtx.totalEmployees === 87, `got ${prCtx.totalEmployees}`);
assert('/people-report: byDept.engineering=34', prCtx.byDept?.engineering === 34, `got ${prCtx.byDept?.engineering}`);
assert('/people-report: byDept.sales=12', prCtx.byDept?.sales === 12, `got ${prCtx.byDept?.sales}`);
assert('/people-report: site=Brussels', prCtx.site?.includes('Brussels'));
assert('/people-report: 5 activeCases', Array.isArray(prCtx.activeCases) && prCtx.activeCases.length === 5, `got ${prCtx.activeCases?.length}`);
assert('/people-report: CAS-005 in activeCases', prCtx.activeCases?.includes('CAS-005'));
assert('/people-report: no CAS-008 in activeCases', !prCtx.activeCases?.includes('CAS-008'));
assert('/people-report: no double injection', !pr?.systemPrompt?.includes('You are NexaAI, CHRO assistant at NexaFlow SA'));
checkForbidden('/people-report', pr?.systemPrompt, pr?.contextData);

const prAttr = await routeCommand('/people-report attrition');
assert('/people-report attrition: title has Attrition', prAttr?.title?.includes('Attrition Focus'));

// ── SECTION 4: /cas-* handlers ─────────────────────────────────────────────
console.log(Y('\n§4  /cas-* handlers (engine=gemini, GROUND_TRUTH grounding)'));

for (const id of ['001', '002', '003', '004', '005']) {
  const cas = await routeCommand(`/cas-${id}`);
  assert(`/cas-${id}: non-null`, cas !== null);
  assert(`/cas-${id}: engine=gemini`, cas?.engine === 'gemini');
  assert(`/cas-${id}: GROUND_TRUTH in contextData (Engineering=34)`, cas?.contextData?.includes('Engineering=34'));
  assert(`/cas-${id}: GROUND_TRUTH in contextData (SINGLE SITE)`, cas?.contextData?.includes('SINGLE SITE'));
  assert(`/cas-${id}: no double injection`, !cas?.systemPrompt?.includes('You are NexaAI, CHRO assistant at NexaFlow SA'));
  checkForbidden(`/cas-${id}`, cas?.systemPrompt, cas?.contextData);
}

// Ghost cases — CAS-006/008 should warn "CAS-001 to CAS-005 only"
for (const ghost of ['006', '008']) {
  const cas = await routeCommand(`/cas-${ghost}`);
  if (cas !== null) {
    assert(`/cas-${ghost}: systemPrompt warns "CAS-001 to CAS-005 only"`,
      cas?.systemPrompt?.includes('CAS-001 to CAS-005 only'));
  } else {
    assert(`/cas-${ghost}: returns null (not routed)`, true);
  }
}

// ── SECTION 5: Other handlers ──────────────────────────────────────────────
console.log(Y('\n§5  Other handlers'));

const draft = await routeCommand('/draft-offer Jonas Goossens');
assert('/draft-offer: non-null', draft !== null);
assert('/draft-offer: name in systemPrompt', draft?.systemPrompt?.includes('Jonas Goossens'));
assert('/draft-offer: CDI or CP200 in systemPrompt', /CDI|CP200|CP 200/.test(draft?.systemPrompt ?? ''));
assert('/draft-offer: engine=ollama', draft?.engine === 'ollama');
checkForbidden('/draft-offer', draft?.systemPrompt);

const onb = await routeCommand('/onboarding Alice Martin');
assert('/onboarding: name in prompt', onb?.systemPrompt?.includes('Alice Martin'));
assert('/onboarding: 30/60/90 referenced', /30.{0,5}60.{0,5}90/.test(onb?.systemPrompt ?? ''));
checkForbidden('/onboarding', onb?.systemPrompt);

const perf = await routeCommand('/performance-review');
assert('/performance-review: 4-level grid', /I=.*II=.*III=.*IV=/.test(perf?.systemPrompt ?? ''));
assert('/performance-review: Vlaamse Overheid', /Vlaamse Overheid/i.test(perf?.systemPrompt ?? ''));

const polBE = await routeCommand('/policy-lookup BE');
assert('/policy-lookup BE: title correct', polBE?.title?.includes('Belgium (BE)'));
assert('/policy-lookup BE: engine=ollama', polBE?.engine === 'ollama');

const polNL = await routeCommand('/policy-lookup NL');
assert('/policy-lookup NL: redirected to BE', polNL?.title?.includes('redirected to BE'));
assert('/policy-lookup NL: prompt warns single jurisdiction', polNL?.systemPrompt?.includes('exclusively from Brussels'));

// ── SECTION 6: /diagram ────────────────────────────────────────────────────
console.log(Y('\n§6  /diagram'));

const diag = await routeCommand('/diagram attrition');
assert('/diagram attrition: diagramMode=true', diag?.diagramMode === true);
assert('/diagram attrition: engine=gemini', diag?.engine === 'gemini');
assert('/diagram attrition: N=34 in prompt', diag?.systemPrompt?.includes('N=34'));
checkForbidden('/diagram', diag?.systemPrompt, diag?.contextData);

const diagComp = await routeCommand('/diagram comp');
assert('/diagram comp: N=34 in prompt', diagComp?.systemPrompt?.includes('N=34'));

// ── SECTION 7: Free-text + unknown commands ────────────────────────────────
console.log(Y('\n§7  Free-text and unknown commands'));

const ft = await routeCommand('What is the notice period for Jonas Goossens?');
assert('Free-text: returns null (direct Ollama dispatch)', ft === null);

const unk = await routeCommand('/unknown-command');
assert('Unknown command: returns null', unk === null);

// ── SECTION 8: --deep flag — engine routing ───────────────────────────────
console.log(Y('\n§8  --deep flag routing'));

const deepCmds = [
  '/people-report --deep',
  '/draft-offer Alice --deep',
  '/onboarding --deep',
  '/performance-review --deep',
  '/policy-lookup BE --deep',
];
for (const cmd of deepCmds) {
  const r = await routeCommand(cmd);
  assert(`${cmd}: engine=gemini`, r?.engine === 'gemini', `got ${r?.engine}`);
}

// ── SECTION 9: --deep flag argument hygiene (regression for N=0 bug) ───────
console.log(Y('\n§9  --deep argument hygiene'));

// Critical: /comp-analysis Dept --deep must NOT produce N=0 or "Dept --deep" title
const compDeepEngineering = await routeCommand('/comp-analysis Engineering --deep');
assert('/comp-analysis Engineering --deep: N=34 in footer (not N=0)', compDeepEngineering?.footer?.includes('N=34'), `got footer="${compDeepEngineering?.footer}"`);
assert('/comp-analysis Engineering --deep: title has no "--deep"', !compDeepEngineering?.title?.includes('--deep'), `title="${compDeepEngineering?.title}"`);
assert('/comp-analysis Engineering --deep: title is "Compensation Analysis — Engineering"', compDeepEngineering?.title === 'Compensation Analysis — Engineering');
assert('/comp-analysis Engineering --deep: N=34 in chips', compDeepEngineering?.chips?.includes('N=34'));
assert('/comp-analysis Engineering --deep: engine=gemini', compDeepEngineering?.engine === 'gemini');

const compDeepSales = await routeCommand('/comp-analysis Sales --deep');
assert('/comp-analysis Sales --deep: N=12 (not N=0)', compDeepSales?.footer?.includes('N=12'), `got footer="${compDeepSales?.footer}"`);
assert('/comp-analysis Sales --deep: title clean', !compDeepSales?.title?.includes('--deep'));

// /draft-offer Name --deep: name must not contain "--deep"
const draftDeep = await routeCommand('/draft-offer Jonas Goossens --deep');
assert('/draft-offer Jonas Goossens --deep: name clean in title', draftDeep?.title === 'Offer Letter — Jonas Goossens', `got title="${draftDeep?.title}"`);
assert('/draft-offer Jonas Goossens --deep: name clean in systemPrompt', draftDeep?.systemPrompt?.includes('Jonas Goossens') && !draftDeep?.systemPrompt?.includes('--deep'));

// /onboarding Name --deep: name clean
const onbDeep = await routeCommand('/onboarding Alice Martin --deep');
assert('/onboarding Alice Martin --deep: name clean', onbDeep?.title === 'Onboarding — Alice Martin', `got title="${onbDeep?.title}"`);

// /policy-lookup NL --deep: both redirected to BE AND engine=gemini
const polDeepNL = await routeCommand('/policy-lookup NL --deep');
assert('/policy-lookup NL --deep: redirected to BE', polDeepNL?.title?.includes('redirected to BE'));
assert('/policy-lookup NL --deep: engine=gemini', polDeepNL?.engine === 'gemini');

// ── SECTION 10: Label normalisation + canonical median ─────────────────────
console.log(Y('\n§10  Label normalisation + canonical median (€79,500 Engineering)'));

// /comp-analysis — lowercase input → canonical title + footer
const compLower = await routeCommand('/comp-analysis engineering');
assert('/comp-analysis engineering: title capitalised', compLower?.title === 'Compensation Analysis — Engineering', `got "${compLower?.title}"`);
assert('/comp-analysis engineering: footer capitalised', compLower?.footer?.includes('| Engineering |'), `got "${compLower?.footer}"`);
assert('/comp-analysis engineering: chip capitalised', compLower?.chips?.includes('Engineering'), `chips="${compLower?.chips}"`);

// Canonical median override: Engineering must show €79 500 (fr-BE locale, Company Bible), not sample value
// fr-BE uses a space (or narrow no-break space) as thousand separator: 79_500 → "79 500"
assert('/comp-analysis Engineering: canonical median 79 500 in footer',
  /79.?500/.test(compLower?.footer ?? ''), `got footer="${compLower?.footer}"`);
assert('/comp-analysis Engineering: footer source = Company Bible', compLower?.footer?.includes('Company Bible'), `got footer="${compLower?.footer}"`);
assert('/comp-analysis Engineering: canonical median in chips', compLower?.chips?.some(c => c.includes('79') && c.includes('500')), `chips="${compLower?.chips}"`);

// Non-canonical dept: Sales shows computed median or N/A, NOT Company Bible
const compSalesLower = await routeCommand('/comp-analysis sales');
assert('/comp-analysis sales: title = "Compensation Analysis — Sales"', compSalesLower?.title === 'Compensation Analysis — Sales', `got "${compSalesLower?.title}"`);
assert('/comp-analysis sales: footer does NOT say Company Bible', !compSalesLower?.footer?.includes('Company Bible'), `got footer="${compSalesLower?.footer}"`);

// UPPERCASE input normalisation
const compUpper = await routeCommand('/comp-analysis ENGINEERING');
assert('/comp-analysis ENGINEERING: title capitalised correctly', compUpper?.title === 'Compensation Analysis — ENGINEERING' || compUpper?.title === 'Compensation Analysis — Engineering');
// Note: normalizeDisplayLabel only caps first letter of each word, preserving intra-word case
// "ENGINEERING" → first letter 'E' already cap, rest preserved → "ENGINEERING"

// /draft-offer — lowercase name → capitalised title
const draftLower = await routeCommand('/draft-offer jonas goossens');
assert('/draft-offer jonas goossens: title = "Offer Letter — Jonas Goossens"', draftLower?.title === 'Offer Letter — Jonas Goossens', `got "${draftLower?.title}"`);
assert('/draft-offer jonas goossens: systemPrompt has "Jonas Goossens"', draftLower?.systemPrompt?.includes('Jonas Goossens'));

// /onboarding — lowercase → capitalised
const onbLower = await routeCommand('/onboarding alice martin');
assert('/onboarding alice martin: title = "Onboarding — Alice Martin"', onbLower?.title === 'Onboarding — Alice Martin', `got "${onbLower?.title}"`);

// /performance-review — lowercase → capitalised
const perfLower = await routeCommand('/performance-review wouter janssens');
assert('/performance-review wouter janssens: title capitalised', perfLower?.title === 'Performance Review — Wouter Janssens', `got "${perfLower?.title}"`);
assert('/performance-review wouter janssens: systemPrompt has "Wouter Janssens"', perfLower?.systemPrompt?.includes('Wouter Janssens'));

// /diagram — lowercase topic → capitalised in title, alias still resolves
const diagLower = await routeCommand('/diagram attrition');
assert('/diagram attrition: title = "Diagram — Attrition"', diagLower?.title === 'Diagram — Attrition', `got "${diagLower?.title}"`);
assert('/diagram attrition: alias still resolves (N=34 in systemPrompt)', diagLower?.systemPrompt?.includes('N=34'));

const diagOrgChart = await routeCommand('/diagram org-chart');
// normalizeDisplayLabel splits on whitespace only — "org-chart" stays as one token → "Org-chart"
assert('/diagram org-chart: title = "Diagram — Org-chart"', diagOrgChart?.title === 'Diagram — Org-chart', `got "${diagOrgChart?.title}"`);

// normalizeDisplayLabel helper — verify from context exports
const { normalizeDisplayLabel: ndl } = await import('./src/lib/nexaflow-context.ts');
assert('normalizeDisplayLabel("engineering")', ndl('engineering') === 'Engineering');
assert('normalizeDisplayLabel("customer success")', ndl('customer success') === 'Customer Success');
assert('normalizeDisplayLabel("jonas goossens")', ndl('jonas goossens') === 'Jonas Goossens');
assert('normalizeDisplayLabel("  alice  martin  ")', ndl('  alice  martin  ') === 'Alice Martin');
assert('normalizeDisplayLabel("ENGINEERING")', ndl('ENGINEERING') === 'ENGINEERING'); // first-letter already cap, rest preserved

// ── SECTION 11: chartData — deterministic chart payloads ──────────────────
console.log(Y('\n§11  chartData (deterministic charts — no LLM involvement)'));

// /comp-analysis Engineering — 2 charts (salary bar + flight risk bar)
const compCharts = await routeCommand('/comp-analysis Engineering');
assert('/comp-analysis: chartData present', Array.isArray(compCharts?.chartData) && compCharts.chartData.length > 0, `got ${JSON.stringify(compCharts?.chartData)}`);
assert('/comp-analysis: first chart is bar type', compCharts?.chartData?.[0]?.type === 'bar');
assert('/comp-analysis: first chart has 2 data points (NexaFlow + Market)', compCharts?.chartData?.[0]?.data?.length === 2, `got ${compCharts?.chartData?.[0]?.data?.length}`);
assert('/comp-analysis: NexaFlow median ≥ 79400 (canonical ±100)', (compCharts?.chartData?.[0]?.data?.[0]?.value ?? 0) >= 79400, `got ${compCharts?.chartData?.[0]?.data?.[0]?.value}`);
assert('/comp-analysis: market benchmark 82000', compCharts?.chartData?.[0]?.data?.[1]?.value === 82000, `got ${compCharts?.chartData?.[0]?.data?.[1]?.value}`);
assert('/comp-analysis: flight risk chart present', compCharts?.chartData?.length >= 2, `got ${compCharts?.chartData?.length} charts`);
assert('/comp-analysis: flight risk chart is bar type', compCharts?.chartData?.[1]?.type === 'bar');

// /comp-analysis Sales — 2 charts, market benchmark 58000
const compSalesCharts = await routeCommand('/comp-analysis Sales');
assert('/comp-analysis Sales: chartData present', Array.isArray(compSalesCharts?.chartData));
assert('/comp-analysis Sales: market benchmark = 58000', compSalesCharts?.chartData?.[0]?.data?.[1]?.value === 58000, `got ${compSalesCharts?.chartData?.[0]?.data?.[1]?.value}`);

// /people-report — 2 charts (donut + cases)
const prCharts = await routeCommand('/people-report');
assert('/people-report: chartData present', Array.isArray(prCharts?.chartData) && prCharts.chartData.length >= 2);
assert('/people-report: first chart is donut', prCharts?.chartData?.[0]?.type === 'donut');
assert('/people-report: donut has 10 departments', prCharts?.chartData?.[0]?.data?.length === 10, `got ${prCharts?.chartData?.[0]?.data?.length}`);
assert('/people-report: donut values sum to 87', (prCharts?.chartData?.[0]?.data?.reduce((s, d) => s + d.value, 0)) === 87, `got ${prCharts?.chartData?.[0]?.data?.reduce((s, d) => s + d.value, 0)}`);
assert('/people-report: second chart is cases type', prCharts?.chartData?.[1]?.type === 'cases');
assert('/people-report: cases chart has exactly 5 entries', prCharts?.chartData?.[1]?.data?.length === 5, `got ${prCharts?.chartData?.[1]?.data?.length}`);
assert('/people-report: CAS-003 has severity 5 (Critical)', prCharts?.chartData?.[1]?.data?.find(d => d.label.includes('003'))?.value === 5, `got ${prCharts?.chartData?.[1]?.data?.find(d => d.label.includes('003'))?.value}`);
assert('/people-report: CAS-004 has severity 2 (Low-Med)', prCharts?.chartData?.[1]?.data?.find(d => d.label.includes('004'))?.value === 2, `got ${prCharts?.chartData?.[1]?.data?.find(d => d.label.includes('004'))?.value}`);

// Handlers WITHOUT chartData should not accidentally get one
const draftCharts = await routeCommand('/draft-offer Test Candidate');
assert('/draft-offer: no chartData', !draftCharts?.chartData || draftCharts.chartData.length === 0);

const casCharts = await routeCommand('/cas-003');
assert('/cas-003: no chartData (text-only output)', !casCharts?.chartData || casCharts.chartData.length === 0);

// ═══════════════════════════════════════════════════════════════════════════
// Report
// ═══════════════════════════════════════════════════════════════════════════
console.log(B('\n═══════════════════════════════════════════════════════'));
console.log(B('  RESULTS'));
console.log(B('═══════════════════════════════════════════════════════\n'));

const failedTests = results.filter(r => !r.ok);
const passedTests = results.filter(r => r.ok);

if (failedTests.length > 0) {
  console.log(R(`FAILURES (${failedTests.length}):`));
  failedTests.forEach(r => console.log(R(`  ✗ ${r.name}`) + (r.detail ? DIM(` [${r.detail}]`) : '')));
  console.log('');
}

console.log(G(`✓ Passed: ${passedTests.length}`));
console.log(failedTests.length > 0 ? R(`✗ Failed: ${failedTests.length}`) : G('✗ Failed: 0'));
console.log(`\nTotal assertions: ${results.length}`);

if (failedTests.length > 0) {
  process.exit(1);
} else {
  console.log(G('\n✅  All validation checks PASSED — system is anchored on NexaFlow ground truth'));
}
