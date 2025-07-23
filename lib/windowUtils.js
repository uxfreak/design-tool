const { BrowserWindow } = require('electron');
const path = require('path');

function createWindowConfig() {
  const isDev = process.argv.includes('--dev');
  return {
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webSecurity: !isDev,
      preload: path.join(__dirname, '..', 'preload.js')
    },
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    show: false
  };
}

function createMainWindow() {
  const config = createWindowConfig();
  const window = new BrowserWindow(config);
  window.loadFile('index.html');
  window.once('ready-to-show', () => {
    window.show();
    if (process.argv.includes('--dev')) {
      window.webContents.openDevTools();
    }
  });
  if (process.argv.includes('--dev')) {
    const fs = require('fs');
    const filesToWatch = ['index.html', 'app.js'];
    filesToWatch.forEach(file => {
      fs.watchFile(file, { interval: 1000 }, () => {
        console.log(`🔄 File changed: ${file}, reloading...`);
        window.reload();
      });
    });
  }
  window.on('closed', () => {
    // mainWindow will be handled in main.js
  });
  return window;
}

module.exports = {
  createWindowConfig,
  createMainWindow
};
