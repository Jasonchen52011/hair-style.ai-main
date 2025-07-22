import { NextResponse } from "next/server";
import { getUserUuid } from "@/services/user";
import { getUserCreditsBalance, deductUserCredits } from "@/models/userCreditsBalance";
import { insertCredit } from "@/models/credit";
import { getSnowId } from "@/lib/hash";

export async function POST(request: Request) {
  try {
    const { credits = 10 } = await request.json(); // 默认消耗10积分

    // 获取用户信息
    const userUuid = await getUserUuid();
    if (!userUuid) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 检查用户积分余额
    const balance = await getUserCreditsBalance(userUuid);
    if (!balance || balance.balance < credits) {
      return NextResponse.json(
        { 
          error: "Insufficient credits", 
          currentBalance: balance?.balance || 0,
          requiredCredits: credits 
        },
        { status: 400 }
      );
    }

    // 扣除积分
    const updatedBalance = await deductUserCredits(userUuid, credits);

    // 创建积分使用记录
    await insertCredit({
      trans_no: getSnowId(),
      created_at: new Date(),
      user_uuid: userUuid,
      trans_type: "consume",
      credits: -credits, // 负数表示消耗
      order_no: null,
    });

    return NextResponse.json({
      success: true,
      remainingCredits: updatedBalance.balance,
      creditsUsed: credits,
    });
  } catch (error) {
    console.error("Error using credits:", error);
    return NextResponse.json(
      { error: "Failed to use credits" },
      { status: 500 }
    );
  }
}