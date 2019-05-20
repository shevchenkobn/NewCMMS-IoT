import { AsyncMqttClient, IClientOptions, connect } from 'async-mqtt';
import { Nullable } from './@types';
import * as config from 'config';
import { bindOnExitHandler } from './exit-handler';

export interface IMqttConfig {
  protocol: 'mqtt';
  host: string;
  port: Nullable<number>;
  username: Nullable<string>;
  password: Nullable<string>;
}

export enum MqttQoS {
  AT_MOST_ONCE = 0,
  AT_LEAST_ONCE = 1,
  EXACTLY_ONCE = 2,
  ERROR = 128,
}

let client: Nullable<AsyncMqttClient> = null;

export function getMqttClient(onConnect: (connack: any) => void) {
  if (client) {
    return client;
  }
  const mqttConfig = config.get<IMqttConfig>('mqttBroker');
  const hasUsername = typeof mqttConfig.username === 'string';
  const hasPassword = typeof mqttConfig.password === 'string';
  if (hasPassword && !hasUsername) {
    throw new TypeError('If password is used, username is also required');
  }
  const clientId = `trigger_${config.get<string>('physicalAddress')}`;
  const url = `${mqttConfig.protocol}://${mqttConfig.host}:${mqttConfig.port || 1883}`;
  const options = {
    clientId,
    will: {
      topic: 'triggers',
      payload: `${clientId}:disconnected`,
      retain: true,
      qos: MqttQoS.EXACTLY_ONCE,
    },
    protocolVersion: 4, // BUG: does not accept 5
    keepalive: 60,
    reconnectPeriod: 0,
    connectTimeout: 30 * 1000,
    rejectUnauthorized: true,
    resubscribe: true, // FIXME: whether needed
  } as IClientOptions;
  (options as any).properties = {
    sessionExpiryInterval: 60,
  };
  if (hasUsername) {
    options.username = mqttConfig.username!;
    if (hasPassword) {
      options.password = mqttConfig.password!;
    }
  }
  console.info(`Connecting to mqtt at "${url}"...`);
  client = connect(
    url,
    options,
  );

  client.on('connect', (connack: any) => {
    console.info('Connected to mqtt.');
    onConnect(connack);
  });
  client.on('close', () => console.info('Disconnected from mqtt.'));
  client.on('reconnect', () => console.info('Reconnecting to mqtt...'));
  bindOnExitHandler(() => {
    if (!client) {
      throw new Error('Unknown mqtt service state');
    }
    console.info('Disconnecting from mqtt...');
    client.end(false);
  }, true);
  return client;
}
