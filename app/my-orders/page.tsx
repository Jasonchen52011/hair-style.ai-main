"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import toast, { Toaster } from 'react-hot-toast';

function OrderSuccessContent() {
  const [user, setUser] = useState<any>(null);
  const [userCredits, setUserCredits] = useState(0);
  const [loading, setLoading] = useState(true);
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const supabase = createClientComponentClient();

  // 获取用户信息和积分
  useEffect(() => {
    const loadUserData = async () => {
      try {
        // 获取用户信息
        const { data: userData } = await supabase.auth.getUser();
        setUser(userData.user);

        if (userData.user) {
          // 直接从Supabase获取用户积分余额
          try {
            const { data: balanceData, error: balanceError } = await supabase
              .from('user_credits_balance')
              .select('balance')
              .eq('user_uuid', userData.user.id)
              .single();
              
            if (balanceError) {
              console.error("Failed to fetch credits:", balanceError);
              // 如果没有记录，显示0
              setUserCredits(0);
            } else {
              console.log("Credits balance:", balanceData);
              setUserCredits(balanceData?.balance || 0);
            }
          } catch (error) {
            console.error("Error fetching credits:", error);
            setUserCredits(0);
          }

          // 如果有session_id，获取订单详情
          if (sessionId) {
            try {
              // 直接从数据库获取订单信息
              const { data: orderData, error: orderError } = await supabase
                .from('orders')
                .select('*')
                .eq('stripe_session_id', sessionId)
                .single();
                
              if (!orderError && orderData) {
                setOrderDetails({
                  productName: orderData.product_name,
                  credits: orderData.credits,
                  amount: orderData.amount,
                  orderNo: orderData.order_no,
                  status: orderData.status
                });
                
                // 如果订单是已支付状态，延迟刷新积分
                if (orderData.status === 'paid') {
                  setTimeout(async () => {
                    const { data: refreshBalance } = await supabase
                      .from('user_credits_balance')
                      .select('balance')
                      .eq('user_uuid', userData.user.id)
                      .single();
                      
                    if (refreshBalance) {
                      console.log("Refreshed credits:", refreshBalance);
                      setUserCredits(refreshBalance.balance || 0);
                    }
                  }, 2000);
                }
              }
            } catch (error) {
              console.error("Error fetching order details:", error);
            }
          }
        }
      } catch (error) {
        console.error("Error loading data:", error);
        toast.error("Failed to load order details");
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [sessionId, supabase]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

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
          <p className="text-gray-600">Thank you for your purchase. Your credits have been added to your account.</p>
        </div>

        {/* 用户积分状态 */}
        {user && (
          <div className="bg-purple-50 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Your Account</h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600">{user.email}</p>
                <p className="text-purple-600 text-xl mt-2">
                  Current Credits: <span className="font-bold">{userCredits}</span>
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

        {/* 订单详情 */}
        {orderDetails && (
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Order Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Product:</span>
                <span className="font-medium">{orderDetails.productName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Credits Purchased:</span>
                <span className="font-medium">{orderDetails.credits} credits</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Amount Paid:</span>
                <span className="font-medium">${orderDetails.amount / 100} USD</span>
              </div>
              {orderDetails.orderNo && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Order ID:</span>
                  <span className="font-mono text-xs">{orderDetails.orderNo}</span>
                </div>
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

export default function MyOrders() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <OrderSuccessContent />
    </Suspense>
  );
}