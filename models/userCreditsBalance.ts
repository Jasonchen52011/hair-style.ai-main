import { eq } from "drizzle-orm";
import { db } from "@/db";
import { userCreditsBalance } from "@/db/schema";

export async function getUserCreditsBalance(userUuid: string) {
  try {
    const result = await db()
      .select()
      .from(userCreditsBalance)
      .where(eq(userCreditsBalance.user_uuid, userUuid))
      .limit(1);
    
    return result[0] || null;
  } catch (error) {
    console.error("Error getting user credits balance:", error);
    throw error;
  }
}

export async function createOrUpdateUserCreditsBalance(
  userUuid: string,
  creditsToAdd: number
) {
  try {
    // 先查询是否存在
    const existing = await getUserCreditsBalance(userUuid);
    
    if (existing) {
      // 更新余额
      const result = await db()
        .update(userCreditsBalance)
        .set({
          balance: existing.balance + creditsToAdd,
          updated_at: new Date(),
        })
        .where(eq(userCreditsBalance.user_uuid, userUuid))
        .returning();
      
      return result[0];
    } else {
      // 创建新记录
      const result = await db()
        .insert(userCreditsBalance)
        .values({
          user_uuid: userUuid,
          balance: creditsToAdd,
        })
        .returning();
      
      return result[0];
    }
  } catch (error) {
    console.error("Error creating/updating user credits balance:", error);
    throw error;
  }
}

export async function deductUserCredits(userUuid: string, creditsToDeduct: number) {
  try {
    const existing = await getUserCreditsBalance(userUuid);
    
    if (!existing) {
      throw new Error("User credits balance not found");
    }
    
    if (existing.balance < creditsToDeduct) {
      throw new Error("Insufficient credits");
    }
    
    const result = await db()
      .update(userCreditsBalance)
      .set({
        balance: existing.balance - creditsToDeduct,
        updated_at: new Date(),
      })
      .where(eq(userCreditsBalance.user_uuid, userUuid))
      .returning();
    
    return result[0];
  } catch (error) {
    console.error("Error deducting user credits:", error);
    throw error;
  }
}