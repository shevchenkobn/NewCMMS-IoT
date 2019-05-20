"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
const config = require("config");
const exit_handler_1 = require("./exit-handler");
const mqtt_1 = require("./mqtt");
const appRootPath = require("app-root-path");
const physicalAddress = config.get('physicalAddress')
    .split(/[-:.]/)
    .join('')
    .toLowerCase();
const subscribeTopic = `actions/${physicalAddress}`;
const publishTopicForResult = `${subscribeTopic}/result`;
Promise.resolve().then(() => require(appRootPath.resolve(config.get('actorModulePath')))).then(async (actionModule) => {
    const emitter = new events_1.EventEmitter();
    emitter.on('warning', message => {
        console.error('Action module warning:', message);
    });
    await actionModule.initialize(false);
    actionModule.setEventEmitter(emitter);
    console.info('Action module is initialized');
    exit_handler_1.bindOnExitHandler(() => {
        console.info('Disposing action module...');
        return actionModule.dispose();
    });
    const client = mqtt_1.getMqttClient(() => {
        client.on('message', (topic, payload, packet) => {
            switch (topic) {
                case subscribeTopic:
                    {
                        console.info('The light is toggled!');
                        // TODO: check, what state is desired
                        actionModule.toggle().then((turnedOn) => {
                            console.info(`The light is turned ${turnedOn ? 'on' : 'off'}`);
                            // TODO: publish result;
                        }).catch(err => {
                            console.error('Error when toggling:', err);
                            // TODO: report error to server;
                        });
                    }
                    break;
                default:
                    console.warn('Unknown topic:', topic);
            }
        });
        subscribe(client);
    });
});
function subscribe(client) {
    client.subscribe(subscribeTopic, {
        qos: mqtt_1.MqttQoS.EXACTLY_ONCE,
        nl: true,
        rap: true,
        rh: false,
    }).catch(err => {
        console.error('Failed to subscribe to action topic. ', err);
        console.error('Retrying...');
        subscribe(client);
    });
}
function publish(client, result) {
    client.publish(publishTopicForResult, result, {
        qos: mqtt_1.MqttQoS.EXACTLY_ONCE,
        retain: true,
        dup: false,
    }).catch(err => {
        console.error(`Error while publishing """${result}""". Resending...`, err, '\n\n');
        publish(client, result);
    }).then(() => {
        console.info(`The result """${result}""" is sent.\n\n`);
    });
}
//# sourceMappingURL=index.js.map