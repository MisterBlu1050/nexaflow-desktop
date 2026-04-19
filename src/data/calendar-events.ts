// Agenda focalisé sur le 19 avril 2026
export type CalendarEvent = {
  id: string;
  title: string;
  start: string; // ISO
  end?: string; // ISO
  attendees?: string[];
  location?: string;
  description?: string;
};

export const calendarEvents: CalendarEvent[] = [
  {
    id: 'EVT-001',
    title: 'Standup équipe produit',
    start: '2026-04-19T09:00:00+02:00',
    end: '2026-04-19T09:15:00+02:00',
    attendees: ['CHRO Persona', 'Product Team'],
    location: 'Teams',
  },
  {
    id: 'EVT-002',
    title: 'Comité RH — revue KPIs',
    start: '2026-04-19T11:00:00+02:00',
    end: '2026-04-19T12:00:00+02:00',
    attendees: ['CHRO Persona', 'HR Team', 'CFO'],
    location: 'Salle 3B',
  },
  {
    id: 'EVT-003',
    title: 'Entretien — Jean Dupont (senior)',
    start: '2026-04-19T14:00:00+02:00',
    end: '2026-04-19T14:45:00+02:00',
    attendees: ['Jean Dupont', 'CHRO Persona', 'Hiring Manager'],
    location: 'Zoom',
  },
];
