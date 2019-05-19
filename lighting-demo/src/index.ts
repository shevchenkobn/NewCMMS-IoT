import { Nullable } from './@types';
import * as config from 'config';
import { Gpio } from 'onoff';
import { EventEmitter } from 'events';

const GpioEnum: { HIGH: number, LOW: number } = Gpio as any;

let ledPin: Nullable<Gpio>;
let turnedOnState = false;

let eventEmitter: Nullable<EventEmitter>;

export function setEventEmitter(emitter: Nullable<EventEmitter>) {
  eventEmitter = emitter;
}

export function hasEventEmitter() {
  return !!eventEmitter;
}

export async function initialize(turnedOn = false): Promise<void> {
  turnedOnState = turnedOn;
  if (!ledPin) {
    ledPin = new Gpio(
      config.get<number>('bcmPinNum'),
      turnedOn ? 'high' : 'low',
    );
  } else {
    emitWarning('The led is already initialized');
    await (ledPin as any).write(getWriteValue());
  }
}

export async function isTurnedOn() {
  return turnedOnState;
}

export async function toggle(): Promise<boolean> {
  if (!ledPin) {
    throw new TypeError('The module is not initialized');
  }
  turnedOnState = !turnedOnState;
  await (ledPin as any).write(getWriteValue());
  return turnedOnState;
}

export async function dispose(): Promise<void> {
  if (ledPin) {
    ledPin.unexport();
    ledPin = null;
  } else {
    emitWarning('The module is not initialized');
  }
}

function getWriteValue() {
  return turnedOnState ? GpioEnum.HIGH : GpioEnum.LOW;
}

function emitWarning(message: any) {
  if (eventEmitter) {
    eventEmitter.emit('warning', message);
  }
}
