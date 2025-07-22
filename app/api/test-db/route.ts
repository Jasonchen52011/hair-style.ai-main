import { NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';
import { db } from "@/db";
import { users, orders, credits, userCreditsBalance } from "@/db/schema";

export async function GET() {
  const results: any = {
    supabaseConnection: false,
    drizzleConnection: false,
    tables: {},
    errors: []
  };

  try {
    // 测试 Supabase 连接
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      results.errors.push("Missing Supabase environment variables");
    } else {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      // 测试查询
      const { data, error } = await supabase.from('users').select('count').limit(1);
      if (error) {
        results.errors.push(`Supabase error: ${error.message}`);
      } else {
        results.supabaseConnection = true;
      }
    }

    // 测试 Drizzle 连接
    try {
      // 测试 users 表
      const usersCount = await db().select().from(users).limit(1);
      results.tables.users = { exists: true, count: usersCount.length };
      results.drizzleConnection = true;
    } catch (error: any) {
      results.errors.push(`Users table error: ${error.message}`);
    }

    // 测试 orders 表
    try {
      const ordersCount = await db().select().from(orders).limit(1);
      results.tables.orders = { exists: true, count: ordersCount.length };
    } catch (error: any) {
      results.errors.push(`Orders table error: ${error.message}`);
    }

    // 测试 credits 表
    try {
      const creditsCount = await db().select().from(credits).limit(1);
      results.tables.credits = { exists: true, count: creditsCount.length };
    } catch (error: any) {
      results.errors.push(`Credits table error: ${error.message}`);
    }

    // 测试 user_credits_balance 表
    try {
      const balanceCount = await db().select().from(userCreditsBalance).limit(1);
      results.tables.userCreditsBalance = { exists: true, count: balanceCount.length };
    } catch (error: any) {
      results.errors.push(`User credits balance table error: ${error.message}`);
      results.tables.userCreditsBalance = { exists: false, error: error.message };
    }

    // 检查数据库 URL
    results.databaseUrl = process.env.DATABASE_URL ? "Configured" : "Missing";
    
    return NextResponse.json(results, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      results
    }, { status: 500 });
  }
}