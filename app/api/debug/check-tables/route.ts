import { NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';

export const runtime = "edge";

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const tableChecks: any = {};

    // 检查profiles表
    try {
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .limit(1);
      
      tableChecks.profiles = {
        exists: !profilesError,
        error: profilesError?.message,
        count: profilesData?.length || 0
      };
    } catch (e) {
      tableChecks.profiles = { exists: false, error: String(e) };
    }

    // 检查subscriptions表
    try {
      const { data: subsData, error: subsError } = await supabase
        .from('subscriptions')
        .select('*')
        .limit(1);
      
      tableChecks.subscriptions = {
        exists: !subsError,
        error: subsError?.message,
        count: subsData?.length || 0
      };
    } catch (e) {
      tableChecks.subscriptions = { exists: false, error: String(e) };
    }

    // 检查credits表
    try {
      const { data: creditsData, error: creditsError } = await supabase
        .from('credits')
        .select('*')
        .limit(1);
      
      tableChecks.credits = {
        exists: !creditsError,
        error: creditsError?.message,
        count: creditsData?.length || 0
      };
    } catch (e) {
      tableChecks.credits = { exists: false, error: String(e) };
    }

    // 检查orders表
    try {
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .limit(1);
      
      tableChecks.orders = {
        exists: !ordersError,
        error: ordersError?.message,
        count: ordersData?.length || 0
      };
    } catch (e) {
      tableChecks.orders = { exists: false, error: String(e) };
    }

    // 检查自定义users表（Drizzle）
    try {
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*')
        .limit(1);
      
      tableChecks.customUsers = {
        exists: !usersError,
        error: usersError?.message,
        count: usersData?.length || 0
      };
    } catch (e) {
      tableChecks.customUsers = { exists: false, error: String(e) };
    }

    // 检查auth.users表
    try {
      const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
      tableChecks.authUsers = {
        exists: !authError,
        error: authError?.message,
        count: authData?.users?.length || 0
      };
    } catch (e) {
      tableChecks.authUsers = { exists: false, error: String(e) };
    }

    return NextResponse.json({
      success: true,
      tableChecks,
      summary: {
        expectedSchema: 'Supabase auth.users + profiles',
        foundProfiles: tableChecks.profiles?.exists,
        foundCustomUsers: tableChecks.customUsers?.exists,
        foundAuthUsers: tableChecks.authUsers?.exists
      }
    });

  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message,
      success: false
    }, { status: 500 });
  }
} 