import { SignUp } from "@clerk/nextjs";
import { Metadata } from "next";

// 注册页面SEO配置
export const metadata: Metadata = {
  title: "Sign Up - Hair Style AI",
  description: "Create your Hair Style AI account to access premium features, get unlimited credits, and transform your look with AI-powered hairstyles.",
  alternates: {
    canonical: "https://hair-style.ai/sign-up"
  },
  robots: {
    index: false, // 注册页面通常不需要被索引
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
  openGraph: {
    title: "Sign Up - Hair Style AI",
    description: "Create your Hair Style AI account to access premium features, get unlimited credits, and transform your look with AI-powered hairstyles.",
    url: "https://hair-style.ai/sign-up",
    siteName: "Hairstyle AI",
    locale: "en_US",
    type: "website",
  },
};

export default function Page() {
  return (
    <div className="w-screen h-screen flex items-center justify-center">
      <SignUp />
    </div>
  );
}