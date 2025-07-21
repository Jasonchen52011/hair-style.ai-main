 1. 建表SQL（必须先执行）

  我之前提供的建表SQL需要先在Supabase的SQL编辑器中执行：

  -- 1. 用户操作日志主表
  CREATE TABLE public.user_activity_logs (
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id uuid REFERENCES public.profiles(id) ON
  DELETE CASCADE,
      session_id text NOT NULL,
      action_type text NOT NULL,
      action_name text NOT NULL,
      page_url text,
      timestamp timestamp with time zone DEFAULT
  timezone('utc'::text, now()),
      user_agent text,
      ip_address inet,
      device_type text,
      browser text,
      metadata jsonb,
      created_at timestamp with time zone DEFAULT
  timezone('utc'::text, now())
  );

  -- 2. API调用日志表
  CREATE TABLE public.api_call_logs (
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id uuid REFERENCES public.profiles(id) ON
  DELETE CASCADE,
      session_id text NOT NULL,
      activity_log_id uuid REFERENCES
  public.user_activity_logs(id) ON DELETE CASCADE,
      endpoint text NOT NULL,
      method text NOT NULL,
      request_body jsonb,
      request_headers jsonb,
      response_status integer,
      response_body jsonb,
      response_time_ms integer,
      error_type text,
      error_message text,
      task_id text,
      created_at timestamp with time zone DEFAULT
  timezone('utc'::text, now())
  );

  -- 3. AI发型生成任务表
  CREATE TABLE public.hairstyle_generation_tasks (
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      task_id text UNIQUE NOT NULL,
      user_id uuid REFERENCES public.profiles(id) ON
  DELETE CASCADE,
      session_id text NOT NULL,
      selected_style text,
      selected_color text,
      selected_gender text,
      image_url text,
      status text NOT NULL,
      failure_reason text,
      failure_details jsonb,
      credits_used integer DEFAULT 0,
      processing_time_ms integer,
      poll_count integer DEFAULT 0,
      created_at timestamp with time zone DEFAULT
  timezone('utc'::text, now()),
      updated_at timestamp with time zone DEFAULT
  timezone('utc'::text, now())
  );

  -- 4. 用户操作错误日志表
  CREATE TABLE public.user_error_logs (
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id uuid REFERENCES public.profiles(id) ON
  DELETE CASCADE,
      session_id text NOT NULL,
      activity_log_id uuid REFERENCES
  public.user_activity_logs(id) ON DELETE CASCADE,
      error_type text NOT NULL,
      error_code text,
      error_message text,
      error_stack text,
      context jsonb,
      resolved boolean DEFAULT false,
      created_at timestamp with time zone DEFAULT
  timezone('utc'::text, now())
  );

  -- 创建索引
  CREATE INDEX idx_user_activity_logs_user_id ON
  public.user_activity_logs(user_id);
  CREATE INDEX idx_user_activity_logs_session_id ON
  public.user_activity_logs(session_id);
  CREATE INDEX idx_user_activity_logs_timestamp ON
  public.user_activity_logs(timestamp);
  CREATE INDEX idx_user_activity_logs_action_type ON
  public.user_activity_logs(action_type);

  CREATE INDEX idx_api_call_logs_user_id ON
  public.api_call_logs(user_id);
  CREATE INDEX idx_api_call_logs_session_id ON
  public.api_call_logs(session_id);
  CREATE INDEX idx_api_call_logs_endpoint ON
  public.api_call_logs(endpoint);
  CREATE INDEX idx_api_call_logs_response_status ON
  public.api_call_logs(response_status);
  CREATE INDEX idx_api_call_logs_task_id ON
  public.api_call_logs(task_id);

  CREATE INDEX idx_hairstyle_generation_tasks_user_id ON
   public.hairstyle_generation_tasks(user_id);
  CREATE INDEX idx_hairstyle_generation_tasks_task_id ON
   public.hairstyle_generation_tasks(task_id);
  CREATE INDEX idx_hairstyle_generation_tasks_status ON
  public.hairstyle_generation_tasks(status);
  CREATE INDEX idx_hairstyle_generation_tasks_created_at
   ON public.hairstyle_generation_tasks(created_at);

  -- 创建视图
  CREATE VIEW public.hairstyle_generation_failures AS
  SELECT
      t.id,
      t.user_id,
      p.email as user_email,
      t.task_id,
      t.selected_style,
      t.selected_color,
      t.selected_gender,
      t.status,
      t.failure_reason,
      t.failure_details,
      t.poll_count,
      t.processing_time_ms,
      t.created_at,
      COUNT(DISTINCT a.id) as api_call_count,
      MAX(a.response_status) as last_response_status,
      ARRAY_AGG(DISTINCT a.error_type) FILTER (WHERE
  a.error_type IS NOT NULL) as error_types
  FROM public.hairstyle_generation_tasks t
  LEFT JOIN public.profiles p ON t.user_id = p.id
  LEFT JOIN public.api_call_logs a ON t.task_id =
  a.task_id
  WHERE t.status = 'failed'
  GROUP BY t.id, p.email;

  -- RLS
  ALTER TABLE public.user_activity_logs ENABLE ROW LEVEL
   SECURITY;
  ALTER TABLE public.api_call_logs ENABLE ROW LEVEL
  SECURITY;
  ALTER TABLE public.hairstyle_generation_tasks ENABLE
  ROW LEVEL SECURITY;
  ALTER TABLE public.user_error_logs ENABLE ROW LEVEL
  SECURITY;

  -- RLS策略
  CREATE POLICY "Users can view own activity logs" ON
  public.user_activity_logs
      FOR SELECT USING (auth.uid() = user_id);

  CREATE POLICY "Users can insert own activity logs" ON
  public.user_activity_logs
      FOR INSERT WITH CHECK (auth.uid() = user_id OR
  user_id IS NULL);

  CREATE POLICY "Users can view own api logs" ON
  public.api_call_logs
      FOR SELECT USING (auth.uid() = user_id);

  CREATE POLICY "Users can insert own api logs" ON
  public.api_call_logs
      FOR INSERT WITH CHECK (auth.uid() = user_id OR
  user_id IS NULL);

  CREATE POLICY "Users can view own generation tasks" ON
   public.hairstyle_generation_tasks
      FOR SELECT USING (auth.uid() = user_id);

  CREATE POLICY "Users can insert own generation tasks"
  ON public.hairstyle_generation_tasks
      FOR INSERT WITH CHECK (auth.uid() = user_id OR
  user_id IS NULL);

  CREATE POLICY "Users can update own generation tasks"
  ON public.hairstyle_generation_tasks
      FOR UPDATE USING (auth.uid() = user_id);

  2. 查询SQL（建表后可用）

  analytics-queries.sql 文件中的内容是查询示例，可以在Su
  pabase的SQL编辑器中单独执行每个查询来分析数据。

  注意事项：
  1. 先执行建表SQL
  2. 部署更新后的代码，让用户操作产生数据
  3. 然后才能使用查询SQL查看分析结果
  4. 查询SQL中的最后一个是创建视图，需要单独执行
