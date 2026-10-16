const http = require('http');

// Read the hookLibrary from seed_db.js
const fs = require('fs');
const seedContent = fs.readFileSync(__dirname + '/seed_db.js', 'utf8');

// Safely extract hookLibrary
const match = seedContent.match(/hookLibrary:\s*(\[[\s\S]*?\])\s*,\s*thumbnailStyles/);
if (!match) {
  console.error("Could not find hookLibrary in seed_db.js");
  process.exit(1);
}

// Evaluate only the array definition
const hookLibrary = eval(match[1]);

console.log(`Found ${hookLibrary.length} hook templates to sync.`);

const postData = JSON.stringify({ hookLibrary });

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/db/save',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log(`Server responded (${res.statusCode}):`, data);
  });
});

req.on('error', (e) => {
  console.log(`Server error: ${e.message}. Is server running on port 3000?`);
});

req.write(postData);
req.end();
