"use client"

import { useSearchParams } from "next/navigation"
import { useEffect, useState, useRef, Suspense } from "react";
import config from "@/config";
import toast, { Toaster } from 'react-hot-toast';
import { useCredits } from "@/contexts/CreditsContext";

function PaymentSuccessContent() {
  const { credits, user, refreshCredits, loading: creditsLoading } = useCredits();
  const [processing, setProcessing] = useState(true);
  const [creditsProcessed, setCreditsProcessed] = useState(false);
  const search = useSearchParams();
  const order_id = search.get("order_id");
  const checkout_id = search.get("checkout_id");
  const product_id = search.get("product_id");
  
  // 🔒 使用useRef防止重复检查
  const checkingRef = useRef(false);
  const checkCountRef = useRef(0);
  const maxChecks = 30; // 最多检查30次 (30秒)

  // 获取预期积分数量
  const getExpectedCredits = () => {
    const finalProductId = product_id || config.creem.products.monthly.id;
    const products = config.creem.products;
    if (products.monthly.id === finalProductId) return products.monthly.credits;
    if (products.yearly.id === finalProductId) return products.yearly.credits;
    if (products.oneTime.id === finalProductId) return products.oneTime.credits;
    return products.monthly.credits;
  };

  // 获取订阅类型显示名称
  const getSubscriptionTypeName = () => {
    const finalProductId = product_id || config.creem.products.monthly.id;
    const products = config.creem.products;
    if (products.monthly.id === finalProductId) return 'Monthly';
    if (products.yearly.id === finalProductId) return 'Yearly';
    if (products.oneTime.id === finalProductId) return 'One-time';
    return 'Monthly';
  };

  // 检查积分是否已被webhook处理
  const checkCreditsStatus = async () => {
    if (!user?.id || !order_id || checkingRef.current || creditsProcessed) {
      return;
    }
    
    checkingRef.current = true;
    checkCountRef.current += 1;
    
    try {
      console.log(`🔍 Checking credits status (attempt ${checkCountRef.current}/${maxChecks}) for order:`, order_id);
      
      const checkResponse = await fetch(`/api/creem/user-credits?order_id=${order_id}`, {
        method: 'GET',
        credentials: 'include'
      });

      if (checkResponse.ok) {
        const checkData = await checkResponse.json();
        console.log('✅ Credits check result:', checkData);
        
        if (checkData.success && checkData.exists && checkData.totalCredits > 0) {
          // Credits已被webhook处理
          console.log('💡 Credits processed by webhook, refreshing display...');
          await refreshCredits();
          setCreditsProcessed(true);
          setProcessing(false);
          
          toast.success(`Payment processed! ${checkData.totalCredits} credits have been added to your account by our system.`, {
            id: 'payment-processed',
            duration: 5000
          });
          return;
        }
      }
      
      // 如果达到最大检查次数，停止检查并显示联系支持的信息
      if (checkCountRef.current >= maxChecks) {
        console.log('⏰ Reached maximum check attempts');
        setProcessing(false);
        toast.error('Credits are taking longer than expected to process. Please contact support if they don\'t appear soon.', {
          id: 'payment-timeout',
          duration: 8000
        });
      }
      
    } catch (error) {
      console.error('Error checking credits status:', error);
    } finally {
      checkingRef.current = false;
    }
  };

  // 手动刷新积分
  const handleRefreshCredits = async () => {
    try {
      await refreshCredits();
      toast.success('Credits refreshed successfully!', {
        id: 'credits-refresh',
        duration: 3000
      });
    } catch (error) {
      console.error('Failed to refresh credits:', error);
      toast.error('Failed to refresh credits', {
        id: 'credits-refresh-error',
        duration: 3000
      });
    }
  };

  // 定期检查积分状态
  useEffect(() => {
    if (!user?.id || !order_id || creditsProcessed) {
      return;
    }

    // 立即检查一次
    checkCreditsStatus();

    // 然后每秒检查一次
    const interval = setInterval(() => {
      if (checkCountRef.current < maxChecks && !creditsProcessed) {
        checkCreditsStatus();
      } else {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [user?.id, order_id, creditsProcessed]);

  return (
    <div className="min-h-screen bg-white p-20">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-4 mt-2">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 relative">
            <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2 mt-10">Payment Successful!</h1>
          <p className="text-gray-600">Thank you for your purchase. Your credits are being processed.</p>
        </div>

        {/* 处理状态显示 */}
        {processing && !creditsProcessed && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
              </div>
              <div>
                <h3 className="text-blue-800 font-medium">Processing Payment</h3>
                <p className="text-blue-700 text-sm">
                  Our webhook system is processing your payment and credits. This usually takes 10-30 seconds.
                  {checkCountRef.current > 0 && ` (Checking ${checkCountRef.current}/${maxChecks})`}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 处理完成状态 */}
        {creditsProcessed && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="text-green-800 font-medium">Credits Added Successfully!</h3>
                <p className="text-green-700 text-sm">
                  Your {getExpectedCredits()} credits have been processed and added to your account.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 订阅详情 */}
        {(product_id || order_id) && (
          <div className="bg-purple-50 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Purchase Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Plan Type:</span>
                <span className="font-medium">{getSubscriptionTypeName()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Expected Credits:</span>
                <span className="font-medium">{getExpectedCredits()} credits</span>
              </div>
              {order_id && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Order ID:</span>
                  <span className="font-mono text-xs">{order_id}</span>
                </div>
              )}
              {checkout_id && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Checkout ID:</span>
                  <span className="font-mono text-xs">{checkout_id}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 用户积分状态 */}
        {user && (
          <div className="bg-purple-50 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Your Account: {user.user_metadata?.name || user.email}</h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 text-xl">
                  Current Credits: {creditsLoading ? (
                    <span className="inline-flex items-center">
                      <div className="animate-spin w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full mr-2"></div>
                      Loading...
                    </span>
                  ) : credits}
                </p>
                <div className="mt-3 flex gap-3">
                  <button
                    onClick={handleRefreshCredits}
                    disabled={creditsLoading}
                    className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors disabled:opacity-50"
                  >
                    {creditsLoading ? (
                      <span className="flex items-center">
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                        Refreshing...
                      </span>
                    ) : (
                      'Refresh Credits'
                    )}
                  </button>
                  <button
                    onClick={() => window.location.href = 'mailto:support@hair-style.ai?subject=Credits Not Updated&body=' + encodeURIComponent(`
Order ID: ${order_id || 'N/A'}
Checkout ID: ${checkout_id || 'N/A'}
Product ID: ${product_id || 'N/A'}
Expected Credits: ${getExpectedCredits()}
Current Credits: ${credits}
User ID: ${user.id}

Please help me check why my credits haven't been updated after successful payment.
`)}
                    className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                  >
                    Contact Support
                  </button>
                </div>
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

        {/* 提示信息 */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
          <div className="flex items-start">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3 mt-1">
              <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h3 className="text-green-800 font-medium mb-2">How it works</h3>
              <ul className="text-green-700 text-sm space-y-1">
                <li>• Your payment has been successfully processed</li>
                <li>• Our webhook system automatically processes credits</li>
                <li>• Credits are usually added within 30 seconds</li>
                <li>• You'll receive an email confirmation shortly</li>
                <li>• If credits don't appear after 2 minutes, please contact support</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 缺少必要参数的警告 */}
        {!checkout_id && !order_id && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="text-yellow-800 font-medium">Missing Payment Information</h3>
                <p className="text-yellow-700 text-sm">
                  Some payment details are missing from the URL. If you completed a payment, 
                  your credits should still be processed automatically by our webhook system. 
                  Please wait a few minutes or contact support if needed.
                </p>
              </div>
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

        {/* 调试信息 */}
        {process.env.NODE_ENV === 'development' && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-sm mt-6">
            <p><strong>Debug Info:</strong></p>
            <p>Checkout ID: {checkout_id || 'Not provided'}</p>
            <p>Order ID: {order_id || 'Not provided'}</p>
            <p>Product ID: {product_id || 'Not provided'}</p>
            <p>User ID: {user?.id || 'Not logged in'}</p>
            <p>Current Credits: {credits}</p>
            <p>Credits Processed: {creditsProcessed ? 'Yes' : 'No'}</p>
            <p>Processing: {processing ? 'Yes' : 'No'}</p>
            <p>Check Count: {checkCountRef.current}</p>
          </div>
        )}
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

export default function PaymentSuccess() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>}>
      <PaymentSuccessContent />
    </Suspense>
  );
}