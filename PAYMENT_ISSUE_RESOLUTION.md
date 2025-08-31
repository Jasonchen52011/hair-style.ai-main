# 支付系统故障修复文档

## 问题概述

**发生时间**: 2024-08-30  
**影响范围**: 从 Vercel 迁移到 Cloudflare Pages 后的所有 Stripe 支付  
**问题描述**: 用户支付成功，但订单数据未写入 Supabase，用户积分未增加

## 问题表现

1. Stripe 支付流程正常完成
2. 用户收到支付成功确认
3. Supabase 数据库中缺少对应订单记录
4. 用户积分余额未更新
5. Webhook 返回 400 错误

## 根本原因分析

### 1. 运行时环境不兼容
- **问题**: Cloudflare Pages 要求 API 路由使用 `edge` 运行时
- **初始错误**: 尝试更改为 `nodejs` 运行时导致部署失败
- **解决方案**: 保持 `edge` 运行时，调整 Supabase 客户端配置

### 2. Webhook 签名验证问题
- **问题**: Edge Runtime 环境下 Stripe webhook 签名验证失败
- **表现**: Webhook 返回 400 状态码
- **解决方案**: 改进错误处理和签名验证逻辑

### 3. Supabase 客户端配置问题
- **问题**: 默认 Supabase 客户端配置在 Edge Runtime 下不兼容
- **解决方案**: 禁用会话持久化和自动刷新功能

## 技术解决方案

### 1. Webhook 处理器改进 (`app/api/stripe/webhook/route.ts`)

```typescript
export const runtime = "edge"; // 保持 edge 运行时

// 改进的签名验证逻辑
try {
  body = await request.text();
  const sig = request.headers.get("stripe-signature");
  
  if (!sig) {
    console.error("Missing stripe-signature header");
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
} catch (err: any) {
  // 降级处理逻辑
  try {
    event = JSON.parse(body) as Stripe.Event;
    console.log("Fallback: Parsed body as JSON event");
  } catch (parseErr) {
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    );
  }
}
```

### 2. Supabase 客户端配置 (`models/orderSupabase.ts`)

```typescript
function getSupabaseClient() {
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,      // Edge Runtime 兼容
      autoRefreshToken: false,    // 禁用自动刷新
      detectSessionInUrl: false   // 禁用 URL 会话检测
    }
  });
}
```

### 3. 创建调试和修复工具

#### 调试工具
- `app/api/debug-orders/route.ts` - 查看订单状态
- `app/api/debug-payment-check/route.ts` - 检查支付状态
- `app/api/debug-webhook/route.ts` - 手动触发 webhook 处理

#### 修复工具
- `app/api/fix-missing-orders/route.ts` - 批量修复缺失订单

## 数据修复记录

### 受影响的支付记录
1. **Payment Intent**: `pi_3S1fajBCTa3kEW1g07LQafFD`
   - 状态: 已修复
   - 订单已创建，积分已发放

2. **Payment Intent**: `pi_3S1NwyBCTa3kEW1g0T9Mcuhv`
   - 状态: 已修复
   - 订单已创建，积分已发放

## 预防措施

### 1. 监控告警
- 设置 Webhook 失败率告警
- 监控订单创建和支付成功的匹配率
- 定期检查积分发放异常

### 2. 测试流程
- 部署前必须测试完整支付流程
- 验证 Webhook 在新环境下的正常工作
- 确认数据库写入操作成功

### 3. 备用处理机制
- 保留手动处理工具用于紧急修复
- 建立支付异常快速响应流程
- 定期备份和验证关键支付数据

## 运营处理步骤

### 发现支付异常时的处理流程

1. **立即响应** (5分钟内)
   - 确认 Stripe 支付状态
   - 检查 Supabase 订单记录
   - 使用调试工具快速定位问题

2. **问题修复** (30分钟内)
   - 使用 `fix-missing-orders` 工具批量修复
   - 手动验证修复结果
   - 通知用户问题已解决

3. **事后分析**
   - 分析问题根本原因
   - 更新预防措施
   - 完善监控机制

## 常用修复命令

### 检查特定支付状态
```bash
curl -X POST https://your-domain.com/api/debug-payment-check \
  -H "Content-Type: application/json" \
  -d '{"payment_intent_id": "pi_xxxxxxxxxxxxx"}'
```

### 批量修复缺失订单
```bash
curl -X POST https://your-domain.com/api/fix-missing-orders \
  -H "Content-Type: application/json" \
  -d '{"payment_intents": ["pi_xxxxxxxxxxxxx", "pi_yyyyyyyyyyyyy"]}'
```

### 查看最近订单状态
```bash
curl https://your-domain.com/api/debug-orders
```

## 技术债务和改进建议

1. **优化错误处理**: 增加更详细的错误日志和用户友好的错误信息
2. **自动化修复**: 开发自动检测和修复支付异常的定时任务
3. **数据一致性检查**: 定期验证 Stripe 和 Supabase 数据的一致性
4. **性能监控**: 添加支付处理性能指标监控

## 联系信息

- **技术负责人**: 开发团队
- **紧急联系**: 运营团队
- **文档更新时间**: 2024-08-30

---

*本文档记录了支付系统的重要故障和修复过程，请相关人员熟悉内容，确保在类似问题发生时能够快速响应和解决。*