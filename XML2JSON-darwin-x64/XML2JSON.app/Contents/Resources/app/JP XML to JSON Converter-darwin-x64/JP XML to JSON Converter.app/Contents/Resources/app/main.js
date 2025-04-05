// 🔄 Enable auto-reload during development
require('electron-reload')(__dirname, {
  electron: require(`${__dirname}/node_modules/electron`)
});

const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');
const remoteMain = require('@electron/remote/main');
remoteMain.initialize(); // ✅ Only call once here

function createWindow() {
  const win = new BrowserWindow({
    width: 900,
    height: 700,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  remoteMain.enable(win.webContents); // ✅ Safe to call per window
  win.loadFile(path.join(__dirname, 'index.html'));
  win.webContents.openDevTools();
}

// 🔲 Native Mac-style menu bar
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
          const { shell } = require('electron');
          await shell.openExternal('https://github.com');
        }
      }
    ]
  }
];
const menu = Menu.buildFromTemplate(template);
Menu.setApplicationMenu(menu);

// 🏁 Standard app lifecycle
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (!isMac) app.quit();
});