
import { ConfigProps } from "./types/config";

const config = {
  // REQUIRED
  appName: "Hairstyle AI",
  // REQUIRED: a short description of your app for SEO tags (can be overwritten)
  appDescription:
    "Test hairstyles on my face free with AI hairstyle changer! Choose from over 60+ hairstyles for men and women, including bob, buzz cut, slicked back, braids, and more.",
  // REQUIRED (no https://, not trialing slash at the end, just the naked domain)
  domainName: "hair-style.ai",
  crisp: {
    // Crisp website ID. IF YOU DON'T USE CRISP: just remove this => Then add a support email in this config file (mailgun.supportEmail) otherwise customer support won't work.
    id: "",
    // Hide Crisp by default, except on route "/". Crisp is toggled with <ButtonSupport/>. If you want to show Crisp on every routes, just remove this below
    onlyShowOnRoutes: ["/"],
  },
  // Creem 支付配置
  creem: {
    // Creem API Key (从环境变量获取)
    apiKey: process.env.CREEM_API_KEY,
    // 产品配置
    products: {
      // 按次订阅
      oneTime: {
        id: "prod_7kbzeBzBsEnWbRA0iTh7wf",
        name: "One Time Purchase",
        price: 6.9,
        credits: 500,
        description: "Support your unlimited creative journey",
        features: [
          "500 Credits/50 High-Quality Images",
          "All AI Hairstyle Tools", 
          "Download All Results"
        ]
      },
      // 月度订阅
      monthly: {
        id: "prod_6OoADdBXIm16LRR6TN6sFw",
        name: "Pro Monthly",
        price: 7.9,
        credits: 500,
        description: "Perfect starter plan for trying hairstyles",
        features: [
          "500 Credits/50 High-Quality Images per month",
          "All AI Hairstyle Tools",
          "Download All Results",
          "Priority Support"
          
        ]
      },
      // 年度订阅
      yearly: {
        id: "prod_6N9SkBhig3ofomadscbGr7",
        name: "Pro Yearly",
        price: 5.8,
        credits: 1000,
        description: "Best value - 1000 credits monthly",
        features: [
          "1000 Credits/100 High-Quality Images per month",
          "All AI Hairstyle Tools",
          "Download All Results", 
          "Priority Support",
          "Advanced Features"
        ]
      }
    }
  },
  stripe: {
    // Create multiple plans in your Stripe dashboard, then add them here. You can add as many plans as you want, just make sure to add the priceId
    plans: [
      {
        // REQUIRED — we use this to find the plan in the webhook (for instance if you want to update the user's credits based on the plan)
        priceId:
          process.env.NODE_ENV === "development"
            ? "price_1Niyy5AxyNprDp7iZIqEyD2h"
            : "price_456",
        //  REQUIRED - Name of the plan, displayed on the pricing page
        name: "Starter",
        // A friendly description of the plan, displayed on the pricing page. Tip: explain why this plan and not others
        description: "Perfect for small projects",
        // The price you want to display, the one user will be charged on Stripe.
        price: 99,
        // If you have an anchor price (i.e. $29) that you want to display crossed out, put it here. Otherwise, leave it empty
        priceAnchor: 149,
        features: [
          {
            name: "60+ hairstyles",
          },
          { name: "AI hairstyle changer" },
          { name: "No credit card required" },
          { name: "No sign up required" },
        ],
      },
      {
        priceId:
          process.env.NODE_ENV === "development"
            ? "price_1O5KtcAxyNprDp7iftKnrrpw"
            : "price_456",
        // This plan will look different on the pricing page, it will be highlighted. You can only have one plan with isFeatured: true
        isFeatured: true,
        name: "Advanced",
        description: "You need more power",
        price: 149,
        priceAnchor: 299,
        features: [
          {
            name: "NextJS boilerplate",
          },
          { name: "User oauth" },
          { name: "Database" },
          { name: "Emails" },
          { name: "1 year of updates" },
          { name: "24/7 support" },
        ],
      },
    ],
  },
  aws: {
    // If you use AWS S3/Cloudfront, put values in here
    bucket: "bucket-name",
    bucketUrl: `https://bucket-name.s3.amazonaws.com/`,
    cdn: "https://cdn-id.cloudfront.net/",
  },
  mailgun: {
    // subdomain to use when sending emails, if you don't have a subdomain, just remove it. Highly recommended to have one (i.e. mg.yourdomain.com or mail.yourdomain.com)
    subdomain: "mg",
    // REQUIRED — Email 'From' field to be used when sending magic login links
    fromNoReply: `Hairstyle AI <hello@hair-style.ai>`,
    // REQUIRED — Email 'From' field to be used when sending other emails, like abandoned carts, updates etc..
    fromAdmin: `Jason at Hairstyle AI <hello@hair-style.ai>`,
    // Email shown to customer if need support. Leave empty if not needed => if empty, set up Crisp above, otherwise you won't be able to offer customer support."
    supportEmail: "hello@hair-style.ai",
    // When someone replies to supportEmail sent by the app, forward it to the email below (otherwise it's lost). If you set supportEmail to empty, this will be ignored.
    forwardRepliesTo: "hello@hair-style.ai",
  },
  colors: {
    // REQUIRED — The DaisyUI theme to use (added to the main layout.js). Leave blank for default (light & dark mode). If you any other theme than light/dark, you need to add it in config.tailwind.js in daisyui.themes.
    theme: "light",
    // REQUIRED — This color will be reflected on the whole app outside of the document (loading bar, Chrome tabs, etc..). By default it takes the primary color from your DaisyUI theme (make sure to update your the theme name after "data-theme=")
    // OR you can just do this to use a custom color: main: "#f37055". HEX only.
    // main: themes["light"]["primary"],
  },
  auth: {
    // REQUIRED — the path to log in users. It's use to protect private routes (like /dashboard). It's used in apiClient (/libs/api.js) upon 401 errors from our API
    loginUrl: "/signin",
    // REQUIRED — the path you want to redirect users after successfull login (i.e. /dashboard, /private). This is normally a private page for users to manage their accounts. It's used in apiClient (/libs/api.js) upon 401 errors from our API & in ButtonSignin.js
    // callbackUrl: "/dashboard",
    callbackUrl: "/",
  },
} as ConfigProps;

// 工具函数：根据产品ID获取产品类型
export function getProductType(productId: string): string | null {
  const products = config.creem.products;
  if (products.oneTime.id === productId) return 'onetime';
  if (products.monthly.id === productId) return 'monthly';
  if (products.yearly.id === productId) return 'yearly';
  return null;
}

// 工具函数：根据产品ID获取积分数
export function getProductCredits(productId: string): number | null {
  const products = config.creem.products;
  if (products.oneTime.id === productId) return products.oneTime.credits;
  if (products.monthly.id === productId) return products.monthly.credits;
  if (products.yearly.id === productId) return products.yearly.credits;
  return null;
}

// 工具函数：获取产品ID到类型的映射
export function getProductPlanMap(): Record<string, string> {
  const products = config.creem.products;
  return {
    [products.oneTime.id]: 'onetime',
    [products.monthly.id]: 'monthly',
    [products.yearly.id]: 'yearly',
  };
}

// 工具函数：获取产品ID到积分的映射
export function getProductCreditsMap(): Record<string, number> {
  const products = config.creem.products;
  return {
    [products.oneTime.id]: products.oneTime.credits,
    [products.monthly.id]: products.monthly.credits,
    [products.yearly.id]: products.yearly.credits,
  };
}

// 工具函数：根据产品类型获取产品ID
export function getProductIdByType(type: 'onetime' | 'monthly' | 'yearly'): string | null {
  const products = config.creem.products;
  switch (type) {
    case 'onetime': return products.oneTime.id;
    case 'monthly': return products.monthly.id;
    case 'yearly': return products.yearly.id;
    default: return null;
  }
}

export default config;
