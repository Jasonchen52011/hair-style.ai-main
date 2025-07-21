-- 创建管理员查询函数（可选）
-- 这些函数可以让管理员页面更安全地执行预定义查询

-- 1. 获取失败原因统计
CREATE OR REPLACE FUNCTION get_failure_analysis(days_back INTEGER DEFAULT 7)
RETURNS TABLE (
    failure_reason TEXT,
    failure_count BIGINT,
    affected_users BIGINT,
    percentage NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.failure_reason::TEXT,
        COUNT(*)::BIGINT as failure_count,
        COUNT(DISTINCT t.user_id)::BIGINT as affected_users,
        ROUND(COUNT(*)::numeric / 
            (SELECT COUNT(*) FROM hairstyle_generation_tasks WHERE status = 'failed')::numeric * 100, 2
        ) as percentage
    FROM hairstyle_generation_tasks t
    WHERE t.status = 'failed'
        AND t.created_at >= NOW() - INTERVAL '1 day' * days_back
    GROUP BY t.failure_reason
    ORDER BY failure_count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. 获取用户转化漏斗
CREATE OR REPLACE FUNCTION get_user_funnel(days_back INTEGER DEFAULT 7)
RETURNS TABLE (
    stage TEXT,
    users BIGINT
) AS $$
BEGIN
    RETURN QUERY
    WITH user_funnel AS (
        SELECT 
            user_id,
            MAX(CASE WHEN action_name = 'ai_hairstyle_page' THEN 1 ELSE 0 END) as visited_page,
            MAX(CASE WHEN action_name = 'image_upload_success' THEN 1 ELSE 0 END) as uploaded_image,
            MAX(CASE WHEN action_name = 'hairstyle_selected' THEN 1 ELSE 0 END) as selected_style,
            MAX(CASE WHEN action_name = 'hairstyle_generation_started' THEN 1 ELSE 0 END) as started_generation,
            MAX(CASE WHEN action_name = 'hairstyle_generated' THEN 1 ELSE 0 END) as completed_generation
        FROM user_activity_logs
        WHERE created_at >= NOW() - INTERVAL '1 day' * days_back
        GROUP BY user_id
    )
    SELECT 
        'Page Visit'::TEXT as stage,
        COUNT(CASE WHEN visited_page = 1 THEN 1 END)::BIGINT as users
    FROM user_funnel
    UNION ALL
    SELECT 
        'Image Upload'::TEXT,
        COUNT(CASE WHEN uploaded_image = 1 THEN 1 END)::BIGINT
    FROM user_funnel
    UNION ALL
    SELECT 
        'Style Selected'::TEXT,
        COUNT(CASE WHEN selected_style = 1 THEN 1 END)::BIGINT
    FROM user_funnel
    UNION ALL
    SELECT 
        'Generation Started'::TEXT,
        COUNT(CASE WHEN started_generation = 1 THEN 1 END)::BIGINT
    FROM user_funnel
    UNION ALL
    SELECT 
        'Generation Completed'::TEXT,
        COUNT(CASE WHEN completed_generation = 1 THEN 1 END)::BIGINT
    FROM user_funnel;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. 获取实时监控数据
CREATE OR REPLACE FUNCTION get_realtime_monitor()
RETURNS TABLE (
    task_id TEXT,
    user_email TEXT,
    status TEXT,
    failure_reason TEXT,
    poll_count INTEGER,
    processing_time_ms INTEGER,
    created_at TIMESTAMPTZ,
    health_status TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.task_id,
        p.email,
        t.status,
        t.failure_reason,
        t.poll_count,
        t.processing_time_ms,
        t.created_at,
        CASE 
            WHEN t.status = 'processing' AND t.created_at < NOW() - INTERVAL '5 minutes' 
            THEN 'STUCK'::TEXT
            ELSE 'NORMAL'::TEXT
        END as health_status
    FROM hairstyle_generation_tasks t
    LEFT JOIN profiles p ON t.user_id = p.id
    WHERE t.created_at >= NOW() - INTERVAL '1 hour'
    ORDER BY t.created_at DESC
    LIMIT 100;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 授予执行权限给authenticated用户
GRANT EXECUTE ON FUNCTION get_failure_analysis TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_funnel TO authenticated;
GRANT EXECUTE ON FUNCTION get_realtime_monitor TO authenticated;