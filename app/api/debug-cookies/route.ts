import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();
  
  return NextResponse.json({
    totalCookies: allCookies.length,
    cookies: allCookies.map(c => ({
      name: c.name,
      value: c.value.substring(0, 20) + (c.value.length > 20 ? '...' : ''),
      length: c.value.length
    })),
    supabaseCookies: allCookies.filter(c => c.name.includes('supabase') || c.name.includes('sb-')).map(c => c.name),
    timestamp: new Date().toISOString()
  });
}