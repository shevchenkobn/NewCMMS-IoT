
// import { nfc } from 'nfc';
// import { NFCReader } from 'libnfc-js';
import * as Freefare from 'freefare';
import { Nullable } from './@types';
import { EventEmitter } from 'events';
import * as config from 'config';

// let nfcReader: Nullable<NFCReader> = null;
// let n: Nullable<nfc.NFC>;
let device: Nullable<any>;
let interval: NodeJS.Timeout;
let emitter: EventEmitter;

export async function setEventEmitter(
  eventEmitter: EventEmitter,
): Promise<void> {
  if (!eventEmitter) {
    throw new TypeError('eventEmitter is not defined');
  }
  emitter = eventEmitter;
}

export async function initialize(eventEmitter: EventEmitter): Promise<void> {
  if (!eventEmitter) {
    throw new TypeError('eventEmitter is not defined. Cannot initialize.');
  }
  emitter = eventEmitter;
  // if (nfcReader) {
  // if (n) {
  if (device) {
    emitter.emit('warning', 'The module is already initialized. Initialization skipped.');
    return;
  }
  // nfcReader = new NFCReader();
  // nfcReader.open();
  // n = new nfc.NFC();
  device = (await new Freefare().listDevices())[0];
  console.info('Found a device:', device);
  await device.open();
  console.info('opened it');
  startListening();
}

export async function dispose(): Promise<void> {
  // if (!nfcReader) {
  // if (!n) {
  if (!device) {
    emitter.emit('warning', 'The module is not initialized.');
    return;
  }
  // nfcReader._nfc.close();
  // nfcReader = null;
  // n.stop();
  // n = null;
  device.close();
  clearInterval(interval);
  device = null;
}

function startListening() {
  // if (!nfcReader) {
  // if (!n) {
  if (!device) {
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
  // n.on('read', (tag: any) => {
  //   console.info(tag);
  //   emitter.emit('data', tag.data);
  // }).on('error', (err: any) => {
  //   emitter.emit(err);
  // }).start();
  const listener = async () => {
    console.info('Getting tags');
    await device.abort();
    const tags = await device.listTags();
    console.info('Tags: ', tags);
    for (const tag of tags) {
      if (tag.read) {
        console.info('Readable', tag);
        new Promise(async (resolve, reject) => {
          console.info('Opening tag', tag);
          await tag.open();
          const buffers = [];
          for (let i = 0; i < 64; i += 1) {
            console.info('Reading at', tag, i);
            buffers.push(await tag.read(i));
          }
          console.info('closing', tag);
          await tag.close();
          return Buffer.concat(buffers);
        }).then(data => emitter.emit('data', data))
          .catch(err => emitter.emit('error', err));
      }
    }
  };
  interval = setInterval(listener, 2000);
}
