import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const checkout_id = searchParams.get("checkout_id");

  if (!checkout_id) {
    return NextResponse.json(
      { message: "Checkout ID is required" },
      { status: 400 }
    );
  }

  try {
    const { data } = await axios.get<Record<string, any>>(
      `https://api.creem.io/v1/checkouts?checkout_id=${checkout_id}`,
      {
        headers: { "x-api-key": process.env.CREEM_API_KEY },
      }
    );

    console.log("Checkout data fetched:", data);

    if (!data) {
      return NextResponse.json(
        { message: "Checkout not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching checkout info:", error);
    return NextResponse.json(
      { message: "Failed to fetch checkout info" },
      { status: 500 }
    );
  }
} 