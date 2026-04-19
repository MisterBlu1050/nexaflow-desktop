import { app, BrowserWindow, ipcMain } from 'electron';
import Database from 'better-sqlite3';
import path from 'path';

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
