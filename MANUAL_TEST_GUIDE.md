# 手动测试指南 - Hair Style AI

## 🎯 测试目标
验证完整的用户注册 → 购买 → 订阅 → 积分流程

## 📋 预备步骤

### 1. 确保orders表已创建
```bash
# 在Supabase SQL编辑器中执行以下脚本
cat scripts/create-orders-table.sql
```

### 2. 检查环境变量
确保以下环境变量已正确配置：
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `CREEM_API_KEY`

## 🧪 测试步骤

### 步骤1: 用户注册/登录
1. 访问 `/signin` 页面
2. 使用Google OAuth登录
3. 登录成功后，检查是否创建了用户profile

**验证命令**:
```bash
curl -X GET http://localhost:3000/api/test-auth
```

**期望结果**:
```json
{
  "success": true,
  "authenticated": true,
  "user": {
    "id": "用户ID",
    "email": "用户邮箱",
    ...
  }
}
```

### 步骤2: 检查用户数据
```bash
curl -X GET http://localhost:3000/api/creem/user-credits
```

**期望结果**:
```json
{
  "success": true,
  "user": {
    "id": "用户ID",
    "email": "用户邮箱",
    "credits": 0,
    "hasActiveSubscription": false
  }
}
```

### 步骤3: 进行购买
1. 访问 `/pricing` 页面
2. 选择月度或年度订阅
3. 完成Creem支付流程
4. 等待支付成功回调

### 步骤4: 验证购买结果

#### 4.1 检查用户积分和订阅
```bash
curl -X GET http://localhost:3000/api/creem/user-credits
```

**期望结果**:
```json
{
  "success": true,
  "user": {
    "id": "用户ID",
    "credits": 500, // 月度订阅
    "hasActiveSubscription": true,
    "subscriptions": [
      {
        "plan_name": "monthly",
        "status": "active",
        "end_date": "未来日期"
      }
    ]
  }
}
```

#### 4.2 检查订单记录
```bash
curl -X GET http://localhost:3000/api/orders
```

**期望结果**:
```json
{
  "success": true,
  "orders": [
    {
      "order_id": "订单ID",
      "product_name": "monthly subscription",
      "status": "completed",
      "credits_granted": 500,
      "payment_date": "支付时间"
    }
  ],
  "total": 1
}
```

### 步骤5: 测试积分消费
1. 访问AI发型生成功能
2. 上传图片并生成发型
3. 检查积分是否正确扣除

**验证命令**:
```bash
curl -X GET http://localhost:3000/api/creem/user-credits
```

**期望结果**: 积分应该减少10分

## 🔍 调试命令

### 检查数据库连接
```bash
curl -X GET http://localhost:3000/api/debug/supabase-test
```

### 检查积分状态
```bash
curl -X GET http://localhost:3000/api/debug/check-credits
```

### 修复积分（如果需要）
```bash
curl -X POST http://localhost:3000/api/fix-credits \
  -H "Content-Type: application/json" \
  -d '{"action": "add_credits", "amount": 500}'
```

## ⚠️ 常见问题

### 问题1: 用户登录后没有profile
**原因**: 认证回调可能失败  
**解决**: 检查 `/api/auth/callback` 日志

### 问题2: 购买后没有积分
**原因**: Webhook处理失败  
**解决**: 检查 `/api/creem/webhook` 日志

### 问题3: 订单记录缺失
**原因**: orders表可能不存在  
**解决**: 执行 `scripts/create-orders-table.sql`

## 📊 测试验证清单

- [ ] ✅ 用户可以成功登录
- [ ] ✅ 登录后创建了用户profile
- [ ] ✅ 用户可以查看pricing页面
- [ ] ✅ 用户可以发起支付
- [ ] ✅ 支付成功后创建了订阅记录
- [ ] ✅ 支付成功后创建了订单记录
- [ ] ✅ 支付成功后分配了正确的积分
- [ ] ✅ 用户状态更新为有访问权限
- [ ] ✅ 积分消费功能正常工作
- [ ] ✅ 积分计算准确无误

## 🎉 成功标准

**全部通过的条件**:
1. 用户可以正常登录注册
2. 购买流程完整无错误
3. 数据正确保存到所有相关表
4. 积分系统正常运行
5. 用户可以正常使用付费功能

**如果测试失败**:
1. 查看浏览器控制台错误
2. 检查服务器日志
3. 使用调试API排查问题
4. 参考 `SYSTEM_CHECK_REPORT.md` 中的解决方案

---

*测试指南更新时间: 2025-07-11*  
*适用版本: 当前开发版本* 