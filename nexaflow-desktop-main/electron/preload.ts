import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electron', {
  // ── Requête SQL générique (debug / custom queries) ────────────────────────
  queryDB: (sql: string, params?: any[]) =>
    ipcRenderer.invoke('db:query', sql, params ?? []),

  // ── Compensation analysis — retourne toutes les colonnes nécessaires ──────
  // Champs retournés: id, nom, fonction, departement, salaire, genre,
  //                  eval_perf, risque_depart, contrat, anciennete
  getCompByDept: (dept: string) =>
    ipcRenderer.invoke('hr:comp-by-dept', dept),

  // ── People stats — headcount + flight risk + genre par département ────────
  // Retourne: { byDept, total, topFlightRisk }
  getPeopleStats: () =>
    ipcRenderer.invoke('hr:people-stats'),

  // ── Save Excalidraw diagram to output/diagrams/ ───────────────────────────
  saveDiagram: (json: string, filename: string) =>
    ipcRenderer.invoke('hr:save-diagram', json, filename),

  // ── Headcount par site ────────────────────────────────────────────────────
  getHeadcount: () =>
    ipcRenderer.invoke('db:query',
      `SELECT lieu, COUNT(*) as count FROM employes GROUP BY lieu ORDER BY count DESC`
    ),

  // ── Flight risk (optionnel: filtré par département) ───────────────────────
  getTurnoverRisk: (dept?: string) =>
    ipcRenderer.invoke('db:query',
      dept
        ? `SELECT nom, fonction, departement, salaire, risque_depart
           FROM employes
           WHERE LOWER(departement) = LOWER(?) AND risque_depart IN ('High','Medium')
           ORDER BY risque_depart, salaire DESC`
        : `SELECT departement, risque_depart, COUNT(*) as count
           FROM employes
           GROUP BY departement, risque_depart
           ORDER BY departement`,
      dept ? [dept] : []
    ),
});
