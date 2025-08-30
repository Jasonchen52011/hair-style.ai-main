import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  try {
    console.log("=== Webhook Test Started ===");
    
    // 检查环境变量
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const stripePrivateKey = process.env.STRIPE_PRIVATE_KEY;
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    const envCheck = {
      hasSupabaseUrl: !!supabaseUrl,
      hasSupabaseServiceKey: !!supabaseServiceKey,
      hasStripePrivateKey: !!stripePrivateKey,
      hasEndpointSecret: !!endpointSecret,
      supabaseUrl: supabaseUrl ? supabaseUrl.substring(0, 30) + '...' : 'missing',
      runtime: 'nodejs'
    };
    
    console.log("Environment check:", envCheck);
    
    // 测试 Supabase 连接
    let supabaseTest = null;
    if (supabaseUrl && supabaseServiceKey) {
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        
        // 测试连接 - 查询 orders 表的第一条记录
        const { data, error } = await supabase
          .from('orders')
          .select('id, order_no, status, created_at')
          .limit(1);
          
        if (error) {
          supabaseTest = { success: false, error: error.message };
        } else {
          supabaseTest = { success: true, recordCount: data?.length || 0 };
        }
      } catch (err) {
        supabaseTest = { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
      }
    }
    
    console.log("Supabase connection test:", supabaseTest);
    
    return NextResponse.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      environment: envCheck,
      supabaseConnection: supabaseTest,
      message: "Webhook test endpoint is working"
    });
    
  } catch (error) {
    console.error("Webhook test error:", error);
    return NextResponse.json({
      status: "error",
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("=== Test POST received ===", body);
    
    return NextResponse.json({
      status: "received",
      timestamp: new Date().toISOString(),
      receivedData: body
    });
  } catch (error) {
    console.error("Test POST error:", error);
    return NextResponse.json({
      status: "error",
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}