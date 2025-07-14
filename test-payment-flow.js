#!/usr/bin/env node

// Node.js v18+ 内置fetch API

// 配置
const BASE_URL = 'http://localhost:3000';
const TEST_USER_ID = '550e8400-e29b-41d4-a716-446655440000';
const PRODUCT_IDS = {
    MONTHLY: 'prod_6OoADdBXIm16LRR6TN6sFw',
    YEARLY: 'prod_6N9SkBhig3ofomadscbGr7', 
    ONETIME: 'prod_7kbzeBzBsEnWbRA0iTh7wf'
};

// 工具函数
function log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = `[${timestamp}]`;
    
    switch(type) {
        case 'success':
            console.log(`${prefix} ✅ ${message}`);
            break;
        case 'error':
            console.log(`${prefix} ❌ ${message}`);
            break;
        case 'warning':
            console.log(`${prefix} ⚠️  ${message}`);
            break;
        case 'info':
        default:
            console.log(`${prefix} ℹ️  ${message}`);
            break;
    }
}

function generateTestOrderId() {
    const timestamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\..+/, '');
    const random = Math.random().toString(36).substr(2, 6);
    return `test_order_${timestamp}_${random}`;
}

async function apiCall(endpoint, method = 'GET', data = null, timeout = 10000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
            },
            signal: controller.signal
        };

        if (data) {
            options.body = JSON.stringify(data);
        }

        const response = await fetch(`${BASE_URL}${endpoint}`, options);
        clearTimeout(timeoutId);
        
        const result = await response.json();
        
        return {
            success: response.ok,
            status: response.status,
            data: result,
            timestamp: new Date().toISOString()
        };
    } catch (error) {
        clearTimeout(timeoutId);
        return {
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        };
    }
}

// 测试函数
async function testWebhookProcessing(orderId, productId) {
    log(`测试Webhook处理 - 订单ID: ${orderId}`, 'info');
    
    const webhookData = {
        eventType: 'subscription.paid',
        object: {
            id: `sub_${orderId}`,
            customer: {
                id: TEST_USER_ID,
                email: 'test-flow@hairstyle.ai'
            },
            product: {
                id: productId,
                name: 'Test Subscription'
            },
            order: {
                id: orderId,
                customer_id: TEST_USER_ID,
                total_amount: 790,
                currency: 'USD',
                status: 'paid',
                created_at: new Date().toISOString()
            },
            metadata: {
                user_id: TEST_USER_ID
            }
        }
    };

    const response = await apiCall('/api/creem/webhook', 'POST', webhookData);
    
    if (response.success) {
        log(`Webhook处理成功`, 'success');
        return true;
    } else {
        log(`Webhook处理失败: ${response.data?.error || response.error}`, 'error');
        return false;
    }
}

async function testCreditQuery(orderId, maxAttempts = 10, interval = 1000) {
    log(`测试积分查询 - 订单ID: ${orderId}`, 'info');
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        log(`查询尝试 ${attempt}/${maxAttempts}`, 'info');
        
        const response = await apiCall(`/api/creem/user-credits?order_id=${orderId}&user_id=${TEST_USER_ID}`);
        
        if (response.success && response.data.exists && response.data.totalCredits > 0) {
            log(`✅ 找到积分记录 - 总积分: ${response.data.totalCredits}`, 'success');
            return {
                success: true,
                attempts: attempt,
                totalCredits: response.data.totalCredits,
                data: response.data
            };
        }
        
        if (response.status === 406) {
            log(`❌ 收到406错误: ${response.data?.error}`, 'error');
            return {
                success: false,
                error: '406 - No credit records found',
                attempts: attempt
            };
        }
        
        if (attempt < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, interval));
        }
    }
    
    return {
        success: false,
        error: '查询超时，未找到积分记录',
        attempts: maxAttempts
    };
}

async function testIdempotency(orderId, productId) {
    log(`测试幂等性 - 订单ID: ${orderId}`, 'info');
    
    const webhookData = {
        eventType: 'subscription.paid',
        object: {
            id: `sub_${orderId}`,
            customer: { id: TEST_USER_ID },
            product: { id: productId },
            order: {
                id: orderId,
                customer_id: TEST_USER_ID,
                status: 'paid',
                created_at: new Date().toISOString()
            }
        }
    };

    // 发送3次相同的webhook
    const results = [];
    for (let i = 1; i <= 3; i++) {
        log(`发送第${i}次webhook`, 'info');
        const response = await apiCall('/api/creem/webhook', 'POST', webhookData);
        results.push(response);
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    // 检查最终积分
    await new Promise(resolve => setTimeout(resolve, 1000));
    const finalCheck = await apiCall(`/api/creem/user-credits?order_id=${orderId}&user_id=${TEST_USER_ID}`);
    
    const allSuccessful = results.every(r => r.success);
    const finalCredits = finalCheck.data?.totalCredits || 0;
    
    if (allSuccessful && finalCredits === 500) {
        log(`幂等性测试通过 - 最终积分: ${finalCredits}`, 'success');
        return true;
    } else {
        log(`幂等性测试失败 - 积分: ${finalCredits}, 预期: 500`, 'error');
        return false;
    }
}

async function runSinglePaymentTest(productId, productName) {
    console.log('\n' + '='.repeat(60));
    log(`开始测试 ${productName} 支付流程`, 'info');
    console.log('='.repeat(60));
    
    const orderId = generateTestOrderId();
    log(`生成测试订单ID: ${orderId}`, 'info');
    
    try {
        // 步骤1: 测试Webhook处理
        log('步骤1: 测试Webhook处理', 'info');
        const webhookSuccess = await testWebhookProcessing(orderId, productId);
        if (!webhookSuccess) {
            throw new Error('Webhook处理失败');
        }
        
        // 步骤2: 等待处理完成
        log('步骤2: 等待处理完成...', 'info');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // 步骤3: 测试积分查询
        log('步骤3: 测试积分查询', 'info');
        const queryResult = await testCreditQuery(orderId);
        if (!queryResult.success) {
            throw new Error(`积分查询失败: ${queryResult.error}`);
        }
        
        log(`${productName} 支付流程测试通过！`, 'success');
        return {
            success: true,
            orderId,
            totalCredits: queryResult.totalCredits,
            attempts: queryResult.attempts
        };
        
    } catch (error) {
        log(`${productName} 支付流程测试失败: ${error.message}`, 'error');
        return {
            success: false,
            orderId,
            error: error.message
        };
    }
}

async function runComprehensiveTest() {
    console.log('\n🚀 开始运行完整支付流程测试');
    console.log('目标: 确保不会出现订单ID找不到和406错误\n');
    
    const testResults = [];
    
    // 测试1: 月度订阅
    log('🔥 测试1: 月度订阅支付流程', 'info');
    const monthlyResult = await runSinglePaymentTest(PRODUCT_IDS.MONTHLY, '月度订阅');
    testResults.push({ name: '月度订阅', ...monthlyResult });
    
    // 测试2: 单次购买
    log('🔥 测试2: 单次购买支付流程', 'info');
    const onetimeResult = await runSinglePaymentTest(PRODUCT_IDS.ONETIME, '单次购买');
    testResults.push({ name: '单次购买', ...onetimeResult });
    
    // 测试3: 幂等性测试
    log('🔥 测试3: 幂等性测试', 'info');
    const idempotencyOrderId = generateTestOrderId();
    const idempotencyResult = await testIdempotency(idempotencyOrderId, PRODUCT_IDS.MONTHLY);
    testResults.push({ 
        name: '幂等性测试', 
        success: idempotencyResult, 
        orderId: idempotencyOrderId 
    });
    
    // 汇总结果
    console.log('\n' + '='.repeat(60));
    log('📊 测试结果汇总', 'info');
    console.log('='.repeat(60));
    
    const passedTests = testResults.filter(r => r.success).length;
    const totalTests = testResults.length;
    
    testResults.forEach(result => {
        const status = result.success ? '✅ 通过' : '❌ 失败';
        const details = result.totalCredits ? ` (积分: ${result.totalCredits})` : '';
        console.log(`${result.name}: ${status}${details}`);
        if (result.error) {
                         console.log(`  错误: ${result.error}`);
        }
    });
    
    console.log(`\n总体结果: ${passedTests}/${totalTests} 测试通过`);
    
    if (passedTests === totalTests) {
        log('🎉 所有测试通过！支付系统运行正常，可以进行真实支付。', 'success');
        return true;
    } else {
        log('⚠️ 部分测试失败，建议修复问题后再进行真实支付。', 'warning');
        return false;
    }
}

async function testSpecificOrderId(orderId) {
    log(`🔍 测试特定订单ID: ${orderId}`, 'info');
    
    // 检查订单是否已存在
    const existingCheck = await apiCall(`/api/creem/user-credits?order_id=${orderId}&user_id=${TEST_USER_ID}`);
    
    if (existingCheck.success && existingCheck.data.exists) {
        log(`订单 ${orderId} 已存在，积分: ${existingCheck.data.totalCredits}`, 'success');
        return true;
    }
    
    // 模拟新的支付
    log(`订单 ${orderId} 不存在，模拟新支付...`, 'info');
    const webhookSuccess = await testWebhookProcessing(orderId, PRODUCT_IDS.MONTHLY);
    
    if (!webhookSuccess) {
        log(`Webhook处理失败`, 'error');
        return false;
    }
    
    // 查询结果
    await new Promise(resolve => setTimeout(resolve, 2000));
    const queryResult = await testCreditQuery(orderId);
    
    return queryResult.success;
}

// 主函数
async function main() {
    console.log('💎 Hair Style AI - 支付流程测试工具');
    console.log('🎯 目标: 防止 ord_6X6Z4AspthHQwU5vj4LR4o 类似的406错误\n');
    
    const args = process.argv.slice(2);
    
    if (args.length > 0) {
        // 测试特定订单ID
        const orderId = args[0];
        const success = await testSpecificOrderId(orderId);
        process.exit(success ? 0 : 1);
    } else {
        // 运行完整测试
        const success = await runComprehensiveTest();
        process.exit(success ? 0 : 1);
    }
}

// 错误处理
process.on('unhandledRejection', (reason, promise) => {
    log(`未处理的Promise拒绝: ${reason}`, 'error');
    process.exit(1);
});

process.on('uncaughtException', (error) => {
    log(`未捕获的异常: ${error.message}`, 'error');
    process.exit(1);
});

// 运行主函数
if (require.main === module) {
    main().catch(error => {
        log(`测试执行失败: ${error.message}`, 'error');
        process.exit(1);
    });
}

module.exports = {
    runComprehensiveTest,
    testSpecificOrderId,
    testWebhookProcessing,
    testCreditQuery,
    testIdempotency
}; 