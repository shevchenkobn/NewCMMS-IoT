"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const I2C = require("i2c");
const pn532_1 = require("pn532");
const config = require("config");
let rfid = null;
let emitter;
let wire = null;
async function setEventEmitter(eventEmitter) {
    if (!eventEmitter) {
        throw new TypeError('eventEmitter is not defined');
    }
    emitter = eventEmitter;
}
exports.setEventEmitter = setEventEmitter;
async function initialize(eventEmitter) {
    if (!eventEmitter) {
        throw new TypeError('eventEmitter is not defined. Cannot initialize.');
    }
    emitter = eventEmitter;
    if (rfid) {
        emitter.emit('warning', 'The module is already initialized. Initialization skipped.');
        return;
    }
    // FIXME: see additional parameters
    wire = new I2C(pn532_1.I2C_ADDRESS, {
        device: config.get('i2cDevicePath'),
        debug: process.env.NODE_ENV !== 'production',
    });
    rfid = new pn532_1.PN532(wire, {
        pollInterval: 500,
    });
}
exports.initialize = initialize;
async function dispose() {
    if (!rfid) {
        emitter.emit('warning', 'The module is not initialized.');
        return;
    }
    wire.close();
    rfid = null;
    wire = null;
    emitter = null;
}
exports.dispose = dispose;
function startListening() {
    if (!rfid) {
        throw new TypeError('The module is not iniitalized');
    }
    rfid.on('tag', (tag) => {
        console.log(tag);
    });
}
//# sourceMappingURL=index.js.map