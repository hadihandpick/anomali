const fs = require('fs');
const wordlist = require('./anoma.json');
const PROGRESS_FILE = 'progress.json';

function log(level, message) {
    const timestamp = new Date().toISOString();
    const levels = {
        debug: '\x1b[36m[DEBUG]\x1b[0m',
        info: '\x1b[34m[INFO]\x1b[0m',
        warn: '\x1b[33m[WARN]\x1b[0m',
        error: '\x1b[31m[ERROR]\x1b[0m',
        success: '\x1b[32m[SUCCESS]\x1b[0m',
    };

    const formatted = `${timestamp} ${levels[level] || '[LOG]'} ${message}\n`;
    if (level === 'error') {
        process.stderr.write(formatted);
    } else {
        process.stdout.write(formatted);
    }
}

function loadProgress() {
    if (fs.existsSync(PROGRESS_FILE)) {
        return JSON.parse(fs.readFileSync(PROGRESS_FILE));
    }
    return { index: 0 };
}

function saveProgress(index) {
    fs.writeFileSync(PROGRESS_FILE, JSON.stringify({ index }, null, 2));
}

async function isCorrect(hex) {
    try {
        const headers = {
            "Accept": "*/*",
            "User-Agent": "Thunder Client (https://www.thunderclient.com)",
            "Content-Type": "application/json"
        };

        const body = JSON.stringify({ invite_code: hex.toUpperCase() });

        const response = await fetch("https://api.prod.testnet.anoma.net/api/v1/invite/redeem", {
            method: "POST",
            body,
            headers
        });

        const data = await response.json();

        if (data.error) {
            log('debug', `${hex.toUpperCase()} => invalid => ${JSON.stringify(data)}`);
            return false;
        }

        log('success', `${hex.toUpperCase()} => VALID`);
        fs.appendFileSync('found.txt', `${hex.toUpperCase()}\n`);
        return true;

    } catch (error) {
        console.log(error)
        log('warn', `Error checking ${hex}: ${error.message}`);
        return 'retry';
    }
}

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
    let { index } = loadProgress();
    log('info', `Resuming from index ${index}/${wordlist.length}`);

    while (index < wordlist.length) {
        const hex = wordlist[index];
        const result = await isCorrect(hex);

        if (result === 'retry') {
            log('warn', 'Rate limit or error, retrying in 5s...');
            await sleep(5000);
            continue;
        }

        if (result === true) {
            log('success', `ðŸŽ‰ Found valid code: ${hex}`);
            break;
        }

        index++;
        saveProgress(index);
        await sleep(100); // throttle
    }

    log('info', 'Brute-force completed or match found.');
}

main();
