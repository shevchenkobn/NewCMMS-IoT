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
                        const result = topic.slice(2);
                        const isSuccessful = !Boolean(Number.parseInt(topic[0], 10));
                        if (!requestInProcess) {
                            console.error('Unknown state because no data in progress found');
                            break;
                        }
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
        emitter.on('data', data => {
            console.log('Got data to send:', data);
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
        console.error(`Error while publishing """${requestInProcess}""". Resending...`, err);
        publish(client, data);
    }).then(() => {
        console.info(`The request """${requestInProcess}""" is sent.`);
    });
}
function notifyAboutDataError(data, result) {
    console.info(`Bad data """${data}"""\nReason: ${result}`);
}
function notifyAboutDataOK(data, result) {
    console.info(`Request """${data}"""\nResult: ${result}`);
}
//# sourceMappingURL=index.js.map