"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

export default function TestAuth() {
  const [authStatus, setAuthStatus] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      
      // Check session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      // Check user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      // Get all cookies (client-side)
      const cookies = document.cookie.split(';').map(c => {
        const [name, value] = c.trim().split('=');
        return { name, hasValue: !!value, length: value?.length || 0 };
      });
      
      setAuthStatus({
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
          total: cookies.length,
          supabase: cookies.filter(c => c.name.includes('supabase') || c.name.includes('sb-')),
          all: cookies
        },
        timestamp: new Date().toISOString()
      });
      
      setLoading(false);
    };
    
    checkAuth();
    
    // Listen for auth changes
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session?.user?.id);
      checkAuth();
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Auth Status Debug</h1>
      <pre className="bg-gray-100 p-4 rounded overflow-auto">
        {JSON.stringify(authStatus, null, 2)}
      </pre>
      
      <div className="mt-4">
        <button 
          onClick={() => window.location.reload()} 
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Refresh
        </button>
        
        <button 
          onClick={() => {
            const supabase = createClient();
            supabase.auth.signOut().then(() => {
              window.location.reload();
            });
          }} 
          className="bg-red-500 text-white px-4 py-2 rounded ml-2"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}