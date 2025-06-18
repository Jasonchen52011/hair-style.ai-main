const sharp = require('sharp');
const fs = require('fs');

// optimize Hero image
async function optimizeHeroImage() {
  try {
    // create optimized directory
    if (!fs.existsSync('public/images/optimized/hero')) {
      fs.mkdirSync('public/images/optimized/hero', { recursive: true });
    }
    
    console.log('🚀 Starting hero image optimization...');
    
    // optimize hero4.jpg to WebP format
    await sharp('public/images/hero/hero4.jpg')
      .resize(700, 700, {
        fit: 'cover',
        position: 'center'
      })
      .webp({ quality: 85 })
      .toFile('public/images/optimized/hero/hero4.webp');
    
    console.log('✅ Hero image optimized: hero4.webp');
    
    // also create a smaller version for preload
    await sharp('public/images/hero/hero4.jpg')
      .resize(350, 350, {
        fit: 'cover',
        position: 'center'
      })
      .webp({ quality: 80 })
      .toFile('public/images/optimized/hero/hero4-small.webp');
    
    console.log('✅ Hero image small version optimized: hero4-small.webp');
    
    // check file size comparison
    const originalStats = fs.statSync('public/images/hero/hero4.jpg');
    const optimizedStats = fs.statSync('public/images/optimized/hero/hero4.webp');
    const smallStats = fs.statSync('public/images/optimized/hero/hero4-small.webp');
    
    console.log(`📊 Original size: ${Math.round(originalStats.size / 1024)}KB`);
    console.log(`📊 Optimized size: ${Math.round(optimizedStats.size / 1024)}KB`);
    console.log(`📊 Small size: ${Math.round(smallStats.size / 1024)}KB`);
    console.log(`🎯 Size reduction: ${Math.round((1 - optimizedStats.size / originalStats.size) * 100)}%`);
    
  } catch (error) {
    console.error('❌ Error optimizing hero image:', error.message);
  }
}

optimizeHeroImage(); 