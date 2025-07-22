"use client";

import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import PriceFAQ from "@/components/PriceFAQ";
import ButtonSignin from "@/components/navbar/ButtonSignin";
import FeedbackModal from "@/components/FeedbackModal";
import { loadStripe } from "@stripe/stripe-js";

// Stripe产品配置
const CREDIT_PRODUCTS = [
  {
    id: "prod_SikhNUm5QhhQ7x",
    name: "50 Credits",
    description: "Perfect for trying out",
    price: 5,
    credits: 50,
    features: [
      "5 AI hairstyle generations",
      "All hairstyle options",
      "High-quality results",
      "Credits never expire",
    ],
  },
  {
    id: "prod_SikttkRGqAS13E",
    name: "100 Credits",
    description: "Great for regular use",
    price: 9,
    credits: 100,
    features: [
      "10 AI hairstyle generations",
      "All hairstyle options",
      "High-quality results",
      "Credits never expire",
      "10% savings",
    ],
  },
  {
    id: "prod_Sikk0qfbCozkzi",
    name: "400 Credits",
    description: "Best value for enthusiasts",
    price: 32,
    credits: 400,
    features: [
      "40 AI hairstyle generations",
      "All hairstyle options",
      "High-quality results",
      "Credits never expire",
      "20% savings",
    ],
    popular: true,
  },
  {
    id: "prod_SiknTEhiFiuKsA",
    name: "800 Credits",
    description: "For professionals",
    price: 56,
    credits: 800,
    features: [
      "80 AI hairstyle generations",
      "All hairstyle options",
      "High-quality results",
      "Credits never expire",
      "30% savings",
      "Priority support",
    ],
  },
];

export default function PricingPageStripe() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [buttonLoading, setButtonLoading] = useState<{
    [key: string]: boolean;
  }>({});
  const [userCredits, setUserCredits] = useState(0);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [hasShownFeedback, setHasShownFeedback] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<{
    type: "link" | "back" | "forward";
    url?: string;
    event?: any;
  } | null>(null);
  const supabase = createClientComponentClient();

  // 获取用户信息和积分余额
  useEffect(() => {
    const getUser = async () => {
      try {
        const { data } = await supabase.auth.getUser();
        setUser(data.user);

        if (data.user) {
          // 获取用户积分余额
          try {
            const response = await fetch("/api/user-credits-balance", {
              method: "GET",
              credentials: "include",
              headers: {
                "Content-Type": "application/json",
              },
            });

            if (response.ok) {
              const data = await response.json();
              setUserCredits(data.balance || 0);
            }
          } catch (error) {
            console.error("Error fetching user credits:", error);
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

  // Stripe支付处理
  const handlePurchase = async (productId: string) => {
    if (!user) {
      // If user is not logged in, redirect to login page with return URL
      const currentPathname = window.location.pathname;
      localStorage.setItem('auth_return_url', currentPathname);
      const returnUrl = encodeURIComponent(currentPathname);
      window.location.href = `/signin?returnUrl=${returnUrl}`;
      return;
    }

    // 设置按钮loading状态
    setButtonLoading((prev) => ({ ...prev, [productId]: true }));

    try {
      // 调用创建checkout session的API（使用简化版本）
      const response = await fetch("/api/stripe/create-checkout-session-simple", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ productId }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("Checkout session creation failed:", error);
        throw new Error(error.error || "Failed to create checkout session");
      }

      const { sessionId, publishableKey } = await response.json();

      // 加载Stripe
      const stripe = await loadStripe(publishableKey);
      if (!stripe) {
        throw new Error("Failed to load Stripe");
      }

      // 跳转到Stripe Checkout
      const { error } = await stripe.redirectToCheckout({ sessionId });
      if (error) {
        throw error;
      }
    } catch (error: any) {
      console.error("Purchase error:", error);
      alert(error.message || "Payment error, please try again later.");
    } finally {
      // 清除loading状态
      setButtonLoading((prev) => ({ ...prev, [productId]: false }));
    }
  };

  // 返回上一页的函数
  const handleGoBack = async () => {
    let previousPage = "/";
    
    if (document.referrer) {
      try {
        const referrerUrl = new URL(document.referrer);
        const currentUrl = new URL(window.location.href);
        
        if (referrerUrl.origin === currentUrl.origin) {
          previousPage = document.referrer;
        }
      } catch (error) {
        console.log("Invalid referrer URL");
      }
    }
    
    window.location.href = previousPage;
  };

  // 反馈弹窗相关函数
  const recordFeedbackShown = () => {
    localStorage.setItem('feedback_last_shown', new Date().toISOString());
    
    fetch("/api/should-show-feedback", {
      method: "POST",
    }).catch((error) => {
      console.error("Failed to record feedback shown:", error);
    });
  };

  const handleFeedbackCancel = () => {
    setShowFeedbackModal(false);
    recordFeedbackShown();
    
    if (pendingNavigation) {
      if (pendingNavigation.type === "link" && pendingNavigation.url) {
        window.location.href = pendingNavigation.url;
      } else if (pendingNavigation.type === "back") {
        window.history.back();
      } else if (pendingNavigation.type === "forward") {
        window.history.forward();
      }
      
      setPendingNavigation(null);
    }
  };

  const handleFeedbackClose = () => {
    setShowFeedbackModal(false);
    
    if (pendingNavigation) {
      if (pendingNavigation.type === "link" && pendingNavigation.url) {
        window.location.href = pendingNavigation.url;
      } else if (pendingNavigation.type === "back") {
        window.history.back();
      } else if (pendingNavigation.type === "forward") {
        window.history.forward();
      }
      
      setPendingNavigation(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      {/* Header */}
      <header className="w-full bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Back button */}
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
            <h1 className="font-bold text-4xl mb-3 lg:text-5xl tracking-tight text-gray-900">
              Pricing
            </h1>
            <p className="font-medium text-lg text-gray-500 mt-2 mb-6">
              Purchase credits to generate AI hairstyles. 10 credits = 1 generation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {CREDIT_PRODUCTS.map((product) => (
              <div
                key={product.id}
                className={`relative w-full ${product.popular ? "max-w-lg mx-auto lg:max-w-none" : ""}`}
              >
                {product.popular && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                    <div className="bg-gradient-to-br from-orange-400 via-pink-500 to-purple-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                      Most Popular
                    </div>
                  </div>
                )}
                <div className={`relative flex flex-col h-full gap-5 lg:gap-8 z-10 bg-white p-8 rounded-lg shadow-lg ${product.popular ? "ring-2 ring-purple-500" : ""}`}>
                  <div className="flex justify-between items-center gap-4">
                    <div>
                      <p className="text-lg lg:text-xl font-bold text-gray-900">
                        {product.name}
                      </p>
                      <p className="text-gray-600 mt-2">
                        {product.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <p className="text-5xl tracking-tight font-extrabold text-gray-900">
                      ${product.price}
                    </p>
                    <div className="flex flex-col justify-end mb-[4px]">
                      <p className="text-sm text-gray-500 font-semibold">
                        USD
                      </p>
                    </div>
                  </div>
                  <ul className="space-y-2.5 leading-relaxed text-base flex-1">
                    {product.features.map((feature, i) => (
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
                    <button
                      onClick={() => handlePurchase(product.id)}
                      disabled={buttonLoading[product.id]}
                      className={`w-full ${
                        product.popular
                          ? "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-purple-400 disabled:to-pink-400"
                          : "bg-purple-700 hover:bg-purple-800 disabled:bg-purple-400"
                      } text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 disabled:scale-100 shadow-lg flex items-center justify-center gap-2`}
                    >
                      {buttonLoading[product.id] && (
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
                      Buy Now
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

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