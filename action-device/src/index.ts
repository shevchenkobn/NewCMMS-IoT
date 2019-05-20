import { AsyncMqttClient } from 'async-mqtt';
import { EventEmitter } from 'events';
import * as config from 'config';
import { Nullable } from './@types';
import { bindOnExitHandler, exitGracefully } from './exit-handler';
import { getMqttClient, MqttQoS } from './mqtt';
import * as appRootPath from 'app-root-path';

export interface IActorEventEmitter extends EventEmitter {
  on(event: 'warning', listener: (message: any) => void): this;
}

export interface IActionModule {
  initialize(turnedOn: boolean): Promise<void>;
  initialize(/*turnedOn = false*/): Promise<void>;
  dispose(): Promise<void>;
  toggle(): Promise<boolean>;
  isTurnedOn(): Promise<boolean>;
  setEventEmitter(emitter: Nullable<IActorEventEmitter>): void;
}

const physicalAddress = config.get<string>('physicalAddress')
  .split(/[-:.]/)
  .join('')
  .toLowerCase();
const subscribeTopic = `actions/${physicalAddress}`;
const publishTopicForResult = `${subscribeTopic}/result`;

import(
  appRootPath.resolve(config.get<string>('actorModulePath'))
).then(async (actionModule: IActionModule) => {
  const emitter = new EventEmitter() as IActorEventEmitter;
  emitter.on('warning', message => {
    console.error('Action module warning:', message);
  });

  await actionModule.initialize(false);
  actionModule.setEventEmitter(emitter);
  console.info('Action module is initialized');
  bindOnExitHandler(() => {
    console.info('Disposing action module...');
    return actionModule.dispose();
  });

  const client = getMqttClient(() => {
    client.on('message', (topic, payload, packet) => {
      switch (topic) {
        case subscribeTopic: {
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

function subscribe(client: AsyncMqttClient) {
  client.subscribe(subscribeTopic, {
    qos: MqttQoS.EXACTLY_ONCE,
    nl: true,
    rap: true,
    rh: false,
  } as any).catch(err => {
    console.error('Failed to subscribe to action topic. ', err);
    console.error('Retrying...');
    subscribe(client);
  });
}

function publish(client: AsyncMqttClient, result: string) {
  client.publish(publishTopicForResult, result, {
    qos: MqttQoS.EXACTLY_ONCE,
    retain: true,
    dup: false,
  }).catch(err => {
    console.error(`Error while publishing """${result}""". Resending...`, err, '\n\n');
    publish(client, result);
  }).then(() => {
    console.info(`The result """${result}""" is sent.\n\n`);
  });
}
