const { app, BrowserWindow, Menu, ipcMain } = require('electron')
const path = require('path')
require('electron-reload')(__dirname);

let mainWindow, workerWindow

function createWindow() {
  Menu.setApplicationMenu(null)
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    webPreferences: { nodeIntegration: true }
  })
  mainWindow.loadFile('ui.html')
  mainWindow.webContents.openDevTools()

  workerWindow = new BrowserWindow({
    show: false,
    webPreferences: { nodeIntegration: true }
  });
  workerWindow.loadFile('worker.html');
  // workerWindow.webContents.openDevTools()
  
  mainWindow.on('closed', function () {
    mainWindow = null;
    if(workerWindow != null)
      workerWindow.close();
  })

  workerWindow.on('closed', () => {
    workerWindow = null;
  })
}

app.on('ready', function() {
  ipcMain.on('log', (evt, arg) => {
    mainWindow.webContents.send('log', arg);
  })
  ipcMain.on('input', (evt, arg) => {
    workerWindow.webContents.send('input', arg);
  })
  ipcMain.on('input_res', (evt, arg) => {
    mainWindow.webContents.send('input_res', arg);
  })
  ipcMain.on('start', (evt, arg) => {
    workerWindow.webContents.send('start', arg);
  })
  ipcMain.on('finished', (evt, arg) => {
    mainWindow.webContents.send('finished', arg);
  })
  ipcMain.on('test_num', (evt, arg) => {
    workerWindow.webContents.send('test_num', arg);
  })
  ipcMain.on('test_num_res', (evt, arg) => {
    mainWindow.webContents.send('test_num_res', arg);
  })
  
  createWindow();
})

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', function () {
  if (mainWindow === null) createWindow()
})