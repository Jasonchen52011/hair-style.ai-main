# 认证系统清理计划

## 当前状况
- ❌ NextAuth (废弃但代码仍存在)
- ✅ Supabase Auth (主要使用)
- ⚠️ Simple Auth (绕过系统)

## 清理步骤

### 第一阶段：移除NextAuth
1. 删除 `auth/` 目录
2. 删除 `app/api/admin/stripe/auth/[...nextauth]/` 
3. 从 package.json 移除 `next-auth` 依赖
4. 清理相关imports和类型定义

### 第二阶段：修复Simple Auth
1. 将 `lib/simple-auth.ts` 改为使用标准Supabase客户端
2. 移除绕过RLS的管理员逻辑
3. 统一使用 `user_credits_balance` 表

### 第三阶段：优化Supabase Auth
1. 确保回调处理正确创建用户记录
2. 统一错误处理
3. 清理调试页面

## 预期结果
- 单一认证系统
- 代码减少50%+
- 维护简单
- 安全性提升