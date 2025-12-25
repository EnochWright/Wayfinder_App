const fs = require('fs');

// Your complete data from the task
const rawData = `{"id":"1","start":"1","end":"1","payoff":"0"},
{"id":"2","start":"1","end":"2","payoff":"3500"},
{"id":"3","start":"1","end":"3","payoff":"2000"},
{"id":"4","start":"1","end":"4","payoff":"3000"},
{"id":"5","start":"1","end":"5","payoff":"1500"},
{"id":"6","start":"1","end":"6","payoff":"2500"},
{"id":"7","start":"1","end":"7","payoff":"5500"},
{"id":"8","start":"1","end":"8","payoff":"3000"},
{"id":"9","start":"1","end":"9","payoff":"3500"},
{"id":"10","start":"1","end":"10","payoff":"10000"},
{"id":"11","start":"1","end":"11","payoff":"9500"},
{"id":"12","start":"1","end":"12","payoff":"7500"},
{"id":"13","start":"1","end":"13","payoff":"10000"},
{"id":"14","start":"1","end":"14","payoff":"11000"},
{"id":"15","start":"1","end":"15","payoff":"8500"},
{"id":"16","start":"1","end":"16","payoff":"15000"},
{"id":"17","start":"1","end":"17","payoff":"13500"},
{"id":"18","start":"1","end":"18","payoff":"6000"},
{"id":"19","start":"1","end":"19","payoff":"5000"},
{"id":"20","start":"1","end":"20","payoff":"13500"},
{"id":"21","start":"1","end":"21","payoff":"8000"},
{"id":"22","start":"1","end":"22","payoff":"7000"},
{"id":"23","start":"1","end":"23","payoff":"5000"},
{"id":"24","start":"1","end":"24","payoff":"6000"},
{"id":"25","start":"1","end":"25","payoff":"5500"},
{"id":"26","start":"1","end":"26","payoff":"7500"},
{"id":"27","start":"1","end":"27","payoff":"9000"},
{"id":"28","start":"1","end":"28","payoff":"10000"},
{"id":"29","start":"1","end":"29","payoff":"11000"},
{"id":"30","start":"1","end":"30","payoff":"17000"},
{"id":"31","start":"1","end":"31","payoff":"17000"},
{"id":"32","start":"1","end":"32","payoff":"18500"},
{"id":"33","start":"1","end":"33","payoff":"13500"},
{"id":"34","start":"1","end":"34","payoff":"8500"},
{"id":"35","start":"1","end":"35","payoff":"12500"},
{"id":"36","start":"1","end":"36","payoff":"10500"},
{"id":"37","start":"1","end":"37","payoff":"15000"},
{"id":"38","start":"1","end":"38","payoff":"19500"},
{"id":"39","start":"1","end":"39","payoff":"16000"},
{"id":"40","start":"1","end":"40","payoff":"18500"},
{"id":"41","start":"1","end":"41","payoff":"12000"},
{"id":"42","start":"1","end":"42","payoff":"14500"},
{"id":"43","start":"1","end":"43","payoff":"12500"},
{"id":"44","start":"1","end":"44","payoff":"12500"},
{"id":"45","start":"1","end":"45","payoff":"15500"},
{"id":"46","start":"1","end":"46","payoff":"13000"},
{"id":"47","start":"1","end":"47","payoff":"18500"},
{"id":"48","start":"1","end":"48","payoff":"12000"},
{"id":"49","start":"1","end":"49","payoff":"21000"},
{"id":"50","start":"1","end":"50","payoff":"23500"},
{"id":"51","start":"1","end":"51","payoff":"18000"},
{"id":"52","start":"1","end":"52","payoff":"23500"},
{"id":"53","start":"1","end":"53","payoff":"30000"},
{"id":"54","start":"1","end":"54","payoff":"17000"},
{"id":"55","start":"1","end":"55","payoff":"23500"},
{"id":"56","start":"1","end":"56","payoff":"31500"},
{"id":"57","start":"1","end":"57","payoff":"26500"},
{"id":"58","start":"1","end":"58","payoff":"22000"},
{"id":"59","start":"1","end":"59","payoff":"28000"},
{"id":"60","start":"1","end":"60","payoff":"30500"},
{"id":"61","start":"1","end":"61","payoff":"31000"},
{"id":"62","start":"1","end":"62","payoff":"27500"},
{"id":"63","start":"1","end":"63","payoff":"25500"},
{"id":"64","start":"1","end":"64","payoff":"27000"},
{"id":"65","start":"1","end":"65","payoff":"31500"},
{"id":"66","start":"1","end":"66","payoff":"31000"},
{"id":"67","start":"1","end":"67","payoff":"18500"}`;

// Parse the raw data and convert to proper format (no id, numeric values)
const entries = ('[' + rawData + ']')
  .replace(/"id":"[^"]+",/g, '')  // Remove id field
  .replace(/"start":"(\d+)"/g, '"start":$1')  // Remove quotes from start
  .replace(/"end":"(\d+)"/g, '"end":$1')  // Remove quotes from end
  .replace(/"payoff":"(\d+)"/g, '"payoff":$1');  // Remove quotes from payoff

const output = {
  payoffs: JSON.parse(entries)
};

fs.writeFileSync('www/data/railbaron-payoffs.json', JSON.stringify(output, null, 2));
console.log('File generated successfully with', output.payoffs.length, 'entries');
