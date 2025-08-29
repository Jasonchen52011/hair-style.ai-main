# Supabase Services 迁移总结

## 概览

本次迁移为了让API能在Cloudflare Pages的Edge Runtime下工作，创建了基于Supabase的services文件来替换当前使用postgres+Drizzle的services。

## 创建的文件

### 1. 类型定义文件

#### `/types/user.ts`
- 定义了 `User` 接口，包含用户基本信息
- 定义了 `UserCredits` 接口，包含积分相关信息

#### `/types/order.ts` 
- 定义了 `Order` 接口，包含订单的所有字段信息

### 2. 服务文件

#### `/services/creditSupabase.ts`
基于现有的 `/services/credit.ts` 创建，主要特点：
- 使用 `createClient` 从 `@supabase/supabase-js` 创建Supabase客户端
- 保持所有现有的API接口不变（函数名、参数、返回值）
- 使用相同的枚举：`CreditsTransType`、`CreditsAmount`
- 实现的核心函数：
  - `getUserCredits()` - 获取用户积分信息
  - `decreaseCredits()` - 减少积分
  - `increaseCredits()` - 增加积分
  - `updateCreditForOrder()` - 为订单更新积分
- 内部辅助函数：
  - `getUserValidCredits()` - 获取用户有效积分记录
  - `findCreditByOrderNo()` - 根据订单号查找积分记录
  - `insertCredit()` - 插入积分记录
  - `getFirstPaidOrderByUserUuid()` - 获取第一个付费订单

#### `/services/userSupabase.ts`
基于现有的 `/services/user.ts` 创建，主要特点：
- 认证部分保持使用Supabase Auth（已经兼容）
- 保持所有现有的API接口不变
- 实现的核心函数：
  - `saveUser()` - 保存用户信息（如不存在则创建新用户）
  - `getUserUuid()` - 获取用户UUID
  - `getBearerToken()` - 获取Bearer Token
  - `getUserEmail()` - 获取用户邮箱
  - `getUserInfo()` - 获取用户信息
- 内部辅助函数：
  - `findUserByEmail()` - 根据邮箱查找用户
  - `findUserByUuid()` - 根据UUID查找用户
  - `insertUser()` - 插入用户
  - `getUserUuidByApiKey()` - 根据API Key获取用户UUID

## 技术实现细节

### Supabase客户端配置
```typescript
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase configuration missing');
  }
  
  return createClient(supabaseUrl, supabaseServiceKey);
}
```

### 环境变量要求
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase项目URL
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase服务角色密钥

### 数据表假设
代码假设Supabase中存在以下表：
- `credits` - 积分记录表
- `users` - 用户表 
- `orders` - 订单表
- `apikeys` - API密钥表

### 错误处理
- 所有函数都包含robust错误处理
- 使用 `console.error` 记录错误详情
- 对于查询不到数据的情况（PGRST116错误码），正确处理为返回null

### Edge Runtime兼容性
- 所有函数都设计为兼容Edge Runtime
- 使用Supabase客户端替代直接的数据库连接
- 避免使用Node.js特有的API

## 使用方式

这些新的服务文件可以直接替换原有的services文件：

```typescript
// 替换原有导入
// import { getUserCredits } from "@/services/credit";
import { getUserCredits } from "@/services/creditSupabase";

// import { saveUser } from "@/services/user"; 
import { saveUser } from "@/services/userSupabase";
```

所有函数接口保持完全一致，无需修改调用代码。