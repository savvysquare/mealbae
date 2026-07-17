const fs = require('fs');
const path = require('path');

const dir = 'C:\\Users\\DELL\\.gemini\\antigravity-ide\\brain\\15e5e78e-7f81-4669-8701-7c686a60d6c5';
const files = [
  'media__1784297959745.png',
  'media__1784298444979.png',
  'media__1784298755406.png'
];

files.forEach(f => {
  const p = path.join(dir, f);
  if (fs.existsSync(p)) {
    const buf = fs.readFileSync(p);
    const width = buf.readUInt32BE(16);
    const height = buf.readUInt32BE(20);
    console.log(`${f}: ${width}x${height}, size: ${buf.length} bytes`);
  } else {
    console.log(`${f} does not exist`);
  }
});
