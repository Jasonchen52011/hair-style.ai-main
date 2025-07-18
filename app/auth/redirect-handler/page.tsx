"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import config from '@/config';

export default function RedirectHandler() {
  const router = useRouter();

  useEffect(() => {
    // 检查 localStorage 中是否有存储的返回URL
    const storedReturnUrl = localStorage.getItem('auth_return_url');
    
    console.log('🔍 Redirect handler - localStorage auth_return_url:', storedReturnUrl);
    console.log('🔍 Redirect handler - config.auth.callbackUrl:', config.auth.callbackUrl);
    
    if (storedReturnUrl && storedReturnUrl !== '/') {
      console.log('🔍 Redirect handler - Found stored return URL:', storedReturnUrl);
      // 清除存储的URL
      localStorage.removeItem('auth_return_url');
      // 重定向到原始页面
      router.replace(storedReturnUrl);
    } else {
      console.log('🔍 Redirect handler - No stored return URL or is homepage, redirecting to default');
      // 如果没有存储的URL或者是首页，重定向到默认页面
      localStorage.removeItem('auth_return_url'); // 清理
      router.replace(config.auth.callbackUrl);
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Redirecting...</p>
      </div>
    </div>
  );
}