// Liste de cas internes (CAS-001 → CAS-008)
export type CaseItem = {
  id: string;
  title: string;
  status: 'open' | 'in-progress' | 'closed';
  createdAt: string;
  assignedTo?: string;
  priority: 'low' | 'medium' | 'high';
  tags?: string[];
  description?: string;
  relatedEmployeeId?: string;
};

export const cases: CaseItem[] = [
  { id: 'CAS-001', title: 'Demande congé non conforme', status: 'closed', createdAt: '2026-03-02T10:00:00.000Z', assignedTo: 'EMP-0005', priority: 'low', tags: ['congé'], description: 'Congé validé par manager.' },
  { id: 'CAS-002', title: 'Problème paie – erreur bulletin', status: 'in-progress', createdAt: '2026-03-22T09:15:00.000Z', assignedTo: 'EMP-0010', priority: 'medium', tags: ['payroll'], description: 'Erreur sur composante variable.' },
  { id: 'CAS-003', title: 'Accès SIRH refusé', status: 'open', createdAt: '2026-04-01T08:30:00.000Z', assignedTo: 'EMP-0012', priority: 'medium', tags: ['it','access'], description: 'Employee cannot access SIRH portal.' },
  { id: 'CAS-004', title: 'Contrat manquant – EMP-023', status: 'open', createdAt: '2026-04-05T11:00:00.000Z', assignedTo: 'EMP-0001', priority: 'high', tags: ['contracts'], description: 'Le contrat n’a pas été téléversé.' },
  { id: 'CAS-005', title: 'Demande formation', status: 'closed', createdAt: '2026-02-12T14:00:00.000Z', assignedTo: 'EMP-0008', priority: 'low', tags: ['training'], description: 'Formation validée.' },
  { id: 'CAS-006', title: 'Probleme timesheet', status: 'in-progress', createdAt: '2026-03-28T10:30:00.000Z', assignedTo: 'EMP-0015', priority: 'medium', tags: ['timesheet'], description: 'Rapprochement heures en cours.' },
  { id: 'CAS-007', title: 'Onboarding matériel', status: 'closed', createdAt: '2026-03-05T09:00:00.000Z', assignedTo: 'EMP-0017', priority: 'low', tags: ['onboarding'], description: 'Matériel livré.' },
  { id: 'CAS-008', title: 'Demande RGPD — suppression données', status: 'in-progress', createdAt: '2026-04-10T09:00:00.000Z', assignedTo: 'EMP-0001', priority: 'high', tags: ['gdpr','legal'], description: 'Demande d’accès/suppression personnelles.' },
];
