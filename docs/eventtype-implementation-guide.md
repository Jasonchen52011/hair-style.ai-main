# EventType Field Implementation Guide

## 概览

本文档描述了在 `credits` 表中添加 `event_type` 字段的实现细节。该字段用于记录credits记录的事件类型，便于分析和追踪。

## 实现内容

### 1. 数据库变更

#### 1.1 添加字段
- 在 `credits` 表中添加了 `event_type` 字段 (VARCHAR(50))
- 为现有记录设置了默认值
- 创建了相关索引以提高查询性能

#### 1.2 迁移脚本
```sql
-- 执行顺序：
-- 1. scripts/add-eventtype-field.sql - 添加字段和索引
-- 2. scripts/update-credits-rpc-functions.sql - 更新RPC函数
-- 3. scripts/test-eventtype-implementation.sql - 验证实现（可选）
```

### 2. 代码修改

#### 2.1 修改的文件
- `app/api/creem/webhook/route.ts` - Webhook处理
- `lib/subscription-utils.ts` - 订阅工具函数
- `app/api/creem/user-credits/route.ts` - 用户积分API
- `app/api/submit/route.ts` - 提交处理
- `app/api/creem/monthly-credits-distribution/route.ts` - 月度分配
- `app/api/creem/activate-pending-subscriptions/route.ts` - 激活订阅
- `app/api/debug/monthly-subscription-diagnosis/route.ts` - 调试工具
- `app/api/creem/subscription-conflict-handler/route.ts` - 订阅冲突处理
- `app/api/debug/simulate-payment-success/route.ts` - 支付模拟

#### 2.2 EventType值说明

| Event Type | 描述 | 使用场景 |
|------------|------|----------|
| `subscription.paid` | 订阅支付成功 | Webhook处理支付成功 |
| `subscription.transfer` | 订阅转换 | 升级/降级处理 |
| `subscription_upgrade` | 订阅升级 | 月度升级到年度 |
| `subscription_activation` | 订阅激活 | 激活待处理的订阅 |
| `new_subscription` | 新订阅 | 创建新的订阅 |
| `monthly_distribution` | 月度分配 | 年度订阅的月度积分分配 |
| `monthly_renewal` | 月度续费 | 月度订阅续费 |
| `credit_consumption` | 积分消费 | 用户消费积分 |
| `manual_addition` | 手动添加 | 管理员手动添加积分 |
| `hairstyle_usage` | 发型使用 | 使用发型服务 |
| `refund.created` | 退款创建 | 处理退款 |
| `dispute.created` | 争议创建 | 处理争议 |
| `manual_fix` | 手动修复 | 调试和修复用途 |
| `payment_simulation` | 支付模拟 | 测试和调试 |

### 3. RPC函数更新

#### 3.1 更新的函数
- `consume_credits()` - 添加了 `event_type` 参数
- `add_credits()` - 添加了 `event_type` 参数
- `process_credits_transaction()` - 新增的综合处理函数

#### 3.2 使用示例
```sql
-- 消费积分
SELECT consume_credits(
    'user-uuid',
    10,
    'hairstyle',
    'TXN_123456',
    'order-123',
    'hairstyle_usage'
);

-- 添加积分
SELECT add_credits(
    'user-uuid',
    100,
    'purchase',
    'TXN_123456',
    'order-123',
    'subscription.paid'
);
```

## 部署步骤

### 1. 数据库迁移
```bash
# 1. 添加字段
psql -f scripts/add-eventtype-field.sql

# 2. 更新RPC函数
psql -f scripts/update-credits-rpc-functions.sql

# 3. 验证实现（可选）
psql -f scripts/test-eventtype-implementation.sql
```

### 2. 代码部署
- 所有代码修改已完成，无需额外配置
- 确保应用重启后生效

## 验证检查

### 1. 字段验证
```sql
-- 检查字段是否存在
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'credits' AND column_name = 'event_type';
```

### 2. 索引验证
```sql
-- 检查索引是否创建
SELECT indexname, indexdef FROM pg_indexes
WHERE tablename = 'credits' AND indexname LIKE '%event_type%';
```

### 3. 数据验证
```sql
-- 检查event_type分布
SELECT event_type, COUNT(*) FROM credits
GROUP BY event_type ORDER BY COUNT(*) DESC;
```

## 使用指南

### 1. 新增credits记录
在插入新的credits记录时，务必包含 `event_type` 字段：

```javascript
await supabase.from('credits').insert({
  user_uuid: userId,
  trans_type: 'purchase',
  trans_no: transactionNo,
  order_no: orderId,
  credits: amount,
  expired_at: null,
  created_at: new Date().toISOString(),
  event_type: 'subscription.paid' // 必须包含
});
```

### 2. 查询分析
可以通过event_type进行更精确的查询和分析：

```sql
-- 查看特定事件类型的积分记录
SELECT * FROM credits WHERE event_type = 'subscription.paid';

-- 分析用户的积分使用模式
SELECT event_type, SUM(credits) as total_credits
FROM credits
WHERE user_uuid = 'user-id'
GROUP BY event_type;
```

## 注意事项

1. **向后兼容性**：现有的代码在添加字段后仍能正常工作
2. **性能影响**：添加了索引以确保查询性能
3. **数据完整性**：所有新记录都必须包含event_type字段
4. **监控**：建议监控没有event_type的记录数量

## 故障排查

### 1. 字段缺失错误
如果出现字段缺失错误，检查：
- 数据库迁移是否成功执行
- 代码是否正确包含event_type字段

### 2. 索引性能问题
如果查询性能下降，检查：
- 索引是否正确创建
- 查询是否使用了合适的event_type过滤

### 3. RPC函数错误
如果RPC函数调用失败，检查：
- 函数是否正确更新
- 参数是否正确传递
- 权限是否正确设置

## 后续改进建议

1. **监控面板**：创建展示不同event_type分布的监控面板
2. **数据分析**：基于event_type进行更深入的用户行为分析
3. **自动化测试**：添加针对event_type的自动化测试用例
4. **文档更新**：持续更新API文档包含event_type字段说明 