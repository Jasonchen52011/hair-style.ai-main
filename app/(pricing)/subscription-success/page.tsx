"use client"

import { useSearchParams } from "next/navigation"
import { useEffect, useState, Suspense } from "react";
import config from "@/config";
import toast, { Toaster } from 'react-hot-toast';
import { useCredits } from "@/contexts/CreditsContext";

function SubscriptionSuccessContent() {
  const { credits, user, refreshCredits, loading: creditsLoading } = useCredits();
  const [loading, setLoading] = useState(false);
  const search = useSearchParams();
  const order_id = search.get("order_id");

  // 简化的积分刷新逻辑，只依赖CreditsContext
  const handleSubscriptionSuccess = async () => {
    if (!user?.id || !order_id) return;
    
    setLoading(true);
    try {
      // 直接刷新积分状态，让CreditsContext处理所有逻辑
      await refreshCredits();
      toast.success(`Subscription activated! Your credits have been updated.`, {
        id: 'subscription-update',
        duration: 4000
      });
    } catch (error) {
      console.error('Error refreshing credits:', error);
      toast.error('Subscription processed but failed to refresh credits. Please refresh the page.', {
        id: 'subscription-update',
        duration: 5000
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (order_id && user?.id) {
      handleSubscriptionSuccess();
    }
  }, [user, order_id]);

  return (
    <div className="min-h-screen bg-white p-20">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-4 mt-16">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2 mt-10">Payment Successful!</h1>
          <p className="text-gray-600">Thank you for your subscription.</p>
        </div>

        {/* 用户状态 */}
        {user && (
          <div className="bg-purple-50 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Your Account: {user.user_metadata?.name || user.email}</h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 text-xl">
                  Current Credits: {creditsLoading ? (
                    <span className="inline-flex items-center">
                      <div className="animate-spin w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full mr-2"></div>
                    </span>
                  ) : credits}
                </p>
              </div>
              {user.user_metadata?.avatar_url && (
                <img
                  src={user.user_metadata.avatar_url}
                  alt="User Avatar"
                  className="w-12 h-12 rounded-full"
                  referrerPolicy="no-referrer"
                />
              )}
            </div>
          </div>
        )}

        {/* 操作按钮 */}
        <div className="text-center">
          <button 
            onClick={() => window.location.href = '/ai-hairstyle'}
            className="bg-purple-700 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-800 mr-4 transition-colors"
          >
            Start Creating
          </button>
          <button 
            onClick={() => window.location.href = '/'}
            className="bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
      
      {/* Toast Container */}
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            style: {
              background: '#10b981',
            },
          },
          error: {
            style: {
              background: '#ef4444',
            },
          },
        }}
      />
    </div>
  );
}

export default function SubscriptionSuccess() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>}>
      <SubscriptionSuccessContent />
    </Suspense>
  );
}