"use client"

import { useSearchParams } from "next/navigation"
import { useEffect, useState, Suspense } from "react";
import config from "@/config";
import toast, { Toaster } from 'react-hot-toast';
import { useCredits } from "@/contexts/CreditsContext";

function SubscriptionSuccessContent() {
  const { credits, user, refreshCredits, loading: creditsLoading } = useCredits();
  const [loading, setLoading] = useState(false);
  const [processingComplete, setProcessingComplete] = useState(false);
  const search = useSearchParams();
  
  const order_id = search.get("order_id");
  const checkout_id = search.get("checkout_id");
  const subscription_id = search.get("subscription_id");

  // 直接验证支付并写入Supabase数据
  const handleSubscriptionSuccess = async () => {
    if (!user?.id || !checkout_id) {
      console.warn('Missing required parameters:', { user_id: user?.id, checkout_id });
      return;
    }
    
    setLoading(true);
    try {
      console.log('🎯 Processing subscription success directly...');
      
      // 调用支付成功回调API直接处理支付验证和数据写入
      const response = await fetch('/api/creem/payment-success-callback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          checkout_id: checkout_id,
          order_id: order_id,
          user_id: user.id,
          subscription_id: subscription_id,
          force_process: false // 避免重复处理
        })
      });

      if (response.ok) {
        const result = await response.json();
        
        if (result.success) {
          // 数据写入成功，刷新积分显示
          await refreshCredits();
          setProcessingComplete(true);
          
          if (result.alreadyProcessed) {
            toast.success(`Subscription confirmed! Your credits are already in your account.`, {
              id: 'subscription-success',
              duration: 5000
            });
          } else {
            const creditsAdded = result.result?.creditsAdded || 'Your';
            toast.success(`Subscription activated successfully! ${creditsAdded} credits have been added to your account.`, {
              id: 'subscription-success',
              duration: 6000
            });
          }
        } else {
          toast.error(`Failed to process subscription: ${result.error}`, {
            id: 'subscription-error',
            duration: 8000
          });
        }
      } else {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        toast.error(`Subscription processing failed: ${errorData.error || 'Unknown error'}`, {
          id: 'subscription-error',
          duration: 8000
        });
      }
      
    } catch (error) {
      console.error('Error processing subscription success:', error);
      toast.error('Failed to process subscription. Please refresh the page or contact support.', {
        id: 'subscription-error',
        duration: 8000
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 只有当有必要参数且还未处理完成时才执行
    if (checkout_id && user?.id && !processingComplete && !loading) {
      handleSubscriptionSuccess();
    }
  }, [user, checkout_id, processingComplete, loading]);

  return (
    <div className="min-h-screen bg-white p-20">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-4 mt-16">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2 mt-10">
            {loading ? 'Processing Subscription...' : 'Subscription Successful!'}
          </h1>
          <p className="text-gray-600">
            {loading ? 'Please wait while we activate your subscription and add credits to your account.' : 'Thank you for your subscription.'}
          </p>
        </div>

        {/* 处理状态指示器 */}
        {loading && (
          <div className="bg-blue-50 rounded-lg p-6 mb-6">
            <div className="flex items-center justify-center">
              <div className="animate-spin w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full mr-3"></div>
              <span className="text-blue-700 font-medium">Verifying payment and activating subscription...</span>
            </div>
          </div>
        )}

        {/* 调试信息 */}
        {process.env.NODE_ENV === 'development' && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-sm">
            <p><strong>Debug Info:</strong></p>
            <p>Checkout ID: {checkout_id || 'Not provided'}</p>
            <p>Order ID: {order_id || 'Not provided'}</p>
            <p>Subscription ID: {subscription_id || 'Not provided'}</p>
            <p>User ID: {user?.id || 'Not logged in'}</p>
            <p>Processing Complete: {processingComplete ? 'Yes' : 'No'}</p>
          </div>
        )}

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
                      Updating...
                    </span>
                  ) : credits}
                </p>
                {processingComplete && (
                  <p className="text-sm text-gray-600 mt-1">
                    ✅ Subscription activated and credits added successfully
                  </p>
                )}
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

        {/* 缺少必要参数的警告 */}
        {!checkout_id && !loading && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="text-yellow-800 font-medium">Unable to Process Subscription</h3>
                <p className="text-yellow-700 text-sm">Missing checkout information. Please contact support if this issue persists.</p>
              </div>
            </div>
          </div>
        )}

        {/* 操作按钮 */}
        <div className="text-center">
          <button 
            onClick={() => window.location.href = '/ai-hairstyle'}
            className="bg-purple-700 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-800 mr-4 transition-colors disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Start Creating'}
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