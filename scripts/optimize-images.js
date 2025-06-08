const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// 配置
const sizes = {
  small: { width: 100, height: 100, quality: 70 },
  medium: { width: 200, height: 200, quality: 75 },
  large: { width: 400, height: 400, quality: 80 }
};

const inputDir = 'public/images/hairstyles';
const outputDir = 'public/images/optimized/hairstyles';

// 创建输出目录
function createDirs() {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // 创建子目录
  const categories = ['female', 'male'];
  categories.forEach(category => {
    Object.keys(sizes).forEach(size => {
      const dir = path.join(outputDir, category, size);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  });
}

// 优化单个图片
async function optimizeImage(inputPath, outputPath, config) {
  try {
    await sharp(inputPath)
      .resize(config.width, config.height, {
        fit: 'cover',
        position: 'center'
      })
      .webp({ quality: config.quality })
      .toFile(outputPath);
    
    console.log(`✅ Optimized: ${outputPath}`);
  } catch (error) {
    console.error(`❌ Error optimizing ${inputPath}:`, error.message);
  }
}

// 处理目录中的所有图片
async function processDirectory(categoryDir) {
  const files = fs.readdirSync(categoryDir);
  
  for (const file of files) {
    if (file.toLowerCase().endsWith('.jpg') || file.toLowerCase().endsWith('.jpeg')) {
      const inputPath = path.join(categoryDir, file);
      const fileName = path.parse(file).name;
      const category = path.basename(categoryDir);
      
      // 为每个尺寸生成优化版本
      for (const [sizeName, config] of Object.entries(sizes)) {
        const outputPath = path.join(outputDir, category, sizeName, `${fileName}.webp`);
        await optimizeImage(inputPath, outputPath, config);
      }
    }
  }
}

// 主函数
async function main() {
  console.log('🚀 Starting image optimization...');
  
  createDirs();
  
  // 处理女性和男性发型图片
  const categories = ['female', 'male'];
  for (const category of categories) {
    const categoryPath = path.join(inputDir, category);
    if (fs.existsSync(categoryPath)) {
      console.log(`\n📁 Processing ${category} hairstyles...`);
      await processDirectory(categoryPath);
    }
  }
  
  console.log('\n✨ Image optimization completed!');
}

// 检查 sharp 是否安装
try {
  require('sharp');
  main().catch(console.error);
} catch (error) {
  console.error('❌ Sharp is not installed. Please run: npm install sharp --save-dev');
  process.exit(1);
} 