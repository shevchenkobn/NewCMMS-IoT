"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const nfc_1 = require("nfc");
// let nfcReader: Nullable<NFCReader> = null;
let n;
// let device: Nullable<any>;
// let listener: Nullable<Promise<any>>;
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
        // if (device) {
        emitter.emit('warning', 'The module is already initialized. Initialization skipped.');
        return;
    }
    // nfcReader = new NFCReader();
    // nfcReader.open();
    n = new nfc_1.nfc.NFC();
    // device = (await new Freefare().listDevices())[0];
    // console.info('Found a device:', device);
    // await device.open();
    // console.info('opened it');
    startListening();
}
exports.initialize = initialize;
async function dispose() {
    // if (!nfcReader) {
    if (!n) {
        // if (!device) {
        emitter.emit('warning', 'The module is not initialized.');
        return;
    }
    // nfcReader._nfc.close();
    // nfcReader = null;
    n.stop();
    n = null;
    // device.close();
    // // clearInterval(interval);
    // device = null;
    // if (listener) {
    //   listener.catch(err => {});
    // }
    // listener = null;
}
exports.dispose = dispose;
function startListening() {
    // if (!nfcReader) {
    if (!n) {
        // if (!device) {
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
    // listener = null;
    // const listen = async () => {
    //   try {
    //     console.info('Getting tags');
    //     const tags = await device.listTags();
    //     console.info('Tags: ', tags);
    //     for (const tag of tags) {
    //       if (tag.read) {
    //         console.info('Readable', tag);
    //         console.info('Opening tag', tag);
    //         await tag.open();
    //         const buffers = [];
    //         for (let i = 0; i < 64; i += 1) {
    //           console.info('Reading at', tag, i);
    //           buffers.push(await tag.read(i));
    //         }
    //         console.info('closing', tag);
    //         await tag.close();
    //         const data = Buffer.concat(buffers);
    //         emitter.emit('data', data);
    //         // await new Promise(async (resolve, reject) => {
    //         //   await tag.open();
    //         //   return Buffer.concat(buffers);
    //         // }).then(data => emitter.emit('data', data))
    //         //   .catch(err => emitter.emit('error', err));
    //       }
    //     }
    //   } catch (err) {
    //     emitter.emit('error', err);
    //   }
    // };
    // const wrapper = (): any => listen().catch(err => emitter.emit('error', err)).then(wrapper);
    // wrapper();
}
//# sourceMappingURL=index.js.map