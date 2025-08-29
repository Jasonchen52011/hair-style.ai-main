import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { createClient } from '@supabase/supabase-js';

// 获取 Supabase 客户端的函数
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase configuration missing');
  }
  
  return createClient(supabaseUrl, supabaseServiceKey);
}

export const runtime = "edge";

export async function GET() {
  const report = {
    currentUser: null as any,
    userInDB: null as any,
    recentOrders: [] as any[],
    recentCredits: [] as any[],
    creditBalance: null as any,
    issues: [] as string[],
    recommendations: [] as string[]
  };

  try {
    // 1. 检查当前登录用户
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      report.issues.push(`Auth error: ${authError.message}`);
      return NextResponse.json(report);
    }
    
    if (!user) {
      report.issues.push("No user logged in");
      report.recommendations.push("Please login first");
      return NextResponse.json(report);
    }
    
    report.currentUser = {
      id: user.id,
      email: user.email,
      created_at: user.created_at
    };

    // 2. 检查 users 表中是否有该用户
    try {
      const supabase = getSupabaseClient();
      const { data: dbUser, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('uuid', user.id)
        .single();
      
      if (userError && userError.code !== 'PGRST116') {
        throw userError;
      }
      
      if (dbUser) {
        report.userInDB = dbUser;
      } else {
        report.issues.push("User logged in but not found in users table");
        report.recommendations.push("User record needs to be created in users table");
        
        // 尝试使用 email 查找
        const { data: userByEmail, error: emailError } = await supabase
          .from('users')
          .select('*')
          .eq('email', user.email!)
          .single();
        
        if (emailError && emailError.code !== 'PGRST116') {
          throw emailError;
        }
        
        if (userByEmail) {
          report.issues.push(`Found user by email but UUID mismatch: DB UUID=${userByEmail.uuid}, Auth UUID=${user.id}`);
          report.userInDB = userByEmail;
        }
      }
    } catch (error: any) {
      report.issues.push(`Error querying users table: ${error.message}`);
    }

    // 3. 检查最近的订单
    try {
      const supabase = getSupabaseClient();
      const { data: recentOrders, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('user_uuid', user.id)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (ordersError) {
        throw ordersError;
      }
      
      report.recentOrders = recentOrders || [];
      
      if (report.recentOrders.length === 0) {
        // 尝试用 email 查找
        const { data: ordersByEmail, error: emailOrdersError } = await supabase
          .from('orders')
          .select('*')
          .eq('user_email', user.email!)
          .order('created_at', { ascending: false })
          .limit(5);
        
        if (emailOrdersError) {
          throw emailOrdersError;
        }
        
        if (ordersByEmail && ordersByEmail.length > 0) {
          report.issues.push("Found orders by email but not by user UUID");
          report.recentOrders = ordersByEmail;
        }
      }
    } catch (error: any) {
      report.issues.push(`Error querying orders table: ${error.message}`);
    }

    // 4. 检查积分记录
    try {
      const supabase = getSupabaseClient();
      const { data: recentCredits, error: creditsError } = await supabase
        .from('credits')
        .select('*')
        .eq('user_uuid', user.id)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (creditsError) {
        throw creditsError;
      }
      
      report.recentCredits = recentCredits || [];
    } catch (error: any) {
      report.issues.push(`Error querying credits table: ${error.message}`);
    }

    // 5. 检查积分余额
    try {
      const supabase = getSupabaseClient();
      const { data: balance, error: balanceError } = await supabase
        .from('user_credits_balance')
        .select('*')
        .eq('user_uuid', user.id)
        .single();
      
      if (balanceError && balanceError.code !== 'PGRST116') {
        throw balanceError;
      }
      
      report.creditBalance = balance;
      
      if (!balance) {
        report.issues.push("No credit balance record found for user");
        report.recommendations.push("Need to create initial credit balance record");
      }
    } catch (error: any) {
      report.issues.push(`Error querying user_credits_balance table: ${error.message}`);
    }

    // 6. 分析问题
    if (report.issues.length === 0) {
      report.recommendations.push("Everything looks good!");
    } else {
      // 提供具体建议
      if (!report.userInDB) {
        report.recommendations.push("Create user record in database when user signs up");
      }
      
      if (report.recentOrders.length > 0 && report.recentCredits.length === 0) {
        report.recommendations.push("Webhook might not be processing payments correctly");
      }
      
      if (report.currentUser && !report.creditBalance) {
        report.recommendations.push("Initialize credit balance for user");
      }
    }

    return NextResponse.json(report, { 
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      }
    });
  } catch (error: any) {
    report.issues.push(`Unexpected error: ${error.message}`);
    return NextResponse.json(report, { status: 500 });
  }
}