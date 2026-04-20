import { app, BrowserWindow, ipcMain } from 'electron';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// DB singleton — ouvert une seule fois au démarrage
let db: Database.Database;

function initDB() {
  const dbPath = app.isPackaged
    ? path.join(process.resourcesPath, 'nexaflow.db')
    : path.join(__dirname, '../../nexaflow.db');  // dev: racine du repo

  db = new Database(dbPath, { readonly: false });
  db.pragma('journal_mode = WAL');  // performances
  console.log('✅ NexaFlow DB connectée:', dbPath);
}

// Handler IPC générique
ipcMain.handle('db:query', (_event, sql: string, params: any[] = []) => {
  try {
    return db.prepare(sql).all(...params);
  } catch (err: any) {
    console.error('DB error:', err.message);
    return { error: err.message };
  }
});

// Handler typé — Compensation analysis par département
ipcMain.handle('hr:comp-by-dept', (_event, dept: string) => {
  try {
    const rows = db.prepare(`
      SELECT id, nom, fonction, departement, salaire, genre,
             eval_perf, risque_depart, contrat, anciennete
      FROM employes
      WHERE LOWER(departement) = LOWER(?)
      ORDER BY salaire DESC
    `).all(dept);
    return rows;
  } catch (err: any) {
    console.error('hr:comp-by-dept error:', err.message);
    return { error: err.message };
  }
});

// Handler — Save Excalidraw diagram file to output/diagrams/
ipcMain.handle('hr:save-diagram', (_event, json: string, filename: string) => {
  try {
    const outDir = app.isPackaged
      ? path.join(process.resourcesPath, 'diagrams')
      : path.join(__dirname, '../../output/diagrams');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    const filePath = path.join(outDir, filename);
    fs.writeFileSync(filePath, json, 'utf-8');
    console.log('✅ Diagram saved:', filePath);
    return { ok: true, path: filePath };
  } catch (err: any) {
    console.error('hr:save-diagram error:', err.message);
    return { ok: false, error: err.message };
  }
});

// Handler — People stats (headcount + flight risk + gender par département)
ipcMain.handle('hr:people-stats', (_event) => {
  try {
    const byDept = db.prepare(`
      SELECT departement,
             COUNT(*) as total,
             SUM(CASE WHEN genre = 'F' THEN 1 ELSE 0 END) as female,
             SUM(CASE WHEN risque_depart = 'High' THEN 1 ELSE 0 END) as high_risk,
             SUM(CASE WHEN risque_depart = 'Medium' THEN 1 ELSE 0 END) as medium_risk,
             ROUND(AVG(salaire)) as avg_salary
      FROM employes
      GROUP BY departement
      ORDER BY total DESC
    `).all();

    const total = db.prepare('SELECT COUNT(*) as n FROM employes').get() as { n: number };

    const topFlightRisk = db.prepare(`
      SELECT nom, fonction, departement, salaire, risque_depart
      FROM employes
      WHERE risque_depart = 'High'
      ORDER BY salaire DESC
      LIMIT 10
    `).all();

    return { byDept, total: total.n, topFlightRisk };
  } catch (err: any) {
    console.error('hr:people-stats error:', err.message);
    return { error: err.message };
  }
});

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const devUrl = process.env.VITE_DEV_SERVER_URL as string | undefined;
  if (devUrl) {
    win.loadURL(devUrl);
  } else {
    win.loadFile(path.join(__dirname, '../index.html'));
  }
}

app.whenReady().then(() => {
  initDB();
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
