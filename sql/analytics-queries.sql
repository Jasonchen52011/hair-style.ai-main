-- 用户操作日志分析查询示例

-- 1. 查看最近24小时内的发型生成失败情况
SELECT 
    t.user_id,
    p.email,
    t.task_id,
    t.failure_reason,
    t.failure_details,
    t.created_at,
    COUNT(a.id) as api_calls_count,
    MAX(a.response_status) as last_status
FROM hairstyle_generation_tasks t
LEFT JOIN profiles p ON t.user_id = p.id
LEFT JOIN api_call_logs a ON t.task_id = a.task_id
WHERE t.status = 'failed' 
    AND t.created_at >= NOW() - INTERVAL '24 hours'
GROUP BY t.user_id, p.email, t.task_id, t.failure_reason, t.failure_details, t.created_at
ORDER BY t.created_at DESC;

-- 2. 统计失败原因分布
SELECT 
    failure_reason,
    COUNT(*) as failure_count,
    COUNT(DISTINCT user_id) as affected_users,
    ROUND(COUNT(*)::numeric / 
        (SELECT COUNT(*) FROM hairstyle_generation_tasks WHERE status = 'failed')::numeric * 100, 2
    ) as percentage
FROM hairstyle_generation_tasks
WHERE status = 'failed'
    AND created_at >= NOW() - INTERVAL '7 days'
GROUP BY failure_reason
ORDER BY failure_count DESC;

-- 3. 查看422错误的详细情况
SELECT 
    u.user_id,
    u.timestamp,
    u.metadata,
    a.request_body,
    a.response_body,
    a.error_message
FROM user_activity_logs u
JOIN api_call_logs a ON u.id = a.activity_log_id
WHERE a.response_status = 422
    AND u.timestamp >= NOW() - INTERVAL '24 hours'
ORDER BY u.timestamp DESC
LIMIT 50;

-- 4. 用户行为漏斗分析
WITH user_funnel AS (
    SELECT 
        user_id,
        MAX(CASE WHEN action_name = 'ai_hairstyle_page' THEN 1 ELSE 0 END) as visited_page,
        MAX(CASE WHEN action_name = 'image_upload_success' THEN 1 ELSE 0 END) as uploaded_image,
        MAX(CASE WHEN action_name = 'hairstyle_selected' THEN 1 ELSE 0 END) as selected_style,
        MAX(CASE WHEN action_name = 'hairstyle_generation_started' THEN 1 ELSE 0 END) as started_generation,
        MAX(CASE WHEN action_name = 'hairstyle_generated' THEN 1 ELSE 0 END) as completed_generation
    FROM user_activity_logs
    WHERE timestamp >= NOW() - INTERVAL '7 days'
    GROUP BY user_id
)
SELECT 
    'Page Visit' as stage,
    COUNT(CASE WHEN visited_page = 1 THEN 1 END) as users
FROM user_funnel
UNION ALL
SELECT 
    'Image Upload' as stage,
    COUNT(CASE WHEN uploaded_image = 1 THEN 1 END) as users
FROM user_funnel
UNION ALL
SELECT 
    'Style Selected' as stage,
    COUNT(CASE WHEN selected_style = 1 THEN 1 END) as users
FROM user_funnel
UNION ALL
SELECT 
    'Generation Started' as stage,
    COUNT(CASE WHEN started_generation = 1 THEN 1 END) as users
FROM user_funnel
UNION ALL
SELECT 
    'Generation Completed' as stage,
    COUNT(CASE WHEN completed_generation = 1 THEN 1 END) as users
FROM user_funnel;

-- 5. API响应时间分析
SELECT 
    endpoint,
    COUNT(*) as request_count,
    AVG(response_time_ms) as avg_response_time,
    MIN(response_time_ms) as min_response_time,
    MAX(response_time_ms) as max_response_time,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY response_time_ms) as median_response_time,
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY response_time_ms) as p95_response_time
FROM api_call_logs
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY endpoint
ORDER BY request_count DESC;

-- 6. 未登录用户使用情况
SELECT 
    DATE(timestamp) as date,
    COUNT(DISTINCT session_id) as guest_sessions,
    COUNT(CASE WHEN action_name = 'hairstyle_generation_started' THEN 1 END) as generation_attempts,
    COUNT(CASE WHEN action_name = 'guest_limit_reached' THEN 1 END) as limit_reached
FROM user_activity_logs
WHERE user_id IS NULL
    AND timestamp >= NOW() - INTERVAL '7 days'
GROUP BY DATE(timestamp)
ORDER BY date DESC;

-- 7. 错误率趋势
SELECT 
    DATE_TRUNC('hour', created_at) as hour,
    COUNT(*) as total_requests,
    COUNT(CASE WHEN response_status >= 400 THEN 1 END) as error_count,
    ROUND(
        COUNT(CASE WHEN response_status >= 400 THEN 1 END)::numeric / 
        COUNT(*)::numeric * 100, 2
    ) as error_rate
FROM api_call_logs
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', created_at)
ORDER BY hour DESC;

-- 8. 发型和颜色选择偏好
SELECT 
    metadata->>'selected_style' as hairstyle,
    metadata->>'selected_gender' as gender,
    COUNT(*) as selection_count
FROM user_activity_logs
WHERE action_name = 'hairstyle_selected'
    AND timestamp >= NOW() - INTERVAL '30 days'
GROUP BY metadata->>'selected_style', metadata->>'selected_gender'
ORDER BY selection_count DESC
LIMIT 20;

-- 9. 设备类型分析
SELECT 
    device_type,
    browser,
    COUNT(DISTINCT user_id) as unique_users,
    COUNT(*) as total_actions,
    COUNT(CASE WHEN action_name = 'hairstyle_generated' THEN 1 END) as successful_generations,
    COUNT(CASE WHEN action_name = 'generation_failed' THEN 1 END) as failed_generations
FROM user_activity_logs
WHERE timestamp >= NOW() - INTERVAL '7 days'
GROUP BY device_type, browser
ORDER BY unique_users DESC;

-- 10. 创建实时监控视图
CREATE OR REPLACE VIEW realtime_generation_monitor AS
SELECT 
    t.task_id,
    t.user_id,
    p.email,
    t.status,
    t.failure_reason,
    t.poll_count,
    t.processing_time_ms,
    t.created_at,
    CASE 
        WHEN t.status = 'processing' AND t.created_at < NOW() - INTERVAL '5 minutes' 
        THEN 'STUCK'
        ELSE 'NORMAL'
    END as health_status
FROM hairstyle_generation_tasks t
LEFT JOIN profiles p ON t.user_id = p.id
WHERE t.created_at >= NOW() - INTERVAL '1 hour'
ORDER BY t.created_at DESC;