"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
const config = require("config");
const exit_handler_1 = require("./exit-handler");
const mqtt_1 = require("./mqtt");
const appRootPath = require("app-root-path");
let requestInProcess = null;
const physicalAddress = config.get('physicalAddress')
    .split(/[-:.]/)
    .join('')
    .toLowerCase();
const publishTopic = `triggers/${physicalAddress}`;
const publishResultTopic = `${publishTopic}/result`;
Promise.resolve().then(() => require(appRootPath.resolve(config.get('triggerModulePath')))).then(async (triggerModule) => {
    const emitter = new events_1.EventEmitter();
    emitter.on('error', err => {
        console.error('Trigger module error:', err);
    });
    emitter.on('uninit', () => {
        console.error('Reinitializing trigger module...');
        triggerModule.dispose().catch(err => {
            console.error('Error while reinitialization!', err);
        }).then(() => {
            triggerModule.initialize(emitter).catch(err => {
                console.error('Reinitialize failed', err);
                exit_handler_1.exitGracefully();
            });
        });
    });
    await triggerModule.initialize(emitter);
    console.info('Trigger module is initialized');
    exit_handler_1.bindOnExitHandler(() => {
        console.info('Disposing trigger module...');
        return triggerModule.dispose();
    });
    const client = mqtt_1.getMqttClient(() => {
        client.on('message', (topic, payload, packet) => {
            switch (topic) {
                case publishResultTopic:
                    {
                        if (!requestInProcess) {
                            console.error('Unknown state because no data in progress found');
                            break;
                        }
                        const strPayload = Buffer.isBuffer(payload)
                            ? payload.toString('utf8')
                            : payload;
                        const result = strPayload.slice(2);
                        const isSuccessful = !Boolean(Number.parseInt(strPayload[0], 10));
                        if (isSuccessful) {
                            notifyAboutDataOK(requestInProcess, result);
                        }
                        else {
                            notifyAboutDataError(requestInProcess, result);
                        }
                        requestInProcess = null;
                    }
                    break;
                default:
                    console.warn('Unknown topic:', topic);
            }
        });
        client.subscribe(publishResultTopic, {
            qos: mqtt_1.MqttQoS.EXACTLY_ONCE,
            nl: true,
            rap: true,
            rh: true,
        }).catch(err => {
            console.error('Failed to subscribe to result. ', err);
        });
        emitter.on('data', data => {
            console.log(`Got data to send """${data}"""\n\n`);
            requestInProcess = data;
            publish(client, data);
        });
    });
});
function publish(client, data) {
    client.publish(publishTopic, data, {
        qos: mqtt_1.MqttQoS.EXACTLY_ONCE,
        retain: true,
        dup: false,
    }).catch(err => {
        console.error(`Error while publishing """${requestInProcess}""". Resending...`, err, '\n\n');
        publish(client, data);
    }).then(() => {
        console.info(`The request """${requestInProcess}""" is sent.\n\n`);
    });
}
function notifyAboutDataError(data, result) {
    console.info(`Bad data """${data}"""\nReason: ${result}\n\n`);
}
function notifyAboutDataOK(data, result) {
    console.info(`Request """${data}"""\nResult: ${result}]\n\n`);
}
//# sourceMappingURL=index.js.map