-- 🔍 完整的支付流程测试报告
-- 请在 Supabase SQL Editor 中运行这个脚本

-- ================================================
-- 1. 表结构和外键检查
-- ================================================
SELECT '===== 1. 表结构检查 =====' as section;

-- orders 表的外键约束
SELECT 
  tc.constraint_name,
  kcu.column_name as "orders表字段",
  ccu.table_schema || '.' || ccu.table_name as "引用的表",
  ccu.column_name as "引用的字段"
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu 
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'orders' 
  AND tc.constraint_type = 'FOREIGN KEY'
  AND kcu.column_name = 'user_uuid';

-- ================================================
-- 2. 数据统计
-- ================================================
SELECT '===== 2. 数据统计 =====' as section;

SELECT 
  'auth.users' as "表名",
  COUNT(*) as "记录数"
FROM auth.users
UNION ALL
SELECT 
  'profiles',
  COUNT(*)
FROM profiles
UNION ALL
SELECT 
  'orders',
  COUNT(*)
FROM orders;

-- ================================================
-- 3. 数据一致性检查
-- ================================================
SELECT '===== 3. 数据一致性 =====' as section;

-- 查找没有 profile 的 auth.users
WITH missing_profiles AS (
  SELECT 
    au.id,
    au.email,
    au.created_at
  FROM auth.users au
  LEFT JOIN profiles p ON p.id = au.id
  WHERE p.id IS NULL
)
SELECT 
  COUNT(*) as "缺少profile的用户数",
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ 所有用户都有profile'
    ELSE '❌ 有用户缺少profile，订单创建会失败'
  END as "状态"
FROM missing_profiles;

-- ================================================
-- 4. 测试订单创建
-- ================================================
SELECT '===== 4. 订单创建测试 =====' as section;

DO $$
DECLARE
  test_user_id UUID;
  test_order_no TEXT := 'TEST_FLOW_' || substring(md5(random()::text), 1, 8);
  test_result TEXT;
BEGIN
  -- 获取一个有 profile 的用户
  SELECT id INTO test_user_id 
  FROM profiles 
  LIMIT 1;
  
  IF test_user_id IS NULL THEN
    RAISE NOTICE '❌ 没有找到任何 profile 记录';
    RETURN;
  END IF;
  
  -- 尝试创建订单
  BEGIN
    INSERT INTO orders (
      order_no,
      user_uuid,
      user_email,
      amount,
      status,
      stripe_session_id,
      credits,
      currency,
      product_id,
      product_name,
      created_at
    ) VALUES (
      test_order_no,
      test_user_id,
      'test@example.com',
      5600,
      'pending',
      'cs_test_' || substring(md5(random()::text), 1, 8),
      800,
      'usd',
      'prod_SoOoHIVnE6zTR0',
      '800 Credits',
      NOW()
    );
    
    RAISE NOTICE '✅ 订单创建成功: %', test_order_no;
    
    -- 清理测试数据
    DELETE FROM orders WHERE order_no = test_order_no;
    RAISE NOTICE '🧹 测试订单已清理';
    
  EXCEPTION
    WHEN foreign_key_violation THEN
      RAISE NOTICE '❌ 外键约束错误: user_uuid (%) 在引用的表中不存在', test_user_id;
      RAISE NOTICE '   错误详情: %', SQLERRM;
    WHEN OTHERS THEN
      RAISE NOTICE '❌ 订单创建失败: %', SQLERRM;
  END;
END $$;

-- ================================================
-- 5. 最近的失败订单
-- ================================================
SELECT '===== 5. 最近的订单状态 =====' as section;

SELECT 
  order_no as "订单号",
  user_uuid as "用户ID",
  status as "状态",
  created_at as "创建时间",
  CASE 
    WHEN p.id IS NULL THEN '❌ 用户无profile'
    ELSE '✅ 用户有profile'
  END as "profile状态"
FROM orders o
LEFT JOIN profiles p ON p.id = o.user_uuid
WHERE o.created_at >= NOW() - INTERVAL '24 hours'
ORDER BY o.created_at DESC
LIMIT 5;

-- ================================================
-- 6. 问题诊断
-- ================================================
SELECT '===== 6. 问题诊断 =====' as section;

-- 检查是否有孤儿订单
SELECT 
  COUNT(*) as "孤儿订单数",
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ 没有孤儿订单'
    ELSE '❌ 存在无效用户的订单'
  END as "状态"
FROM orders o
WHERE NOT EXISTS (
  SELECT 1 FROM profiles p WHERE p.id = o.user_uuid
);

-- ================================================
-- 7. 修复建议
-- ================================================
SELECT '===== 7. 自动修复 =====' as section;

-- 为所有 auth.users 创建缺失的 profiles
INSERT INTO profiles (id, email, created_at, updated_at, has_access)
SELECT 
  au.id,
  au.email,
  au.created_at,
  NOW(),
  true
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM profiles p WHERE p.id = au.id
)
ON CONFLICT (id) DO NOTHING;

-- 报告修复结果
SELECT 
  '修复完成' as "状态",
  COUNT(*) as "profiles总数"
FROM profiles;