// Centre de notifications — 5 alertes
export type Notification = {
  id: string;
  title: string;
  message: string;
  date: string;
  level: 'info' | 'warning' | 'critical';
};

export const notifications: Notification[] = [
  { id: 'N-001', title: 'Nouvelle demande de congé', message: 'EMP-023 a demandé 5 jours (mai).', date: '2026-04-18T08:00:00.000Z', level: 'info' },
  { id: 'N-002', title: 'CAS-004 : Contrat manquant', message: 'Contrat manquant pour EMP-023.', date: '2026-04-17T11:30:00.000Z', level: 'warning' },
  { id: 'N-003', title: 'Payslip ready', message: 'Bulletins de paie avril publiés (Payroll Provider).', date: '2026-04-16T09:30:00.000Z', level: 'info' },
  { id: 'N-004', title: 'GDPR request', message: 'CAS-008 demande action immédiate.', date: '2026-04-18T14:00:00.000Z', level: 'critical' },
  { id: 'N-005', title: 'Interview scheduled', message: 'Entretien Jean Dupont programmé 19/04 14:00.', date: '2026-04-17T10:00:00.000Z', level: 'info' },
];
