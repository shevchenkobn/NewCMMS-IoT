"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config = require("config");
const onoff_1 = require("onoff");
const GpioEnum = onoff_1.Gpio;
let ledPin;
let turnedOnState = false;
let eventEmitter;
function setEventEmitter(emitter) {
    eventEmitter = emitter;
}
exports.setEventEmitter = setEventEmitter;
function hasEventEmitter() {
    return !!eventEmitter;
}
exports.hasEventEmitter = hasEventEmitter;
async function initialize(turnedOn = false) {
    turnedOnState = turnedOn;
    if (!ledPin) {
        ledPin = new onoff_1.Gpio(config.get('bcmPinNum'), turnedOn ? 'high' : 'low');
    }
    else {
        emitWarning('The led is already initialized');
        await ledPin.write(getWriteValue());
    }
}
exports.initialize = initialize;
async function isTurnedOn() {
    return turnedOnState;
}
exports.isTurnedOn = isTurnedOn;
async function toggle() {
    if (!ledPin) {
        throw new TypeError('The module is not initialized');
    }
    turnedOnState = !turnedOnState;
    await ledPin.write(getWriteValue());
    return turnedOnState;
}
exports.toggle = toggle;
async function dispose() {
    if (ledPin) {
        ledPin.unexport();
        ledPin = null;
    }
    else {
        emitWarning('The module is not initialized');
    }
}
exports.dispose = dispose;
function getWriteValue() {
    return turnedOnState ? GpioEnum.HIGH : GpioEnum.LOW;
}
function emitWarning(message) {
    if (eventEmitter) {
        eventEmitter.emit('warning', message);
    }
}
//# sourceMappingURL=index.js.map