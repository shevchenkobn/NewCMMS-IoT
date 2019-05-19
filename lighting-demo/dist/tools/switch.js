"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const readline_1 = require("readline");
const index_1 = require("../index");
process.once('unhandledRejection', (err, p) => {
    console.error('Rejection error');
    console.error(err);
    console.error('Promise:');
    console.error(p);
    index_1.dispose().then(() => process.exit(1));
});
process.once('uncaughtException', err => {
    console.error('Unhandled error');
    console.error(err);
    index_1.dispose().then(() => process.exit(1));
});
run();
async function run() {
    await index_1.initialize(false);
    const cli = readline_1.createInterface({
        input: process.stdin,
        output: process.stdout,
        terminal: true,
        removeHistoryDuplicates: true,
    });
    cli.write('The pin is initialized! Press enter to switch the led on or off.');
    cli.prompt(true);
    const clear = async () => {
        cli.write('Disposing and exiting...');
        return index_1.dispose();
    };
    cli.on('SIGINT', clear);
    cli.on('SIGTSTP', clear);
    cli.on('line', async (input) => {
        await index_1.toggle();
        cli.write('LED is turned ' + (await index_1.isTurnedOn() ? 'on' : 'off'));
        cli.prompt();
    });
}
//# sourceMappingURL=switch.js.map