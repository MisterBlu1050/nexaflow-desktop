import { employees } from '@/data/employees';
import { payrollData } from '@/data/payroll';
import { NEXAFLOW_SYSTEM_CONTEXT } from '@/lib/nexaflow-context';

export type HandlerResult = {
  cardColor: string;
  title: string;
  systemPrompt: string;
  contextData: string;
  chips: string[];
};

export function routeCommand(input: string): HandlerResult | null {
  const cmd = input.trim().toLowerCase();

  if (cmd.startsWith('/comp-analysis')) {
    const dept = cmd.split(' ')[1] ?? 'all';
    const filtered = dept === 'all' ? employees : employees.filter(e => e.department.toLowerCase().includes(dept));
    return {
      cardColor: '#F59E0B',
      title: 'Compensation Analysis',
      systemPrompt: `${NEXAFLOW_SYSTEM_CONTEXT}

=== TASK ===
You are a CHRO at NexaFlow SA. Analyze compensation data for ${filtered.length} employees. Apply Belgian CP200 framework. Return a salary band table with P25/median/P75, flag outliers >20% above/below band, note any gender pay gap risk.`,
      contextData: JSON.stringify(filtered.map(e => ({ name: e.name, dept: e.department, salary: e.salary, grade: e.grade }))),
      chips: ['Afficher benchmarks secteur', 'Filtrer par site', 'Export Excel', 'Analyse genre'],
    };
  }

  if (cmd.startsWith('/draft-offer')) {
    const name = input.split(' ').slice(1).join(' ') || 'Candidat';
    return {
      cardColor: '#3B82F6',
      title: `Offer Letter — ${name}`,
      systemPrompt: `${NEXAFLOW_SYSTEM_CONTEXT}

=== TASK ===
You are a CHRO at NexaFlow SA. Draft a complete Belgian CDI offer letter for ${name}. Include: gross salary, CP200 classification, notice period (law Eenheidsstatuut), non-compete clause (max 12m, capped), meal vouchers €8/day, eco-vouchers, hospitalization insurance DKV. Format as formal letter.`,
      contextData: '',
      chips: ['Modifier salaire', 'Ajouter clause NDA', 'Version NL', 'Envoyer DocuSign'],
    };
  }

  if (cmd.startsWith('/onboarding')) {
    const name = input.split(' ').slice(1).join(' ') || 'New hire';
    return {
      cardColor: '#10B981',
      title: `Onboarding — ${name}`,
      systemPrompt: `${NEXAFLOW_SYSTEM_CONTEXT}

=== TASK ===
Create a detailed 30/60/90 day onboarding plan for ${name} joining NexaFlow SA IT dept. Day 1-7: admin setup, badge, tools, team intros. Week 2-4: buddy system, shadow sessions, first deliverable. Day 31-60: own project, 1:1 cadence. Day 61-90: KPI review, probation assessment.`,
      contextData: '',
      chips: ['Générer checklist IT', 'Planifier 1:1s', 'Assigner buddy', 'Créer ticket ITSM'],
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
    };
  }

  if (cmd.startsWith('/performance-review')) {
    const name = input.split(' ').slice(1).join(' ') || 'Collaborateur';
    return {
      cardColor: '#EAB308',
      title: `Performance Review — ${name}`,
      systemPrompt: `${NEXAFLOW_SYSTEM_CONTEXT}

=== TASK ===
Generate an AI-assisted performance review for ${name} at NexaFlow SA. Use 4-level grid (I=Below expectations, II=Meets, III=Exceeds, IV=Outstanding). Assess: delivery, collaboration, AI competency (Vlaamse Overheid framework), innovation. Include calibration recommendation and development plan.`,
      contextData: '',
      chips: ['Grille détaillée', 'Plan développement', 'Calibration comité', 'Historique revues'],
    };
  }

  if (cmd.startsWith('/policy-lookup')) {
    const country = cmd.split(' ')[1]?.toUpperCase() ?? 'BE';
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
    };
  }

  return null; // pas une slash-command → envoi direct à LLM
}

function groupBy<T>(arr: T[], key: keyof T) {
  return arr.reduce((acc, item) => {
    const k = String(item[key]);
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}
