import { SignIn } from "@clerk/nextjs";
import { Metadata } from "next";

// 登录页面SEO配置
export const metadata: Metadata = {
  title: "Sign In - Hair Style AI",
  description: "Sign in to your Hair Style AI account to access premium features, unlimited credits, and save your favorite hairstyles.",
  alternates: {
    canonical: "https://hair-style.ai/sign-in"
  },
  robots: {
    index: false, // 登录页面通常不需要被索引
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
  openGraph: {
    title: "Sign In - Hair Style AI",
    description: "Sign in to your Hair Style AI account to access premium features, unlimited credits, and save your favorite hairstyles.",
    url: "https://hair-style.ai/sign-in",
    siteName: "Hairstyle AI",
    locale: "en_US",
    type: "website",
  },
};

export default function Page() {
  return (
    <div className="w-screen h-screen flex items-center justify-center">
      <SignIn />
    </div>
  );
}