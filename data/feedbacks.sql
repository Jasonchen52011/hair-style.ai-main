CREATE TABLE feedbacks (
    id SERIAL PRIMARY KEY,
    user_id uuid REFERENCES profiles(id),  -- 关联到 profiles 表，允许为 NULL
    email TEXT,                             -- 存储用户邮箱，可以为 NULL
    feedback_type VARCHAR(255) NOT NULL,     -- 问题类型
    feedback_detail TEXT NOT NULL,           -- 具体问题描述
    comments TEXT,                           -- 用户额外的评论
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP  -- 提交时间
);
