import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

// 积分交易类型
const TRANS_TYPE = {
  TEST: 'test',
  HAIRSTYLE: 'hairstyle'
} as const;

// 积分数量
const CREDITS_AMOUNT = {
  TEST_COST: 1,
  HAIRSTYLE_COST: 10
} as const;

// 生成交易编号
function generateTransactionNo(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `TXN_${timestamp}_${random}`.toUpperCase();
}

// 获取用户UUID
async function getUserUuid(): Promise<string | null> {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      console.error('Error getting user:', error);
      return null;
    }
    
    return user.id;
  } catch (error) {
    console.error('Error in getUserUuid:', error);
    return null;
  }
}

// 减少积分
async function decreaseCredits(
  user_uuid: string,
  trans_type: string,
  credits: number,
  order_no?: string
): Promise<boolean> {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // 首先检查用户当前积分是否足够
    const { data: creditRecords, error: fetchError } = await supabase
      .from('credits')
      .select('credits')
      .eq('user_uuid', user_uuid)
      .or('expired_at.is.null,expired_at.gte.' + new Date().toISOString());

    if (fetchError) {
      console.error('Error fetching user credits:', fetchError);
      throw new Error(`Failed to fetch credits: ${fetchError.message}`);
    }

    const currentCredits = creditRecords?.reduce((sum, record) => sum + (record.credits || 0), 0) || 0;
    if (currentCredits < credits) {
      throw new Error(`Insufficient credits. Current: ${currentCredits}, Required: ${credits}`);
    }

    // 生成交易编号
    const transactionNo = generateTransactionNo();

    // 记录积分扣费
    const { error } = await supabase
      .from('credits')
      .insert({
        user_uuid,
        trans_type,
        trans_no: transactionNo,
        order_no: order_no || null,
        credits: -credits, // 负数表示扣费
        expired_at: null,
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error decreasing credits:', error);
      throw new Error(`Failed to decrease credits: ${error.message}`);
    }

    console.log(`Successfully decreased ${credits} credits for user ${user_uuid}, transaction: ${transactionNo}`);
    return true;

  } catch (error) {
    console.error('Error in decreaseCredits:', error);
    throw error;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();
    if (!message) {
      return NextResponse.json({
        success: false,
        error: "invalid params"
      }, { status: 400 });
    }

    const user_uuid = await getUserUuid();
    if (!user_uuid) {
      return NextResponse.json({
        success: false,
        error: "no auth"
      }, { status: 401 });
    }

    // 扣减积分进行测试
    try {
      await decreaseCredits(
        user_uuid,
        TRANS_TYPE.TEST,
        CREDITS_AMOUNT.TEST_COST
      );
    } catch (error) {
      return NextResponse.json({
        success: false,
        error: error instanceof Error ? error.message : "Failed to consume credits"
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: "Success",
      data: {
        pong: `received message: ${message}`,
        creditsConsumed: CREDITS_AMOUNT.TEST_COST
      }
    });
  } catch (e) {
    console.log("test failed:", e);
    return NextResponse.json({
      success: false,
      error: "test failed"
    }, { status: 500 });
  }
} 