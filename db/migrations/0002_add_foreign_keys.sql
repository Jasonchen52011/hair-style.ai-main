-- 添加外键关系

-- 1. orders 表关联到 users 表
ALTER TABLE "orders" 
ADD CONSTRAINT "orders_user_uuid_fkey" 
FOREIGN KEY ("user_uuid") 
REFERENCES "users" ("uuid") 
ON DELETE CASCADE;

-- 2. credits 表关联到 users 表
ALTER TABLE "credits" 
ADD CONSTRAINT "credits_user_uuid_fkey" 
FOREIGN KEY ("user_uuid") 
REFERENCES "users" ("uuid") 
ON DELETE CASCADE;

-- 3. credits 表关联到 orders 表（可选，因为不是所有积分都来自订单）
-- 注意：order_no 可能为 NULL，所以这是一个可选的外键
ALTER TABLE "credits" 
ADD CONSTRAINT "credits_order_no_fkey" 
FOREIGN KEY ("order_no") 
REFERENCES "orders" ("order_no") 
ON DELETE SET NULL;

-- 4. user_credits_balance 表关联到 users 表
ALTER TABLE "user_credits_balance" 
ADD CONSTRAINT "user_credits_balance_user_uuid_fkey" 
FOREIGN KEY ("user_uuid") 
REFERENCES "users" ("uuid") 
ON DELETE CASCADE;

-- 5. apikeys 表关联到 users 表
ALTER TABLE "apikeys" 
ADD CONSTRAINT "apikeys_user_uuid_fkey" 
FOREIGN KEY ("user_uuid") 
REFERENCES "users" ("uuid") 
ON DELETE CASCADE;

-- 6. affiliates 表关联到 users 表
ALTER TABLE "affiliates" 
ADD CONSTRAINT "affiliates_user_uuid_fkey" 
FOREIGN KEY ("user_uuid") 
REFERENCES "users" ("uuid") 
ON DELETE CASCADE;

-- affiliates 表的 invited_by 字段也关联到 users 表
ALTER TABLE "affiliates" 
ADD CONSTRAINT "affiliates_invited_by_fkey" 
FOREIGN KEY ("invited_by") 
REFERENCES "users" ("uuid") 
ON DELETE SET NULL;

-- 7. feedbacks 表关联到 users 表（可选，因为反馈可能来自未登录用户）
ALTER TABLE "feedbacks" 
ADD CONSTRAINT "feedbacks_user_uuid_fkey" 
FOREIGN KEY ("user_uuid") 
REFERENCES "users" ("uuid") 
ON DELETE SET NULL;

-- 创建额外的索引以提高查询性能
CREATE INDEX IF NOT EXISTS "orders_user_uuid_idx" ON "orders" ("user_uuid");
CREATE INDEX IF NOT EXISTS "credits_user_uuid_idx" ON "credits" ("user_uuid");
CREATE INDEX IF NOT EXISTS "affiliates_invited_by_idx" ON "affiliates" ("invited_by");