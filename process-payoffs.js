const fs = require('fs');

// Read the original task data - paste ALL 2279 entries here
const taskData = `YOUR_COMPLETE_DATA_HERE`;

// Process: remove id field, convert string numbers to actual numbers
const processed = taskData
  .split('\n')
  .filter(line => line.trim())
  .map(line => {
    const match = line.match(/"start":"(\d+)","end":"(\d+)","payoff":"(\d+)"/);
    if (match) {
      return {
        start: parseInt(match[1]),
        end: parseInt(match[2]),
        payoff: parseInt(match[3])
      };
    }
    return null;
  })
  .filter(item => item !== null);

const output = {
  payoffs: processed
};

fs.writeFileSync('www/data/railbaron-payoffs.json', JSON.stringify(output, null, 2));
console.log(`✓ Generated railbaron-payoffs.json with ${processed.length} entries`);
