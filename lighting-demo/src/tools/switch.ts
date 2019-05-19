import { createInterface } from 'readline';
import { dispose, initialize, isTurnedOn, toggle } from '../index';

process.on('unhandledRejection', (err, p) => {
  console.error('Rejection error');
  console.error(err);
  console.error('Promise:');
  console.error(p);
  process.exit(1);
});

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
    dispose().then(() => {
      cli.write('Disposing and exiting...');
      return dispose();
    });
  };
  cli.on('SIGINT', clear);
  cli.on('SIGTSTP', clear);

  for await (const line of cli) {
    await toggle();
    cli.write('LED is turned ' + (await isTurnedOn() ? 'on' : 'off'));
    cli.prompt();
  }
}