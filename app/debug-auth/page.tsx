"use client";

import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function DebugAuthPage() {
  const [authState, setAuthState] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      // 1. Check Supabase session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      // 2. Check Supabase user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      // 3. Get auth state
      const authState = await supabase.auth.onAuthStateChange((event, session) => {
        console.log('Auth state change:', event, session);
      });

      // 4. Check environment
      const env = {
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
        NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
      };

      setAuthState({
        session: session,
        sessionError: sessionError?.message,
        user: user,
        userError: userError?.message,
        environment: env,
        currentUrl: window.location.href,
      });
      
      setLoading(false);
    } catch (error: any) {
      setAuthState({ error: error.message });
      setLoading(false);
    }
  };

  const testSignIn = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback`,
        },
      });
      
      console.log('Sign in result:', { data, error });
    } catch (error: any) {
      console.error('Sign in error:', error);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Auth Debug Page</h1>
      
      <div className="space-y-6">
        <div className="bg-gray-100 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Current Auth State</h2>
          <pre className="bg-white p-4 rounded overflow-auto text-sm">
            {JSON.stringify(authState, null, 2)}
          </pre>
        </div>

        <div className="flex gap-4">
          {!authState.user ? (
            <button
              onClick={testSignIn}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Test Google Sign In
            </button>
          ) : (
            <button
              onClick={signOut}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Sign Out
            </button>
          )}
          
          <button
            onClick={checkAuth}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Refresh Status
          </button>
        </div>

        <div className="bg-yellow-50 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Expected Flow</h2>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>Click "Test Google Sign In"</li>
            <li>Redirect to Google OAuth</li>
            <li>Google redirects to Supabase: https://tnolrawxpimpxcplyvwt.supabase.co/auth/v1/callback</li>
            <li>Supabase redirects to: http://localhost:3000/api/auth/callback</li>
            <li>Our callback creates user in database</li>
            <li>Final redirect to home page</li>
          </ol>
        </div>
      </div>
    </div>
  );
}