// Polyfill for URL.canParse (Node.js < 19.9.0)
if (!URL.canParse) {
  URL.canParse = function(url: string, base?: string): boolean {
    try {
      new URL(url, base);
      return true;
    } catch {
      return false;
    }
  };
}

import { createClerkClient } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  
  if (!userId) {
    return NextResponse.json(
      { message: "User ID is required" },
      { status: 400 }
    );
  }

  try {
    const clerkClient = createClerkClient({
      secretKey: process.env.CLERK_SECRET_KEY,
    });

    const user = await clerkClient.users.getUser(userId);
    const currentBalance = user.publicMetadata?.balance as number || 0;
    const lastDailyRefresh = user.publicMetadata?.lastDailyRefresh as string || '';
    const membership = user.publicMetadata?.membership as string || '';
    
    // 检查是否需要每日积分刷新
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    const needsDailyRefresh = lastDailyRefresh !== today;
    
    let newBalance = currentBalance;
    
    if (needsDailyRefresh) {
      if (membership === 'onetime' || membership === 'monthly' || membership === 'yearly') {
        // 已购买用户：不刷新积分，保持现有余额
        // 只更新刷新日期，不改变积分
        await clerkClient.users.updateUserMetadata(userId, {
          publicMetadata: {
            ...user.publicMetadata,
            lastDailyRefresh: today,
            lastUpdated: new Date().getTime(),
          }
        });
        console.log(`Paid user ${userId}: keeping existing balance ${currentBalance}`);
      } else {
        // 免费用户：每日赠送50积分
        newBalance = 50;
        
        await clerkClient.users.updateUserMetadata(userId, {
          publicMetadata: {
            ...user.publicMetadata,
            balance: newBalance,
            lastDailyRefresh: today,
            lastUpdated: new Date().getTime(),
          }
        });
        
        console.log(`Free user ${userId}: daily credits refreshed to ${newBalance} credits`);
      }
    }
    
    return NextResponse.json({
      balance: newBalance,
      success: true,
      dailyRefreshed: needsDailyRefresh
    });
  } catch (error) {
    console.error('Error fetching user credits:', error);
    return NextResponse.json(
      { message: "Failed to fetch user credits" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const { userId, action, amount, reason = 'api_call' } = await request.json();
  
  if (!userId || !action || amount === undefined) {
    return NextResponse.json(
      { message: "Missing required parameters" },
      { status: 400 }
    );
  }

  try {
    const clerkClient = createClerkClient({
      secretKey: process.env.CLERK_SECRET_KEY,
    });

    const user = await clerkClient.users.getUser(userId);
    const currentBalance = user.publicMetadata?.balance as number || 0;
    
    let newBalance;
    
    if (action === 'add') {
      newBalance = currentBalance + amount;
    } else if (action === 'subtract') {
      newBalance = Math.max(0, currentBalance - amount); // 确保不会变为负数
    } else {
      return NextResponse.json(
        { message: "Invalid action. Use 'add' or 'subtract'" },
        { status: 400 }
      );
    }
    
    // 更新用户元数据
    await clerkClient.users.updateUserMetadata(userId, {
      publicMetadata: {
        ...user.publicMetadata,
        balance: newBalance,
        lastUpdated: new Date().getTime(),
      }
    });
    
    console.log(`Credits ${action}ed for user ${userId}: ${amount} credits (${currentBalance} -> ${newBalance}) - reason: ${reason}`);
    
    return NextResponse.json({
      balance: newBalance,
      success: true,
      action,
      amount,
      previousBalance: currentBalance
    });
  } catch (error) {
    console.error('Error updating user credits:', error);
    return NextResponse.json(
      { message: "Failed to update user credits" },
      { status: 500 }
    );
  }
} 