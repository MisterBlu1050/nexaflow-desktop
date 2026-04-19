// src/lib/nexaai/commands.ts
// Six HR-focused NexaAI slash-command handlers
export const randTypingDelay = () => Math.floor(Math.random() * (1400 - 800 + 1)) + 800;
export const isoNow = () => new Date().toISOString();
const makeFooter = (legalRef) => ({ validation: 'auto-validated', legalRef, generatedIn: isoNow() });
// /comp-analysis
export const compAnalysis = (_args) => {
    const text = [`Compensation benchmark summary (high level):`,
        '',
        '| Department | Median | Company Avg | Market Median |',
        '|---|---:|---:|---:|',
        '| Engineering | €68,000 | €71,000 | €70,500 |',
        '| Sales | €54,000 | €49,500 | €58,000 |',
        '| HR | €52,500 | €50,000 | €51,000 |',
        '',
        '**Alerts:**',
        '• Sales median is 9% below market — retention risk',
        '• Compression at senior engineering grades',
        '• Gender pay gap >10% in Sales',
        '',
        '**Recommendations:**',
        '1. Targeted top-ups for Sales L3',
        '2. Update salary bands against benchmark',
        '3. Schedule pay equity audit (HR + Legal)',
    ].join('\n');
    return {
        command: '/comp-analysis',
        text,
        followUpChips: ['/people-report', '/policy-lookup BE', '/draft-offer'],
        attachments: [{ label: 'Export benchmark CSV' }, { label: 'Download summary PDF' }],
        footer: makeFooter('CP 200 Art.12 · Equal Pay Act 22/04/2012'),
        typingDelay: randTypingDelay(),
        cardColor: '#F59E0B',
        data: {
            table: [
                { department: 'Engineering', median: 68000, companyAvg: 71000, marketMedian: 70500 },
                { department: 'Sales', median: 54000, companyAvg: 49500, marketMedian: 58000 },
                { department: 'HR', median: 52500, companyAvg: 50000, marketMedian: 51000 },
            ],
        },
    };
};
// /draft-offer
export const draftOffer = (args) => {
    if (!args || !args.trim()) {
        return {
            command: '/draft-offer',
            text: 'Please provide candidate details (Name; Role; Start Date; Salary). Example: "Jane Doe; Senior Engineer; 2026-06-01; €68,000"',
            followUpChips: ['/draft-offer Jane Doe; Senior Engineer; 2026-06-01; €68,000', '/comp-analysis', '/policy-lookup BE'],
            attachments: [{ label: 'Offer letter checklist' }],
            footer: makeFooter('CP 200 Art. 6, 67, 104'),
            typingDelay: randTypingDelay(),
            cardColor: '#3B82F6',
        };
    }
    const parts = args.split(';').map(p => p.trim());
    const [name = 'New Hire', role = 'Role', start = 'TBD', salary = 'TBD'] = parts;
    const letter = [
        `Date: ${new Date().toLocaleDateString()}`,
        '',
        `Dear ${name},`,
        '',
        `We are pleased to offer you the position of ${role} at NexaFlow on a permanent (CDI) basis. Your start date will be ${start} and the proposed gross annual salary is ${salary}.`,
        '',
        'This offer is subject to standard pre-employment checks and the terms described below.',
        '',
        '— Role & responsibilities: ...',
        '— Working time: full-time (38h per week)',
        '— Benefits: pension, health insurance, mobility allowance (as per company policy)',
        '',
        'Please confirm acceptance by signing and returning this letter.',
        '',
        'Sincerely,',
        'NexaFlow HR',
    ].join('\n');
    return {
        command: '/draft-offer',
        text: letter,
        followUpChips: ['/draft-offer (download)', '/people-report', '/onboarding'],
        attachments: [{ label: 'Download Offer (DOCX)' }],
        footer: makeFooter('CP 200 Art. 6, 67, 104'),
        typingDelay: randTypingDelay(),
        cardColor: '#3B82F6',
        data: { candidate: { name, role, start, salary } },
    };
};
// /onboarding
export const onboarding = (_args) => {
    const preArrival = [
        '• Complete new-hire form',
        '• Send IT access request',
        '• Prepare workstation and badge',
        '• Share onboarding schedule',
    ];
    const dayOne = [
        { time: '09:00', activity: 'Welcome & HR admin' },
        { time: '10:00', activity: 'Team intro' },
        { time: '11:00', activity: 'Workspace setup (IT)' },
        { time: '13:00', activity: 'Lunch with manager' },
        { time: '14:30', activity: 'Product overview' },
    ];
    const objectives = {
        '30': ['Complete onboarding modules', 'First contribution to backlog'],
        '60': ['Own a small feature', 'Build relationships across teams'],
        '90': ['Deliver measurable outcome', 'Development plan review'],
    };
    const text = ['Pre-arrival checklist:', '', ...preArrival, '', 'Day 1 schedule:', '', '| Time | Activity |', '|---|---|', ...dayOne.map(r => `| ${r.time} | ${r.activity} |`), '', '30/60/90 Objectives:', '', `- 30 days: ${objectives['30'].join('; ')}`, `- 60 days: ${objectives['60'].join('; ')}`, `- 90 days: ${objectives['90'].join('; ')}`].join('\n');
    return {
        command: '/onboarding',
        text,
        followUpChips: ['/performance-review', '/people-report', '/draft-offer'],
        attachments: [{ label: 'Onboarding Checklist' }],
        footer: makeFooter('Wellbeing Act 04/08/1996'),
        typingDelay: randTypingDelay(),
        cardColor: '#10B981',
        data: { preArrival, dayOne, objectives },
    };
};
// /people-report
export const peopleReport = (_args, ctx) => {
    // If context provides employees, aggregate counts; otherwise provide sample summary
    const employees = Array.isArray(ctx?.employees) ? ctx.employees : [];
    const byDept = employees.length ? employees.reduce((acc, e) => { acc[e.department] = (acc[e.department] || 0) + 1; return acc; }, {}) : { Engineering: 120, Sales: 95, HR: 15, Product: 40 };
    const sites = employees.length ? employees.reduce((acc, e) => { acc[e.site] = (acc[e.site] || 0) + 1; return acc; }, {}) : { Brussels: 180, Amsterdam: 60, Berlin: 30 };
    const attrition = employees.length ? ((employees.filter((e) => e.status === 'left').length / employees.length) * 100).toFixed(1) + '%' : '8.2%';
    const diversity = employees.length ? { female: `${(employees.filter((e) => e.gender === 'F').length)} (${Math.round((employees.filter((e) => e.gender === 'F').length / employees.length) * 100)}%)` } : { female: '42 (34%)', underrepresented: '12%' };
    // include up to 4 active critical cases (CAS-001..CAS-008)
    const cases = ctx?.cases?.slice?.(0, 4) || ['CAS-001', 'CAS-002', 'CAS-003', 'CAS-004'];
    const text = [`People report — headcount by department:`, '', ...Object.entries(byDept).map(([k, v]) => `• ${k}: ${v}`), '', 'Sites breakdown:', '', ...Object.entries(sites).map(([k, v]) => `• ${k}: ${v}`), '', `Attrition (12mo): ${attrition}`, '', `Diversity snapshot: ${JSON.stringify(diversity)}`, '', `Active critical cases: ${cases.join(', ')}`].join('\n');
    return {
        command: '/people-report',
        text,
        followUpChips: ['/comp-analysis', '/onboarding', '/performance-review'],
        attachments: [{ label: 'Download headcount CSV' }],
        footer: makeFooter('GDPR Art.5'),
        typingDelay: randTypingDelay(),
        cardColor: '#8B5CF6',
        data: { byDept, sites, attrition, diversity, criticalCases: cases },
    };
};
// /performance-review
export const performanceReview = (_args) => {
    const selfAssessment = [
        '1. Achievements this period',
        '2. Challenges faced',
        '3. Development goals',
        '4. Feedback for manager',
    ];
    const managerGrid = [
        { competency: 'Communication', ratingScale: '1-5' },
        { competency: 'Execution', ratingScale: '1-5' },
        { competency: 'Collaboration', ratingScale: '1-5' },
        { competency: 'Leadership', ratingScale: '1-5' },
        { competency: 'Critical AI use (I→IV)', ratingScale: 'I,II,III,IV' },
    ];
    const text = ['Performance review templates:', '', 'Self-assessment:', '', ...selfAssessment, '', 'Manager evaluation grid (5 competencies):', '', ...managerGrid.map(m => `• ${m.competency} — ${m.ratingScale}`)].join('\n');
    return {
        command: '/performance-review',
        text,
        followUpChips: ['/people-report', '/onboarding', '/draft-offer'],
        attachments: [{ label: 'Download self-assessment' }, { label: 'Download manager grid' }],
        footer: makeFooter('Competentiewoordenboek VLO + AI Addendum v3.2'),
        typingDelay: randTypingDelay(),
        cardColor: '#EAB308',
        data: { selfAssessment, managerGrid },
    };
};
// /policy-lookup
export const policyLookup = (args) => {
    const input = (args || '').trim().toUpperCase();
    let jurisdiction = 'International';
    if (/\bBE\b/.test(input))
        jurisdiction = 'Belgium (BE)';
    else if (/\bNL\b/.test(input))
        jurisdiction = 'Netherlands (NL)';
    else if (/\bDE\b/.test(input))
        jurisdiction = 'Germany (DE)';
    else if (/\bPT\b/.test(input))
        jurisdiction = 'Portugal (PT)';
    const frameworks = {
        'Belgium (BE)': 'Belgian Labour Code — key provisions: CP 200; Equal Pay Act; Working Time rules.',
        'Netherlands (NL)': 'Dutch employment law summary — employee protections, dismissal rules, and works council practice.',
        'Germany (DE)': 'German labour framework — BGB/Tarifrecht basics and co-determination rules.',
        'Portugal (PT)': 'Portuguese Labour Code — contracts, termination, and collective agreements.',
        'International': 'Specify jurisdiction (BE/NL/DE/PT) for a targeted legal summary.',
    };
    const text = [`Jurisdiction detected: ${jurisdiction}`, '', frameworks[jurisdiction] || frameworks['International'], '', 'NexaFlow internal policy summary: HR procedures, internal escalation, and document links.'].join('\n');
    return {
        command: '/policy-lookup',
        text,
        followUpChips: ['/comp-analysis', '/people-report', '/draft-offer'],
        attachments: [{ label: 'Download policy summary' }],
        footer: makeFooter(`Legal framework: ${jurisdiction}`),
        typingDelay: randTypingDelay(),
        cardColor: '#EF4444',
        data: { jurisdiction },
    };
};
export const commandMap = {
    '/comp-analysis': compAnalysis,
    '/draft-offer': draftOffer,
    '/onboarding': onboarding,
    '/people-report': peopleReport,
    '/performance-review': performanceReview,
    '/policy-lookup': policyLookup,
};
export const findCommand = (cmd) => commandMap[cmd] || null;
export const handleSlashCommand = (cmd, args, ctx) => {
    const handler = findCommand(cmd);
    if (!handler) {
        return {
            command: cmd,
            text: `Unknown command: ${cmd}`,
            followUpChips: ['/help', '/people-report', '/policy-lookup'],
            attachments: [],
            footer: makeFooter(),
            typingDelay: randTypingDelay(),
            cardColor: '#9CA3AF',
        };
    }
    return handler(args, ctx);
};
