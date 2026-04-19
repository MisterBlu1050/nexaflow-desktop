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
    // Prefer IPC (Electron) but gracefully fall back to in-memory demo data when not running in Electron
    let employeesList = employees as any[];
    try {
      if (typeof window !== 'undefined' && (window as any).electron && (window as any).electron.getCompByDept) {
        const remote = await (window as any).electron.getCompByDept(dept);
        if (Array.isArray(remote) && remote.length > 0) employeesList = remote;
      }
    } catch (err) {
      // swallow and fallback to local `employees`
      console.error('IPC getCompByDept failed, using local demo employees:', err);
    }

    const n = employeesList.length;
    const salaires = employeesList.map((e: any) => e.salaire || e.salary).filter(Boolean) as number[];
    const sorted = salaires.slice().sort((a, b) => a - b);
    const median = sorted.length ? sorted[Math.floor(sorted.length / 2)] : undefined;
    const highRisk = employeesList.filter((e: any) => (e.risque_depart || e.risk) === 'High').length;

    return {
      skill: 'comp-analysis',
      cardColor: 'from-emerald-900/40 to-teal-900/40',
      title: 'Compensation Analysis',
      systemPrompt: `You are NexaAI doing a compensation analysis.`,
      contextData: `REAL SIRH DATA — ${dept} department (N=${n} employees):\nSalary data: ${JSON.stringify(employeesList.slice(0, 20))}\nMedian salary: €${median?.toLocaleString()}\nHigh flight risk: ${highRisk}/${n} employees\nProduce a CP200-compliant comp analysis memo to Bruno Mineo CHRO.`,
      chips: ['CP200', dept, `N=${n}`, `Médiane €${median?.toLocaleString()}`],
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
      chips: ['Modifier salaire', 'Ajouter clause NDA', 'Version NL', 'Envoyer DocuSign'],
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
      chips: ['Générer checklist IT', 'Planifier 1:1s', 'Assigner buddy', 'Créer ticket ITSM'],
      engine: isDeep ? 'gemini' : 'ollama',
    };
  }

  if (cmd.startsWith('/people-report')) {
    const focus = cmd.includes('attrition') ? 'attrition' : 'overview';
    const promptFocus = focus === 'attrition'
      ? 'Focus on turnover: calculate 12m rolling attrition rate, identify 4 critical flight-risk cases, cost-to-replace analysis (1.5x annual salary benchmark).'
      : 'Show: headcount by dept/site, gender ratio, avg tenure, open positions, eNPS trend.';
    return {
      cardColor: '#8B5CF6',
      title: 'People Report — ' + (focus === 'attrition' ? 'Attrition Focus' : 'April 2026'),
      systemPrompt: `${NEXAFLOW_SYSTEM_CONTEXT}

=== TASK ===
Generate a CHRO people report for NexaFlow SA (500 employees, 4 EU sites). ${promptFocus}`,
      contextData: JSON.stringify({ totalEmployees: employees.length, byDept: groupBy(employees, 'department') }),
      chips: ['Top 4 flight risks', 'Analyse coût turnover', 'Benchmark secteur', 'Export PowerBI'],
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
      chips: ['Grille détaillée', 'Plan développement', 'Calibration comité', 'Historique revues'],
      engine: isDeep ? 'gemini' : 'ollama',
    };
  }

  if (cmd.startsWith('/policy-lookup')) {
    const country = cmd.replace('/policy-lookup', '').trim().toUpperCase() || 'BE';
    const frameworks: Record<string, string> = {
      BE: 'Belgian Labour Law: CP200, Eenheidsstatuut 2014, GDPR (DPA BE), télétravail structurel (CCT 149), bien-être au travail (loi 4/8/1996)',
      NL: 'Dutch Labour Law: CAO ICT, Wet Flexibel Werken, AVG (GDPR-NL), Wet Werk en Zekerheid, OR medezeggenschap',
      FR: 'Droit du travail FR: CCN Syntec, Code du travail, CNIL/RGPD, accord télétravail 2021, CSE obligations',
      LU: 'Droit luxembourgeois: Code du Travail LU, CNPD/RGPD, délégation du personnel obligatoire >15 ETP',
    };
    return {
      cardColor: '#EF4444',
      title: `Policy Lookup — ${country}`,
      systemPrompt: `${NEXAFLOW_SYSTEM_CONTEXT}

=== TASK ===
As NexaFlow CHRO, provide a structured HR policy brief for ${country}. Framework: ${frameworks[country] ?? frameworks['BE']}. Cover: hiring obligations, notice periods, remote work rules, data protection, collective rights.`,
      contextData: '',
      chips: ['Télécharger policy PDF', 'Comparer avec BE', 'Alerte changements légaux', 'Contact CLO'],
      engine: isDeep ? 'gemini' : 'ollama',
    };
  }

  // /cas-001, /cas-002, … → always Gemini (legal/disciplinary)
  if (cmd.startsWith('/cas-')) {
    const caseId = cmd.split(' ')[0].replace('/cas-', '').toUpperCase();
    return {
      cardColor: '#DC2626',
      title: `Case CAS-${caseId} — Deep Legal Analysis`,
      systemPrompt: `${NEXAFLOW_SYSTEM_CONTEXT}

=== TASK ===
You are acting as a senior employment law advisor. Provide a thorough analysis of case CAS-${caseId} at NexaFlow SA. Include: legal risk assessment, recommended actions, timeline, parties involved, applicable law by jurisdiction. Structure with Executive Summary, Legal Framework, Risk Matrix, Action Plan, and Required Approvals.`,
      contextData: input.replace(/\/cas-\S+/i, '').trim(),
      chips: ['Rapport juridique complet', 'Impliquer CLO', 'Créer timeline', 'Notifier CPBW'],
      engine: 'gemini',
    };
  }

  return null; // pas une slash-command → envoi direct à LLM (Ollama)
}

function groupBy<T>(arr: T[], key: keyof T) {
  return arr.reduce((acc, item) => {
    const k = String(item[key]);
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}
