// Use native fetch

fetch('http://localhost:3000/api/yt/projects/YT-001')
    .then(r => r.json())
    .then(console.log)
    .catch(console.error);
