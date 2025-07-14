"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useCreditsUpdateListener } from '@/lib/credits-utils';

interface CreditsContextType {
  credits: number;
  hasActiveSubscription: boolean;
  loading: boolean;
  user: any;
  refreshCredits: () => Promise<void>;
  updateCredits: (newCredits: number) => void;
}

const CreditsContext = createContext<CreditsContextType | undefined>(undefined);

export const useCredits = () => {
  const context = useContext(CreditsContext);
  if (!context) {
    throw new Error('useCredits must be used within a CreditsProvider');
  }
  return context;
};

interface CreditsProviderProps {
  children: React.ReactNode;
}

export const CreditsProvider: React.FC<CreditsProviderProps> = ({ children }) => {
  const [credits, setCredits] = useState<number>(0);
  const [hasActiveSubscription, setHasActiveSubscription] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [user, setUser] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const supabase = createClientComponentClient();

  // 确保组件已挂载（客户端渲染）
  useEffect(() => {
    setMounted(true);
  }, []);

  const refreshCredits = useCallback(async () => {
    if (!user || !mounted || isRefreshing) return;
    
    setIsRefreshing(true);
    let retries = 3; // 增加重试机制
    
    while (retries > 0) {
      try {
        console.log(`🔄 Refreshing credits for user ${user.id} (attempt ${4 - retries})`);
        
        const response = await fetch(`/api/user-credits-simple?userId=${user.id}&_t=${Date.now()}`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
            'x-user-id': user.id
          }
        });
        
        if (response.ok) {
          const result = await response.json();
          console.log(`📊 Credits API response:`, result);
          
          if (result.success) {
            const newCredits = result.user.credits || 0;
            const hasSubscription = result.user.hasActiveSubscription || false;
            
            console.log(`✅ Credits updated: ${newCredits}, Subscription: ${hasSubscription}`);
            
            setCredits(newCredits);
            setHasActiveSubscription(hasSubscription);
            
            // 成功后跳出重试循环
            break;
          } else {
            console.error('API returned error:', result.error);
            // API错误，但不重试
            setCredits(0);
            setHasActiveSubscription(false);
            break;
          }
        } else {
          console.error(`Failed to fetch credits (${response.status}):`, response.statusText);
          
          // 只有在5xx错误时才重试
          if (response.status >= 500 && retries > 1) {
            retries--;
            console.log(`🔄 Retrying... (${retries} attempts left)`);
            await new Promise(resolve => setTimeout(resolve, 1000)); // 等待1秒后重试
            continue;
          }
          
          setCredits(0);
          setHasActiveSubscription(false);
          break;
        }
      } catch (error) {
        console.error('Error refreshing credits:', error);
        
        // 网络错误，重试
        if (retries > 1) {
          retries--;
          console.log(`🔄 Network error, retrying... (${retries} attempts left)`);
          await new Promise(resolve => setTimeout(resolve, 1000));
          continue;
        }
        
        setCredits(0);
        setHasActiveSubscription(false);
        break;
      }
    }
    
    setIsRefreshing(false);
  }, [user, mounted, isRefreshing]);

  const updateCredits = useCallback((newCredits: number) => {
    setCredits(newCredits);
  }, []);

  // 获取用户信息和积分
  useEffect(() => {
    if (!mounted) return;
    
    const getUser = async () => {
      try {
        setLoading(true);
        const { data } = await supabase.auth.getUser();
        setUser(data.user);
        
        if (data.user) {
          // 立即获取用户credits信息，不再延迟
          const response = await fetch(`/api/user-credits-simple?userId=${data.user.id}`, {
            method: 'GET',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
              'x-user-id': data.user.id
            },
          });
          
          if (response.ok) {
            const result = await response.json();
            if (result.success) {
              setCredits(result.user.credits || 0);
              setHasActiveSubscription(result.user.hasActiveSubscription || false);
            } else {
              console.error('Credits API returned error:', result.error);
              setCredits(0);
              setHasActiveSubscription(false);
            }
          } else {
            console.error('Credits API failed:', response.status);
            setCredits(0);
            setHasActiveSubscription(false);
          }
        } else {
          setCredits(0);
          setHasActiveSubscription(false);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        setCredits(0);
        setHasActiveSubscription(false);
      } finally {
        setLoading(false);
      }
    };

    getUser();
  }, [supabase, mounted]);

  // 监听用户认证状态变化
  useEffect(() => {
    if (!mounted) return;
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user);
          // 用户登录后立即获取积分，移除延迟
          await refreshCredits();
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setCredits(0);
          setHasActiveSubscription(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase, refreshCredits, mounted]);

  // 监听积分更新事件
  useEffect(() => {
    if (!mounted) return;
    
    const cleanup = useCreditsUpdateListener((newCredits) => {
      if (newCredits !== undefined) {
        setCredits(newCredits);
      } else {
        // 如果没有提供新积分值，则刷新积分
        refreshCredits();
      }
    });

    return cleanup;
  }, [mounted, refreshCredits]);

  // 定期刷新积分，但频率更低
  useEffect(() => {
    if (!mounted || !user) return;
    
    const interval = setInterval(() => {
      refreshCredits();
    }, 5 * 60 * 1000); // 5分钟刷新一次

    return () => clearInterval(interval);
  }, [mounted, user, refreshCredits]);

  return (
    <CreditsContext.Provider value={{
      credits,
      hasActiveSubscription,
      loading,
      user,
      refreshCredits,
      updateCredits
    }}>
      {children}
    </CreditsContext.Provider>
  );
}; 