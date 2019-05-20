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
  console.info('Trigger module is initialized');
  bindOnExitHandler(() => {
    console.info('Disposing trigger module...');
    return triggerModule.dispose();
  });

  const client = getMqttClient(() => {
    client.on('message', (topic, payload, packet) => {
      switch (topic) {
        case publishResultTopic: {
          if (!requestInProcess) {
            console.error('Unknown state because no data in progress found');
            break;
          }
          const strPayload = Buffer.isBuffer(payload)
            ? (payload as Buffer).toString('utf8')
            : payload;
          const result = strPayload.slice(2);
          const isSuccessful = !Boolean(Number.parseInt(strPayload[0], 10));
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
    client.subscribe(publishResultTopic, {
      qos: MqttQoS.EXACTLY_ONCE,
      nl: true,
      rap: true,
      rh: true,
    } as any).catch(err => {
      console.error('Failed to subscribe to result. ', err);
    });

    emitter.on('data', data => {
      console.log(`Got data to send """${data}"""\n\n`);
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
    console.error(`Error while publishing """${requestInProcess}""". Resending...`, err, '\n\n');
    publish(client, data);
  }).then(() => {
    console.info(`The request """${requestInProcess}""" is sent.\n\n`);
  });
}

function notifyAboutDataError(data: string, result: string) {
  console.info(`Bad data """${data}"""\nReason: ${result}\n\n`);
}

function notifyAboutDataOK(data: string, result: string) {
  console.info(`Request """${data}"""\nResult: ${result}]\n\n`);
}
