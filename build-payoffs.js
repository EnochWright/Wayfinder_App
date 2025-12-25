const fs = require('fs');

// Read the task data from your original message
// Since we can't paste all 2279 entries, let's build it programmatically
// by reading the pattern from your data

const rawInput = fs.readFileSync('payoffs-raw.txt', 'utf8');

// Extract all entries using regex
const entries = [];
const regex = /"start":"(\d+)","end":"(\d+)","payoff":"(\d+)"/g;
let match;

while ((match = regex.exec(rawInput)) !== null) {
  entries.push({
    start: parseInt(match[1]),
    end: parseInt(match[2]),
    payoff: parseInt(match[3])
  });
}

const output = {
  payoffs: entries
};

fs.writeFileSync('www/data/railbaron-payoffs.json', JSON.stringify(output, null, 2));
console.log(`✓ Generated railbaron-payoffs.json with ${entries.length} entries`);
