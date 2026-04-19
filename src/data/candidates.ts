// Pipeline candidats (Workable style)
export type Candidate = {
  id: string;
  name: string;
  email?: string;
  stage: 'applied' | 'phone' | 'onsite' | 'offer' | 'hired' | 'rejected';
  appliedAt: string;
  role: string;
  notes?: string[];
};

export const candidates: Candidate[] = [
  { id: 'CAND-001', name: 'Jean Dupont', email: 'jean.dupont@example.test', stage: 'phone', appliedAt: '2026-04-17T07:00:00.000Z', role: 'Senior Engineer', notes: ['CV reçu', 'phone scheduled'] },
  { id: 'CAND-002', name: 'Laura Petit', email: 'laura.petit@example.test', stage: 'applied', appliedAt: '2026-04-10T12:00:00.000Z', role: 'Product Manager', notes: [] },
  { id: 'CAND-003', name: 'Marc Leroy', email: 'marc.leroy@example.test', stage: 'onsite', appliedAt: '2026-03-30T09:00:00.000Z', role: 'Designer', notes: ['Portfolio excellent'] },
];
