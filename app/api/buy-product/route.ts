import axios from "axios";
import { NextRequest, NextResponse } from "next/server";

const apiKey = process.env.API_KEY;

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const productId = params.get("productId");

  const result = await axios.post(
    `https://test-api.creem.io/v1/checkouts`,
    {
      product_id: productId,
    },
    {
      headers: { "x-api-key": apiKey },
    },
  );
  const redirectData = result.data;
  console.log(redirectData);
  return NextResponse.json({ redirectData: redirectData });
}
