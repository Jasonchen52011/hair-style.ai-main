"use client";

import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import config from "@/config";

export default function PricingPage() {
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [currentSubscriptionType, setCurrentSubscriptionType] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [buttonLoading, setButtonLoading] = useState<{[key: string]: boolean}>({});
  const supabase = createClientComponentClient();

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data } = await supabase.auth.getUser();
        setUser(data.user);
        
        if (data.user) {
          // 获取用户profile信息
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();
          setUserProfile(profile);

          // 检查用户是否有有效的订阅
          const { data: activeSubscriptions } = await supabase
            .from('subscriptions')
            .select('plan_name, status, end_date')
            .eq('user_id', data.user.id)
            .eq('status', 'active')
            .gte('end_date', new Date().toISOString())
            .in('plan_name', ['monthly', 'yearly']);
          
          const hasSubscription = Boolean(activeSubscriptions && activeSubscriptions.length > 0);
          setHasActiveSubscription(hasSubscription);
          
          // 设置当前订阅类型
          if (hasSubscription && activeSubscriptions && activeSubscriptions.length > 0) {
            setCurrentSubscriptionType(activeSubscriptions[0].plan_name);
          } else {
            setCurrentSubscriptionType(null);
          }
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setLoading(false);
      }
    };

    getUser();
  }, [supabase]);

  const handlePurchase = async (productId: string) => {
    if (!user) {
      // 如果用户未登录，跳转到登录页面
      window.location.href = '/signin';
      return;
    }

    // 检查是否是按次购买且用户没有有效订阅
    if (productId === config.creem.products.oneTime.id && !hasActiveSubscription) {
      alert('您需要先订阅月度或年度套餐才能购买额外积分。请先选择订阅套餐。');
      return;
    }

    // 检查是否重复购买相同类型的订阅
    if (currentSubscriptionType) {
      if (productId === config.creem.products.monthly.id && currentSubscriptionType === 'monthly') {
        alert('You already have a monthly subscription, you cannot purchase the monthly plan again.');
        return;
      }
      if (productId === config.creem.products.yearly.id && currentSubscriptionType === 'yearly') {
        alert('You already have a yearly subscription, you cannot purchase the yearly plan again.');
        return;
      }
    }

    // 设置按钮loading状态
    setButtonLoading(prev => ({ ...prev, [productId]: true }));

    try {
      const response = await fetch(`/api/creem/buy-product?productId=${productId}&userId=${user.id}`, {
        method: "GET"
      });
      const result = await response.json();
      
      if (response.ok && result?.redirectData?.checkout_url) {
        window.location.href = result.redirectData.checkout_url;
      } else if (response.status === 403 && result?.requiresSubscription) {
        alert('You need to subscribe to the monthly or yearly plan first to purchase additional credits. Please select a subscription plan first.');
      } else if (response.status === 403 && result?.duplicateSubscription) {
        alert(result.error);
      } else {
        alert(result?.error || 'Failed to create payment order, please try again later.');
      }
    } catch (error) {
      console.error('Purchase error:', error);
      alert('Payment error, please try again later.');
    } finally {
      // 清除loading状态
      setButtonLoading(prev => ({ ...prev, [productId]: false }));
    }
  };

  // 检查用户是否有有效订阅
  const checkUserSubscription = async () => {
    if (!user) return false;
    
    try {
      const { data } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .gte('end_date', new Date().toISOString())
        .single();
      
      return !!data;
    } catch (error) {
      return false;
    }
  };

  

  return (
    <section className="bg-gray-50 overflow-hidden min-h-screen" id="pricing">
      <div className="py-10 px-8 max-w-6xl mx-auto">
        <div className="flex flex-col text-center w-full mb-10">
          <h2 className="font-bold text-3xl lg:text-6xl tracking-tight text-gray-900">
            Pricing
          </h2>
          <p className="font-medium text-xl text-gray-500 mb-4 mt-6">
            Discover your hair inspiration with Hairstyle AI Pro.
          </p>
        </div>

        <div className="relative flex justify-center flex-col lg:flex-row items-center lg:items-stretch gap-8">
          {/* 按次付费 */}
          <div className="relative w-full max-w-lg">
            <div className="relative flex flex-col h-full gap-5 lg:gap-8 z-10 bg-white p-8 rounded-lg shadow-lg">
              <div className="flex justify-between items-center gap-4">
                <div>
                  <p className="text-lg lg:text-xl font-bold text-gray-900">
                    {config.creem.products.oneTime.name}
                  </p>
                  <p className="text-gray-600 mt-2">
                    {config.creem.products.oneTime.description}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <p className="text-5xl tracking-tight font-extrabold text-gray-900">
                  ${config.creem.products.oneTime.price}
                </p>
                <div className="flex flex-col justify-end mb-[4px]">
                  <p className="text-xs text-gray-500 uppercase font-semibold">
                    USD
                  </p>
                </div>
              </div>
              <ul className="space-y-2.5 leading-relaxed text-base flex-1">
                {config.creem.products.oneTime.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="w-[18px] h-[18px] text-purple-700 shrink-0"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
              <div className="space-y-2">
                {user && !hasActiveSubscription ? (
                  <>
                    <button 
                      disabled
                      className="w-full bg-purple-700 text-white font-medium py-3 px-6 rounded-lg cursor-not-allowed"
                    >
                      Requires Subscription
                    </button>
                    <p className="flex items-center justify-center gap-2 text-sm text-center text-orange-600 font-medium relative">
                      ⚠️ Subscribe to monthly or yearly plan first
                    </p>
                  </>
                ) : (
                  <>
                    <button 
                      onClick={() => handlePurchase(config.creem.products.oneTime.id)}
                      disabled={buttonLoading[config.creem.products.oneTime.id]}
                      className="w-full bg-purple-700 hover:bg-purple-800 disabled:bg-purple-400 text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      {buttonLoading[config.creem.products.oneTime.id] && (
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      )}
                      Get Started
                    </button>
                    <p className="flex items-center justify-center gap-2 text-sm text-center text-gray-600 font-medium relative">
                      <span className="group relative">
                        Pay once. Credits expire monthly.
                        <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap mb-1">
                          Monthly users: expires with subscription<br/>
                          Yearly users: expires end of month
                        </span>
                      </span>
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* 月度订阅 */}
          <div className="relative w-full max-w-lg">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                <div className="bg-gradient-to-br from-orange-400 via-pink-500 to-purple-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                  Most Popular
                </div>
              </div>
              <div className="relative flex flex-col h-full gap-5 lg:gap-8 z-10 bg-white p-8 rounded-lg shadow-lg ring-2 ring-purple-600">
                <div className="flex justify-between items-center gap-4">
                  <div>
                    <p className="text-lg lg:text-xl font-bold text-gray-900">
                      {config.creem.products.monthly.name}
                    </p>
                    <p className="text-gray-600 mt-2">
                      {config.creem.products.monthly.description}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <p className="text-5xl tracking-tight font-extrabold text-gray-900">
                    ${config.creem.products.monthly.price}
                  </p>
                  <div className="flex flex-col justify-end mb-[4px]">
                    <p className="text-sm text-gray-500 font-semibold">
                      USD/month
                    </p>
                  </div>
                </div>
                <ul className="space-y-2.5 leading-relaxed text-base flex-1">
                  {config.creem.products.monthly.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="w-[18px] h-[18px] text-purple-700 shrink-0"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                <div className="space-y-2">
                  {currentSubscriptionType === 'monthly' ? (
                    <>
                      <button 
                        disabled
                        className="w-full bg-purple-900 text-white font-medium py-3 px-6 rounded-lg cursor-not-allowed"
                      >
                        Current Plan
                      </button>
                      <p className="flex items-center justify-center gap-2 text-sm text-center text-orange-600 font-medium relative">
                        ✓ You are already subscribed this plan
                      </p>
                    </>
                  ) : (
                    <>
                      <button 
                        onClick={() => handlePurchase(config.creem.products.monthly.id)}
                        disabled={buttonLoading[config.creem.products.monthly.id]}
                        className="w-full bg-purple-700 hover:bg-purple-800 disabled:bg-purple-400 text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
                      >
                        {buttonLoading[config.creem.products.monthly.id] && (
                          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        )}
                        Subscribe Monthly
                      </button>
                      <p className="flex items-center justify-center gap-2 text-sm text-center text-gray-600 font-medium relative">
                        Cancel anytime
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>

          {/* 年度订阅 */}
          <div className="relative w-full max-w-lg">
            {/* 38% OFF 徽章 */}
            <div className="absolute -top-4 -right-4 z-20">
              <div className="relative">
                <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg transform rotate-12">
                  38% OFF
                </div>
              </div>
            </div>
            
            {/* 主卡片 */}
            <div className="relative flex flex-col h-full gap-6 z-10 bg-gradient-to-br from-orange-400 via-pink-500 to-purple-600 p-4 rounded-2xl shadow-xl overflow-hidden">
              {/* 装饰星星 */}
              <div className="absolute top-4 right-8 text-white/30 text-xl">✨</div>
              <div className="absolute top-12 right-16 text-white/20 text-sm">✨</div>
              <div className="absolute bottom-12 left-8 text-white/30 text-lg">✨</div>
              
              {/* 标题区域 */}
              <div className="text-center text-white">
                <h3 className="text-2xl font-bold mb-2">{config.creem.products.yearly.name}</h3>
                <p className="text-white/90 text-sm">
                  {config.creem.products.yearly.description}
                </p>
              </div>
              
              {/* 价格区域 */}
              <div className="text-center text-white">
                <div className="flex items-center justify-center gap-3 mb-2">
                  <span className="text-5xl font-extrabold">${config.creem.products.yearly.price}</span>
                  <div className="flex flex-col">
                    <span className="text-lg font-medium">/month</span>
                    <span className="text-lg line-through text-white/70">${(config.creem.products.monthly.price * 12).toFixed(0)}</span>
                  </div>
                </div>
                <div className="flex items-center justify-center gap-1 text-white/90">
                  <span className="text-lg">✨</span>
                  <span className="text-sm font-medium">Only $69/year • 1000 credits/month</span>
                </div>
              </div>
              
              {/* 白色内容区域 */}
              <div className="bg-white/95 backdrop-blur-sm rounded-xl p-6 space-y-4">
                <ul className="space-y-3">
                  {config.creem.products.yearly.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="text-gray-700 font-medium">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <div className="space-y-3 pt-4">
                  {currentSubscriptionType === 'yearly' ? (
                    <>
                      <button 
                        disabled
                        className="w-full bg-gray-400 text-white font-bold py-4 px-6 rounded-xl cursor-not-allowed"
                      >
                        Current Plan
                      </button>
                      <p className="text-center text-sm text-green-600 font-medium">
                        ✓ You are already subscribed to yearly plan
                      </p>
                    </>
                  ) : (
                    <>
                      <button 
                        onClick={() => handlePurchase(config.creem.products.yearly.id)}
                        disabled={buttonLoading[config.creem.products.yearly.id]}
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-purple-400 disabled:to-pink-400 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 disabled:scale-100 shadow-lg flex items-center justify-center gap-2"
                      >
                        {buttonLoading[config.creem.products.yearly.id] && (
                          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        )}
                        Subscribe Yearly
                      </button>
                      <p className="text-center text-sm text-gray-500 font-medium">
                        Cancel anytime
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 用户状态提示 */}
        {!user && (
          <div className="mt-12 text-center">
            <p className="text-gray-600 mb-4">
              Need to sign in first? 
              <a href="/signin" className="text-purple-700 hover:text-purple-800 font-medium ml-1">
                Sign in here
              </a>
            </p>
          </div>
        )}
      </div>
    </section>
  );
}