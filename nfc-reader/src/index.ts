import * as I2C from 'i2c';
import { Nullable } from './@types';
import { I2C_ADDRESS, PN532 } from 'pn532';
import { EventEmitter } from 'events';
import * as config from 'config';

let rfid: Nullable<PN532> = null;
let emitter: EventEmitter;
let wire: Nullable<I2C> = null;

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
  if (rfid) {
    emitter.emit('warning', 'The module is already initialized. Initialization skipped.');
    return;
  }
  // FIXME: see additional parameters
  wire = new I2C(
    I2C_ADDRESS,
    {
      device: config.get<string>('i2cDevicePath'),
      debug: process.env.NODE_ENV !== 'production',
    },
  );
  rfid = new PN532(wire, {
    pollInterval: 500,
  });
}

export async function dispose(): Promise<void> {
  if (!rfid) {
    emitter.emit('warning', 'The module is not initialized.');
    return;
  }
  wire.close();
  rfid = null;
  wire = null;
  (emitter as any) = null;
}

function startListening() {
  if (!rfid) {
    throw new TypeError('The module is not iniitalized');
  }
  rfid.on('ready', () => {
    rfid.on('tag', (tag: any) => {
      console.log(tag);
    });
  });
}
