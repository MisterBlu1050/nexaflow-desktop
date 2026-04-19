export type RoutedCommand = {
  cardColor: string;
  title: string;
  systemPrompt: string;
  contextData?: string;
  chips: string[];
};

function getCountryFramework(country: string) {
  const frameworks: Record<string, string> = {
    BE: "Belgian Labour Law: CP200, Eenheidsstatuut, GDPR, telework rules, works council and wellbeing obligations.",
    NL: "Dutch Labour Law: CAO/arbeidsrecht, AVG, Wet flexibel werken, ondernemingsraad and sickness obligations.",
    FR: "French Labour Law: Code du travail, CNIL/GDPR, CSE obligations, telework and dismissal framework.",
    LU: "Luxembourg Labour Law: Code du Travail, GDPR/CNPD, staff delegation rules, leave and notice obligations.",
  };

  return frameworks[country] ?? frameworks.BE;
}

export function routeCommand(input: string): RoutedCommand | null {
  const raw = input.trim();
  const normalized = raw.toLowerCase();

  if (normalized.startsWith('/comp-analysis')) {
    const department = raw.split(/\s+/).slice(1).join(' ').trim();
    return {
      cardColor: '#F59E0B',
      title: department ? `Compensation Analysis — ${department}` : 'Compensation Analysis',
      systemPrompt:
        'You are NexaAI, CHRO assistant for NexaFlow SA. Produce a Belgian compensation analysis. Return a practical HR answer with a salary table, 3 follow-up insights, legal footer mentioning CP 200 and GDPR, and concise action points. If a department is specified, focus the analysis on that department only.',
      contextData: department ? `Department filter: ${department}` : 'Scope: all departments',
      chips: ['Benchmark marché', 'Filtrer par site', 'Export Excel'],
    };
  }

  if (normalized.startsWith('/draft-offer')) {
    const candidate = raw.split(/\s+/).slice(1).join(' ').trim() || 'Candidate';
    return {
      cardColor: '#3B82F6',
      title: `Draft Offer — ${candidate}`,
      systemPrompt:
        'You are NexaAI, CHRO assistant for NexaFlow SA. Draft a complete Belgian CDI offer letter in French with salary, benefits, start date placeholder, legal clauses, CP 200 footer, GDPR note, and clear HR formatting.',
      contextData: `Candidate name: ${candidate}`,
      chips: ['Version NL', 'Ajouter NDA', 'Préparer PDF'],
    };
  }

  if (normalized.startsWith('/onboarding')) {
    const person = raw.split(/\s+/).slice(1).join(' ').trim() || 'New hire';
    return {
      cardColor: '#10B981',
      title: `Onboarding — ${person}`,
      systemPrompt:
        'You are NexaAI, CHRO assistant for NexaFlow SA. Build a structured onboarding plan with checklist and 30/60/90 day plan. Keep it operational, manager-friendly, and HR-compliant.',
      contextData: `Employee: ${person}`,
      chips: ['Checklist IT', 'Plan manager', 'Buddy setup', 'Créer PDF'],
    };
  }

  if (normalized.startsWith('/people-report')) {
    const focus = raw.split(/\s+/).slice(1).join(' ').trim();
    return {
      cardColor: '#8B5CF6',
      title: focus ? `People Report — ${focus}` : 'People Report',
      systemPrompt:
        'You are NexaAI, CHRO assistant for NexaFlow SA. Produce a people report with headcount, KPIs, critical HR issues, and recommendations. If attrition is requested, include turnover KPI and 4 critical cases.',
      contextData: focus ? `Requested focus: ${focus}` : 'Requested focus: general headcount and KPI view',
      chips: ['Voir turnover', 'Cas critiques', 'Export Excel', 'Synthèse comité'],
    };
  }

  if (normalized.startsWith('/performance-review')) {
    const employee = raw.split(/\s+/).slice(1).join(' ').trim() || 'Employee';
    return {
      cardColor: '#EAB308',
      title: `Performance Review — ${employee}`,
      systemPrompt:
        'You are NexaAI, CHRO assistant for NexaFlow SA. Create a structured performance review using levels I-IV, strengths, risks, development actions, and manager guidance.',
      contextData: `Employee: ${employee}`,
      chips: ['Plan développement', 'Calibration', 'Version manager'],
    };
  }

  if (normalized.startsWith('/policy-lookup')) {
    const country = (raw.split(/\s+/)[1] || 'BE').toUpperCase();
    return {
      cardColor: '#EF4444',
      title: `Policy Lookup — ${country}`,
      systemPrompt:
        `You are NexaAI, CHRO assistant for NexaFlow SA. Provide a structured policy brief for ${country}. Cover hiring, contracts, notice, remote work, data protection, and employee representation. Include a short legal footer and practical HR policy notes. Applicable framework: ${getCountryFramework(country)}`,
      contextData: `Country: ${country}`,
      chips: ['Comparer BE/NL', 'Télécharger policy', 'Alerte légale'],
    };
  }

  return null;
}
