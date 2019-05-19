import { createInterface } from 'readline';
import {
  dispose,
  initialize,
  isTurnedOn,
  setEventEmitter,
  toggle,
} from '../index';

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
  await initialize(false);
  const cli = createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true,
    removeHistoryDuplicates: true,
  });
  cli.write('The pin is initialized! Press enter to switch the led on or off.');
  cli.prompt(true);

  const clear = async () => {
    cli.write('Disposing and exiting...');
    return dispose();
  };
  cli.on('SIGINT', clear);
  cli.on('SIGTSTP', clear);

  cli.on('line', async input => {
    await toggle();
    cli.write('LED is turned ' + (await isTurnedOn() ? 'on' : 'off'));
    cli.prompt();
  });
}