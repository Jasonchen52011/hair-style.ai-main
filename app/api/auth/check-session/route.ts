import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const cookieStore = await cookies();
    
    // Create Supabase client
    const supabase = await createClient();

    // Check session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    // Check user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    // Get all cookies for debugging
    const allCookies = cookieStore.getAll();
    const supabaseCookies = allCookies.filter(c => c.name.includes('supabase'));
    
    return NextResponse.json({
      session: {
        exists: !!session,
        userId: session?.user?.id,
        email: session?.user?.email,
        error: sessionError?.message
      },
      user: {
        exists: !!user,
        userId: user?.id,
        email: user?.email,
        error: userError?.message
      },
      cookies: {
        count: supabaseCookies.length,
        names: supabaseCookies.map(c => c.name)
      },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}