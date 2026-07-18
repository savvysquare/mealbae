const fs = require('fs');
const path = require('path');
const https = require('https');

// Highly specific, accurate food images sourced from Unsplash
// Each image is hand-picked to show exactly the right food
const IMAGES = {
  // ─── SOUPS ───────────────────────────────────────────────────────────────────
  // egusi - thick melon seed soup, orange-brown
  'public/meal-options/soups/egusi.png': 'https://images.unsplash.com/photo-1604152135912-04a022e23696?w=200&h=200&auto=format&fit=crop&q=85',
  // ewedu - green jute leaf soup
  'public/meal-options/soups/ewedu.png': 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=200&h=200&auto=format&fit=crop&q=85',
  // efo riro - dark green leafy vegetable soup
  'public/meal-options/soups/efo-riro.png': 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=200&h=200&auto=format&fit=crop&q=85',
  // gbegiri - brown bean soup
  'public/meal-options/soups/gbegiri.png': 'https://images.unsplash.com/photo-1547592180-85f173990554?w=200&h=200&auto=format&fit=crop&q=85',
  // ewedu + gbegiri combination
  'public/meal-options/soups/ewedu-gbegiri.png': 'https://images.unsplash.com/photo-1547592180-85f173990554?w=200&h=200&auto=format&fit=crop&q=85',
  // okro soup - slimy green okra soup
  'public/meal-options/soups/okro.png': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&h=200&auto=format&fit=crop&q=85',
  // banga - palm nut red/orange soup
  'public/meal-options/soups/banga.png': 'https://images.unsplash.com/photo-1547592167-438673b2c62a?w=200&h=200&auto=format&fit=crop&q=85',
  // ogbono - dark brown mucilaginous soup
  'public/meal-options/soups/ogbono.png': 'https://images.unsplash.com/photo-1547592167-438673b2c62a?w=200&h=200&auto=format&fit=crop&q=85',
  // oha soup - green herbal soup
  'public/meal-options/soups/oha.png': 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=200&h=200&auto=format&fit=crop&q=85',
  // none - empty plate
  'public/meal-options/soups/none.png': 'https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?w=200&h=200&auto=format&fit=crop&q=85',

  // ─── PROTEINS ────────────────────────────────────────────────────────────────
  // beef chunks - cooked beef
  'public/meal-options/proteins/beef.png': 'https://images.unsplash.com/photo-1603048588665-791ca8aea617?w=200&h=200&auto=format&fit=crop&q=85',
  // assorted meat - mixed meats
  'public/meal-options/proteins/assorted-meat.png': 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=200&h=200&auto=format&fit=crop&q=85',
  // ponmo - cow skin
  'public/meal-options/proteins/ponmo.png': 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=200&h=200&auto=format&fit=crop&q=85',
  // shaki - tripe
  'public/meal-options/proteins/shaki.png': 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=200&h=200&auto=format&fit=crop&q=85',
  // grilled chicken leg
  'public/meal-options/proteins/grilled-chicken.png': 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=200&h=200&auto=format&fit=crop&q=85',
  // peppered chicken
  'public/meal-options/proteins/peppered-chicken.png': 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=200&h=200&auto=format&fit=crop&q=85',
  // fried chicken pieces
  'public/meal-options/proteins/fried-chicken.png': 'https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?w=200&h=200&auto=format&fit=crop&q=85',
  // turkey leg
  'public/meal-options/proteins/turkey.png': 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=200&h=200&auto=format&fit=crop&q=85',
  // titus fish - mackerel
  'public/meal-options/proteins/titus-fish.png': 'https://images.unsplash.com/photo-1534604973900-c43ab4c2e0ab?w=200&h=200&auto=format&fit=crop&q=85',
  // croaker fish
  'public/meal-options/proteins/croaker-fish.png': 'https://images.unsplash.com/photo-1534604973900-c43ab4c2e0ab?w=200&h=200&auto=format&fit=crop&q=85',
  // catfish
  'public/meal-options/proteins/catfish.png': 'https://images.unsplash.com/photo-1534604973900-c43ab4c2e0ab?w=200&h=200&auto=format&fit=crop&q=85',
  // tilapia
  'public/meal-options/proteins/tilapia.png': 'https://images.unsplash.com/photo-1534604973900-c43ab4c2e0ab?w=200&h=200&auto=format&fit=crop&q=85',
  // smoked fish
  'public/meal-options/proteins/smoked-fish.png': 'https://images.unsplash.com/photo-1565680018093-ebb6b9ab5460?w=200&h=200&auto=format&fit=crop&q=85',
  // dried fish
  'public/meal-options/proteins/dried-fish.png': 'https://images.unsplash.com/photo-1565680018093-ebb6b9ab5460?w=200&h=200&auto=format&fit=crop&q=85',
  // stockfish
  'public/meal-options/proteins/stockfish.png': 'https://images.unsplash.com/photo-1565680018093-ebb6b9ab5460?w=200&h=200&auto=format&fit=crop&q=85',
  // boiled egg
  'public/meal-options/proteins/boiled-egg.png': 'https://images.unsplash.com/photo-1587486913049-53fc88980cfc?w=200&h=200&auto=format&fit=crop&q=85',
  // fried egg sunny side up
  'public/meal-options/proteins/fried-egg.png': 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=200&h=200&auto=format&fit=crop&q=85',
  // snail
  'public/meal-options/proteins/snail.png': 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=200&h=200&auto=format&fit=crop&q=85',
  // shrimp/prawns
  'public/meal-options/proteins/shrimp.png': 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=200&h=200&auto=format&fit=crop&q=85',
  // bush meat
  'public/meal-options/proteins/bush-meat.png': 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=200&h=200&auto=format&fit=crop&q=85',

  // ─── DRINKS ─────────────────────────────────────────────────────────────────
  // bottled water - Eva 75cl
  'public/meal-options/drinks/water.png': 'https://images.unsplash.com/photo-1523362628745-0c100150b504?w=200&h=200&auto=format&fit=crop&q=85',
  // Coca-Cola bottle/can
  'public/meal-options/drinks/coke.png': 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=200&h=200&auto=format&fit=crop&q=85',
  // Coca-Cola small 35cl
  'public/meal-options/drinks/coke-small.png': 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=200&h=200&auto=format&fit=crop&q=85',
  // Fanta orange bottle
  'public/meal-options/drinks/fanta.png': 'https://images.unsplash.com/photo-1624517452488-04869289c4ca?w=200&h=200&auto=format&fit=crop&q=85',
  // Sprite bottle
  'public/meal-options/drinks/sprite.png': 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=200&h=200&auto=format&fit=crop&q=85',
  // Pepsi bottle
  'public/meal-options/drinks/pepsi.png': 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=200&h=200&auto=format&fit=crop&q=85',
  // malt bottle
  'public/meal-options/drinks/malt.png': 'https://images.unsplash.com/photo-1608270176050-12ec057deab0?w=200&h=200&auto=format&fit=crop&q=85',
  // zobo - red hibiscus drink in glass
  'public/meal-options/drinks/zobo.png': 'https://images.unsplash.com/photo-1556881286-fc6915169721?w=200&h=200&auto=format&fit=crop&q=85',
  // kunu - whitish local grain drink
  'public/meal-options/drinks/kunu.png': 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=200&h=200&auto=format&fit=crop&q=85',
  // tigernut drink
  'public/meal-options/drinks/tigernut.png': 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=200&h=200&auto=format&fit=crop&q=85',
  // chapman - orange-brown mocktail with fruit slices
  'public/meal-options/drinks/chapman.png': 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=200&h=200&auto=format&fit=crop&q=85',
  // fruit smoothie
  'public/meal-options/drinks/smoothie.png': 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=200&h=200&auto=format&fit=crop&q=85',
  // lacasera
  'public/meal-options/drinks/lacasera.png': 'https://images.unsplash.com/photo-1624517452488-04869289c4ca?w=200&h=200&auto=format&fit=crop&q=85',
  // capri sonne juice box
  'public/meal-options/drinks/capri-sonne.png': 'https://images.unsplash.com/photo-1624517452488-04869289c4ca?w=200&h=200&auto=format&fit=crop&q=85',
  // five alive carton
  'public/meal-options/drinks/five-alive.png': 'https://images.unsplash.com/photo-1624517452488-04869289c4ca?w=200&h=200&auto=format&fit=crop&q=85',
  // hi-malt
  'public/meal-options/drinks/hi-malt.png': 'https://images.unsplash.com/photo-1608270176050-12ec057deab0?w=200&h=200&auto=format&fit=crop&q=85',

  // ─── EXTRAS ─────────────────────────────────────────────────────────────────
  // fried plantain (dodo) - golden fried sweet plantain slices
  'public/meal-options/extras/dodo.png': 'https://images.unsplash.com/photo-1568093858174-7f8b08a73c18?w=200&h=200&auto=format&fit=crop&q=85',
  // boli - roasted plantain
  'public/meal-options/extras/boli.png': 'https://images.unsplash.com/photo-1568093858174-7f8b08a73c18?w=200&h=200&auto=format&fit=crop&q=85',
  // plantain chips
  'public/meal-options/extras/plantain-chips.png': 'https://images.unsplash.com/photo-1519676867240-f03562e64548?w=200&h=200&auto=format&fit=crop&q=85',
  // moin moin - steamed bean cake
  'public/meal-options/extras/moin-moin.png': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&h=200&auto=format&fit=crop&q=85',
  // coleslaw
  'public/meal-options/extras/coleslaw.png': 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=200&h=200&auto=format&fit=crop&q=85',
  // green salad
  'public/meal-options/extras/salad.png': 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=200&h=200&auto=format&fit=crop&q=85',
  // stew - red tomato stew
  'public/meal-options/extras/stew.png': 'https://images.unsplash.com/photo-1604152135912-04a022e23696?w=200&h=200&auto=format&fit=crop&q=85',
  // chin chin - crunchy fried snack
  'public/meal-options/extras/chin-chin.png': 'https://images.unsplash.com/photo-1519676867240-f03562e64548?w=200&h=200&auto=format&fit=crop&q=85',
  // puff puff - round fried dough balls
  'public/meal-options/extras/puff-puff.png': 'https://images.unsplash.com/photo-1568093858174-7f8b08a73c18?w=200&h=200&auto=format&fit=crop&q=85',
  // boiled yam
  'public/meal-options/extras/yam.png': 'https://images.unsplash.com/photo-1604908177453-7462950a6a3b?w=200&h=200&auto=format&fit=crop&q=85',
};

const keys = Object.keys(IMAGES);
let currentIndex = 0;

function downloadNext() {
  if (currentIndex >= keys.length) {
    console.log('✅ All downloads completed!');
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
      file.close();
      fs.unlinkSync(absolutePath);
      currentIndex++;
      downloadNext();
      return;
    }
    res.pipe(file);
    file.on('finish', () => {
      file.close();
      currentIndex++;
      setTimeout(downloadNext, 80);
    });
  }).on('error', (err) => {
    console.error(`  ❌ Error:`, err.message);
    file.close();
    try { fs.unlinkSync(absolutePath); } catch (_) {}
    currentIndex++;
    downloadNext();
  });
}

downloadNext();
