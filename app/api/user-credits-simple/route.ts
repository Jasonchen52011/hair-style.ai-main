import { NextRequest, NextResponse } from "next/server";
import { 
  validateUserId, 
  extractUserId, 
  getUserCredits, 
  updateUserCredits, 
  checkActiveSubscription,
  getUserProfile,
  getSimpleDbClient
} from "@/lib/simple-auth";

// 积分交易类型
const TRANS_TYPE = {
  HAIRSTYLE: 'hairstyle',
  PURCHASE: 'purchase',
  REFUND: 'refund',
  BONUS: 'bonus'
} as const;

// 生成交易编号
function generateTransactionNo(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `TXN_${timestamp}_${random}`.toUpperCase();
}

export async function GET(request: NextRequest) {
  try {
    // 🔥 使用新的简化验证方式
    const userId = extractUserId(request);
    
    if (!userId) {
      return NextResponse.json({
        success: false,
        error: "User ID is required. Please provide userId in header (x-user-id) or query parameter."
      }, { status: 400 });
    }

    // 验证用户ID
    const validation = await validateUserId(userId);
    if (!validation.valid) {
      return NextResponse.json({
        success: false,
        error: `Invalid user: ${validation.error}`
      }, { status: 401 });
    }

    try {
      // 获取用户信息
      const [profile, userCredits, hasActiveSubscription] = await Promise.all([
        getUserProfile(userId),
        getUserCredits(userId),
        checkActiveSubscription(userId)
      ]);

      // 获取用户的积分交易历史
      const supabase = getSimpleDbClient();
      const { data: creditHistory, error: historyError } = await supabase
        .from('credits')
        .select('*')
        .eq('user_uuid', userId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (historyError) {
        console.error("Error fetching credit history:", historyError);
      }

      // 获取用户的订阅信息
      const { data: subscriptions, error: subscriptionError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (subscriptionError) {
        console.error("Error fetching subscriptions:", subscriptionError);
      }

      return NextResponse.json({
        success: true,
        user: {
          id: userId,
          profile: profile || null,
          credits: userCredits,
          hasActiveSubscription: hasActiveSubscription,
          creditHistory: creditHistory || [],
          subscriptions: subscriptions || []
        }
      });

    } catch (error) {
      console.error("Error fetching user data:", error);
      return NextResponse.json({
        success: false,
        error: "Failed to fetch user data",
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 });
    }

  } catch (error) {
    console.error("Error in GET request:", error);
    return NextResponse.json({
      success: false,
      error: "An unexpected error occurred",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, amount, trans_type = TRANS_TYPE.HAIRSTYLE, order_no, userId: bodyUserId } = await request.json();
    
    // 🔥 使用新的简化验证方式
    const headerUserId = extractUserId(request);
    const userId = bodyUserId || headerUserId;
    
    if (!userId) {
      return NextResponse.json({
        success: false,
        error: "User ID is required. Please provide userId in header (x-user-id), query parameter, or request body."
      }, { status: 400 });
    }

    // 验证用户ID
    const validation = await validateUserId(userId);
    if (!validation.valid) {
      return NextResponse.json({
        success: false,
        error: `Invalid user: ${validation.error}`
      }, { status: 401 });
    }

    if (action === 'consume' && amount > 0) {
      try {
        // 获取用户当前积分
        const currentCredits = await getUserCredits(userId);
        
        if (currentCredits < amount) {
          return NextResponse.json({
            success: false,
            error: "Insufficient credits",
            currentCredits: currentCredits,
            requiredCredits: amount
          }, { status: 400 });
        }

        // 生成交易编号
        const transactionNo = generateTransactionNo();
        const newCredits = currentCredits - amount;

        // 更新用户积分
        await updateUserCredits(userId, newCredits);

        // 记录积分消费
        const supabase = getSimpleDbClient();
        await supabase
          .from('credits')
          .insert({
            user_uuid: userId,
            trans_type: trans_type,
            trans_no: transactionNo,
            order_no: order_no || null,
            credits: -amount, // 负数表示消费
            expired_at: null,
            created_at: new Date().toISOString(),
            event_type: 'credit_consumption'
          });

        return NextResponse.json({
          success: true,
          message: `Successfully consumed ${amount} credits`,
          transactionNo: transactionNo,
          previousCredits: currentCredits,
          currentCredits: newCredits,
          creditsConsumed: amount
        });

      } catch (error) {
        console.error("Error consuming credits:", error);
        return NextResponse.json({
          success: false,
          error: "Failed to consume credits",
          details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
      }
    }

    if (action === 'add' && amount > 0) {
      try {
        // 获取用户当前积分
        const currentCredits = await getUserCredits(userId);
        const transactionNo = generateTransactionNo();
        const newCredits = currentCredits + amount;

        // 更新用户积分
        await updateUserCredits(userId, newCredits);

        // 记录积分添加
        const supabase = getSimpleDbClient();
        await supabase
          .from('credits')
          .insert({
            user_uuid: userId,
            trans_type: trans_type,
            trans_no: transactionNo,
            order_no: order_no || null,
            credits: amount, // 正数表示添加
            expired_at: null,
            created_at: new Date().toISOString(),
            event_type: 'manual_addition'
          });

        return NextResponse.json({
          success: true,
          message: `Successfully added ${amount} credits`,
          transactionNo: transactionNo,
          previousCredits: currentCredits,
          currentCredits: newCredits,
          creditsAdded: amount
        });

      } catch (error) {
        console.error("Error adding credits:", error);
        return NextResponse.json({
          success: false,
          error: "Failed to add credits",
          details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
      }
    }

    return NextResponse.json({
      success: false,
      error: "Invalid action or amount. Supported actions: 'consume', 'add'. Amount must be positive."
    }, { status: 400 });

  } catch (error) {
    console.error("Error in POST request:", error);
    return NextResponse.json({
      success: false,
      error: "An unexpected error occurred",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 