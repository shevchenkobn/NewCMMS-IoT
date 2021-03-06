"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ndef_1 = require("ndef");
const nfc_1 = require("nfc");
const utils_1 = require("./utils");
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
    const nfc = n;
    n = null;
    nfc.stop();
    nfc.stop();
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
        const protectedData = utils_1.getProtectedData(tag);
        if (protectedData) {
            emitter.emit('data', protectedData);
            return;
        }
        if (!tag.data) {
            emitter.emit('no-data', tag);
            return;
        }
        const offsetPresent = typeof tag.offset === 'number';
        try {
            const buffer = offsetPresent
                ? tag.data.slice(tag.offset)
                : tag.data;
            const tagData = nfc_1.nfc.parse(buffer);
            console.log(tagData);
            emitter.emit('data', ndef_1.text.decodePayload(tagData[0].payload));
        }
        catch (err) {
            emitter.emit('error', err);
            if (offsetPresent) {
                emitter.emit('raw-data', tag.buffer, tag.offset);
            }
            else {
                emitter.emit('raw-data', tag.data);
            }
        }
    }).on('stopped', (...args) => {
        dispose()
            .then(() => emitter.emit('uninit'))
            .catch(err => emitter.emit('error', err));
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