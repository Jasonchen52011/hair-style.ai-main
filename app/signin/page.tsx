"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Provider } from "@supabase/supabase-js";
import toast from "react-hot-toast";
import config from "@/config";
import { useSearchParams } from "next/navigation";

// This a login/singup page for Supabase Auth.
// Successfull login redirects to /api/auth/callback where the Code Exchange is processed (see app/api/auth/callback/route.js).
export default function Login() {
  const supabase = createClientComponentClient();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isDisabled, setIsDisabled] = useState<boolean>(false);
  const [returnUrl, setReturnUrl] = useState<string>("");

  useEffect(() => {
    // 获取 returnUrl 参数
    const url = searchParams.get("returnUrl");
    if (url) {
      setReturnUrl(url);
      // 同时存储到 localStorage 作为备用
      localStorage.setItem('auth_return_url', url);
    }
  }, [searchParams]);

  const handleSignup = async (
    e: any,
    options: {
      type: string;
      provider?: Provider;
    }
  ) => {
    e?.preventDefault();

    setIsLoading(true);

    try {
      const { type, provider } = options;
      let redirectURL = (process.env.NEXT_PUBLIC_APP_URL || window.location.origin) + "/api/auth/callback";
      
      // 如果有 returnUrl，将其添加到回调 URL 中
      if (returnUrl) {
        redirectURL += `?returnUrl=${encodeURIComponent(returnUrl)}`;
      }
      
      // 调试日志
      console.log('🔍 Sign in - returnUrl:', returnUrl);
      console.log('🔍 Sign in - redirectURL:', redirectURL);

      if (type === "oauth") {
        await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: redirectURL,
          },
        });
      } else if (type === "magic_link") {
        await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: redirectURL,
          },
        });

        toast.success("Check your emails!");

        setIsDisabled(true);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen" data-theme={config.colors.theme}>
      {/* Desktop back button */}
      <div className="hidden lg:block absolute top-6 left-8 z-20">
        <Link href="/" className="flex items-center px-4 py-2 text-gray-700 hover:text-purple-700 transition-colors duration-200">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-5 h-5 mr-1"
          >
            <path
              fillRule="evenodd"
              d="M15 10a.75.75 0 01-.75.75H7.612l2.158 1.96a.75.75 0 11-1.04 1.08l-3.5-3.25a.75.75 0 010-1.08l3.5-3.25a.75.75 0 111.04 1.08L7.612 9.25h6.638A.75.75 0 0115 10z"
              clipRule="evenodd"
            />
          </svg>
          Home
        </Link>
      </div>
      
      <div className="flex flex-col lg:grid lg:grid-cols-2 min-h-screen bg-gray-900">
        {/* Mobile image - shows on top for mobile only */}
        <div className="flex lg:hidden flex-col p-4">
          {/* Mobile back button */}
          <div className="mb-8">
            <Link href="/" className="flex items-center px-4 py-2 text-white hover:text-purple-300 transition-colors duration-200">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-5 h-5 mr-1"
              >
                <path
                  fillRule="evenodd"
                  d="M15 10a.75.75 0 01-.75.75H7.612l2.158 1.96a.75.75 0 11-1.04 1.08l-3.5-3.25a.75.75 0 010-1.08l3.5-3.25a.75.75 0 111.04 1.08L7.612 9.25h6.638A.75.75 0 0115 10z"
                  clipRule="evenodd"
                />
              </svg>
              Home
            </Link>
          </div>
          
          {/* Mobile image */}
          <div className="flex items-center justify-center">
            <img
              src="/images/red-hair-filter-hero3.webp"
              alt="Hair style transformation"
              className="max-w-xs max-h-[40vh] object-contain rounded-lg shadow-lg"
            />
          </div>
        </div>
        
        {/* Desktop image - shows on left for desktop only */}
        <div className="hidden lg:flex relative items-center justify-center p-16 bg-white">
          <img
            src="/images/red-hair-filter-hero3.webp"
            alt="Hair style transformation"
            className="max-w-xl max-h-[90vh] object-contain rounded-lg shadow-lg"
          />
        </div>
        
        {/* Sign-in form */}
        <div className="flex flex-col justify-center items-center p-12">
          <div className="w-full max-w-md space-y-8">
            <div className="text-center">
              <h1 className="text-2xl md:text-4xl text-white font-extrabold tracking-tight mb-2">
                Sign-in to {config.appName}
              </h1>
            </div>

            <div className="space-y-6">
              <button
                className="btn btn-block"
                onClick={(e) =>
                  handleSignup(e, { type: "oauth", provider: "google" })
                }
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="loading loading-spinner loading-xs"></span>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-6 h-6"
                    viewBox="0 0 48 48"
                  >
                    <path
                      fill="#FFC107"
                      d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
                    />
                    <path
                      fill="#FF3D00"
                      d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
                    />
                    <path
                      fill="#4CAF50"
                      d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
                    />
                    <path
                      fill="#1976D2"
                      d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
                    />
                  </svg>
                )}
                Sign-up with Google
              </button>

              <div className="divider text-xs text-white/50 font-medium">
                OR
              </div>

              <form
                className="form-control w-full space-y-4"
                onSubmit={(e) => handleSignup(e, { type: "magic_link" })}
              >
                <input
                  required
                  type="email"
                  value={email}
                  autoComplete="email"
                  placeholder="hello@hair-style.ai"
                  className="input input-bordered w-full placeholder:opacity-60"
                  onChange={(e) => setEmail(e.target.value)}
                />

                <button
                  className="btn btn-primary btn-block"
                  disabled={isLoading || isDisabled}
                  type="submit"
                >
                  {isLoading && (
                    <span className="loading loading-spinner loading-xs"></span>
                  )}
                  Send
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
