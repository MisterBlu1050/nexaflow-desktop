import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.resourcesPath ?? '.', 'nexaflow.db');
const db = new Database(dbPath);

export function queryEmployes(sql: string, params: any[] = []) {
  return db.prepare(sql).all(...params);
}

export function getHeadcount() {
  return db.prepare(`
    SELECT lieu, COUNT(*) as count FROM employes GROUP BY lieu
  `).all();
}

export function getTurnoverRisk() {
  return db.prepare(`
    SELECT departement, risque_depart, COUNT(*) as count
    FROM employes GROUP BY departement, risque_depart
  `).all();
}

export function getCompByDept(dept: string) {
  return db.prepare(`
    SELECT nom, fonction, salaire, eval_perf, risque_depart
    FROM employes WHERE departement = ?
    ORDER BY salaire DESC
  `).all(dept);
}
