import { dispose, initialize } from '../';
import { EventEmitter } from 'events';

process.once('unhandledRejection', (err, p) => {
  console.error('Rejection error');
  console.error(err);
  console.error('Promise:');
  console.error(p);
  dispose().then(() => process.exit(1));
});
process.once('uncaughtException', err => {
  console.error('Unhandled error');
  console.error(err);
  dispose().then(() => process.exit(1));
});

run();

async function run() {
  const eventEmitter = new EventEmitter();
  eventEmitter.on('error', err => console.error('NFC error: ', err));
  eventEmitter.on('data', (data: any) => {
    console.info(`Read data from NFC: """${JSON.stringify(data)}""".\n\n`);
  });
  eventEmitter.on('no-data', (tag: any) => {
    console.info(`Tag without data found: """${JSON.stringify(tag)}""".\n\n`);
  });
  eventEmitter.on('raw-data', (buffer: Buffer) => {
    console.info(`Failed to parse data: """${JSON.stringify(buffer)}""".\n\n`);
  });
  await initialize(eventEmitter);

  console.info('NFC module is initialized. Scanning for devices...');

  const clear = async (signal: NodeJS.Signals) => {
    console.info('Disposing and exiting...\n');
    return dispose().then(() => process.exit(0));
  };
  process.on('SIGINT', clear);
  process.on('SIGTSTP', clear);
}
