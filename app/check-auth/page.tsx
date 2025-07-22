"use client";

import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function CheckAuthPage() {
  const [authData, setAuthData] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      // 1. 获取Supabase用户
      const { data: { user }, error } = await supabase.auth.getUser();
      
      const result: any = {
        supabaseUser: user ? {
          id: user.id,
          email: user.email,
          created_at: user.created_at,
          metadata: user.user_metadata
        } : null,
        authError: error?.message
      };

      if (user) {
        // 2. 检查profiles表
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
          
        result.profileData = profile;

        // 3. 检查users表
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('uuid', user.id)
          .single();
          
        result.userData = userData;

        // 4. 检查积分余额
        const { data: balance } = await supabase
          .from('user_credits_balance')
          .select('*')
          .eq('user_uuid', user.id)
          .single();
          
        result.creditsBalance = balance;

        // 5. 最近的订单
        const { data: orders } = await supabase
          .from('orders')
          .select('*')
          .eq('user_uuid', user.id)
          .order('created_at', { ascending: false })
          .limit(3);
          
        result.recentOrders = orders;
      }

      setAuthData(result);
      setLoading(false);
    } catch (error: any) {
      setAuthData({ error: error.message });
      setLoading(false);
    }
  };

  const createUserRecord = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      // 创建users表记录
      const { error: userError } = await supabase
        .from('users')
        .insert({
          uuid: user.id,
          email: user.email,
          nickname: user.user_metadata?.name || '',
          avatar_url: user.user_metadata?.picture || '',
          signin_type: 'oauth',
          signin_provider: 'google',
          signin_openid: user.id,
          created_at: new Date().toISOString()
        });

      if (userError && !userError.message.includes('duplicate')) {
        throw userError;
      }

      // 创建积分余额记录
      const { error: balanceError } = await supabase
        .from('user_credits_balance')
        .insert({
          user_uuid: user.id,
          balance: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (balanceError && !balanceError.message.includes('duplicate')) {
        throw balanceError;
      }

      alert('User records created successfully!');
      checkAuth(); // 刷新数据
    } catch (error: any) {
      alert('Error creating user record: ' + error.message);
    }
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Authentication & Database Check</h1>
      
      <div className="space-y-6">
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-semibold mb-2">Supabase Auth User</h2>
          <pre className="bg-white p-4 rounded text-sm overflow-auto">
            {JSON.stringify(authData.supabaseUser, null, 2)}
          </pre>
        </div>

        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-semibold mb-2">Profiles Table</h2>
          <pre className="bg-white p-4 rounded text-sm overflow-auto">
            {JSON.stringify(authData.profileData, null, 2)}
          </pre>
        </div>

        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-semibold mb-2">Users Table</h2>
          <pre className="bg-white p-4 rounded text-sm overflow-auto">
            {JSON.stringify(authData.userData, null, 2)}
          </pre>
          {authData.supabaseUser && !authData.userData && (
            <button
              onClick={createUserRecord}
              className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Create User Record
            </button>
          )}
        </div>

        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-semibold mb-2">Credits Balance</h2>
          <pre className="bg-white p-4 rounded text-sm overflow-auto">
            {JSON.stringify(authData.creditsBalance, null, 2)}
          </pre>
        </div>

        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-semibold mb-2">Recent Orders</h2>
          <pre className="bg-white p-4 rounded text-sm overflow-auto">
            {JSON.stringify(authData.recentOrders, null, 2)}
          </pre>
        </div>
      </div>

      <div className="mt-6 flex gap-4">
        <button
          onClick={checkAuth}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Refresh
        </button>
        <button
          onClick={() => window.location.href = '/signin'}
          className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
        >
          Go to Sign In
        </button>
      </div>
    </div>
  );
}