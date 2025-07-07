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
import axios from "axios";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const payload = await request.json();
  const userId = payload.userId;
  const meta = payload.meta;
  const paymentParams = payload.paymentParams;

  if (!userId) {
    return NextResponse.json(
      { message: "User ID is required" },
      { status: 400 },
    );
  }

  // 如果有paymentParams，则验证支付
  if (paymentParams) {
    try {
      const { data } = await axios.get<Record<string, any>>(
        `https://api.creem.io/v1/checkouts?checkout_id=${paymentParams.checkout_id}`,
        {
          headers: { "x-api-key": process.env.API_KEY },
        },
      );
      console.log("checkout data", data, paymentParams.order_id);
      
      // 验证checkout是否存在且状态为completed
      if (!data?.status || data.status !== 'completed') {
        return NextResponse.json({ message: "Invalid payment status" }, { status: 400 });
      }
      
      // 验证order存在
      if (!data?.order?.id) {
        return NextResponse.json({ message: "Order not found" }, { status: 400 });
      }
      
      // 如果有subscription，验证subscription
      if (
        data?.subscription?.id &&
        paymentParams.subscription_id &&
        data?.subscription?.id !== paymentParams.subscription_id
      ) {
        return NextResponse.json(
          { message: "Invalid subscription" },
          { status: 400 },
        );
      }
    } catch (error) {
      console.error("Payment verification failed:", error);
      return NextResponse.json(
        { message: "Payment verification failed" },
        { status: 400 }
      );
    }
  }

  try {
    const clerkClient = createClerkClient({
      secretKey: process.env.CLERK_SECRET_KEY,
    });
    
    // 检查是否已经处理过这个订单
    if (paymentParams && paymentParams.order_id) {
      const user = await clerkClient.users.getUser(userId);
      const lastProcessedOrder = user.publicMetadata?.lastOrder as string;
      
      if (lastProcessedOrder === paymentParams.order_id) {
        console.log("Order already processed, skipping update:", paymentParams.order_id);
        return NextResponse.json(
          {
            message: "Order already processed",
            alreadyProcessed: true,
          },
          { status: 200 },
        );
      }
    }
    
    await clerkClient.users.updateUserMetadata(userId, {
      publicMetadata: meta,
    });
    
    console.log("User metadata updated successfully for user:", userId);
    
    return NextResponse.json(
      {
        message: "User metadata updated successfully",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error updating user metadata:", error);
    return NextResponse.json(
      { message: "Failed to update user metadata" },
      { status: 500 }
    );
  }
}