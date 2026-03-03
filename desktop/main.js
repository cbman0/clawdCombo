const { app, BrowserWindow, shell, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const waitOn = require('wait-on');

const UI_URL = process.env.CLAWDCOMBO_UI_URL || 'http://127.0.0.1:4173';
let serverProc = null;
let mainWindow = null;

function startBackend() {
  const root = path.resolve(__dirname, '..');

  serverProc = spawn(process.execPath, [path.join(root, 'ui', 'server.js')], {
    cwd: root,
    env: process.env,
    stdio: 'pipe',
  });

  serverProc.stdout.on('data', (d) => {
    // keep logs for debugging desktop startup
    console.log(`[backend] ${d.toString().trim()}`);
  });

  serverProc.stderr.on('data', (d) => {
    console.error(`[backend:error] ${d.toString().trim()}`);
  });

  serverProc.on('exit', (code) => {
    console.log(`[backend] exited with code ${code}`);
    serverProc = null;
  });
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1360,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: 'clawdCombo Desktop',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  try {
    await waitOn({ resources: [UI_URL], timeout: 20000, interval: 250 });
    await mainWindow.loadURL(UI_URL);
  } catch (e) {
    const msg = `Failed to start local UI at ${UI_URL}.\n\n${e.message}`;
    dialog.showErrorBox('clawdCombo startup failed', msg);
  }
}

function stopBackend() {
  if (serverProc && !serverProc.killed) {
    serverProc.kill('SIGTERM');
  }
}

app.on('ready', async () => {
  startBackend();
  await createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', async () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    if (!serverProc) startBackend();
    await createWindow();
  }
});

app.on('before-quit', () => {
  stopBackend();
});
