-- 创建一个触发器函数，当profiles表有新记录时同步到users表
CREATE OR REPLACE FUNCTION sync_profile_to_users()
RETURNS TRIGGER AS $$
BEGIN
  -- 检查users表中是否已存在该用户
  IF NOT EXISTS (SELECT 1 FROM users WHERE email = NEW.email) THEN
    -- 插入新用户到users表
    INSERT INTO users (
      uuid,
      email,
      nickname,
      avatar_url,
      signin_type,
      signin_provider,
      signin_openid,
      created_at,
      updated_at
    ) VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.name, ''),
      COALESCE(NEW.image, ''),
      'oauth',
      'google',
      NEW.id,
      COALESCE(NEW.created_at, NOW()),
      NOW()
    );
    
    -- 同时创建初始积分余额记录
    INSERT INTO user_credits_balance (
      user_uuid,
      balance,
      created_at,
      updated_at
    ) VALUES (
      NEW.id,
      0,
      NOW(),
      NOW()
    ) ON CONFLICT (user_uuid) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器
DROP TRIGGER IF EXISTS sync_profile_to_users_trigger ON profiles;
CREATE TRIGGER sync_profile_to_users_trigger
AFTER INSERT ON profiles
FOR EACH ROW
EXECUTE FUNCTION sync_profile_to_users();

-- 更新触发器函数，当profiles表更新时同步到users表
CREATE OR REPLACE FUNCTION sync_profile_update_to_users()
RETURNS TRIGGER AS $$
BEGIN
  -- 更新users表中的对应记录
  UPDATE users
  SET
    nickname = COALESCE(NEW.name, OLD.name, ''),
    avatar_url = COALESCE(NEW.image, OLD.image, ''),
    updated_at = NOW()
  WHERE uuid = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建更新触发器
DROP TRIGGER IF EXISTS sync_profile_update_to_users_trigger ON profiles;
CREATE TRIGGER sync_profile_update_to_users_trigger
AFTER UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION sync_profile_update_to_users();