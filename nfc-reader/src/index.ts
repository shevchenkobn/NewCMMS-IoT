
import { nfc } from 'nfc';

// import { NFCReader } from 'libnfc-js';
import { Nullable } from './@types';
import { EventEmitter } from 'events';
import * as config from 'config';

// let nfcReader: Nullable<NFCReader> = null;
let n: Nullable<nfc.NFC>;
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
  if (n) {
    emitter.emit('warning', 'The module is already initialized. Initialization skipped.');
    return;
  }
  // nfcReader = new NFCReader();
  // nfcReader.open();
  n = new nfc.NFC();
  startListening();
}

export async function dispose(): Promise<void> {
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
  n.on('read', (tag: any) => {
    console.info(tag);
    emitter.emit('data', tag.data);
  }).on('error', (err: any) => {
    emitter.emit(err);
  }).start();
}
