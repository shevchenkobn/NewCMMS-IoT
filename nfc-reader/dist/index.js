"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const libnfc_js_1 = require("libnfc-js");
let nfcReader = null;
let emitter;
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
    if (nfcReader) {
        emitter.emit('warning', 'The module is already initialized. Initialization skipped.');
        return;
    }
    nfcReader = new libnfc_js_1.NFCReader();
    nfcReader.open();
    startListening();
}
exports.initialize = initialize;
async function dispose() {
    if (!nfcReader) {
        emitter.emit('warning', 'The module is not initialized.');
        return;
    }
    nfcReader._nfc.close();
    nfcReader = null;
}
exports.dispose = dispose;
function startListening() {
    if (!nfcReader) {
        throw new TypeError('The module is not iniitalized');
    }
    nfcReader.on('card', (card) => {
        emitter.emit('data', card);
        console.info(card);
        nfcReader.transceive(Buffer.from([0])).then((...results) => {
            console.info(results);
            nfcReader.release().then((...args) => {
                console.info(args);
                nfcReader.poll();
            });
        });
    });
    nfcReader.poll();
}
//# sourceMappingURL=index.js.map