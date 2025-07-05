import { generateSignature } from "@/lib/util";
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

  const { data } = await axios.get<Record<string, any>>(
    `https://test-api.creem.io/v1/checkouts?checkout_id=${paymentParams.checkout_id}`,
    {
      headers: { "x-api-key": process.env.API_KEY },
    },
  );
  console.log("checkout data", data, paymentParams.order_id);
  if (!data?.order?.id || data?.order?.id !== paymentParams.order_id) {
    return NextResponse.json({ message: "Invalid order" }, { status: 400 });
  }
  const clerkClient = createClerkClient({
    secretKey: process.env.CLERK_SECRET_KEY,
  });
  clerkClient.users.updateUserMetadata(userId, {
    publicMetadata: meta,
  });
  return NextResponse.json(
    {
      message: "User metadata updated successfully",
    },
    { status: 200 },
  );
}
