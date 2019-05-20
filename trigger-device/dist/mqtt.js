"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const async_mqtt_1 = require("async-mqtt");
const config = require("config");
const exit_handler_1 = require("./exit-handler");
var MqttQoS;
(function (MqttQoS) {
    MqttQoS[MqttQoS["AT_MOST_ONCE"] = 0] = "AT_MOST_ONCE";
    MqttQoS[MqttQoS["AT_LEAST_ONCE"] = 1] = "AT_LEAST_ONCE";
    MqttQoS[MqttQoS["EXACTLY_ONCE"] = 2] = "EXACTLY_ONCE";
    MqttQoS[MqttQoS["ERROR"] = 128] = "ERROR";
})(MqttQoS = exports.MqttQoS || (exports.MqttQoS = {}));
let client = null;
function getMqttClient(onConnect) {
    if (client) {
        return client;
    }
    const mqttConfig = config.get('mqttBroker');
    const hasUsername = typeof mqttConfig.username === 'string';
    const hasPassword = typeof mqttConfig.password === 'string';
    if (hasPassword && !hasUsername) {
        throw new TypeError('If password is used, username is also required');
    }
    const clientId = `trigger_${config.get('physicalAddress')}`;
    const url = `${mqttConfig.protocol}://${mqttConfig.host}:${mqttConfig.port || 1883}`;
    const options = {
        clientId,
        will: {
            topic: '/servers',
            payload: `${clientId}:disconnected`,
            retain: true,
            qos: MqttQoS.EXACTLY_ONCE,
        },
        protocolVersion: 4,
        keepalive: 60,
        reconnectPeriod: 0,
        connectTimeout: 30 * 1000,
        rejectUnauthorized: true,
        resubscribe: true,
    };
    options.properties = {
        sessionExpiryInterval: 60,
    };
    if (hasUsername) {
        options.username = mqttConfig.username;
        if (hasPassword) {
            options.password = mqttConfig.password;
        }
    }
    console.info(`Connecting to mqtt at "${url}"...`);
    client = async_mqtt_1.connect(url, options);
    client.on('connect', (connack) => {
        console.info('Connected to mqtt.');
        onConnect(connack);
    });
    client.on('close', () => console.info('Disconnected from mqtt.'));
    client.on('reconnect', () => console.info('Reconnecting to mqtt...'));
    exit_handler_1.bindOnExitHandler(() => {
        if (!client) {
            throw new Error('Unknown mqtt service state');
        }
        console.info('Disconnecting from mqtt...');
        client.end(false);
    }, true);
    return client;
}
exports.getMqttClient = getMqttClient;
//# sourceMappingURL=mqtt.js.map