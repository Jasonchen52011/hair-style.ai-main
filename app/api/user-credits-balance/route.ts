import { NextResponse } from "next/server";
import { getUserUuid } from "@/services/user";
import { getUserCreditsBalance } from "@/models/userCreditsBalance";

export async function GET() {
  try {
    const userUuid = await getUserUuid();
    if (!userUuid) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const balance = await getUserCreditsBalance(userUuid);
    
    return NextResponse.json({
      balance: balance?.balance || 0,
      user_uuid: userUuid,
    });
  } catch (error) {
    console.error("Error fetching user credits balance:", error);
    return NextResponse.json(
      { error: "Failed to fetch credits balance" },
      { status: 500 }
    );
  }
}