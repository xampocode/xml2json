const { app, BrowserWindow, Menu, shell } = require('electron');
const path = require('path');
const remoteMain = require('@electron/remote/main');
const { autoUpdater } = require('electron-updater');
const log = require('electron-log');

// ✅ Enable auto-reload only during development
if (process.env.NODE_ENV !== 'production') {
  try {
    require('electron-reload')(__dirname, {
      electron: require(`${__dirname}/node_modules/electron`)
    });
  } catch (err) {
    console.warn('🔄 electron-reload not installed. Skipping live reload.');
  }
}

// 📜 Setup logging for autoUpdater
log.transports.file.level = 'info';
autoUpdater.logger = log;

// 🪟 Window
function createWindow() {
  const win = new BrowserWindow({
    width: 700,
    height: 700,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  remoteMain.enable(win.webContents);
  win.loadFile(path.join(__dirname, 'index.html'));

  // DevTools for debugging
  win.webContents.openDevTools();
}

// 🍎 Mac-style menu
const isMac = process.platform === 'darwin';
const template = [
  ...(isMac ? [{
    label: app.name,
    submenu: [
      { role: 'about' },
      { type: 'separator' },
      { role: 'quit' }
    ]
  }] : []),
  {
    label: 'File',
    submenu: [
      { role: 'reload' },
      { role: 'close' }
    ]
  },
  {
    label: 'Help',
    submenu: [
      {
        label: 'Visit GitHub',
        click: async () => {
          await shell.openExternal('https://github.com');
        }
      },
      {
        label: 'Check for Updates',
        click: () => {
          autoUpdater.checkForUpdatesAndNotify();
        }
      }
    ]
  }
];
const menu = Menu.buildFromTemplate(template);
Menu.setApplicationMenu(menu);

// 🚀 App lifecycle
remoteMain.initialize();

app.whenReady().then(() => {
  createWindow();
  autoUpdater.checkForUpdatesAndNotify();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (!isMac) app.quit();
});