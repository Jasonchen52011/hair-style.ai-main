# 免费使用次数限制测试用例

## 测试目标
验证用户终身免费使用次数已从3次成功修改为5次。

## 测试环境
- 开发环境 (NODE_ENV=development)
- 生产环境模式

## 测试用例

### 用例1: 后端API限制验证
**测试文件**: `app/api/submit/route.ts`

**测试步骤**:
1. 清空内存中的 `lifetimeUsageCounts`
2. 使用同一个IP发送5次成功的发型生成请求
3. 验证前5次请求都成功返回 taskId
4. 第6次请求应该返回 429 状态码和错误消息

**预期结果**:
```javascript
// 前5次请求
{ success: true, taskId: "xxx", status: "processing" }

// 第6次请求
{
  success: false,
  error: "You have used your 5 free generations. Please subscribe to continue unlimited generation!",
  errorType: "lifetime_limit",
  requiresSubscription: true
}
```

### 用例2: 前端UI显示验证
**测试文件**: `app/ai-hairstyle/page-content.tsx`

**测试步骤**:
1. 清空 localStorage `guest_hairstyle_lifetime_usage_count`
2. 打开页面，未登录状态
3. 验证初始 `guestUsageCount` 为5
4. 模拟成功生成操作，减少计数
5. 验证UI显示剩余次数正确

**预期结果**:
- 初始显示: "Generate (5 tries left)"
- 使用1次后: "Generate (4 tries left)"
- 使用5次后: 按钮禁用，提示订阅

### 用例3: 错误消息验证
**测试步骤**:
1. 触发免费次数限制
2. 验证错误消息中的数字已更新

**预期结果**:
- 错误消息包含 "5 free generations" 而不是 "3 free generations"

### 用例4: localStorage 初始化验证
**测试步骤**:
1. 清空 localStorage
2. 刷新页面
3. 验证 `guest_hairstyle_lifetime_usage_count` 被设置为 "5"

**预期结果**:
```javascript
localStorage.getItem("guest_hairstyle_lifetime_usage_count") === "5"
```

### 用例5: 配置文件验证
**测试文件**: `app/barbershop/config.json`

**测试步骤**:
1. 读取配置文件
2. 验证描述文字中的数字

**预期结果**:
```json
"description": "Every user gets 5 free style previews, no login required."
```

## 自动化测试脚本

```javascript
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
  const description = config.sections[1].features[0].description;
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
```

## 手动测试清单

- [ ] 清空浏览器localStorage，刷新页面，确认显示5次
- [ ] 连续生成5次发型，确认每次计数正确减少
- [ ] 第6次尝试确认被阻止并显示正确错误消息
- [ ] 检查barbershop页面描述文字已更新
- [ ] 测试登录用户不受影响（如果有积分）