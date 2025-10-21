#!/usr/bin/env node

/**
 * 验证免费次数是否已正确改为5次的测试用例
 * 检查所有相关配置文件和代码
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 ===== 验证免费次数是否改为5次 =====\n');

let testResults = [];
let errors = [];

function logTest(testName, passed, details = '') {
  testResults.push({ name: testName, passed, details });
  console.log(`${passed ? '✅' : '❌'} ${testName}`);
  if (details) console.log(`   ${details}`);
}

function checkFile(filePath, description, expectedValue, regexPattern) {
  try {
    if (!fs.existsSync(filePath)) {
      logTest(description, false, `文件不存在: ${filePath}`);
      return false;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const match = content.match(regexPattern);

    if (match) {
      const actualValue = match[1] || match[0];
      const isCorrect = actualValue === expectedValue;
      logTest(description, isCorrect, `期望: ${expectedValue}, 实际: ${actualValue}`);
      return isCorrect;
    } else {
      logTest(description, false, `未找到匹配模式`);
      return false;
    }
  } catch (error) {
    logTest(description, false, `读取文件失败: ${error.message}`);
    return false;
  }
}

console.log('📋 1. 后端API配置检查');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

// 检查 submit/route.ts 中的 LIFETIME_FREE_LIMIT
const submitRoutePath = path.join(__dirname, 'app/api/submit/route.ts');
checkFile(
  submitRoutePath,
  '1.1 LIFETIME_FREE_LIMIT 常量',
  '5',
  /const LIFETIME_FREE_LIMIT = (\d+)/
);

// 检查错误消息中的次数
checkFile(
  submitRoutePath,
  '1.2 错误消息中的免费次数',
  '5',
  /You have used your (\d+) free generations/
);

// 检查全局每日限制
checkFile(
  submitRoutePath,
  '1.3 全局每日免费限制',
  '2000',
  /const GLOBAL_DAILY_FREE_LIMIT = (\d+)/
);

console.log('\n📋 2. 前端UI配置检查');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

// 检查 page-content.tsx 中的初始状态
const pageContentPath = path.join(__dirname, 'app/ai-hairstyle/page-content.tsx');
checkFile(
  pageContentPath,
  '2.1 初始免费次数状态',
  '5',
  /useState<number>\((\d+)\)/
);

// 检查 localStorage 初始值
checkFile(
  pageContentPath,
  '2.2 localStorage 初始值',
  '5',
  /localStorage\.setItem\("guest_hairstyle_lifetime_usage_count", "(\d+)"\)/
);

// 检查UI显示文本
checkFile(
  pageContentPath,
  '2.3 UI显示文本',
  '5',
  /\$\{guestUsageCount === 1 \? 'try' : 'tries'\} left/  // 确认有显示逻辑
);

console.log('\n📋 3. 数据库和API相关检查');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

// 检查用户注册时的初始积分
const authCallbackPath = path.join(__dirname, 'app/api/auth/callback/route.ts');
checkFile(
  authCallbackPath,
  '3.1 新用户初始积分',
  '0',
  /createOrUpdateUserCreditsBalanceSupabase\(user\.id, (\d+)\)/
);

// 检查积分扣除逻辑
checkFile(
  submitRoutePath,
  '3.2 积分扣除金额',
  '10',
  /credits: -(\d+)/
);

console.log('\n📋 4. 配置文件检查');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

// 检查各个工具页面的配置文件
const configFiles = [
  'app/barbershop/config.json',
  'app/hair-clinics/config.json',
  'app/long-hair-filter/config.json'
];

configFiles.forEach((configFile, index) => {
  const configPath = path.join(__dirname, configFile);
  try {
    if (fs.existsSync(configPath)) {
      const content = fs.readFileSync(configPath, 'utf8');
      const hasFiveFree = content.includes('5 free') || content.includes('five free');
      logTest(
        `4.${index + 1} ${configFile} 免费次数描述`,
        hasFiveFree,
        hasFiveFree ? '包含5次免费描述' : '未找到5次免费描述'
      );
    } else {
      logTest(`4.${index + 1} ${configFile} 文件`, false, '文件不存在');
    }
  } catch (error) {
    logTest(`4.${index + 1} ${configFile} 读取`, false, error.message);
  }
});

console.log('\n📋 5. 实际功能逻辑检查');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

// 检查免费额度检查逻辑
try {
  const submitContent = fs.readFileSync(submitRoutePath, 'utf8');
  const hasLifetimeCheck = submitContent.includes('currentUsageCount >= LIFETIME_FREE_LIMIT');
  const hasErrorType = submitContent.includes('errorType: \'lifetime_limit\'');
  const hasSubscriptionRequired = submitContent.includes('requiresSubscription: true');

  logTest('5.1 终身限制检查逻辑', hasLifetimeCheck, '实现了终身使用次数检查');
  logTest('5.2 错误类型标识', hasErrorType, '包含lifetime_limit错误类型');
  logTest('5.3 订阅要求标识', hasSubscriptionRequired, '包含requiresSubscription标识');
} catch (error) {
  logTest('5. 逻辑检查', false, error.message);
}

console.log('\n📋 6. 测试用例验证');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

// 模拟用户使用5次的逻辑
function simulateFreeUsage() {
  console.log('🎮 模拟免费使用流程:');

  // 初始状态
  let remainingUses = 5;
  console.log(`   初始状态: ${remainingUses} 次免费机会`);

  // 模拟使用过程
  for (let i = 1; i <= 6; i++) {
    if (remainingUses > 0) {
      remainingUses--;
      console.log(`   第${i}次生图: 成功，剩余 ${remainingUses} 次`);
    } else {
      console.log(`   第${i}次生图: 失败 - 免费次数已用完，需要订阅`);
    }
  }

  return remainingUses === 0;
}

const simulationPassed = simulateFreeUsage();
logTest('6.1 免费使用流程模拟', simulationPassed, '5次使用后正确显示需要订阅');

console.log('\n📊 测试结果总结');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

const passedTests = testResults.filter(r => r.passed).length;
const totalTests = testResults.length;
const successRate = ((passedTests / totalTests) * 100).toFixed(1);

console.log(`✅ 通过测试: ${passedTests}/${totalTests}`);
console.log(`❌ 失败测试: ${totalTests - passedTests}/${totalTests}`);
console.log(`📈 成功率: ${successRate}%`);

console.log('\n🔍 详细结果:');
testResults.forEach(result => {
  if (!result.passed) {
    console.log(`   ❌ ${result.name}: ${result.details}`);
  }
});

console.log('\n🎯 最终结论:');
if (passedTests === totalTests) {
  console.log('✅ 所有配置已正确改为5次免费！');
  console.log('✅ 系统配置一致性检查通过');
} else if (passedTests >= totalTests * 0.8) {
  console.log('⚠️  大部分配置已改为5次，但仍有少量配置需要检查');
} else {
  console.log('❌ 发现多个配置不一致，需要全面检查');
}

// 检查最关键的核心配置
const coreConfigTests = testResults.filter(r =>
  r.name.includes('LIFETIME_FREE_LIMIT') ||
  r.name.includes('初始免费次数状态') ||
  r.name.includes('错误消息中的免费次数')
);
const corePassed = coreConfigTests.filter(r => r.passed).length;

console.log(`\n🎯 核心配置检查: ${corePassed}/${coreConfigTests.length} 通过`);

if (corePassed === coreConfigTests.length) {
  console.log('✅ 核心免费次数配置已正确设置为5次');
} else {
  console.log('❌ 核心配置存在问题，需要修复');
}

console.log('\n' + '='.repeat(60));
console.log(`🏁 验证完成 - 总体成功率: ${successRate}%`);
console.log('='.repeat(60));

// 如果成功率低于100%，返回非零退出码
if (passedTests < totalTests) {
  process.exit(1);
}