const fs = require('fs');
const path = require('path');
const https = require('https');

// Retry only the ones that failed (404) with corrected URLs
const IMAGES = {
  // Soups - banga & ogbono (orange/dark palm-based soups)
  'public/meal-options/soups/banga.png':  'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=200&h=200&auto=format&fit=crop&q=85',
  'public/meal-options/soups/ogbono.png': 'https://images.unsplash.com/photo-1604152135912-04a022e23696?w=200&h=200&auto=format&fit=crop&q=85',

  // Proteins - smoked/dried/stock fish
  'public/meal-options/proteins/smoked-fish.png':  'https://images.unsplash.com/photo-1534604973900-c43ab4c2e0ab?w=200&h=200&auto=format&fit=crop&q=85',
  'public/meal-options/proteins/dried-fish.png':   'https://images.unsplash.com/photo-1559742811-822873691df8?w=200&h=200&auto=format&fit=crop&q=85',
  'public/meal-options/proteins/stockfish.png':    'https://images.unsplash.com/photo-1559742811-822873691df8?w=200&h=200&auto=format&fit=crop&q=85',

  // Drinks - malt, hi-malt
  'public/meal-options/drinks/malt.png':    'https://images.unsplash.com/photo-1574701148212-8518049c7b2c?w=200&h=200&auto=format&fit=crop&q=85',
  'public/meal-options/drinks/hi-malt.png': 'https://images.unsplash.com/photo-1574701148212-8518049c7b2c?w=200&h=200&auto=format&fit=crop&q=85',

  // Extras - dodo, boli, puff-puff (plantain / fried dough)
  'public/meal-options/extras/dodo.png':      'https://images.unsplash.com/photo-1590301157890-4810ed352733?w=200&h=200&auto=format&fit=crop&q=85',
  'public/meal-options/extras/boli.png':      'https://images.unsplash.com/photo-1590301157890-4810ed352733?w=200&h=200&auto=format&fit=crop&q=85',
  'public/meal-options/extras/puff-puff.png': 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=200&h=200&auto=format&fit=crop&q=85',
};

const keys = Object.keys(IMAGES);
let currentIndex = 0;

function downloadNext() {
  if (currentIndex >= keys.length) {
    console.log('✅ Retry downloads completed!');
    process.exit(0);
  }
  const targetPath = keys[currentIndex];
  const url = IMAGES[targetPath];
  const absolutePath = path.resolve(__dirname, '..', targetPath);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  console.log(`[${currentIndex + 1}/${keys.length}] ${path.basename(targetPath)}`);
  const file = fs.createWriteStream(absolutePath);
  https.get(url, (res) => {
    if (res.statusCode >= 400) {
      console.error(`  ❌ Failed (${res.statusCode}): ${url}`);
      file.close(); try { fs.unlinkSync(absolutePath); } catch (_) {}
      currentIndex++; downloadNext();
      return;
    }
    res.pipe(file);
    file.on('finish', () => { file.close(); currentIndex++; setTimeout(downloadNext, 80); });
  }).on('error', (err) => {
    console.error(`  ❌ Error:`, err.message);
    file.close(); try { fs.unlinkSync(absolutePath); } catch (_) {}
    currentIndex++; downloadNext();
  });
}

downloadNext();
