// Sanitized demo inbox for Sophie (no external vendor names)
export type Email = {
  id: string;
  from: string;
  to: string[];
  subject: string;
  date: string; // ISO
  snippet: string;
  body: string;
  labels?: string[];
  unread?: boolean;
};

export const emails: Email[] = [
  {
    id: 'MSG-001',
    from: 'noreply@ats.example',
    to: ['sophie.lefevre@nexaflow.local'],
    subject: 'New candidate: Jean Dupont — Senior Engineer',
    date: '2026-04-18T08:12:00.000Z',
    snippet: "Jean Dupont a postulé au poste de Senior Engineer.",
    body: 'Bonjour Sophie,\n\nJean Dupont a postulé via l’ATS pour Senior Engineer. CV et lettre joints.\n\n— ATS',
    labels: ['recruiting','inbox'],
    unread: true,
  },
  {
    id: 'MSG-002',
    from: 'calendar@calendar.internal',
    to: ['sophie.lefevre@nexaflow.local'],
    subject: 'Réunion : Comité RH — 19 avril 2026 11:00',
    date: '2026-04-15T12:00:00.000Z',
    snippet: 'Agenda: revue des KPIs, embauches et cas ouverts.',
    body: 'Lien réunion interne: https://meet.internal/abcd\n\nOrdre du jour: 1) KPIs 2) Recrutement 3) CAS-008',
    labels: ['calendar'],
    unread: false,
  },
  {
    id: 'MSG-003',
    from: 'payroll@payroll.example',
    to: ['sophie.lefevre@nexaflow.local'],
    subject: 'Bulletin de paie – Avril 2026 disponible',
    date: '2026-04-16T09:30:00.000Z',
    snippet: 'Les bulletins d’avril sont disponibles.',
    body: 'Bonjour,\n\nLes bulletins de paie pour avril 2026 sont disponibles dans votre espace paie.\n\nCordialement.',
    labels: ['payroll'],
    unread: false,
  },
  {
    id: 'MSG-004',
    from: 'alerts@alerts.example',
    to: ['sophie.lefevre@nexaflow.local'],
    subject: 'Action requise — CAS-004 : Contrat manquant',
    date: '2026-04-17T07:45:00.000Z',
    snippet: 'Le dossier employé pour NXF-0023 est incomplet (contrat).',
    body: 'Merci de compléter le contrat manquant pour NXF-0023 afin de finaliser son dossier.',
    labels: ['alerts','cas'],
    unread: true,
  },
  {
    id: 'MSG-005',
    from: 'assistant@nexaflow.local',
    to: ['sophie.lefevre@nexaflow.local'],
    subject: 'Draft: réponse GDPR pour CAS-008',
    date: '2026-04-18T14:20:00.000Z',
    snippet: 'Proposition de réponse conforme RGPD (pré-remplie).',
    body: 'Voici un brouillon de réponse pour CAS-008. Relire et valider avant envoi.',
    labels: ['nexaai','gdpr'],
    unread: false,
  },
];
