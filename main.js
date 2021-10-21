const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const { SerialComs } = require('./SerialComs');
const { ipcEvents } = require('./ipcEvents');
const { autoUpdater } = require('electron-updater');

const coms = new SerialComs();

coms.on(SerialComs.events.Connected, () => sendToWindow(ipcEvents.serialConnected));
coms.on(SerialComs.events.Data, (data) => sendToWindow(ipcEvents.CANMessage, data));
coms.on(SerialComs.events.Close, onSerialDisconnect);
coms.on(SerialComs.events.Error, (e) => sendToWindow(ipcEvents.debugMessage, `[DBG] ${e}`));
coms.on(SerialComs.events.Debug, (e) => sendToWindow(ipcEvents.debugMessage, e));

function createWindow () {
    const mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js')
        }
    });

    mainWindow.loadFile('index.html');

    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        shell.openExternal(url);
        return { action: 'deny' };
    });
    
    autoUpdater.checkForUpdatesAndNotify();
}

/**
 * Send an event to the focused window
 * @param {string} e - Event key to emit 
 * @param {object} d - Event data to send 
 */
function sendToWindow(e, d) {
    const window = BrowserWindow.getFocusedWindow();

    if (window && window.webContents)
        window.webContents.send(e, d);
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0)
        createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') 
    app.quit();
});

autoUpdater.on('update-available', () => {
    sendToWindow(ipcEvents.updateAvailable);
});

autoUpdater.on('update-downloaded', () => {
    sendToWindow(ipcEvents.updateDownloaded);
});

ipcMain.on(ipcEvents.performUpdate, () => {
    autoUpdater.quitAndInstall();
});

ipcMain.on(ipcEvents.performPortList, async () => {
    try {
        const ports = await SerialComs.listPorts();

        sendToWindow(ipcEvents.portList, ports);
    } catch (e) {
        sendToWindow(ipcEvents.debugMessage, `[DBG] Error getting ports, ${e}`)
    }
});

ipcMain.on(ipcEvents.performSerialConnect, (e, path) => {
    if (!coms.isOpen) {
        coms.connectToArduino(path);
    } else {
        sendToWindow(ipcEvents.serialConnected);
    }
});

ipcMain.on(ipcEvents.performSerialDisconnect, (e) => {
    if (coms.isOpen) {
        coms.disconnect();
    } else {
        onSerialDisconnect();
    }
});

ipcMain.on(ipcEvents.performStartCANListening, () => {
    if (coms.isOpen)
        coms.sendCommand(SerialComs.commands.Start);
});

ipcMain.on(ipcEvents.performStopCANListening, () => {
    if (coms.isOpen)
        coms.sendCommand(SerialComs.commands.Stop);
});

ipcMain.on(ipcEvents.performInit, () => {
    sendToWindow(ipcEvents.init, {
        connected: coms.isOpen,
        path: coms.path,
        version: app.getVersion()
    });
});

function onSerialDisconnect(e) {
    sendToWindow(ipcEvents.debugMessage, `[DBG] Port - ${coms.path} closed with error: ${e}`);
    sendToWindow(ipcEvents.serialDisconnect, coms.path);
}