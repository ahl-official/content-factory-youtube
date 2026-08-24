const fs = require('fs');

const path = 'c:/Users/HP/Desktop/Saniya/content-factory-work/content-factory/routes/youtubeAi.js';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(/InputData:\s*JSON\.stringify\((.*?)\),/g, 'InputData: $1,');
code = code.replace(/OutputData:\s*JSON\.stringify\((.*?)\),/g, 'OutputData: $1,');

fs.writeFileSync(path, code, 'utf8');
console.log("Replaced JSON.stringify in youtubeAi.js");
