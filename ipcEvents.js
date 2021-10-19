const ipcEvents = {
    serialConnected: 'connected',
    serialDisconnect: 'disconnect',
    CANMessage: 'data',
    debugMessage: 'debug',
    init: 'init',
    portList: 'ports',
    performInit: 'performInit',
    performSerialConnect: 'performConnect',
    performSerialDisconnect: 'performDisconnect',
    performStartCANListening: 'performStart',
    performStopCANListening: 'performStop',
    performPortList: 'performPortList'
};

module.exports.ipcEvents = ipcEvents;