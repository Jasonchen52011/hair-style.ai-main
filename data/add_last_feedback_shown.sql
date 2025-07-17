-- 为profiles表添加last_feedback_shown字段，用于记录用户最后一次显示反馈弹窗的时间
-- 这样可以实现24小时冷却时间的功能

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS last_feedback_shown TIMESTAMP DEFAULT NULL;

-- 添加注释说明字段用途
COMMENT ON COLUMN public.profiles.last_feedback_shown IS 'user last feedback shown time, for 24 hours cooling time';