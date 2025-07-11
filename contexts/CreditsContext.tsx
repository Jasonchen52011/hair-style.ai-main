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
    try {
      const response = await fetch('/api/creem/user-credits', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (response.ok) {
        const creditsData = await response.json();
        setCredits(creditsData.credits || 0);
        setHasActiveSubscription(creditsData.hasActiveSubscription || false);
      } else {
        console.error('Failed to fetch credits:', response.status);
        // 简化错误处理，不再使用双重fallback
        setCredits(0);
        setHasActiveSubscription(false);
      }
    } catch (error) {
      console.error('Error refreshing credits:', error);
      setCredits(0);
      setHasActiveSubscription(false);
    } finally {
      setIsRefreshing(false);
    }
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
          const response = await fetch('/api/creem/user-credits', {
            method: 'GET',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
            },
          });
          
          if (response.ok) {
            const creditsData = await response.json();
            setCredits(creditsData.credits || 0);
            setHasActiveSubscription(creditsData.hasActiveSubscription || false);
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