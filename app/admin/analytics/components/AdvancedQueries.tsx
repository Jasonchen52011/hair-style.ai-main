"use client";

import { useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export function AdvancedQueries() {
  const [queryResult, setQueryResult] = useState<any[]>([]);
  const [selectedQuery, setSelectedQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const supabase = createClientComponentClient();

  const predefinedQueries = [
    {
      id: "failure_analysis",
      name: "failed hairstyle generation failure reason analysis (last 7 days)",
      query: `
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
        ORDER BY failure_count DESC
      `
    },
    {
      id: "user_funnel",
      name: "用户转化漏斗",
      query: `
        WITH user_funnel AS (
          SELECT 
            user_id,
            MAX(CASE WHEN action_name = 'ai_hairstyle_page' THEN 1 ELSE 0 END) as visited_page,
            MAX(CASE WHEN action_name = 'image_upload_success' THEN 1 ELSE 0 END) as uploaded_image,
            MAX(CASE WHEN action_name = 'hairstyle_selected' THEN 1 ELSE 0 END) as selected_style,
            MAX(CASE WHEN action_name = 'hairstyle_generation_started' THEN 1 ELSE 0 END) as started_generation,
            MAX(CASE WHEN action_name = 'hairstyle_generated' THEN 1 ELSE 0 END) as completed_generation
          FROM user_activity_logs
          WHERE created_at >= NOW() - INTERVAL '7 days'
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
        FROM user_funnel
      `
    },
    {
      id: "api_performance",
      name: "API performance analysis (last 24 hours)",
      query: `
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
        ORDER BY request_count DESC
      `
    },
    {
      id: "error_422_details",
      name: "422 error details (image quality problem)",
      query: `
        SELECT 
          u.created_at,
          u.user_id,
          u.metadata,
          a.request_body,
          a.response_body,
          a.error_message
        FROM user_activity_logs u
        JOIN api_call_logs a ON u.id = a.activity_log_id
        WHERE a.response_status = 422
          AND u.created_at >= NOW() - INTERVAL '24 hours'
        ORDER BY u.created_at DESC
        LIMIT 20
      `
    },
    {
      id: "popular_styles",
      name: "popular hairstyles and colors",
      query: `
        SELECT 
          metadata->>'selected_style' as hairstyle,
          metadata->>'selected_gender' as gender,
          COUNT(*) as selection_count
        FROM user_activity_logs
        WHERE action_name = 'hairstyle_selected'
          AND created_at >= NOW() - INTERVAL '30 days'
        GROUP BY metadata->>'selected_style', metadata->>'selected_gender'
        ORDER BY selection_count DESC
        LIMIT 20
      `
    },
    {
      id: "hourly_error_trend",
      name: "error rate trend (by hour)",
      query: `
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
        ORDER BY hour DESC
      `
    },
    {
      id: "stuck_tasks",
      name: "stuck tasks (more than 5 minutes)",
      query: `
        SELECT 
          task_id,
          user_id,
          status,
          poll_count,
          created_at,
          NOW() - created_at as stuck_duration
        FROM hairstyle_generation_tasks
        WHERE status = 'processing' 
          AND created_at < NOW() - INTERVAL '5 minutes'
        ORDER BY created_at DESC
      `
    },
    {
      id: "guest_usage",
      name: "guest usage",
      query: `
        SELECT 
          DATE(timestamp) as date,
          COUNT(DISTINCT session_id) as guest_sessions,
          COUNT(CASE WHEN action_name = 'hairstyle_generation_started' THEN 1 END) as generation_attempts,
          COUNT(CASE WHEN action_name = 'guest_limit_reached' THEN 1 END) as limit_reached
        FROM user_activity_logs
        WHERE user_id IS NULL
          AND timestamp >= NOW() - INTERVAL '7 days'
        GROUP BY DATE(timestamp)
        ORDER BY date DESC
      `
    }
  ];

  const executeQuery = async (query: string) => {
    setLoading(true);
    setError("");
    setQueryResult([]);

    try {
      const { data, error: queryError } = await supabase.rpc('execute_sql', {
        query: query
      });

      if (queryError) {
        // 如果RPC不存在，尝试直接查询
        const match = query.match(/FROM\s+(\w+)/i);
        if (match) {
          const tableName = match[1];
          const { data: tableData, error: tableError } = await supabase
            .from(tableName)
            .select('*')
            .limit(50);

          if (tableError) {
            throw tableError;
          }
          setQueryResult(tableData || []);
        } else {
          throw new Error("无法执行查询，请检查SQL语法");
        }
      } else {
        setQueryResult(data || []);
      }
    } catch (err: any) {
      setError(err.message || "查询执行失败");
      console.error("Query error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuerySelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const queryId = e.target.value;
    setSelectedQuery(queryId);
    
    const query = predefinedQueries.find(q => q.id === queryId);
    if (query) {
      executeQuery(query.query);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          select predefined query
        </label>
        <select
          value={selectedQuery}
          onChange={handleQuerySelect}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500"
        >
          <option value="">-- select query --</option>
          {predefinedQueries.map(query => (
            <option key={query.id} value={query.id}>
              {query.name}
            </option>
          ))}
        </select>
      </div>

      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">executing query...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {queryResult.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b">
            <h3 className="text-lg font-medium text-gray-900">
              query result ({queryResult.length} records)
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {Object.keys(queryResult[0]).map(key => (
                    <th
                      key={key}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {queryResult.map((row, idx) => (
                  <tr key={idx}>
                    {Object.entries(row).map(([key, value]) => (
                      <td key={key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {typeof value === 'object' 
                          ? JSON.stringify(value).substring(0, 50) + '...'
                          : String(value)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}