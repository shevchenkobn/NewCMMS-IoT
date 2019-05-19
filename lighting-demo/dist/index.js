"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config = require("config");
const onoff_1 = require("onoff");
const GpioEnum = onoff_1.Gpio;
let ledPin;
let turnedOnState = false;
async function initialize(turnedOn) {
    turnedOnState = turnedOn;
    if (!ledPin) {
        ledPin = new onoff_1.Gpio(config.get('bcmPinNum'), turnedOn ? 'high' : 'low');
    }
    else {
        await ledPin.write(getWriteValue());
    }
}
exports.initialize = initialize;
async function isTurnedOn() {
    return turnedOnState;
}
exports.isTurnedOn = isTurnedOn;
async function toggle() {
    turnedOnState = !turnedOnState;
    await ledPin.write(getWriteValue());
    return turnedOnState;
}
exports.toggle = toggle;
async function dispose() {
    if (ledPin) {
        ledPin.unexport();
    }
}
exports.dispose = dispose;
function getWriteValue() {
    return turnedOnState ? GpioEnum.HIGH : GpioEnum.LOW;
}
//# sourceMappingURL=index.js.map