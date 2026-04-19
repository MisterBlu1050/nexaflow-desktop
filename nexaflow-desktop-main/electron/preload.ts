import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electron', {
  queryDB: (sql: string, params?: any[]) =>
    ipcRenderer.invoke('db:query', sql, params ?? []),

  // helpers typés pour les handlers RH
  getCompByDept: (dept: string) =>
    ipcRenderer.invoke('db:query',
      `SELECT nom, fonction, salaire, eval_perf, risque_depart
       FROM employes WHERE departement = ? ORDER BY salaire DESC`,
      [dept]
    ),

  getHeadcount: () =>
    ipcRenderer.invoke('db:query',
      `SELECT lieu, COUNT(*) as count FROM employes GROUP BY lieu`
    ),

  getTurnoverRisk: (dept?: string) =>
    ipcRenderer.invoke('db:query',
      dept
        ? `SELECT nom, fonction, risque_depart FROM employes
           WHERE departement = ? AND risque_depart IN ('High','Medium')
           ORDER BY risque_depart`
        : `SELECT departement, risque_depart, COUNT(*) as count
           FROM employes GROUP BY departement, risque_depart`,
      dept ? [dept] : []
    ),
});
