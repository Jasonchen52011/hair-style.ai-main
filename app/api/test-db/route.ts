import { NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';

export const runtime = "edge";

export async function GET() {
  const results: any = {
    supabaseConnection: false,
    tables: {},
    errors: []
  };

  try {
    // 测试 Supabase 连接
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      results.errors.push("Missing Supabase environment variables");
      return NextResponse.json(results, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 测试 users 表
    try {
      const { data, error } = await supabase.from('users').select('*').limit(1);
      if (error) {
        results.errors.push(`Users table error: ${error.message}`);
        results.tables.users = { exists: false, error: error.message };
      } else {
        results.tables.users = { exists: true, count: data?.length || 0 };
      }
    } catch (error: any) {
      results.errors.push(`Users table error: ${error.message}`);
    }

    // 测试 orders 表
    try {
      const { data, error } = await supabase.from('orders').select('*').limit(1);
      if (error) {
        results.errors.push(`Orders table error: ${error.message}`);
        results.tables.orders = { exists: false, error: error.message };
      } else {
        results.tables.orders = { exists: true, count: data?.length || 0 };
      }
    } catch (error: any) {
      results.errors.push(`Orders table error: ${error.message}`);
    }

    // 测试 credits 表
    try {
      const { data, error } = await supabase.from('credits').select('*').limit(1);
      if (error) {
        results.errors.push(`Credits table error: ${error.message}`);
        results.tables.credits = { exists: false, error: error.message };
      } else {
        results.tables.credits = { exists: true, count: data?.length || 0 };
      }
    } catch (error: any) {
      results.errors.push(`Credits table error: ${error.message}`);
    }

    // 测试 user_credits_balance 表
    try {
      const { data, error } = await supabase.from('user_credits_balance').select('*').limit(1);
      if (error) {
        results.errors.push(`User credits balance table error: ${error.message}`);
        results.tables.userCreditsBalance = { exists: false, error: error.message };
      } else {
        results.tables.userCreditsBalance = { exists: true, count: data?.length || 0 };
      }
    } catch (error: any) {
      results.errors.push(`User credits balance table error: ${error.message}`);
    }

    // 如果所有表都能成功查询，则连接成功
    results.supabaseConnection = results.errors.length === 0;
    
    return NextResponse.json(results, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      results
    }, { status: 500 });
  }
}