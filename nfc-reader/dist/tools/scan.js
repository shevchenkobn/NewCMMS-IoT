"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const __1 = require("../");
const events_1 = require("events");
process.once('unhandledRejection', (err, p) => {
    console.error('Rejection error');
    console.error(err);
    console.error('Promise:');
    console.error(p);
    __1.dispose().then(() => process.exit(1));
});
process.once('uncaughtException', err => {
    console.error('Unhandled error');
    console.error(err);
    __1.dispose().then(() => process.exit(1));
});
run();
async function run() {
    const eventEmitter = new events_1.EventEmitter();
    let counter = 0;
    eventEmitter.on('error', err => console.error('NFC error: ', err));
    eventEmitter.on('data', (data) => {
        counter += 1;
        console.info(`Read data from NFC: """${data}""".\nSuccessful reads: ${counter}\n\n`);
    });
    eventEmitter.on('no-data', (tag) => {
        console.info(`Tag without data found: """${JSON.stringify(tag)}""".\n\n`);
    });
    eventEmitter.on('raw-data', (buffer) => {
        console.info(`Failed to parse data: """${buffer.toString('utf8')}""".\n\n`);
    });
    eventEmitter.on('uninit', () => {
        console.info('The NFC module was uninitialized due to error');
    });
    await __1.initialize(eventEmitter);
    console.info('NFC module is initialized. Scanning for devices...');
    const clear = async (signal) => {
        console.info('Disposing and exiting...\n');
        return __1.dispose().then(() => process.exit(0));
    };
    process.on('SIGINT', clear);
    process.on('SIGTSTP', clear);
}
//# sourceMappingURL=scan.js.map