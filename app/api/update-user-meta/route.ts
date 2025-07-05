import { createClerkClient } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const payload = await request.json();
  const userId = payload.userId;
  const meta = payload.meta;
  if (!userId) {
    return NextResponse.json(
      { message: "User ID is required" },
      { status: 400 },
    );
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
