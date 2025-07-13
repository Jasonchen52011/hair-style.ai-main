import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// 管理员客户端（用于测试，不需要RLS）
const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET - 健康检查端点，测试credits相关的基础功能
 * 不需要用户认证，用于系统测试
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const testMode = searchParams.get('test');
  
  try {
    const healthCheck = {
      timestamp: new Date().toISOString(),
      status: 'ok',
      checks: {} as any
    };

    // 1. 测试数据库连接
    try {
      const { data, error } = await adminSupabase
        .from('credits')
        .select('count')
        .limit(1);
      
      healthCheck.checks.database = error ? 'failed' : 'ok';
      if (error) {
        healthCheck.checks.databaseError = error.message;
      }
    } catch (error) {
      healthCheck.checks.database = 'failed';
      healthCheck.checks.databaseError = error instanceof Error ? error.message : 'Unknown error';
    }

    // 2. 测试credits表结构
    try {
      const { data, error } = await adminSupabase
        .from('credits')
        .select('user_uuid, order_no, trans_type, credits, created_at')
        .limit(1);
      
      healthCheck.checks.creditsTable = error ? 'failed' : 'ok';
      if (error) {
        healthCheck.checks.creditsTableError = error.message;
      }
    } catch (error) {
      healthCheck.checks.creditsTable = 'failed';
      healthCheck.checks.creditsTableError = error instanceof Error ? error.message : 'Unknown error';
    }

    // 3. 如果是测试模式，检查特定order_id
    if (testMode && searchParams.get('order_id')) {
      const testOrderId = searchParams.get('order_id');
      try {
        const { data: existingCredits, error } = await adminSupabase
          .from('credits')
          .select('*')
          .eq('order_no', testOrderId)
          .eq('trans_type', 'purchase');

        healthCheck.checks.orderSearch = error ? 'failed' : 'ok';
        healthCheck.checks.orderResults = {
          found: existingCredits ? existingCredits.length : 0,
          records: existingCredits || []
        };
        
        if (error) {
          healthCheck.checks.orderSearchError = error.message;
        }
      } catch (error) {
        healthCheck.checks.orderSearch = 'failed';
        healthCheck.checks.orderSearchError = error instanceof Error ? error.message : 'Unknown error';
      }
    }

    // 4. 检查环境变量
    healthCheck.checks.environment = {
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      hasCreemApiKey: !!process.env.CREEM_API_KEY
    };

    // 5. 整体状态
    const allChecksOk = Object.values(healthCheck.checks).every(check => {
      if (typeof check === 'string') return check === 'ok';
      if (typeof check === 'object' && check !== null) {
        return !('error' in check);
      }
      return true;
    });

    healthCheck.status = allChecksOk ? 'healthy' : 'degraded';

    return NextResponse.json({
      success: true,
      ...healthCheck
    });

  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json({
      success: false,
      status: 'failed',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 