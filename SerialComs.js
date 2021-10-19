const SerialPort = require('serialport');
const Readline = require('@serialport/parser-readline');
const { EventEmitter } = require('events');
const { CanMessageTransform, ChunkingTransform } = require('./transforms');

/**
 * Available commands to send to the arduino
 * @typedef {Object} Commands
 * @property {int} Identify - Causes the arduino to respond with an identifier string.
 * @property {int} Start - Causes the arduino to start listening to CAN messages.
 * @property {int} Stop - Causes the arduino to stop listening to CAN messages.
 */

/**
 * Available events emitted
 * @typedef {Object} Events
 * @property {string} Connected - Event emitted when the serial port is connected
 * @property {string} Data - Event emitted when CAN message recieved
 * @property {string} Close - Event emitted when serial port is closed
 * @property {string} Error - Event emitted when there is an error
 * @property {string} Debug - Event emitted when a debug message is recieved from the Arduino.
 */

/**
 * Callback after performing an action
 * @callback CompleteCallback
 * @param {Error | null} error - Error object if an error occured performing action
 */

class SerialComs extends EventEmitter {
    /**
     * @type {SerialPort}
     */
    #port;

    /**
     * @type {Commands}
     */
    static commands = {
        'Identify': 1,
        'Start': 2,
        'Stop': 3
    }

    /**
     * @type {Events}
     */
    static events = {
        'Close': 'close',
        'Connected': 'open',
        'Data': 'data',
        'Error': 'error',
        'Debug': 'debug'
    }

    /**
     * Get a list of serial ports.
     * 
     * @returns Primise<SerialPort.PortInfo[]>
     */
    static listPorts() {
        return SerialPort.list();
    }

    get isOpen() {
        return this.#port?.isOpen || false;
    }

    get path() {
        return this.#port?.path
    }

    /**
     * connect to the arduino using the path provided.
     * 
     * @param {string} path - Path for the serial port the arduino is connected to
     * @param {CompleteCallback} cb - Callback called after atempting to connect
     */
    connectToArduino(path, cb) {
        this.#port = new SerialPort(path, (e) => {
            if (!e)
                this.emit(SerialComs.events.Connected);

            if (cb)
                cb(e);
        });

        this.#port.on('error', (...args) => this.emit(SerialComs.events.Error, ...args));
        this.#port.on('close', (...args) => this.emit(SerialComs.events.Close, ...args));
        this.#port.on('open', (...args) => this.emit(SerialComs.events.Connected, ...args));

        const lineStream = this.#port
            .pipe(new Readline());

        lineStream.on('data', (data) => {
            if (data.startsWith('[DBG]'))
                this.emit(SerialComs.events.Debug, data);
        });

        lineStream
            .pipe(new CanMessageTransform())
            .pipe(new ChunkingTransform())
            .on('data', (data) => this.emit(SerialComs.events.Data, data));

    }

    /**
     * Closes the connection to the arduino
     * @param {CompleteCallback} cb - Callback called after closing the connection
     */
    disconnect(cb) {
        this.#port.close(cb);
    }

    /**
     * Instruct the Arduino to perform a command
     * @param {Commands} command 
     */
    sendCommand(command) {
        if (this.#port.isOpen) {
            this.#port.write(command.toString());
        }
    }
}

module.exports.SerialComs = SerialComs;
