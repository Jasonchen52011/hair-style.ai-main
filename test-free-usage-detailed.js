const fs = require('fs');
const path = require('path');

// 详细验证免费额度功能的脚本
function validateFreeUsageSystem() {
  console.log('🔍 ===== 免费额度系统深度验证 =====\n');
  let freeCountInConfig = '未找到'; // 在函数开始时声明变量

  // 1. 后端核心逻辑验证
  console.log('1️⃣ 后端核心逻辑验证');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const submitRoutePath = path.join(__dirname, 'app/api/submit/route.ts');
  const submitRouteContent = fs.readFileSync(submitRoutePath, 'utf8');

  // 提取关键配置
  const lifetimeLimitMatch = submitRouteContent.match(/const LIFETIME_FREE_LIMIT = (\d+)/);
  const lifetimeLimit = lifetimeLimitMatch ? lifetimeLimitMatch[1] : '未找到';

  console.log(`✅ 终身免费限制配置: LIFETIME_FREE_LIMIT = ${lifetimeLimit}`);

  // 检查错误消息
  const errorMsgMatch = submitRouteContent.match(/You have used your (\d+) free generations/);
  const errorMsgLimit = errorMsgMatch ? errorMsgMatch[1] : '未找到';
  console.log(`✅ 错误消息中的次数: ${errorMsgLimit}`);

  // 检查IP跟踪逻辑
  const ipTracking = submitRouteContent.includes('lifetimeUsageCounts.get(ip)');
  console.log(`✅ IP使用次数跟踪: ${ipTracking ? '已实现' : '未实现'}`);

  // 检查免费额度扣除逻辑
  const freeDeduction = submitRouteContent.includes('chargedFreeTasks.add(taskId)');
  console.log(`✅ 免费任务扣费跟踪: ${freeDeduction ? '已实现' : '未实现'}`);

  console.log('');

  // 2. 前端UI验证
  console.log('2️⃣ 前端UI验证');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const pageContentPath = path.join(__dirname, 'app/ai-hairstyle/page-content.tsx');
  const pageContent = fs.readFileSync(pageContentPath, 'utf8');

  // 检查初始状态
  const initialStateMatch = pageContent.match(/useState<number>\((\d+)\)/);
  const initialState = initialStateMatch ? initialStateMatch[1] : '未找到';
  console.log(`✅ 初始免费次数状态: ${initialState}`);

  // 检查localStorage设置
  const localStorageMatch = pageContent.match(/localStorage\.setItem\("guest_hairstyle_lifetime_usage_count", "(\d+)"\)/);
  const localStorageValue = localStorageMatch ? localStorageMatch[1] : '未找到';
  console.log(`✅ localStorage初始值: ${localStorageValue}`);

  // 检查UI显示逻辑
  const uiDisplayMatch = pageContent.match(/\$\{guestUsageCount\} \${guestUsageCount === 1 \? 'try' : 'tries'\} left/);
  console.log(`✅ UI显示剩余次数: ${uiDisplayMatch ? '已实现' : '未实现'}`);

  console.log('');

  // 3. 数据库结构验证
  console.log('3️⃣ 数据库结构验证');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const schemaPath = path.join(__dirname, 'db/schema.ts');
  const schemaContent = fs.readFileSync(schemaPath, 'utf8');

  // 检查用户积分余额表
  const creditsBalanceTable = schemaContent.includes('user_credits_balance');
  console.log(`✅ 用户积分余额表: ${creditsBalanceTable ? '已定义' : '未定义'}`);

  // 检查积分交易表
  const creditsTable = schemaContent.includes('credits');
  console.log(`✅ 积分交易记录表: ${creditsTable ? '已定义' : '未定义'}`);

  console.log('');

  // 4. 用户注册逻辑验证
  console.log('4️⃣ 用户注册逻辑验证');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const authCallbackPath = path.join(__dirname, 'app/api/auth/callback/route.ts');
  const authCallbackContent = fs.readFileSync(authCallbackPath, 'utf8');

  // 检查初始积分分配
  const initialCreditsMatch = authCallbackContent.match(/createOrUpdateUserCreditsBalanceSupabase\(user\.id, (\d+)\)/);
  const initialCredits = initialCreditsMatch ? initialCreditsMatch[1] : '未找到';
  console.log(`✅ 新用户初始积分: ${initialCredits}`);

  console.log('');

  // 5. API端点验证
  console.log('5️⃣ API端点验证');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // 检查积分查询API
  const creditsBalanceApi = fs.existsSync(path.join(__dirname, 'app/api/user-credits-balance/route.ts'));
  console.log(`✅ 积分余额查询API: ${creditsBalanceApi ? '已实现' : '未实现'}`);

  // 检查积分使用API
  const useCreditsApi = fs.existsSync(path.join(__dirname, 'app/api/use-credits/route.ts'));
  console.log(`✅ 积分使用API: ${useCreditsApi ? '已实现' : '未实现'}`);

  // 检查简化积分API
  const simpleCreditsApi = fs.existsSync(path.join(__dirname, 'app/api/user-credits-simple/route.ts'));
  console.log(`✅ 简化积分API: ${simpleCreditsApi ? '已实现' : '未实现'}`);

  console.log('');

  // 6. 配置文件验证
  console.log('6️⃣ 配置文件验证');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  try {
    const configPath = path.join(__dirname, 'app/barbershop/config.json');
    const configContent = fs.readFileSync(configPath, 'utf8');
    const config = JSON.parse(configContent);

    // 查找包含免费次数的描述
    let freeCountInConfig = '未找到';
    function searchFreeCount(obj, path = '') {
      for (const key in obj) {
        if (typeof obj[key] === 'string' && obj[key].includes('free')) {
          const match = obj[key].match(/(\d+)\s+free/);
          if (match) {
            freeCountInConfig = match[1];
            return;
          }
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          searchFreeCount(obj[key], path + key + '.');
        }
      }
    }

    searchFreeCount(config);
    console.log(`✅ 配置文件中的免费次数: ${freeCountInConfig}`);
  } catch (error) {
    console.log(`❌ 配置文件读取失败: ${error.message}`);
  }

  console.log('');

  // 7. 潜在问题分析
  console.log('7️⃣ 潜在问题分析');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const issues = [];
  const warnings = [];

  // 检查配置一致性
  if (lifetimeLimit !== initialState || lifetimeLimit !== localStorageValue || lifetimeLimit !== errorMsgLimit) {
    issues.push('配置不一致：不同文件中的免费次数配置不匹配');
  }

  // 检查免费额度存储方式
  if (submitRouteContent.includes('lifetimeUsageCounts = new Map()')) {
    warnings.push('免费额度使用内存存储，服务器重启后数据会丢失');
  }

  // 检查用户初始积分
  if (initialCredits === '0') {
    warnings.push('新用户注册时积分为0，免费额度基于IP地址而非用户账户');
  }

  if (issues.length > 0) {
    console.log('❌ 发现的问题:');
    issues.forEach((issue, index) => {
      console.log(`   ${index + 1}. ${issue}`);
    });
  }

  if (warnings.length > 0) {
    console.log('⚠️  警告:');
    warnings.forEach((warning, index) => {
      console.log(`   ${index + 1}. ${warning}`);
    });
  }

  if (issues.length === 0 && warnings.length === 0) {
    console.log('✅ 未发现明显问题');
  }

  console.log('');

  // 8. 总结
  console.log('8️⃣ 验证总结');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const allConfigsMatch = lifetimeLimit === initialState &&
                         lifetimeLimit === localStorageValue &&
                         lifetimeLimit === errorMsgLimit &&
                         lifetimeLimit === freeCountInConfig;

  console.log(`📊 配置一致性: ${allConfigsMatch ? '✅ 通过' : '❌ 失败'}`);
  console.log(`📊 免费额度配置: ${lifetimeLimit}次`);
  console.log(`📊 系统完整性: ${issues.length === 0 ? '✅ 正常' : '⚠️  需要修复'}`);

  console.log('');
  console.log('🎯 验证完成！');

  return {
    success: issues.length === 0,
    freeLimit: lifetimeLimit,
    issues,
    warnings,
    configConsistency: allConfigsMatch
  };
}

// 运行验证
const result = validateFreeUsageSystem();

// 输出最终结论
console.log('\n' + '='.repeat(50));
if (result.success) {
  console.log('🎉 免费额度系统验证通过！');
  console.log(`✅ 当前配置：每位用户终身${result.freeLimit}次免费生图`);
} else {
  console.log('⚠️  发现问题需要修复');
  console.log(`📝 当前配置：${result.freeLimit}次免费生图`);
}
console.log('='.repeat(50));