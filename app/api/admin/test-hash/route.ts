import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  const { password } = await request.json();
  const hash = crypto.createHash('sha256').update(password).digest('hex');
  
  return NextResponse.json({
    password,
    hash,
    expectedHash: '137767f133dca34af6fba21e57149c059cdc7f256f53ae11dcbcdeb103de8ea7',
    matches: hash === '137767f133dca34af6fba21e57149c059cdc7f256f53ae11dcbcdeb103de8ea7'
  });
}