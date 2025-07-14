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

  // 检查积分状态
  const checkCreditsStatus = async () => {
    if (checkingRef.current || !user?.id) return;
    
    checkingRef.current = true;
    checkCountRef.current += 1;

    try {
      console.log(`🔍 Checking credits status (attempt ${checkCountRef.current}/${maxChecks})`);
      console.log(`📊 Current credits before refresh: ${credits}`);
      
      // 刷新积分
      await refreshCredits();
      
      // 稍等一下让状态更新
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log(`📊 Current credits after refresh: ${credits}`);
      
      // 检查积分是否已增加 (考虑一次性购买的情况，预期积分大于等于1000)
      const expectedCredits = getExpectedCredits();
      
      if (credits > 0) {
        console.log('💡 Credits found, marking as processed...');
        setCreditsProcessed(true);
        setProcessing(false);
        
        toast.success(`Payment processed! You now have ${credits} credits.`, {
          id: 'payment-processed',
          duration: 5000
        });
        return;
      }
      
      // 如果达到最大检查次数，停止检查并尝试诊断问题
      if (checkCountRef.current >= maxChecks) {
        console.log('⏰ Reached maximum check attempts, trying diagnosis...');
        
        // 尝试使用诊断API检查数据一致性
        try {
          const diagnosisResponse = await fetch(`/api/debug/credits-diagnosis?userId=${user.id}`, {
            method: 'GET',
            headers: {
              'Cache-Control': 'no-cache'
            }
          });
          
          if (diagnosisResponse.ok) {
            const diagnosisResult = await diagnosisResponse.json();
            console.log('🔍 Credits diagnosis result:', diagnosisResult);
            
            if (diagnosisResult.success && diagnosisResult.diagnosis) {
              const diagnosis = diagnosisResult.diagnosis;
              
              // 如果发现数据不一致，尝试修复
              if (!diagnosis.consistency.isConsistent && diagnosis.creditsRecords.totalCredits > 0) {
                console.log('🔧 Attempting to fix credits inconsistency...');
                
                const fixResponse = await fetch('/api/debug/credits-diagnosis', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    userId: user.id,
                    action: 'fix_credits'
                  })
                });
                
                if (fixResponse.ok) {
                  const fixResult = await fixResponse.json();
                  console.log('✅ Credits fix result:', fixResult);
                  
                  if (fixResult.success) {
                    // 修复成功，再次刷新积分
                    await refreshCredits();
                    
                    toast.success(`Credits fixed! You now have ${fixResult.correctedCredits} credits.`, {
                      id: 'credits-fixed',
                      duration: 5000
                    });
                    
                    setCreditsProcessed(true);
                    setProcessing(false);
                    return;
                  }
                }
              } else if (diagnosis.creditsRecords.totalCredits === 0) {
                // 没有积分记录，可能是webhook问题
                toast.error('No credit records found. The payment webhook may not have processed correctly. Please contact support.', {
                  id: 'no-credits-found',
                  duration: 10000
                });
              }
            }
          }
        } catch (diagnosisError) {
          console.error('Error during diagnosis:', diagnosisError);
        }
        
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



  // 定期检查积分状态
  useEffect(() => {
    if (!user?.id || creditsProcessed) {
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
  }, [user?.id, creditsProcessed]);

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
                      
                    </span>
                  ) : credits}
                </p>
                <div className="mt-3 flex gap-3">
                 
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