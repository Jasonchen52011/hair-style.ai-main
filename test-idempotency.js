#!/usr/bin/env node

/**
 * 幂等性测试脚本
 * 测试三种产品 (按次购买、月度订阅、年度订阅) 的幂等性
 */

const axios = require('axios');
const { performance } = require('perf_hooks');

// 配置
const CONFIG = {
  // 测试环境
  BASE_URL: process.env.TEST_BASE_URL || 'http://localhost:3000',
  
  // 产品配置 (与config.ts保持一致)
  PRODUCTS: {
    onetime: {
      id: 'prod_7kbzeBzBsEnWbRA0iTh7wf',
      name: '按次购买',
      expectedCredits: 500
    },
    monthly: {
      id: 'prod_6OoADdBXIm16LRR6TN6sFw', 
      name: '月度订阅',
      expectedCredits: 500
    },
    yearly: {
      id: 'prod_6N9SkBhig3ofomadscbGr7',
      name: '年度订阅',
      expectedCredits: 1000
    }
  },
  
  // 测试配置
  TEST_CONFIG: {
    REPEAT_COUNT: 5,           // 重复次数
    CONCURRENT_COUNT: 3,       // 并发数量
    DELAY_MS: 1000,           // 请求间隔
    TIMEOUT_MS: 30000         // 请求超时
  }
};

// 测试统计
let testResults = {
  summary: {
    totalTests: 0,
    passedTests: 0,
    failedTests: 0,
    startTime: null,
    endTime: null
  },
  products: {}
};

// 日志工具
const logger = {
  info: (msg) => console.log(`ℹ️  [INFO] ${new Date().toISOString()} ${msg}`),
  success: (msg) => console.log(`✅ [SUCCESS] ${new Date().toISOString()} ${msg}`),
  warning: (msg) => console.log(`⚠️  [WARNING] ${new Date().toISOString()} ${msg}`),
  error: (msg) => console.log(`❌ [ERROR] ${new Date().toISOString()} ${msg}`),
  test: (msg) => console.log(`🧪 [TEST] ${new Date().toISOString()} ${msg}`)
};

// 生成测试用户ID
function generateTestUserId() {
  return `test-user-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
}

// 生成订单ID
function generateOrderId() {
  return `order-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// 发送购买请求
async function sendPurchaseRequest(productId, userId, requestIndex = 1) {
  const startTime = performance.now();
  
  try {
    const response = await axios.get(
      `${CONFIG.BASE_URL}/api/test/buy-product`,
      {
        params: { productId, userId },
        timeout: CONFIG.TEST_CONFIG.TIMEOUT_MS,
        validateStatus: () => true // 接受所有状态码
      }
    );
    
    const endTime = performance.now();
    const duration = Math.round(endTime - startTime);
    
    return {
      requestIndex,
      status: response.status,
      data: response.data,
      duration,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    const endTime = performance.now();
    const duration = Math.round(endTime - startTime);
    
    return {
      requestIndex,
      status: 'ERROR',
      error: error.message,
      duration,
      timestamp: new Date().toISOString()
    };
  }
}

// 发送Webhook请求
async function sendWebhookRequest(orderId, productId, userId, requestIndex = 1) {
  const webhookData = {
    event_type: 'payment.succeeded',
    // 直接放在顶层，匹配webhook的提取逻辑
    customer: { id: userId },
    product_id: productId,
    order_id: orderId,
    subscription_id: `sub_${orderId}`,
    checkout_id: `checkout_${orderId}`,
    status: 'paid'
  };

  const startTime = performance.now();
  
  try {
    const response = await axios.post(
      `${CONFIG.BASE_URL}/api/creem/webhook`,
      webhookData,
      {
        timeout: CONFIG.TEST_CONFIG.TIMEOUT_MS,
        validateStatus: () => true,
        headers: { 'Content-Type': 'application/json' }
      }
    );
    
    const endTime = performance.now();
    const duration = Math.round(endTime - startTime);
    
    return {
      requestIndex,
      status: response.status,
      data: response.data,
      duration,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    const endTime = performance.now();
    const duration = Math.round(endTime - startTime);
    
    return {
      requestIndex,
      status: 'ERROR', 
      error: error.message,
      duration,
      timestamp: new Date().toISOString()
    };
  }
}

// 测试单个产品的购买幂等性
async function testPurchaseIdempotency(productType) {
  const product = CONFIG.PRODUCTS[productType];
  const userId = generateTestUserId();
  
  logger.test(`开始测试 ${product.name} 购买幂等性`);
  logger.info(`产品ID: ${product.id}, 用户ID: ${userId}`);
  
  const results = [];
  
  // 顺序请求测试
  logger.info(`开始顺序请求测试 (${CONFIG.TEST_CONFIG.REPEAT_COUNT} 次)`);
  for (let i = 0; i < CONFIG.TEST_CONFIG.REPEAT_COUNT; i++) {
    const result = await sendPurchaseRequest(product.id, userId, i + 1);
    results.push(result);
    
    if (result.status === 'ERROR') {
      logger.error(`请求 ${i + 1} 失败: ${result.error}`);
    } else if (result.status === 200) {
      logger.success(`请求 ${i + 1} 成功 (${result.duration}ms)`);
    } else if (result.status === 403) {
      logger.warning(`请求 ${i + 1} 被阻止: ${result.data.error || 'Forbidden'} (${result.duration}ms)`);
    } else {
      logger.warning(`请求 ${i + 1} 状态码: ${result.status} (${result.duration}ms)`);
    }
    
    // 请求间隔
    if (i < CONFIG.TEST_CONFIG.REPEAT_COUNT - 1) {
      await new Promise(resolve => setTimeout(resolve, CONFIG.TEST_CONFIG.DELAY_MS));
    }
  }
  
  // 并发请求测试
  logger.info(`开始并发请求测试 (${CONFIG.TEST_CONFIG.CONCURRENT_COUNT} 个并发)`);
  const concurrentPromises = [];
  for (let i = 0; i < CONFIG.TEST_CONFIG.CONCURRENT_COUNT; i++) {
    concurrentPromises.push(sendPurchaseRequest(product.id, userId, `concurrent-${i + 1}`));
  }
  
  const concurrentResults = await Promise.allSettled(concurrentPromises);
  const successfulConcurrent = concurrentResults.filter(
    r => r.status === 'fulfilled' && r.value.status === 200
  ).length;
  
  results.push(...concurrentResults.map(r => r.status === 'fulfilled' ? r.value : { error: r.reason?.message }));
  
  // 分析结果
  const analysis = analyzePurchaseResults(results, product.name);
  testResults.products[productType] = {
    type: 'purchase',
    product: product.name,
    results,
    analysis,
    concurrentSuccessCount: successfulConcurrent
  };
  
  logger.test(`${product.name} 购买测试完成`);
  return analysis;
}

// 测试Webhook幂等性
async function testWebhookIdempotency(productType) {
  const product = CONFIG.PRODUCTS[productType];
  const userId = generateTestUserId();
  const orderId = generateOrderId();
  
  logger.test(`开始测试 ${product.name} Webhook幂等性`);
  logger.info(`订单ID: ${orderId}, 产品ID: ${product.id}`);
  
  const results = [];
  
  // 发送多次相同的webhook
  for (let i = 0; i < CONFIG.TEST_CONFIG.REPEAT_COUNT; i++) {
    const result = await sendWebhookRequest(orderId, product.id, userId, i + 1);
    results.push(result);
    
    if (result.status === 'ERROR') {
      logger.error(`Webhook ${i + 1} 失败: ${result.error}`);
    } else if (result.status === 200) {
      if (result.data.alreadyProcessed) {
        logger.success(`Webhook ${i + 1} 幂等性正确: 已处理订单 (${result.duration}ms)`);
      } else {
        logger.info(`Webhook ${i + 1} 处理成功 (${result.duration}ms)`);
      }
    } else {
      logger.warning(`Webhook ${i + 1} 状态码: ${result.status} (${result.duration}ms)`);
    }
    
    // 短暂延迟
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // 分析结果
  const analysis = analyzeWebhookResults(results, product.name);
  testResults.products[`${productType}_webhook`] = {
    type: 'webhook',
    product: product.name,
    orderId,
    results,
    analysis
  };
  
  logger.test(`${product.name} Webhook测试完成`);
  return analysis;
}

// 分析购买请求结果
function analyzePurchaseResults(results, productName) {
  const successful = results.filter(r => r.status === 200).length;
  const forbidden = results.filter(r => r.status === 403).length;
  const errors = results.filter(r => r.status === 'ERROR' || (r.status && r.status >= 400 && r.status !== 403)).length;
  
  const avgDuration = results
    .filter(r => r.duration)
    .reduce((sum, r) => sum + r.duration, 0) / results.filter(r => r.duration).length;
  
  const isIdempotent = successful <= 1; // 理想情况是只有第一个请求成功
  
  return {
    totalRequests: results.length,
    successful,
    forbidden,
    errors,
    avgDuration: Math.round(avgDuration) || 0,
    isIdempotent,
    idempotencyScore: successful <= 1 ? 100 : Math.max(0, 100 - (successful - 1) * 20),
    recommendation: isIdempotent ? 
      '✅ 幂等性表现良好' : 
      `⚠️ 检测到${successful}个成功请求，建议检查幂等性逻辑`
  };
}

// 分析Webhook结果
function analyzeWebhookResults(results, productName) {
  const successful = results.filter(r => r.status === 200).length;
  const alreadyProcessed = results.filter(r => r.status === 200 && r.data?.alreadyProcessed).length;
  const errors = results.filter(r => r.status === 'ERROR' || (r.status && r.status >= 400)).length;
  
  const avgDuration = results
    .filter(r => r.duration)
    .reduce((sum, r) => sum + r.duration, 0) / results.filter(r => r.duration).length;
  
  const isIdempotent = alreadyProcessed >= (successful - 1); // 除了第一个，其他都应该是已处理
  
  return {
    totalRequests: results.length,
    successful,
    alreadyProcessed,
    errors,
    avgDuration: Math.round(avgDuration) || 0,
    isIdempotent,
    idempotencyScore: isIdempotent ? 100 : Math.max(0, 100 - (successful - alreadyProcessed - 1) * 25),
    recommendation: isIdempotent ?
      '✅ Webhook幂等性表现良好' :
      `⚠️ 检测到${successful - alreadyProcessed}个重复处理，建议检查幂等性逻辑`
  };
}

// 生成测试报告
function generateReport() {
  const duration = testResults.summary.endTime - testResults.summary.startTime;
  
  console.log('\n' + '='.repeat(80));
  console.log('🧪 幂等性测试报告');
  console.log('='.repeat(80));
  
  console.log(`\n📊 测试概要:`);
  console.log(`   总测试数: ${testResults.summary.totalTests}`);
  console.log(`   通过: ${testResults.summary.passedTests}`);
  console.log(`   失败: ${testResults.summary.failedTests}`);
  console.log(`   耗时: ${Math.round(duration)}ms`);
  console.log(`   测试时间: ${new Date(testResults.summary.startTime).toLocaleString()} - ${new Date(testResults.summary.endTime).toLocaleString()}`);
  
  console.log(`\n📋 详细结果:`);
  
  Object.entries(testResults.products).forEach(([key, result]) => {
    console.log(`\n   ${result.type === 'webhook' ? '🔗' : '🛒'} ${result.product} ${result.type === 'webhook' ? 'Webhook' : '购买'}:`);
    console.log(`      总请求: ${result.analysis.totalRequests}`);
    console.log(`      成功: ${result.analysis.successful}`);
    
    if (result.type === 'webhook') {
      console.log(`      已处理: ${result.analysis.alreadyProcessed}`);
    } else {
      console.log(`      被阻止: ${result.analysis.forbidden}`);
      if (result.concurrentSuccessCount > 0) {
        console.log(`      并发成功: ${result.concurrentSuccessCount}`);
      }
    }
    
    console.log(`      错误: ${result.analysis.errors}`);
    console.log(`      平均耗时: ${result.analysis.avgDuration}ms`);
    console.log(`      幂等性评分: ${result.analysis.idempotencyScore}/100`);
    console.log(`      建议: ${result.analysis.recommendation}`);
  });
  
  // 生成JSON报告
  const reportFile = `idempotency-test-report-${Date.now()}.json`;
  require('fs').writeFileSync(reportFile, JSON.stringify(testResults, null, 2));
  console.log(`\n📄 详细报告已保存到: ${reportFile}`);
  
  console.log('\n' + '='.repeat(80));
}

// 主测试函数
async function runAllTests() {
  logger.info('开始幂等性测试套件');
  logger.info(`测试环境: ${CONFIG.BASE_URL}`);
  logger.info(`测试配置: 重复${CONFIG.TEST_CONFIG.REPEAT_COUNT}次, 并发${CONFIG.TEST_CONFIG.CONCURRENT_COUNT}个, 间隔${CONFIG.TEST_CONFIG.DELAY_MS}ms`);
  
  testResults.summary.startTime = Date.now();
  
  try {
    // 测试每个产品的购买幂等性
    for (const productType of Object.keys(CONFIG.PRODUCTS)) {
      testResults.summary.totalTests++;
      try {
        const purchaseAnalysis = await testPurchaseIdempotency(productType);
        if (purchaseAnalysis.isIdempotent) {
          testResults.summary.passedTests++;
        } else {
          testResults.summary.failedTests++;
        }
        
        // 短暂休息
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        logger.error(`${CONFIG.PRODUCTS[productType].name} 购买测试失败: ${error.message}`);
        testResults.summary.failedTests++;
      }
    }
    
    // 测试每个产品的Webhook幂等性
    for (const productType of Object.keys(CONFIG.PRODUCTS)) {
      testResults.summary.totalTests++;
      try {
        const webhookAnalysis = await testWebhookIdempotency(productType);
        if (webhookAnalysis.isIdempotent) {
          testResults.summary.passedTests++;
        } else {
          testResults.summary.failedTests++;
        }
        
        // 短暂休息
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        logger.error(`${CONFIG.PRODUCTS[productType].name} Webhook测试失败: ${error.message}`);
        testResults.summary.failedTests++;
      }
    }
    
  } catch (error) {
    logger.error(`测试过程中发生错误: ${error.message}`);
  }
  
  testResults.summary.endTime = Date.now();
  
  // 生成报告
  generateReport();
  
  // 退出码
  process.exit(testResults.summary.failedTests > 0 ? 1 : 0);
}

// 命令行参数处理
function parseArgs() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
幂等性测试脚本

用法:
  node test-idempotency.js [选项]

选项:
  --base-url <url>     设置测试基础URL (默认: http://localhost:3000)
  --repeat <count>     设置重复次数 (默认: 5)
  --concurrent <count> 设置并发数量 (默认: 3) 
  --delay <ms>         设置请求间隔 (默认: 1000ms)
  --timeout <ms>       设置请求超时 (默认: 30000ms)
  --help, -h           显示帮助信息

环境变量:
  TEST_BASE_URL        测试基础URL

示例:
  node test-idempotency.js --repeat 10 --concurrent 5
  TEST_BASE_URL=https://hair-style.ai node test-idempotency.js
    `);
    process.exit(0);
  }
  
  // 解析参数
  const baseUrlIndex = args.indexOf('--base-url');
  if (baseUrlIndex !== -1 && args[baseUrlIndex + 1]) {
    CONFIG.BASE_URL = args[baseUrlIndex + 1];
  }
  
  const repeatIndex = args.indexOf('--repeat');
  if (repeatIndex !== -1 && args[repeatIndex + 1]) {
    CONFIG.TEST_CONFIG.REPEAT_COUNT = parseInt(args[repeatIndex + 1]);
  }
  
  const concurrentIndex = args.indexOf('--concurrent');
  if (concurrentIndex !== -1 && args[concurrentIndex + 1]) {
    CONFIG.TEST_CONFIG.CONCURRENT_COUNT = parseInt(args[concurrentIndex + 1]);
  }
  
  const delayIndex = args.indexOf('--delay');
  if (delayIndex !== -1 && args[delayIndex + 1]) {
    CONFIG.TEST_CONFIG.DELAY_MS = parseInt(args[delayIndex + 1]);
  }
  
  const timeoutIndex = args.indexOf('--timeout');
  if (timeoutIndex !== -1 && args[timeoutIndex + 1]) {
    CONFIG.TEST_CONFIG.TIMEOUT_MS = parseInt(args[timeoutIndex + 1]);
  }
}

// 启动测试
if (require.main === module) {
  parseArgs();
  runAllTests().catch(error => {
    logger.error(`测试启动失败: ${error.message}`);
    process.exit(1);
  });
}

module.exports = {
  runAllTests,
  testPurchaseIdempotency,
  testWebhookIdempotency,
  CONFIG
}; 