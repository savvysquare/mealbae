const fs = require('fs');
const path = require('path');

const srcDir = 'C:\\Users\\DELL\\.gemini\\antigravity-ide\\brain\\15e5e78e-7f81-4669-8701-7c686a60d6c5';
const destDir = 'c:\\Users\\DELL\\Desktop\\mealbae\\public';

const copies = [
  { src: 'media__1784297959745.png', dest: 'logo.png' },
  { src: 'media__1784298444979.png', dest: 'favicon.png' },
  { src: 'media__1784298755406.png', dest: 'splash.png' }
];

copies.forEach(({ src, dest }) => {
  const srcPath = path.join(srcDir, src);
  const destPath = path.join(destDir, dest);
  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, destPath);
    console.log(`Successfully copied ${src} to ${dest}`);
  } else {
    console.error(`Source file ${src} does not exist!`);
  }
});

// Also remove favicon.ico if it exists, to prevent cache issues or prioritize favicon.png
const icoPath = path.join(destDir, 'favicon.ico');
if (fs.existsSync(icoPath)) {
  fs.unlinkSync(icoPath);
  console.log('Removed favicon.ico to ensure favicon.png is used');
}
