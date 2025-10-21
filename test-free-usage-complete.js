#!/usr/bin/env node

/**
 * 用户终身免费五次逻辑的完整测试套件
 * 发现了多个关键问题，需要验证
 */

// 模拟 API 调用的辅助函数
class MockAPITester {
  constructor() {
    this.testResults = [];
    this.currentIP = "192.168.1.100";
    this.lifetimeUsage = new Map(); // 模拟内存存储
    this.globalDailyUsage = new Map(); // 模拟全局使用统计
    this.chargedTasks = new Set(); // 模拟已扣费任务
  }

  // 记录测试结果
  log(test, result, details = '') {
    this.testResults.push({ test, result, details });
    console.log(`${result === 'PASS' ? '✅' : '❌'} ${test}: ${result}`);
    if (details) console.log(`    详情: ${details}`);
  }

  // 模拟未登录用户提交任务
  async simulateGuestSubmission(taskId, expectedSuccess = true) {
    const currentUsage = this.lifetimeUsage.get(this.currentIP) || 0;
    const LIFETIME_LIMIT = 5;

    if (currentUsage >= LIFETIME_LIMIT) {
      return {
        success: false,
        error: `You have used your ${LIFETIME_LIMIT} free generations. Please sign in and subscribe to continue unlimited generation!`,
        errorType: 'lifetime_limit'
      };
    }

    // 模拟任务创建成功
    return {
      success: true,
      taskId,
      status: 'processing',
      requiresSubscription: true
    };
  }

  // 模拟任务完成并扣除免费次数
  async simulateTaskCompletion(taskId, isSuccess = true) {
    if (!isSuccess) {
      return { success: false, status: 'FAILED' };
    }

    const today = new Date().toISOString().split('T')[0];
    const currentUsage = this.lifetimeUsage.get(this.currentIP) || 0;
    const globalUsage = this.globalDailyUsage.get(today) || 0;

    // 扣除免费次数
    this.lifetimeUsage.set(this.currentIP, currentUsage + 1);
    this.globalDailyUsage.set(today, globalUsage + 1);
    this.chargedTasks.add(taskId);

    return {
      success: true,
      status: 'SUCCESS',
      freeUsageDeducted: 1,
      lifetimeUsageRemaining: 5 - (currentUsage + 1),
      globalFreeUsageRemaining: 2000 - (globalUsage + 1)
    };
  }

  // 获取当前IP的使用次数
  getCurrentUsage() {
    return this.lifetimeUsage.get(this.currentIP) || 0;
  }

  // 重置测试状态
  reset() {
    this.lifetimeUsage.clear();
    this.globalDailyUsage.clear();
    this.chargedTasks.clear();
  }
}

// 测试用例定义
async function runFreeUsageTests() {
  console.log('🔍 ===== 用户终身免费五次逻辑完整测试 =====\n');

  const tester = new MockAPITester();

  console.log('📋 测试场景 1: 基本免费额度验证');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // 测试1.1: 未使用过的用户应该能成功提交
  tester.reset();
  let result = await tester.simulateGuestSubmission('task_1');
  tester.log(
    '1.1 新用户首次提交',
    result.success ? 'PASS' : 'FAIL',
    `预期: 成功, 实际: ${result.success ? '成功' : '失败'}`
  );

  // 测试1.2: 完成5次任务后的状态
  for (let i = 2; i <= 5; i++) {
    await tester.simulateGuestSubmission(`task_${i}`);
    await tester.simulateTaskCompletion(`task_${i}`);
  }

  const usageAfter5 = tester.getCurrentUsage();
  tester.log(
    '1.2 使用5次后的计数',
    usageAfter5 === 5 ? 'PASS' : 'FAIL',
    `预期: 5, 实际: ${usageAfter5}`
  );

  // 测试1.3: 第6次提交应该被拒绝
  result = await tester.simulateGuestSubmission('task_6');
  tester.log(
    '1.3 超出限制后提交',
    !result.success && result.errorType === 'lifetime_limit' ? 'PASS' : 'FAIL',
    `预期: 被拒绝, 实际: ${result.success ? '成功' : '被拒绝'}`
  );

  console.log('\n📋 测试场景 2: 边界条件测试');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // 测试2.1: 恰好使用5次的情况
  tester.reset();
  for (let i = 1; i <= 4; i++) {
    await tester.simulateGuestSubmission(`task_${i}`);
    await tester.simulateTaskCompletion(`task_${i}`);
  }

  // 第5次提交应该还能成功
  result = await tester.simulateGuestSubmission('task_5');
  tester.log(
    '2.1 第5次提交是否成功',
    result.success ? 'PASS' : 'FAIL',
    `预期: 成功, 实际: ${result.success ? '成功' : '失败'}`
  );

  // 完成第5次任务
  await tester.simulateTaskCompletion('task_5');

  // 第6次提交应该失败
  result = await tester.simulateGuestSubmission('task_6');
  tester.log(
    '2.2 第6次提交是否被拒绝',
    !result.success ? 'PASS' : 'FAIL',
    `预期: 被拒绝, 实际: ${result.success ? '成功' : '被拒绝'}`
  );

  console.log('\n📋 测试场景 3: 逻辑漏洞检测');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // 测试3.1: 任务提交后但未完成时的计数
  tester.reset();
  await tester.simulateGuestSubmission('task_pending');
  const usageAfterSubmission = tester.getCurrentUsage();
  tester.log(
    '3.1 提交后未完成时的计数',
    usageAfterSubmission === 0 ? 'PASS' : 'FAIL',
    `预期: 0 (未完成不应扣除), 实际: ${usageAfterSubmission}`
  );

  // 测试3.2: 任务失败后不应扣除次数
  await tester.simulateTaskCompletion('task_pending', false);
  const usageAfterFailure = tester.getCurrentUsage();
  tester.log(
    '3.2 任务失败后计数不变',
    usageAfterFailure === 0 ? 'PASS' : 'FAIL',
    `预期: 0, 实际: ${usageAfterFailure}`
  );

  // 测试3.3: 重复扣除检测
  await tester.simulateGuestSubmission('task_success');
  await tester.simulateTaskCompletion('task_success', true);

  // 尝试再次扣除同一个任务
  const duplicateResult = await tester.simulateTaskCompletion('task_success', true);
  const usageAfterDuplicate = tester.getCurrentUsage();
  tester.log(
    '3.3 重复任务完成处理',
    usageAfterDuplicate === 1 ? 'PASS' : 'FAIL',
    `预期: 1 (不应重复扣除), 实际: ${usageAfterDuplicate}`
  );

  console.log('\n📋 测试场景 4: 实际代码逻辑问题');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // 问题1: 内存存储在服务器重启后会丢失
  tester.log(
    '4.1 内存存储持久性',
    'FAIL',
    '问题: 使用Map存储lifetimeUsageCounts，服务器重启后数据丢失'
  );

  // 问题2: IP地址可能被绕过
  tester.log(
    '4.2 IP地址限制绕过',
    'FAIL',
    '问题: 用户可通过VPN、代理、更换网络等方式绕过IP限制'
  );

  // 问题3: 共享IP环境的问题
  tester.log(
    '4.3 共享IP环境影响',
    'FAIL',
    '问题: 公司、学校、咖啡馆等共享网络环境会影响其他用户'
  );

  // 问题4: 前端和后端状态不同步
  tester.log(
    '4.4 前后端状态同步',
    'FAIL',
    '问题: 前端localStorage和后端Map状态可能不一致'
  );

  console.log('\n📋 测试场景 5: 安全性测试');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // 测试5.1: 批量注册攻击
  tester.log(
    '5.1 批量注册攻击防护',
    'FAIL',
    '问题: 缺乏对单个IP大量创建任务的频率限制'
  );

  // 测试5.2: 恶意请求消耗
  tester.log(
    '5.2 资源消耗防护',
    'PARTIAL',
    '部分防护: 有全局每日限制，但缺乏单IP频率限制'
  );

  console.log('\n📊 测试总结');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const passCount = tester.testResults.filter(r => r.result === 'PASS').length;
  const failCount = tester.testResults.filter(r => r.result === 'FAIL').length;
  const partialCount = tester.testResults.filter(r => r.result === 'PARTIAL').length;
  const totalTests = tester.testResults.length;

  console.log(`✅ 通过: ${passCount}/${totalTests}`);
  console.log(`❌ 失败: ${failCount}/${totalTests}`);
  console.log(`⚠️  部分通过: ${partialCount}/${totalTests}`);
  console.log(`📈 成功率: ${((passCount / totalTests) * 100).toFixed(1)}%`);

  return {
    totalTests,
    passCount,
    failCount,
    partialCount,
    successRate: (passCount / totalTests) * 100,
    criticalIssues: [
      '内存存储不持久',
      'IP限制可绕过',
      '共享IP环境影响',
      '前后端状态可能不同步',
      '缺乏单IP频率限制'
    ]
  };
}

// 生成问题报告
function generateIssueReport(testResults) {
  console.log('\n🚨 发现的关键问题报告');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  console.log('\n1. 📊 数据持久性问题:');
  console.log('   - 当前使用内存Map存储用户使用次数');
  console.log('   - 服务器重启后所有用户的免费次数会重置');
  console.log('   - 用户可以通过刷新服务器来重置免费次数');

  console.log('\n2. 🔐 安全限制问题:');
  console.log('   - 仅通过IP地址限制用户，容易被绕过');
  console.log('   - VPN、代理、更换网络都可以重置免费次数');
  console.log('   - 缺乏设备指纹或其他更可靠的用户识别方式');

  console.log('\n3. 🌐 网络环境问题:');
  console.log('   - 共享网络环境(公司、学校)会影响其他用户');
  console.log('   - 移动网络IP地址可能频繁变更');
  console.log('   - NAT网络背后的多个用户会被视为同一用户');

  console.log('\n4. 🔄 状态同步问题:');
  console.log('   - 前端localStorage和后端Map状态可能不一致');
  console.log('   - 用户可以手动修改localStorage来绕过限制');
  console.log('   - 缺乏状态校验机制');

  console.log('\n💡 建议的解决方案:');
  console.log('   1. 使用数据库存储用户使用记录，而非内存');
  console.log('   2. 实现基于用户账户的免费额度系统');
  console.log('   3. 添加设备指纹识别作为辅助限制');
  console.log('   4. 实现更智能的异常检测机制');
  console.log('   5. 添加前端状态校验和后端验证');
}

// 主执行函数
async function main() {
  try {
    const testResults = await runFreeUsageTests();
    generateIssueReport(testResults);

    console.log('\n' + '='.repeat(60));
    if (testResults.successRate < 80) {
      console.log('⚠️  测试结果: 存在严重问题，需要立即修复');
      console.log(`🔢 发现 ${testResults.criticalIssues.length} 个关键问题`);
    } else {
      console.log('✅ 测试结果: 基本通过，但仍有改进空间');
    }
    console.log('='.repeat(60));

    process.exit(testResults.successRate < 80 ? 1 : 0);
  } catch (error) {
    console.error('❌ 测试执行失败:', error);
    process.exit(1);
  }
}

// 如果直接运行此文件
if (require.main === module) {
  main();
}

module.exports = { runFreeUsageTests, generateIssueReport };