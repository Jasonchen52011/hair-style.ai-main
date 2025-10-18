// test-free-usage.js
const fs = require('fs');
const path = require('path');

// 测试1: 验证后端配置
function testBackendConfig() {
  const routePath = path.join(__dirname, 'app/api/submit/route.ts');
  const content = fs.readFileSync(routePath, 'utf8');

  console.log('✅ 测试1: 后端API配置');
  console.log(`   LIFETIME_FREE_LIMIT = 5: ${content.includes('LIFETIME_FREE_LIMIT = 5')}`);
  console.log(`   错误消息更新为5次: ${content.includes('5 free generations')}`);
  console.log('');
}

// 测试2: 验证前端配置
function testFrontendConfig() {
  const pagePath = path.join(__dirname, 'app/ai-hairstyle/page-content.tsx');
  const content = fs.readFileSync(pagePath, 'utf8');

  console.log('✅ 测试2: 前端UI配置');
  console.log(`   初始状态为5: ${content.includes('useState<number>(5)')}`);
  console.log(`   默认值设置为5: ${content.includes('setGuestUsageCount(5)')}`);
  console.log(`   localStorage设置为5: ${content.includes('localStorage.setItem("guest_hairstyle_lifetime_usage_count", "5")')}`);
  console.log('');
}

// 测试3: 验证配置文件
function testConfigFiles() {
  const configPath = path.join(__dirname, 'app/barbershop/config.json');
  const content = fs.readFileSync(configPath, 'utf8');
  const config = JSON.parse(content);

  console.log('✅ 测试3: 配置文件');
  const description = config.whyChooseSection.features[0].description;
  console.log(`   描述文字包含5次: ${description.includes('5 free style previews')}`);
  console.log('');
}

function runAllTests() {
  console.log('🚀 开始验证免费使用次数修改...\n');

  try {
    testBackendConfig();
    testFrontendConfig();
    testConfigFiles();

    console.log('🎉 所有配置验证完成！');
    console.log('📝 请手动进行功能测试以验证完整流程。');

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

runAllTests();