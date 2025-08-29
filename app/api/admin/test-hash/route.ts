import { NextRequest, NextResponse } from 'next/server';

export const runtime = "edge";

// 生成SHA-256哈希的辅助函数 - 使用 Web Crypto API
async function createSHA256Hash(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function POST(request: NextRequest) {
  const { password } = await request.json();
  const hash = await createSHA256Hash(password);
  
  return NextResponse.json({
    password,
    hash,
    expectedHash: '137767f133dca34af6fba21e57149c059cdc7f256f53ae11dcbcdeb103de8ea7',
    matches: hash === '137767f133dca34af6fba21e57149c059cdc7f256f53ae11dcbcdeb103de8ea7'
  });
}