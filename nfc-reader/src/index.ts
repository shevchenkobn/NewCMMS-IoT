
import { NFCReader } from 'libnfc-js';
import { Nullable } from './@types';
import { EventEmitter } from 'events';
import * as config from 'config';

let nfcReader: Nullable<NFCReader> = null;
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
  if (nfcReader) {
    emitter.emit('warning', 'The module is already initialized. Initialization skipped.');
    return;
  }
  nfcReader = new NFCReader();
  nfcReader.open();
  startListening();
}

export async function dispose(): Promise<void> {
  if (!nfcReader) {
    emitter.emit('warning', 'The module is not initialized.');
    return;
  }
  nfcReader._nfc.close();
  nfcReader = null;
}

function startListening() {
  if (!nfcReader) {
    throw new TypeError('The module is not iniitalized');
  }
  nfcReader.on('card', (card: any) => {
    emitter.emit('data', card);
    console.info(card);
    nfcReader.transceive(Buffer.from([0])).then((...results: any[]) => {
      console.info(results);
      nfcReader.release().then((...args: any[]) => {
        console.info(args);
        nfcReader.poll();
      });
    });
  });
  nfcReader.poll();
}
