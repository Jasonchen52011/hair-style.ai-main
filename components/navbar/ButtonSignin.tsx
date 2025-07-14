/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect, useRef, memo } from "react";
import Link from "next/link";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import config from "@/config";
import { useCredits } from "@/contexts/CreditsContext";

// 优化的积分显示组件
const CreditsDisplay = memo(({ credits, hasActiveSubscription }: { credits: number; hasActiveSubscription: boolean }) => (
  <div className="flex items-center space-x-2">
    <Link
      href="/pricing"
      className="bg-purple-100 text-purple-700 px-4 py-2 rounded-full text-sm font-medium hover:bg-purple-200 transition-colors"
    >
      {credits} Credits
    </Link>
    {hasActiveSubscription && (
      <Link href="/pricing" className="px-4 py-2 bg-orange-100 rounded-full text-sm font-medium transition-colors text-orange-600 hover:text-orange-700 hover:bg-orange-200">
     Upgrade
     </Link>
    )}
  </div>
));

CreditsDisplay.displayName = 'CreditsDisplay';

// 优化的用户头像组件
const UserAvatar = memo(({ user, onClick }: { user: any; onClick: () => void }) => (
  <button
    onClick={onClick}
    className="flex items-center gap-1 hover:opacity-80 transition-opacity"
  >
    {user.user_metadata?.avatar_url ? (
      <img
        src={user.user_metadata.avatar_url}
        alt="User Avatar"
        className="w-8 h-8 rounded-full cursor-pointer"
        referrerPolicy="no-referrer"
      />
    ) : (
      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center cursor-pointer">
        <span className="text-sm font-medium text-purple-700">
          {user.user_metadata?.name?.charAt(0) || user.email?.charAt(0)}
        </span>
      </div>
    )}
  </button>
));

UserAvatar.displayName = 'UserAvatar';

// 优化的下拉菜单组件
const UserDropdown = memo(({ user, credits, hasActiveSubscription, onSignOut }: {
  user: any;
  credits: number;
  hasActiveSubscription: boolean;
  onSignOut: () => void;
}) => (
  <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
    {/* 用户信息 */}
    <div className="px-4 py-3 border-b border-gray-100">
      <div className="flex items-center gap-3">
        {user.user_metadata?.avatar_url ? (
          <img
            src={user.user_metadata.avatar_url}
            alt="User Avatar"
            className="w-10 h-10 rounded-full"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
            <span className="text-lg font-medium text-purple-700">
              {user.user_metadata?.name?.charAt(0) || user.email?.charAt(0)}
            </span>
          </div>
        )}
        <div>
          <div className="font-medium text-gray-900">
            {user.user_metadata?.name || user.email?.split('@')[0]}
          </div>
          <div className="text-xs text-gray-500">{user.email}</div>
        </div>
      </div>
    </div>

    {/* 积分信息 */}
    <div className="px-4 py-2 border-b border-gray-100">
      <div className="flex items-center justify-between">
        
        <span className="text-xs text-gray-600">Credits</span>
        <span className="font-medium text-purple-600 text-xs">{credits}Credits</span>
      </div>
      {hasActiveSubscription && (
        <div className="flex items-center gap-1 mt-1">
          <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-xs text-green-600">Pro</span>
        </div>
      )}
    </div>


    {/* 菜单选项 */}
    <div className="py-1">
      <button
        onClick={onSignOut}
        className="flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors w-full text-left"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
        Logout
      </button>
    </div>
  </div>
));

UserDropdown.displayName = 'UserDropdown';

// 优化的加载骨架屏组件
const LoadingSkeleton = memo(() => (
  <div className="flex items-center space-x-2">
    <div className="w-6 h-6 bg-gray-200 rounded-full animate-pulse"></div>
    <div className="w-20 h-6 bg-gray-200 rounded animate-pulse"></div>
  </div>
));

LoadingSkeleton.displayName = 'LoadingSkeleton';

// A simple button to sign in with our providers (Google & Magic Links).
// It automatically redirects user to callbackUrl (config.auth.callbackUrl) after login, which is normally a private page for users to manage their accounts.
// If the user is already logged in, it will show their profile picture & redirect them to callbackUrl immediately.
const ButtonSignin = memo(({
  text = "Login",
  extraStyle,
}: {
  text?: string;
  extraStyle?: string;
}) => {
  const supabase = createClientComponentClient();
  const { credits, hasActiveSubscription, loading, user } = useCredits();
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 处理点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 登出函数
  const handleSignOut = async () => {
    if (isSigningOut) return;
    
    setIsSigningOut(true);
    try {
      await supabase.auth.signOut();
      setShowDropdown(false);
      // 刷新页面或重定向到首页
      window.location.href = '/';
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      setIsSigningOut(false);
    }
  };

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  // 优化加载状态
  if (loading) {
    return <LoadingSkeleton />;
  }

  if (user) {
    return (
      <div className="flex items-center space-x-3">
        {/* Credits显示 */}
        <CreditsDisplay credits={credits} hasActiveSubscription={hasActiveSubscription} />

        {/* 用户头像和下拉菜单 */}
        <div className="relative" ref={dropdownRef}>
          <UserAvatar user={user} onClick={toggleDropdown} />

          {/* 下拉菜单 */}
          {showDropdown && (
            <UserDropdown
              user={user}
              credits={credits}
              hasActiveSubscription={hasActiveSubscription}
              onSignOut={handleSignOut}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <Link
      className={`btn ${extraStyle ? extraStyle : ""}`}
      href={config.auth.loginUrl}
    >
      {text}
    </Link>
  );
});

ButtonSignin.displayName = 'ButtonSignin';

export default ButtonSignin;
