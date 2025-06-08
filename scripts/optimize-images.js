const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// 优化配置
const config = {
  hairstyles: {
    // 发型预览图 - 小尺寸高质量
    small: { width: 200, height: 200, quality: 80 },
    // 发型详情图 - 中等尺寸
    medium: { width: 400, height: 400, quality: 75 },
    // 大图显示
    large: { width: 800, height: 800, quality: 70 }
  },
  hero: {
    // 首页英雄图
    desktop: { width: 1200, height: 800, quality: 75 },
    tablet: { width: 768, height: 512, quality: 75 },
    mobile: { width: 375, height: 250, quality: 80 }
  },
  steps: {
    // 步骤说明图
    default: { width: 400, height: 300, quality: 75 }
  }
};

// 创建优化后的图片目录
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// 优化单个图片
const optimizeImage = async (inputPath, outputPath, options) => {
  try {
    const { width, height, quality } = options;
    
    await sharp(inputPath)
      .resize(width, height, { 
        fit: 'cover',
        position: 'center'
      })
      .webp({ quality, effort: 6 })
      .toFile(outputPath.replace(/\.(jpg|jpeg|png)$/i, '.webp'));
    
    // 同时生成AVIF格式（更小）
    await sharp(inputPath)
      .resize(width, height, { 
        fit: 'cover',
        position: 'center'
      })
      .avif({ quality: quality - 5, effort: 9 })
      .toFile(outputPath.replace(/\.(jpg|jpeg|png)$/i, '.avif'));
    
    console.log(`✓ Optimized: ${path.basename(inputPath)} -> ${width}x${height}`);
  } catch (error) {
    console.error(`✗ Error optimizing ${inputPath}:`, error.message);
  }
};

// 批量优化发型图片
const optimizeHairstyles = async () => {
  const hairstylesDir = path.join(__dirname, '../public/images/hairstyles');
  const optimizedDir = path.join(__dirname, '../public/images/optimized/hairstyles');
  
  ensureDir(optimizedDir);
  ensureDir(path.join(optimizedDir, 'female'));
  ensureDir(path.join(optimizedDir, 'male'));
  
  const processDir = async (category) => {
    const categoryDir = path.join(hairstylesDir, category);
    const files = fs.readdirSync(categoryDir);
    
    for (const file of files) {
      if (!/\.(jpg|jpeg|png)$/i.test(file)) continue;
      
      const inputPath = path.join(categoryDir, file);
      const basename = path.parse(file).name;
      
      // 生成多种尺寸
      for (const [size, options] of Object.entries(config.hairstyles)) {
        const outputDir = path.join(optimizedDir, category, size);
        ensureDir(outputDir);
        
        const outputPath = path.join(outputDir, `${basename}.webp`);
        await optimizeImage(inputPath, outputPath, options);
      }
    }
  };
  
  await processDir('female');
  await processDir('male');
};

// 优化其他图片
const optimizeOtherImages = async () => {
  const imagesDir = path.join(__dirname, '../public/images');
  const optimizedDir = path.join(__dirname, '../public/images/optimized');
  
  // 优化英雄图片
  const heroDir = path.join(imagesDir, 'hero');
  if (fs.existsSync(heroDir)) {
    const heroOptimizedDir = path.join(optimizedDir, 'hero');
    ensureDir(heroOptimizedDir);
    
    const heroFiles = fs.readdirSync(heroDir);
    for (const file of heroFiles) {
      if (!/\.(jpg|jpeg|png)$/i.test(file)) continue;
      
      const inputPath = path.join(heroDir, file);
      const basename = path.parse(file).name;
      
      for (const [size, options] of Object.entries(config.hero)) {
        const outputPath = path.join(heroOptimizedDir, `${basename}-${size}.webp`);
        await optimizeImage(inputPath, outputPath, options);
      }
    }
  }
  
  // 优化步骤图片
  const stepsDir = path.join(imagesDir, 'steps');
  if (fs.existsSync(stepsDir)) {
    const stepsOptimizedDir = path.join(optimizedDir, 'steps');
    ensureDir(stepsOptimizedDir);
    
    const stepFiles = fs.readdirSync(stepsDir);
    for (const file of stepFiles) {
      if (!/\.(jpg|jpeg|png)$/i.test(file)) continue;
      
      const inputPath = path.join(stepsDir, file);
      const outputPath = path.join(stepsOptimizedDir, file);
      await optimizeImage(inputPath, outputPath, config.steps.default);
    }
  }
};

// 生成优化报告
const generateReport = () => {
  const originalDir = path.join(__dirname, '../public/images');
  const optimizedDir = path.join(__dirname, '../public/images/optimized');
  
  const getDirectorySize = (dir) => {
    let totalSize = 0;
    const files = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const file of files) {
      const filePath = path.join(dir, file.name);
      if (file.isDirectory()) {
        totalSize += getDirectorySize(filePath);
      } else {
        totalSize += fs.statSync(filePath).size;
      }
    }
    return totalSize;
  };
  
  const originalSize = getDirectorySize(originalDir);
  const optimizedSize = fs.existsSync(optimizedDir) ? getDirectorySize(optimizedDir) : 0;
  const savings = originalSize - optimizedSize;
  const savingsPercent = ((savings / originalSize) * 100).toFixed(1);
  
  console.log('\n📊 优化报告:');
  console.log(`原始大小: ${(originalSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`优化后大小: ${(optimizedSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`节省空间: ${(savings / 1024 / 1024).toFixed(2)} MB (${savingsPercent}%)`);
};

// 主函数
const main = async () => {
  console.log('🚀 开始图片优化...\n');
  
  try {
    await optimizeHairstyles();
    await optimizeOtherImages();
    generateReport();
    
    console.log('\n✅ 图片优化完成！');
    console.log('💡 建议: 使用优化后的图片替换原图片以获得最佳性能');
  } catch (error) {
    console.error('❌ 优化过程中出现错误:', error);
  }
};

// 检查Sharp是否已安装
try {
  require('sharp');
  main();
} catch (error) {
  console.error('❌ Sharp未安装，请运行: npm install sharp --save-dev');
} 