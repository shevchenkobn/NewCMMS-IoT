"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const nfc_1 = require("nfc");
// let nfcReader: Nullable<NFCReader> = null;
let n;
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
    // if (nfcReader) {
    if (n) {
        emitter.emit('warning', 'The module is already initialized. Initialization skipped.');
        return;
    }
    // nfcReader = new NFCReader();
    // nfcReader.open();
    n = new nfc_1.nfc.NFC();
    startListening();
}
exports.initialize = initialize;
async function dispose() {
    // if (!nfcReader) {
    if (!n) {
        emitter.emit('warning', 'The module is not initialized.');
        return;
    }
    // nfcReader._nfc.close();
    // nfcReader = null;
    n.stop();
    n = null;
}
exports.dispose = dispose;
function startListening() {
    // if (!nfcReader) {
    if (!n) {
        throw new TypeError('The module is not iniitalized');
    }
    // nfcReader.on('card', (card: any) => {
    //   emitter.emit('data', card);
    //   console.info(card);
    //   // console.info(results);
    //   nfcReader.release().then((...args: any[]) => {
    //     console.info(args);
    //     nfcReader.poll();
    //   });
    //   // nfcReader.transceive(Buffer.from([0])).then((...results: any[]) => {
    //   // });
    // });
    // nfcReader.poll();
    n.on('read', (tag) => {
        console.info(tag);
        emitter.emit('data', tag.data);
    }).on('error', (err) => {
        emitter.emit(err);
    }).start();
}
//# sourceMappingURL=index.js.map