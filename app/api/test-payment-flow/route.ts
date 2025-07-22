import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { db } from "@/db";
import { users, orders, credits, userCreditsBalance } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

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
      const [dbUser] = await db()
        .select()
        .from(users)
        .where(eq(users.uuid, user.id))
        .limit(1);
      
      if (dbUser) {
        report.userInDB = dbUser;
      } else {
        report.issues.push("User logged in but not found in users table");
        report.recommendations.push("User record needs to be created in users table");
        
        // 尝试使用 email 查找
        const [userByEmail] = await db()
          .select()
          .from(users)
          .where(eq(users.email, user.email!))
          .limit(1);
        
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
      const recentOrders = await db()
        .select()
        .from(orders)
        .where(eq(orders.user_uuid, user.id))
        .orderBy(desc(orders.created_at))
        .limit(5);
      
      report.recentOrders = recentOrders;
      
      if (recentOrders.length === 0) {
        // 尝试用 email 查找
        const ordersByEmail = await db()
          .select()
          .from(orders)
          .where(eq(orders.user_email, user.email!))
          .orderBy(desc(orders.created_at))
          .limit(5);
        
        if (ordersByEmail.length > 0) {
          report.issues.push("Found orders by email but not by user UUID");
          report.recentOrders = ordersByEmail;
        }
      }
    } catch (error: any) {
      report.issues.push(`Error querying orders table: ${error.message}`);
    }

    // 4. 检查积分记录
    try {
      const recentCredits = await db()
        .select()
        .from(credits)
        .where(eq(credits.user_uuid, user.id))
        .orderBy(desc(credits.created_at))
        .limit(5);
      
      report.recentCredits = recentCredits;
    } catch (error: any) {
      report.issues.push(`Error querying credits table: ${error.message}`);
    }

    // 5. 检查积分余额
    try {
      const [balance] = await db()
        .select()
        .from(userCreditsBalance)
        .where(eq(userCreditsBalance.user_uuid, user.id))
        .limit(1);
      
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