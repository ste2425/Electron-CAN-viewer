const ipcEvents = {
    serialConnected: 'connected',
    serialDisconnect: 'disconnect',
    CANMessage: 'data',
    debugMessage: 'debug',
    init: 'init',
    portList: 'ports',
    updateAvailable: 'updateAvailable',
    updateDownloaded: 'updateDownloaded',
    performInit: 'performInit',
    performSerialConnect: 'performConnect',
    performSerialDisconnect: 'performDisconnect',
    performStartCANListening: 'performStart',
    performStopCANListening: 'performStop',
    performPortList: 'performPortList',
    performUpdate: 'performUpdate'
};

module.exports.ipcEvents = ipcEvents;