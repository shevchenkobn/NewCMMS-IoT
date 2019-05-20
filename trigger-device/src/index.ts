import { AsyncMqttClient } from 'async-mqtt';
import { EventEmitter } from 'events';
import * as config from 'config';
import { Nullable } from './@types';
import { bindOnExitHandler, exitGracefully } from './exit-handler';
import { getMqttClient, MqttQoS } from './mqtt';
import * as appRootPath from 'app-root-path';

export interface ITriggerEventEmitter extends EventEmitter {
  on(event: 'data', listener: (data: string) => void): this;
  on(event: 'error', listener: (err: any) => void): this;
  on(event: 'uninit', listener: () => void): this;
}

export interface ITriggerModule {
  initialize(eventEmitter: ITriggerEventEmitter): Promise<void>;
  dispose(): Promise<void>;
}

let requestInProcess: Nullable<string> = null;
const physicalAddress = config.get<string>('physicalAddress')
  .split(/[-:.]/)
  .join('')
  .toLowerCase();
const publishTopic = `triggers/${physicalAddress}`;
const publishResultTopic = `${publishTopic}/result`;

import(
  appRootPath.resolve(config.get<string>('triggerModulePath'))
).then(async (triggerModule: ITriggerModule) => {
  const emitter = new EventEmitter() as ITriggerEventEmitter;
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
        exitGracefully();
      });
    });
  });

  await triggerModule.initialize(emitter);
  bindOnExitHandler(() => triggerModule.dispose());

  const client = getMqttClient(() => {
    client.on('message', (topic, payload, packet) => {
      switch (topic) {
        case publishResultTopic: {
          const result = topic.slice(2);
          const isSuccessful = !Boolean(Number.parseInt(topic[0], 10));
          if (!requestInProcess) {
            console.error('Unknown state because no data in progress found');
            break;
          }
          if (isSuccessful) {
            notifyAboutDataOK(requestInProcess, result);
          } else {
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

function publish(client: AsyncMqttClient, data: string) {
  client.publish(publishTopic, data, {
    qos: MqttQoS.EXACTLY_ONCE,
    retain: true,
    dup: false,
  }).catch(err => {
    console.error(`Error while publishing """${requestInProcess}""". Resending...`, err);
    publish(client, data);
  }).then(() => {
    console.info(`The request """${requestInProcess}""" is sent.`);
  });
}

function notifyAboutDataError(data: string, result: string) {
  console.info(`Bad data """${data}"""\nReason: ${result}`);
}

function notifyAboutDataOK(data: string, result: string) {
  console.info(`Request """${data}"""\nResult: ${result}`);
}
