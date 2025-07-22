const fs = require('fs');
const charset = 'abcdef0123456789';
const prefix = 'A6B776CB81479571';
const suffix = '';
const targetLength = 20; // final length
const neededLength = targetLength - prefix.length - suffix.length;

const data = [];

function* generateCombinations(charset, length, current = '') {
    if (length === 0) {
        yield current;
    } else {
        for (const char of charset) {
            yield* generateCombinations(charset, length - 1, current + char);
        }
    }
}

(async () => {
    let count = 0;
    for (const mid of generateCombinations(charset, neededLength)) {
        const fullHex = prefix + mid + suffix;
        data.push(fullHex);
        count++;
    }

    fs.writeFileSync("anoma.json", JSON.stringify(data, null, 2));
    console.log(`✅ Generated ${count} codes of exactly 20 characters and saved to anoma.json`);
})();
