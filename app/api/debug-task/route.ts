import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export const runtime = "edge";

export async function POST(request: NextRequest) {
  try {
    const { taskId } = await request.json();
    
    if (!taskId) {
      return NextResponse.json({ error: "Task ID required" }, { status: 400 });
    }

    // 获取用户信息
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const { data: { user } } = await supabase.auth.getUser();

    // 使用管理员客户端
    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 查找该任务的积分交易记录
    const { data: creditRecords, error: creditError } = await adminSupabase
      .from('credits')
      .select('*')
      .eq('task_id', taskId);

    // 查找用户当前积分余额
    let userBalance = null;
    if (user) {
      const { data: balance } = await adminSupabase
        .from('user_credits_balance')
        .select('*')
        .eq('user_uuid', user.id)
        .single();
      userBalance = balance;
    }

    // 调用AI API检查任务状态
    let taskStatus = null;
    try {
      const response = await fetch(
        `https://www.ailabapi.com/api/common/query-async-task-result?task_id=${taskId}`,
        {
          headers: {
            "Content-Type": "application/json",
            "ailabapi-api-key": process.env.AILABAPI_API_KEY!
          }
        }
      );
      
      if (response.ok) {
        taskStatus = await response.json();
      }
    } catch (e) {
      console.error("Failed to fetch task status:", e);
    }

    return NextResponse.json({
      taskId,
      user: user ? { id: user.id, email: user.email } : null,
      taskStatus: taskStatus,
      creditRecords: creditRecords || [],
      hasCreditRecord: creditRecords && creditRecords.length > 0,
      userBalance: userBalance,
      debug: {
        hasUser: !!user,
        taskStatusValue: taskStatus?.task_status,
        isTaskSuccess: taskStatus?.task_status === 2 || taskStatus?.task_status === 'SUCCESS',
        creditsShouldBeDeducted: !!user && (taskStatus?.task_status === 2 || taskStatus?.task_status === 'SUCCESS')
      }
    });

  } catch (error: any) {
    console.error("Debug task error:", error);
    return NextResponse.json(
      { error: error.message || "Debug failed" },
      { status: 500 }
    );
  }
}