import { Nullable } from './@types';
import * as config from 'config';
import { Gpio } from 'onoff';

const GpioEnum: { HIGH: number, LOW: number } = Gpio as any;

let ledPin: Nullable<Gpio>;
let turnedOnState = false;

export async function initialize(turnedOn: false): Promise<void> {
  turnedOnState = turnedOn;
  if (!ledPin) {
    ledPin = new Gpio(
      config.get<number>('bcmPinNum'),
      turnedOn ? 'high' : 'low',
    );
  } else {
    await (ledPin as any).write(getWriteValue());
  }
}

export async function isTurnedOn() {
  return turnedOnState;
}

export async function toggle(): Promise<boolean> {
  turnedOnState = !turnedOnState;
  await (ledPin as any).write(getWriteValue());
  return turnedOnState;
}

export async function dispose(): Promise<void> {
  if (ledPin) {
    ledPin.unexport();
  }
}

function getWriteValue() {
  return turnedOnState ? GpioEnum.HIGH : GpioEnum.LOW;
}
