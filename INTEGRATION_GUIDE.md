# Stripe积分系统集成指南

## 积分使用集成

要将新的积分系统集成到AI生成功能中，请按以下步骤修改 `/app/api/submit/route.ts` 文件：

### 1. 在文件开头添加导入

```typescript
import { getUserCreditsBalance, deductUserCredits } from "@/models/userCreditsBalance";
import { insertCredit } from "@/models/credit";
import { getSnowId } from "@/lib/hash";
```

### 2. 修改POST方法中的积分检查

替换现有的积分检查逻辑（大约在第210行）：

```typescript
// 旧代码：if (userCredits < 10) {
// 新代码：
const creditsBalance = await getUserCreditsBalance(user.id);
if (!creditsBalance || creditsBalance.balance < 10) {
  return NextResponse.json({
    success: false,
    error: 'You need at least 10 credits to generate a hairstyle. Please purchase more credits!',
    errorType: 'insufficient_credits',
    currentCredits: creditsBalance?.balance || 0,
    requiredCredits: 10
  }, { status: 402 });
}
```

### 3. 修改GET方法中的积分扣除逻辑

在任务成功完成时扣除积分（大约在第580-620行），替换现有的扣除逻辑：

```typescript
// 旧代码：使用adminSupabase更新profiles表
// 新代码：
if (user && hasActiveSubscription) {
  try {
    // 使用新的积分系统扣除积分
    const updatedBalance = await deductUserCredits(user.id, 10);
    
    // 创建积分交易记录
    await insertCredit({
      trans_no: getSnowId(),
      created_at: new Date(),
      user_uuid: user.id,
      trans_type: 'hairstyle',
      credits: -10,
      order_no: taskId,
    });
    
    chargedTasks.add(taskId);
    console.log(`✅ Credits deducted: ${updatedBalance.balance} remaining for user ${user.id}, task ${taskId}`);
    
    // 在响应中添加积分扣除信息
    statusData.creditsDeducted = 10;
    statusData.newCreditBalance = updatedBalance.balance;
  } catch (error) {
    console.error(`❌ Failed to deduct credits for task ${taskId}:`, error);
  }
}
```

## 测试要点

1. **积分余额显示**：确保pricing页面正确显示用户的积分余额
2. **积分购买**：测试Stripe支付流程，确保积分正确添加到用户账户
3. **积分使用**：生成AI图片时，确保积分正确扣除
4. **余额不足**：测试积分不足时的错误提示

## 环境变量配置

确保在.env文件中配置以下变量：

```
# Stripe配置
STRIPE_PUBLIC_KEY=pk_test_xxx
STRIPE_PRIVATE_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# 支付回调URL
NEXT_PUBLIC_PAY_SUCCESS_URL=http://localhost:3000/my-orders
NEXT_PUBLIC_PAY_CANCEL_URL=http://localhost:3000/#pricing
```

## Webhook配置

### 本地测试
使用Stripe CLI转发webhook到本地：
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

### 生产环境
在Stripe Dashboard中配置webhook端点：
- URL: `https://your-domain.com/api/stripe/webhook`
- 事件: `checkout.session.completed`