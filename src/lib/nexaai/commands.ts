// Full NexaAI slash-command handlers (HR-focused)
export type NexaCommandResponse = {
  text: string;
  followUpChips: string[]; // 3 contextual next commands
  attachments: string[]; // 1-2 download button labels
  footer: { validation: string; legalRef?: string; generatedIn: string };
  typingDelay: number; // ms (800-1400)
  cardColor: string;
  data?: any;
};

export type NexaCommand = {
  id: string;
  name: string; // '/comp-analysis', '/draft-offer', ...
  description: string;
  cardColor: string;
  legalRef?: string;
  handler: (args?: string, ctx?: any) => Promise<NexaCommandResponse>;
};

const randTypingDelay = () => 800 + Math.floor(Math.random() * 601); // 800..1400 ms
const isoNow = () => new Date().toISOString();

export const commands: NexaCommand[] = [
  {
    id: 'comp-analysis',
    name: '/comp-analysis',
    description: 'Compensation benchmark table + 3 alerts + recommendations',
    cardColor: '#F59E0B',
    legalRef: 'CP 200 Art.12 · Equal Pay Act 22/04/2012',
    handler: async (args = '', ctx = {}) => {
      const kpis = ctx.kpis || {};
      const employees = ctx.employees || [];
      // Minimal benchmark: aggregate by role if provided in args
      const role = args.trim() || 'Sample role';
      const table = `Role | Median | 25th | 75th\n---|---:|---:|---:\n${role} | €72,000 | €60,000 | €85,000`;
      const alerts = [
        'Alert 1: Pay outlier — 3 employees > 95th percentile',
        'Alert 2: Gender pay gap detected by department',
        'Alert 3: Several high-performers flagged as flight-risk',
      ];
      const recommendations = [
        'Recommendation: run market adjustment for roles above 10% below median',
        'Recommendation: schedule targeted retention meetings for high flight-risk profiles',
        'Recommendation: audit job families for pay parity and apply corrective increases',
      ];

      return {
        text: [`Compensation analysis for: ${role}`, '', table, '', 'Alerts:', ...alerts.map(a => `- ${a}`), '', 'Recommendations:', ...recommendations.map(r => `- ${r}`)].join('\n'),
        followUpChips: ['/people-report', '/draft-offer', '/policy-lookup BE'],
        attachments: ['Download CSV', 'Export PDF'],
        footer: { validation: 'Automated HR heuristic — requires manager validation', legalRef: 'CP 200 Art.12 · Equal Pay Act 22/04/2012', generatedIn: isoNow() },
        typingDelay: randTypingDelay(),
        cardColor: '#F59E0B',
        data: { kpis, sampleTable: { role, median: 72000 } },
      };
    },
  },

  {
    id: 'draft-offer',
    name: '/draft-offer',
    description: 'Generate a CDI offer letter (or ask for details)',
    cardColor: '#3B82F6',
    legalRef: 'CP 200 Art. 6, 67, 104',
    handler: async (args = '', ctx = {}) => {
      const delay = randTypingDelay();
      if (!args || args.trim().length < 3) {
        return {
          text: 'Please provide candidate name, role, salary, start date and office (e.g. "Jean Dupont | Senior Engineer | €75k | 2026-06-01 | Brussels").',
          followUpChips: ['/comp-analysis', '/people-report', '/email-draft'],
          attachments: ['Offer template (.docx)'],
          footer: { validation: 'Missing candidate details', legalRef: 'CP 200 Art. 6, 67, 104', generatedIn: isoNow() },
          typingDelay: delay,
          cardColor: '#3B82F6',
        };
      }

      // Parse simple pipe-separated args
      const parts = args.split('|').map(s => s.trim());
      const [candidate = 'Candidate', role = 'Role', salary = '€XX,XXX', start = 'Start Date', site = 'Site'] = parts;
      const letter = `Dear ${candidate},\n\nWe are pleased to offer you a permanent contract (CDI) for the position of ${role} based in ${site}.\n\nSalary: ${salary} gross per year. Start date: ${start}.\n\nThis offer is subject to standard background checks and signature of the employment contract.\n\nSincerely,\nNexaFlow HR`;

      return {
        text: letter,
        followUpChips: ['/email-draft', '/onboarding', '/policy-lookup BE'],
        attachments: ['Download Offer (.pdf)', 'Download Contract Template (.docx)'],
        footer: { validation: 'Template auto-generated — legal review recommended', legalRef: 'CP 200 Art. 6, 67, 104', generatedIn: isoNow() },
        typingDelay: delay,
        cardColor: '#3B82F6',
        data: { candidate, role, salary, start, site },
      };
    },
  },

  {
    id: 'onboarding',
    name: '/onboarding',
    description: 'Pre-arrival checklist + Day 1 schedule + 30-60-90 objectives',
    cardColor: '#10B981',
    legalRef: 'Wellbeing Act 04/08/1996',
    handler: async (_args = '', ctx = {}) => {
      const checklist = [
        'IT account created & laptop provisioned',
        'Welcome packet sent (HR policies, NDAs)',
        'Workspace reserved (if on-site) / remote setup guide sent',
        'Manager pre-brief & 1:1 scheduled',
      ];

      const day1 = `09:00 - Welcome & HR intro\n10:00 - Team meet & tour\n11:00 - IT setup\n12:30 - Lunch with buddy\n14:00 - Role onboarding\n16:30 - Q&A`;

      const objectives = `30 days: ramp & training plan\n60 days: deliver first owned task\n90 days: measurable impact & roadmap ownership`;

      return {
        text: ['Pre-arrival checklist:', ...checklist.map(i => `- ${i}`), '', 'Day 1 schedule:', day1, '', '30/60/90 objectives:', objectives].join('\n'),
        followUpChips: ['/draft-offer', '/people-report', '/email-draft'],
        attachments: ['Download Checklist (.pdf)', 'Add to Calendar (.ics)'],
        footer: { validation: 'Checklist standard — adapt to local rules', legalRef: 'Wellbeing Act 04/08/1996', generatedIn: isoNow() },
        typingDelay: randTypingDelay(),
        cardColor: '#10B981',
      };
    },
  },

  {
    id: 'people-report',
    name: '/people-report',
    description: 'Headcount by dept + sites breakdown + attrition + diversity + 4 active critical cases',
    cardColor: '#8B5CF6',
    handler: async (_args = '', ctx = {}) => {
      const employees = ctx.employees || [];
      const kpis = ctx.kpis || {};
      const cases = ctx.cases || [];

      // Basic aggregations (defensive)
      const headcount = kpis.headcount ?? employees.length;
      const byDept: Record<string, number> = {};
      const bySite: Record<string, number> = {};
      (employees as any[]).forEach((e: any) => {
        byDept[e.department] = (byDept[e.department] || 0) + 1;
        bySite[e.site] = (bySite[e.site] || 0) + 1;
      });

      const attrition = typeof kpis.turnoverRate === 'number' ? `${Math.round(kpis.turnoverRate * 100)}%` : 'n/a';

      const diversity = { womenPct: kpis.womenPct ?? 'n/a', avgTenureMonths: kpis.avgTenureMonths ?? 'n/a' };

      // pick up to 4 critical cases (priority high or in-progress)
      const critical = (cases as any[]).filter((c: any) => c.priority === 'high' || c.status === 'in-progress').slice(0, 4);

      const deptLines = Object.entries(byDept).map(([d, n]) => `${d}: ${n}`).join('\n');
      const siteLines = Object.entries(bySite).map(([s, n]) => `${s}: ${n}`).join('\n');

      return {
        text: [`Total headcount (indicator): ${headcount}`, '', 'By department:', deptLines || 'n/a', '', 'By site:', siteLines || 'n/a', '', `Attrition (12m): ${attrition}`, '', 'Diversity snapshot:', JSON.stringify(diversity, null, 2), '', 'Active critical cases:', ...(critical.length ? critical.map(c => `- ${c.id}: ${c.title} (${c.status})`) : ['- None'])].join('\n'),
        followUpChips: ['/comp-analysis', '/create-case', '/policy-lookup BE'],
        attachments: ['Download Report (.csv)'],
        footer: { validation: 'Aggregated from HR sources — verify with payroll', generatedIn: isoNow() },
        typingDelay: randTypingDelay(),
        cardColor: '#8B5CF6',
        data: { byDept, bySite, attrition, criticalCases: critical },
      };
    },
  },

  {
    id: 'performance-review',
    name: '/performance-review',
    description: 'Self-assessment form + manager grid with 5 competencies',
    cardColor: '#EAB308',
    legalRef: 'Competentiewoordenboek VLO + AI Addendum v3.2',
    handler: async (_args = '', _ctx = {}) => {
      const selfAssessment = ['1) Key achievements (bullet list)', '2) Challenges & blockers', '3) Development goals (next 12 months)'];
      const managerGrid = `Competency | Rating (1-5) | Comments\n---|---:|---\nRole Mastery | | \nCollaboration | | \nDelivery | | \nLeadership | | \nCritical AI Use (I→IV) | I / II / III / IV — select level and comment`;

      return {
        text: ['Self-assessment template:', ...selfAssessment.map(s => `- ${s}`), '', 'Manager evaluation grid:', managerGrid].join('\n'),
        followUpChips: ['/people-report', '/draft-offer', '/email-draft'],
        attachments: ['Download Review Form (.pdf)'],
        footer: { validation: 'Use for annual review cycles — calibrate with HRBP', legalRef: 'Competentiewoordenboek VLO + AI Addendum v3.2', generatedIn: isoNow() },
        typingDelay: randTypingDelay(),
        cardColor: '#EAB308',
      };
    },
  },

  {
    id: 'policy-lookup',
    name: '/policy-lookup',
    description: 'Detect jurisdiction and return legal framework + NexaFlow policy summary',
    cardColor: '#EF4444',
    handler: async (args = '', _ctx = {}) => {
      const txt = (args || '').toLowerCase();
      const map: Record<string, { code: string; framework: string }> = {
        be: { code: 'BE', framework: 'Belgian Labour Code, GDPR (BE)' },
        nl: { code: 'NL', framework: 'Dutch Civil Code & working conditions (NL)' },
        de: { code: 'DE', framework: 'German Labor Law (BGB & KSchG)' },
        pt: { code: 'PT', framework: 'Portuguese Labour Code' },
      };

      let detected = 'International (no jurisdiction detected)';
      let legal = 'Refer to global labour framework and local counsel.';
      for (const k of Object.keys(map)) {
        if (txt.includes(k) || txt.includes(map[k].code.toLowerCase()) || txt.includes(map[k].framework.split(' ')[0].toLowerCase())) {
          detected = map[k].code;
          legal = map[k].framework;
          break;
        }
      }

      const policySummary = `NexaFlow internal policy (summary): working time, leave, termination rules, data protection baseline. Local variations may apply: see ${detected}.`;

      return {
        text: `Jurisdiction: ${detected}\nLegal framework: ${legal}\n\n${policySummary}`,
        followUpChips: ['/people-report', '/comp-analysis', '/draft-offer'],
        attachments: ['Download Policy Summary (.pdf)'],
        footer: { validation: 'Auto-detection — confirm jurisdiction before legal action', generatedIn: isoNow(), legalRef: undefined },
        typingDelay: randTypingDelay(),
        cardColor: '#EF4444',
        data: { jurisdiction: detected, legalFramework: legal },
      };
    },
  },
];

export function findCommand(nameOrSlash: string) {
  return commands.find(c => c.name === nameOrSlash || c.name === `/${nameOrSlash}`);
}
