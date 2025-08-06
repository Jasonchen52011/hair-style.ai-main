-- 为 orders 表添加 INSERT 权限策略
-- 允许认证用户为自己创建订单
CREATE POLICY "Users can insert own orders" ON public.orders
    FOR INSERT 
    WITH CHECK (auth.uid() = user_uuid);

-- 或者，如果你想让 service role 完全绕过 RLS
-- 可以暂时禁用 orders 表的 RLS（不推荐用于生产环境）
-- ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;

-- 查看现有策略
-- SELECT * FROM pg_policies WHERE tablename = 'orders';