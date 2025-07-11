import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 交易类型常量
const TRANS_TYPE = {
  PURCHASE: 'purchase',
  CONSUMPTION: 'consumption',
  HAIRSTYLE: 'hairstyle',
  MONTHLY_DISTRIBUTION: 'monthly_distribution',
  ACTIVATION: 'activation',
  TRANSFER: 'transfer',
  FIX: 'fix'
};

// 生成交易编号
function generateTransactionNo(): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `TXN${timestamp}${random}`;
}

export async function POST(request: NextRequest) {
  try {
    const { 
      userId, 
      amount, 
      transType = TRANS_TYPE.FIX, 
      reason, 
      orderId, 
      expiredAt = null 
    } = await request.json();
    
    if (!userId || !amount) {
      return NextResponse.json({ 
        error: "User ID and amount are required" 
      }, { status: 400 });
    }

    console.log(`🔧 Fixing credits for user ${userId}: ${amount} credits, reason: ${reason}`);

    // 验证用户存在
    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ 
        error: "User not found" 
      }, { status: 404 });
    }

    // 获取用户当前积分（用于记录）
    const { data: creditRecords, error: creditsError } = await supabase
      .from('credits')
      .select('credits')
      .eq('user_uuid', userId)
      .or('expired_at.is.null,expired_at.gte.' + new Date().toISOString());

    if (creditsError) {
      console.error("Error fetching current credits:", creditsError);
      return NextResponse.json({
        error: "Failed to fetch current credits"
      }, { status: 500 });
    }

    const currentCredits = creditRecords?.reduce((sum, record) => sum + (record.credits || 0), 0) || 0;

    // 生成交易编号
    const transactionNo = generateTransactionNo();

    // 添加积分记录
    const { error: insertError } = await supabase
      .from('credits')
      .insert({
        user_uuid: userId,
        trans_type: transType,
        trans_no: transactionNo,
        order_no: orderId || `fix_${Date.now()}`,
        credits: amount, // 正数表示添加积分
        expired_at: expiredAt,
        created_at: new Date().toISOString()
      });

    if (insertError) {
      console.error("Error adding credits:", insertError);
      return NextResponse.json({
        error: "Failed to add credits",
        details: insertError.message
      }, { status: 500 });
    }

    // 记录操作日志
    console.log(`✅ Credits fixed successfully:
      - User: ${userId}
      - Amount: ${amount}
      - Transaction: ${transactionNo}
      - Reason: ${reason}
      - Previous credits: ${currentCredits}
      - New total: ${currentCredits + amount}`);

    return NextResponse.json({
      success: true,
      message: "Credits fixed successfully",
      data: {
        userId,
        creditsAdded: amount,
        previousCredits: currentCredits,
        newTotal: currentCredits + amount,
        transactionNo,
        reason: reason || 'Manual fix'
      }
    });

  } catch (error) {
    console.error('Fix credits error:', error);
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred"
    }, { status: 500 });
  }
}

// GET方法用于检查积分修复历史
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ 
        error: "User ID is required" 
      }, { status: 400 });
    }

    // 获取用户的所有修复记录
    const { data: fixRecords, error: fixError } = await supabase
      .from('credits')
      .select('*')
      .eq('user_uuid', userId)
      .eq('trans_type', TRANS_TYPE.FIX)
      .order('created_at', { ascending: false });

    if (fixError) {
      console.error("Error fetching fix records:", fixError);
      return NextResponse.json({
        error: "Failed to fetch fix records"
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      userId,
      fixRecords: fixRecords || [],
      totalFixed: fixRecords?.reduce((sum, record) => sum + (record.credits || 0), 0) || 0
    });

  } catch (error) {
    console.error('Get fix records error:', error);
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred"
    }, { status: 500 });
  }
} 