"use client";

import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import config from "@/config";
import PriceFAQ from "@/components/PriceFAQ";
import ButtonSignin from "@/components/navbar/ButtonSignin";
import FeedbackModal from "@/components/FeedbackModal";

export default function PricingPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [currentSubscriptionType, setCurrentSubscriptionType] = useState<
    string | null
  >(null);
  const [buttonLoading, setButtonLoading] = useState<{
    [key: string]: boolean;
  }>({});
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [hasShownFeedback, setHasShownFeedback] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<{
    type: "link" | "back" | "forward";
    url?: string;
    event?: any;
  } | null>(null);
  const supabase = createClientComponentClient();

  // 简化的不拦截条件 - 主要针对定价页面内的按钮
  const shouldNotIntercept = (element: HTMLElement): boolean => {
    const button = element.closest("button");
    if (button) {
      const buttonText = button.textContent?.toLowerCase() || "";
      const buttonClasses = button.className?.toLowerCase() || "";

      if (
        buttonText.includes("subscribe") ||
        buttonText.includes("get started") ||
        buttonText.includes("requires subscription") ||
        buttonText.includes("subscribe monthly") ||
        buttonText.includes("subscribe yearly") ||
        buttonText.includes("current plan") ||
        buttonText.includes("i know") ||
        buttonText.includes("cancel") ||
        buttonClasses.includes("bg-purple") ||
        buttonClasses.includes("bg-gradient") ||
        button.disabled
      ) {
        return true;
      }
    }

    return false;
  };

  // 检查是否应该显示反馈弹窗（包含localStorage逻辑）
  const checkShouldShowFeedback = async (): Promise<{ shouldShow: boolean; reason: string }> => {
    try {
      const response = await fetch("/api/should-show-feedback");
      const result = await response.json();
      
      // 如果API返回false但原因是未登录，则检查localStorage
      if (!result.shouldShow && result.reason.includes('not logged in')) {
        // 检查localStorage中的24小时限制
        const lastShownKey = 'feedback_last_shown';
        const lastShown = localStorage.getItem(lastShownKey);
        
        if (lastShown) {
          const lastShownTime = new Date(lastShown);
          const now = new Date();
          const hoursDiff = (now.getTime() - lastShownTime.getTime()) / (1000 * 60 * 60);
          
          if (hoursDiff < 24) {
            return {
              shouldShow: false,
              reason: `Last shown ${Math.round(hoursDiff)} hours ago (localStorage), need to wait ${Math.round(24 - hoursDiff)} more hours`
            };
          }
        }
        
        // 未登录用户且24小时已过，可以显示
        return {
          shouldShow: true,
          reason: 'Anonymous user, 24h cooldown passed (localStorage)'
        };
      }
      
      // 登录用户使用API结果
      return result;
    } catch (error) {
      console.error("Error checking feedback eligibility:", error);
      return { shouldShow: false, reason: 'Error checking eligibility' };
    }
  };

  // 记录弹窗已显示（包含localStorage逻辑）
  const recordFeedbackShown = () => {
    // 在localStorage中记录时间戳（用于未登录用户）
    const lastShownKey = 'feedback_last_shown';
    localStorage.setItem(lastShownKey, new Date().toISOString());
    
    // 同时调用API（用于登录用户）
    fetch("/api/should-show-feedback", {
      method: "POST",
    }).catch((error) => {
      console.error("Failed to record feedback shown:", error);
    });
  };

  // 检查并显示反馈弹窗的统一函数
  const checkAndShowFeedback = async (triggerType: string, navigationInfo?: any) => {
    if (!hasInteracted) {
      return false;
    }

    const result = await checkShouldShowFeedback();
    
    if (result.shouldShow) {
      console.log(`${triggerType}: Should show feedback modal`);
      setHasShownFeedback(true);
      setShowFeedbackModal(true);
      if (navigationInfo) {
        setPendingNavigation(navigationInfo);
      }
      return true;
    } else {
      console.log(`${triggerType}: Should not show feedback -`, result.reason);
      return false;
    }
  };

  // 返回上一页的函数
  const handleGoBack = async () => {
    let previousPage = "/"; // 默认返回首页
    
    // 检查document.referrer
    if (document.referrer) {
      try {
        const referrerUrl = new URL(document.referrer);
        const currentUrl = new URL(window.location.href);
        
        // 确保referrer是同一域名，避免跳转到外部网站
        if (referrerUrl.origin === currentUrl.origin) {
          previousPage = document.referrer;
          console.log("Valid referrer found:", previousPage);
        } else {
          console.log("External referrer detected, redirecting to home:", document.referrer);
        }
      } catch (error) {
        console.log("Invalid referrer URL, redirecting to home:", document.referrer);
      }
    } else {
      console.log("No referrer found, redirecting to home");
    }
    
    // 额外检查：如果referrer就是当前页面，也返回首页
    if (previousPage === window.location.href) {
      console.log("Referrer is current page, redirecting to home");
      previousPage = "/";
    }
    
    console.log("Final redirect target:", previousPage);
    
    // 检查是否应该显示反馈弹窗
    if (hasInteracted) {
      const shouldShow = await checkAndShowFeedback("Back navigation");
      if (shouldShow) {
        setPendingNavigation({ type: "link", url: previousPage });
      } else {
        window.location.href = previousPage;
      }
    } else {
      // 用户没有交互，直接返回
      window.location.href = previousPage;
    }
  };

  // 页面离开检测和反馈弹窗逻辑
  useEffect(() => {
    let interactionTimer: NodeJS.Timeout;

    // 添加调试日志
    console.log("useEffect running, state:", {
      hasInteracted,
      hasActiveSubscription,
      hasShownFeedback,
    });

    // 检测用户交互的组合处理
    const handleClick = (e: MouseEvent) => {
      // 首先处理用户交互检测
      if (!hasInteracted) {
        setHasInteracted(true);
        console.log("User interaction detected");
      }

      const target = e.target as HTMLElement;

      // 使用统一的判断函数
      if (shouldNotIntercept(target)) {
        console.log("Element should not be intercepted, allowing normal behavior");
        return;
      }

      // 处理返回按钮的点击已经在handleGoBack中处理
      // 这里主要处理其他可能的导航
    };

    // 其他用户交互检测
    const handleUserInteraction = () => {
      if (!hasInteracted) {
        setHasInteracted(true);
        console.log("User interaction detected");
      }
    };

    // 页面可见性变化检测（用户切换标签页或最小化窗口）
    const handleVisibilityChange = async () => {
      console.log("Visibility change:", {
        hidden: document.hidden,
        hasInteracted,
        hasActiveSubscription,
        hasShownFeedback,
      });
      
      if (document.hidden && hasInteracted) {
        await checkAndShowFeedback("Page visibility change");
      }
    };

    // 页面卸载检测 - 使用多种事件
    const handlePageUnload = async (eventType: string) => {
      console.log(`${eventType} event triggered:`, {
        hasInteracted,
        hasActiveSubscription,
        hasShownFeedback,
      });
      
      if (hasInteracted) {
        await checkAndShowFeedback(eventType);
      }
    };

    const handlePageHide = () => {
      handlePageUnload("pagehide");
    };

    // 监听前进后退按钮
    const handlePopState = async (e: PopStateEvent) => {
      if (hasInteracted) {
        const shouldShow = await checkAndShowFeedback("Browser back/forward", { type: "back", event: e });
        
        if (shouldShow) {
          console.log("Browser back/forward button clicked, preventing navigation");
          // 阻止导航：推回当前页面状态
          const currentUrl = window.location.href;
          window.history.pushState(null, "", currentUrl);
        }
      }
    };

    // 添加事件监听器
    document.addEventListener("click", handleClick);
    document.addEventListener("scroll", handleUserInteraction);
    document.addEventListener("keydown", handleUserInteraction);
    document.addEventListener("mousemove", handleUserInteraction);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", handlePageHide);
    window.addEventListener("popstate", handlePopState); // 监听前进后退

    return () => {
      document.removeEventListener("click", handleClick);
      document.removeEventListener("scroll", handleUserInteraction);
      document.removeEventListener("keydown", handleUserInteraction);
      document.removeEventListener("mousemove", handleUserInteraction);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", handlePageHide);
      window.removeEventListener("popstate", handlePopState);
    };
  }, [
    hasInteracted,
    hasActiveSubscription,
    hasShownFeedback,
  ]);

  // 处理弹窗取消后的导航继续
  const handleFeedbackCancel = () => {
    setShowFeedbackModal(false);
    
    // 用户取消弹窗时，也需要记录时间戳（表示已经显示过弹窗）
    recordFeedbackShown();
    
    // 用户取消弹窗后，执行待跳转的导航
    if (pendingNavigation) {
      console.log('Feedback cancelled, executing pending navigation:', pendingNavigation);
      
      if (pendingNavigation.type === "link" && pendingNavigation.url) {
        window.location.href = pendingNavigation.url;
      } else if (pendingNavigation.type === "back") {
        // 浏览器后退
        window.history.back();
      } else if (pendingNavigation.type === "forward") {
        // 浏览器前进
        window.history.forward();
      }
      
      setPendingNavigation(null);
    }
  };

  const handleFeedbackClose = () => {
    setShowFeedbackModal(false);
    
    // 用户提交反馈后，执行待跳转的导航
    if (pendingNavigation) {
      console.log('Feedback submitted, executing pending navigation:', pendingNavigation);
      
      if (pendingNavigation.type === "link" && pendingNavigation.url) {
        window.location.href = pendingNavigation.url;
      } else if (pendingNavigation.type === "back") {
        // 浏览器后退
        window.history.back();
      } else if (pendingNavigation.type === "forward") {
        // 浏览器前进
        window.history.forward();
      }
      
      setPendingNavigation(null);
    }
  };

  // 当反馈弹窗显示时，记录显示时间戳
  useEffect(() => {
    if (showFeedbackModal) {
      // 记录反馈弹窗已显示
      recordFeedbackShown();
    }
  }, [showFeedbackModal]);

  // 添加一个测试按钮来验证弹窗功能
  const testFeedbackModal = () => {
    console.log("Test button clicked, showing feedback modal");
    setShowFeedbackModal(true);
  };

  // 调试函数：检查用户状态
  const debugUserStatus = async () => {
    console.log("=== user status debug info ===");
    console.log("user id:", user?.id);
    console.log("has active subscription:", hasActiveSubscription);
    console.log("current subscription type:", currentSubscriptionType);
    
    // 检查反馈弹窗显示条件
    const result = await checkShouldShowFeedback();
    console.log("feedback modal check result:", result);
    
    // 调用 API 检查订阅状态
    if (user) {
      try {
        const response = await fetch("/api/user-credits-simple", {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": user.id,
          },
        });
        const data = await response.json();
        console.log("API back user data:", data);
      } catch (error) {
        console.error("get user data failed:", error);
      }
    }
  };



  useEffect(() => {
    const getUser = async () => {
      try {
        const { data } = await supabase.auth.getUser();
        setUser(data.user);

        if (data.user) {
          try {
            // 获取用户profile信息
            const { data: profile } = await supabase
              .from("profiles")
              .select("*")
              .eq("id", data.user.id)
              .single();
            // setUserProfile(profile); // 移除未使用的状态

            // 通过API获取用户积分和订阅信息（使用简化API）
            const response = await fetch("/api/user-credits-simple", {
              method: "GET",
              credentials: "include",
              headers: {
                "Content-Type": "application/json",
                "x-user-id": data.user.id,
              },
            });

            if (response.ok) {
              const creditsData = await response.json();
              if (creditsData.success && creditsData.user) {
                setHasActiveSubscription(
                  creditsData.user.hasActiveSubscription || false
                );
                // 根据订阅信息确定订阅类型
                const subscriptions = creditsData.user.subscriptions || [];
                const activeSubscription = subscriptions.find(
                  (sub: any) => sub.status === "active"
                );
                if (activeSubscription) {
                  // 根据产品ID判断订阅类型
                  if (
                    activeSubscription.product_id ===
                    config.creem.products.monthly.id
                  ) {
                    setCurrentSubscriptionType("monthly");
                  } else if (
                    activeSubscription.product_id ===
                    config.creem.products.yearly.id
                  ) {
                    setCurrentSubscriptionType("yearly");
                  } else {
                    setCurrentSubscriptionType(null);
                  }
                } else {
                  setCurrentSubscriptionType(null);
                }
              } else {
                console.error("API returned error:", creditsData.error);
                setHasActiveSubscription(false);
                setCurrentSubscriptionType(null);
              }
            } else {
              console.error(
                "Failed to fetch user credits and subscriptions:",
                response.status
              );
              // 降级处理，设置默认值
              setHasActiveSubscription(false);
              setCurrentSubscriptionType(null);
            }
          } catch (error) {
            console.error("Error fetching user subscription data:", error);
            setHasActiveSubscription(false);
            setCurrentSubscriptionType(null);
          }
        }
      } catch (error) {
        console.error("Error fetching user:", error);
      } finally {
        setLoading(false);
      }
    };

    getUser();
  }, [supabase]);

  const handlePurchase = async (productId: string) => {
    if (!user) {
      // 如果用户未登录，跳转到登录页面
      window.location.href = "/signin";
      return;
    }

    // 检查是否是按次购买且用户没有有效订阅
    if (
      productId === config.creem.products.oneTime.id &&
      !hasActiveSubscription
    ) {
      alert(
        "You need to subscribe to the monthly or yearly plan first to purchase additional credits."
      );
      return;
    }

    // 检查是否重复购买相同类型的订阅
    if (currentSubscriptionType) {
      if (
        productId === config.creem.products.monthly.id &&
        currentSubscriptionType === "monthly"
      ) {
        alert(
          "You already have a monthly subscription, you cannot purchase the monthly plan again."
        );
        return;
      }
      if (
        productId === config.creem.products.yearly.id &&
        currentSubscriptionType === "yearly"
      ) {
        alert(
          "You already have a yearly subscription, you cannot purchase the yearly plan again."
        );
        return;
      }
    }

    // 设置按钮loading状态
    setButtonLoading((prev) => ({ ...prev, [productId]: true }));

    try {
      const response = await fetch(
        `/api/creem/buy-product?productId=${productId}&userId=${user.id}`,
        {
          method: "GET",
        }
      );
      const result = await response.json();

      if (response.ok && result?.redirectData?.checkout_url) {
        window.location.href = result.redirectData.checkout_url;
      } else if (response.status === 403 && result?.requiresSubscription) {
        alert(
          "You need to subscribe to the monthly or yearly plan first to purchase additional credits. Please select a subscription plan first."
        );
      } else if (response.status === 403 && result?.duplicateSubscription) {
        alert(result.error);
      } else {
        alert(
          result?.error ||
            "Failed to create payment order, please try again later."
        );
      }
    } catch (error) {
      console.error("Purchase error:", error);
      alert("Payment error, please try again later.");
    } finally {
      // 清除loading状态
      setButtonLoading((prev) => ({ ...prev, [productId]: false }));
    }
  };

  // 检查用户是否有有效订阅
  const checkUserSubscription = async () => {
    if (!user) return false;

    try {
      const { data } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "active")
        .gte("end_date", new Date().toISOString())
        .single();

      return !!data;
    } catch (error) {
      return false;
    }
  };

  return (
    <div className="min-h-screenflex flex-col overflow-x-hidden">
      {/* 替换Navbar为简单的头部和返回按钮 */}
      <header className="w-full  bg-gray-50 ">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* 返回按钮 */}
            <button
              onClick={handleGoBack}
              className="flex items-center gap-2 text-gray-700 hover:text-purple-700 transition-colors duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back
            </button>

            {/* 登录按钮 */}
            <div className="flex items-center">
              <ButtonSignin />
            </div>
          </div>
        </div>
      </header>

      <section className="bg-gray-50 overflow-hidden flex-1" id="pricing">
        <div className="px-4 max-w-6xl mx-auto">
          <div className="flex flex-col text-center w-full mb-6">
            <h2 className="font-bold text-4xl lg:text-5xl tracking-tight text-gray-900">
              Pricing
            </h2>
            <p className="font-medium text-lg text-gray-500 mb-1 mt-2">
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
                    <li key={i} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                        <svg
                          className="w-3 h-3 text-white"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <span className="text-gray-700 font-medium">
                        {feature}
                      </span>
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
                      <p className="flex items-center justify-center gap-2 text-sm text-center text-gray-600 font-medium relative">
                        <span className="group relative">
                          Pay once. Credits expire monthly.
                          <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap mb-1">
                            Monthly users: expires with subscription
                            <br />
                            Yearly users: expires end of month
                          </span>
                        </span>
                      </p>
                      <button
                        onClick={() =>
                          handlePurchase(config.creem.products.oneTime.id)
                        }
                        disabled={
                          buttonLoading[config.creem.products.oneTime.id]
                        }
                        className="w-full bg-purple-700 hover:bg-purple-800 disabled:bg-purple-400 text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
                      >
                        {buttonLoading[config.creem.products.oneTime.id] && (
                          <svg
                            className="animate-spin h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                        )}
                        Get Started
                      </button>
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
              <div className="relative flex flex-col h-full gap-5 lg:gap-8 z-10 bg-white p-8 rounded-lg shadow-lg ring-2 ring-purple-500">
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
                    <li key={i} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                        <svg
                          className="w-3 h-3 text-white"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <span className="text-gray-700 font-medium">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="space-y-2">
                  {currentSubscriptionType === "monthly" ? (
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
                        onClick={() =>
                          handlePurchase(config.creem.products.monthly.id)
                        }
                        disabled={
                          buttonLoading[config.creem.products.monthly.id]
                        }
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-purple-400 disabled:to-pink-400 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 disabled:scale-100 shadow-lg flex items-center justify-center gap-2"
                      >
                        {buttonLoading[config.creem.products.monthly.id] && (
                          <svg
                            className="animate-spin h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                        )}
                        Subscribe Monthly
                      </button>
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
                <div className="absolute top-4 right-8 text-white/30 text-xl">
                  ✨
                </div>
                <div className="absolute top-12 right-16 text-white/20 text-sm">
                  ✨
                </div>
                <div className="absolute bottom-12 left-8 text-white/30 text-lg">
                  ✨
                </div>

                {/* 标题区域 */}
                <div className="text-center text-white">
                  <h3 className="text-2xl font-bold mb-2">
                    {config.creem.products.yearly.name}
                  </h3>
                  <p className="text-white/90 text-sm">
                    {config.creem.products.yearly.description}
                  </p>
                </div>

                {/* 价格区域 */}
                <div className="text-center text-white">
                  <div className="flex items-center justify-center gap-3 mb-2">
                    <span className="text-5xl font-extrabold">
                      ${config.creem.products.yearly.price}
                    </span>
                    <div className="flex flex-col">
                      <span className="text-lg font-medium">/month</span>
                      <span className="text-lg line-through text-white/70">
                        ${(config.creem.products.monthly.price * 12).toFixed(0)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-center gap-1 text-white/90">
                    <span className="text-lg">✨</span>
                    <span className="text-sm font-medium">
                      Only $69/year • 1000 credits/month
                    </span>
                  </div>
                </div>

                {/* 白色内容区域 */}
                <div className="bg-white/95 backdrop-blur-sm rounded-xl p-6 space-y-4">
                  <ul className="space-y-3">
                    {config.creem.products.yearly.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                          <svg
                            className="w-3 h-3 text-white"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                        <span className="text-gray-700 font-medium">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <div className="space-y-3 pt-4">
                    {currentSubscriptionType === "yearly" ? (
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
                          onClick={() =>
                            handlePurchase(config.creem.products.yearly.id)
                          }
                          disabled={
                            buttonLoading[config.creem.products.yearly.id]
                          }
                          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-purple-400 disabled:to-pink-400 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 disabled:scale-100 shadow-lg flex items-center justify-center gap-2"
                        >
                          {buttonLoading[config.creem.products.yearly.id] && (
                            <svg
                              className="animate-spin h-4 w-4"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              ></circle>
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              ></path>
                            </svg>
                          )}
                          Subscribe Yearly
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Cancel subscription/refund link */}
          <div className="mt-4 mb-10 text-center space-y-2">
            <button
              onClick={() => setShowCancelModal(true)}
              className="text-gray-500 hover:text-gray-700 text-sm underline transition-colors block mx-auto"
            >
              Cancel subscription
            </button>
            
          </div>

          {/* Cancel/refund modal */}
          {showCancelModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg max-w-md w-full p-6 relative">
                {/* Close button */}
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl"
                >
                  ×
                </button>

                {/* Modal content */}
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">
                    Do you want to cancel your subscription?
                  </h3>

                  <div className="text-gray-700 space-y-3">
                    <p>
                      If you want to cancel your subscription, please contact us
                      by email, and please note:
                    </p>

                    <ul className="list-disc pl-6 space-y-1">
                      <li>Your email address</li>
                      <li>Reason for cancellation</li>
                    </ul>

                    <p>We will contact you as soon as possible.</p>

                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="font-medium text-gray-900">
                        Our contact email:
                      </p>
                      <a
                        href="mailto:hello@hair-style.ai"
                        className="text-purple-600 hover:text-purple-800 font-medium"
                      >
                        hello@hair-style.ai
                      </a>
                    </div>
                  </div>

                  {/* Confirm button */}
                  <div className="flex justify-end pt-4">
                    <button
                      onClick={() => setShowCancelModal(false)}
                      className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                    >
                      I know
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* FAQ Section */}
          <PriceFAQ />

          {/* Feedback Modal */}
          <FeedbackModal
            isOpen={showFeedbackModal}
            onClose={handleFeedbackClose}
            onCancel={handleFeedbackCancel}
          />
        </div>
      </section>
    </div>
  );
}
  