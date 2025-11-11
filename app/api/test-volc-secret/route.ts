import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const secretKey = process.env.VOLC_SECRET_KEY || 'NOT_SET';

  return NextResponse.json({
    hasSecret: !!process.env.VOLC_SECRET_KEY,
    secretKeyLength: secretKey.length,
    secretKeyPreview: secretKey.substring(0, 20) + '...' + secretKey.substring(secretKey.length - 10),
    secretKeyFormat: {
      endsWithEquals: secretKey.endsWith('==') || secretKey.endsWith('='),
      isBase64Like: /^[A-Za-z0-9+/]+=*$/.test(secretKey),
      isHexLike: /^[0-9a-fA-F]+$/.test(secretKey)
    }
  });
}
