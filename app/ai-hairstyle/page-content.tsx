"use client";

import { useState, useEffect, Suspense, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import toast, { Toaster } from "react-hot-toast";
import Image from "next/image";
import Link from "next/link";
import { hairColors, femaleStyles, maleStyles } from "@/libs/hairstyles";
import type { HairStyle } from "@/libs/hairstyles";
import ButtonSignin from "@/components/navbar/ButtonSignin";
import { useCredits } from "@/contexts/CreditsContext";
import { getAnalytics, logActivity, classifyFailureReason } from "@/libs/analytics";

// create a wrapper component to handle search parameters
function SearchParamsWrapper({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  return <>{children}</>;
}

export default function SelectStylePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SearchParamsWrapper>
        <SelectStylePageContent />
      </SearchParamsWrapper>
    </Suspense>
  );
}

// move the original component content here
function SelectStylePageContent() {
  const supabase = createClientComponentClient();
  const { credits, hasActiveSubscription, user, refreshCredits, updateCredits } = useCredits();
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>();
  const [resultImageUrl, setResultImageUrl] = useState<string>();
  const [defaultStyle, setDefaultStyle] = useState<string>("PixieCut");
  const searchParams = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const analytics = getAnalytics();

  // new state - merged from SelectStyle component
  const [selectedGender, setSelectedGender] = useState<"Female" | "Male">(
    "Female"
  );
  const [selectedStyle, setSelectedStyle] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("brown");
  const [isLoading, setIsLoading] = useState(false);
  const [styleImageHeight, setStyleImageHeight] = useState<string>("h-32");

  // 添加ref用于滚动到选中的发型
  const selectedStyleRef = useRef<HTMLButtonElement>(null);

  // 未登录用户使用次数限制
  const [guestUsageCount, setGuestUsageCount] = useState<number>(3);

  // 自定义确认对话框状态
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmDialogConfig, setConfirmDialogConfig] = useState({
    title: "",
    message: "",
    confirmText: "",
    cancelText: "",
    onConfirm: () => {},
    onCancel: () => {},
  });

  // 添加 guideline 弹窗状态
  const [showGuidelineModal, setShowGuidelineModal] = useState(false);
  const [alwaysShowGuidelines, setAlwaysShowGuidelines] = useState(false); // 默认为false，避免干扰用户

  // 初始化未登录用户使用次数
  useEffect(() => {
    if (!user) {
      const storedCount = localStorage.getItem("guest_hairstyle_usage_count");
      if (storedCount) {
        const count = parseInt(storedCount);
        setGuestUsageCount(Math.max(0, count));
      } else {
        setGuestUsageCount(3);
        localStorage.setItem("guest_hairstyle_usage_count", "3");
      }
    }
  }, [user]);

  // 初始化guideline显示偏好
  useEffect(() => {
    const alwaysShow = localStorage.getItem('guideline_always_show');
    // 默认为true，只有明确设置为false时才为false
    setAlwaysShowGuidelines(alwaysShow !== 'false');
  }, []);

  // 记录页面访问
  useEffect(() => {
    logActivity('page_view', 'ai_hairstyle_page', {
      has_preset_image: !!searchParams.get("image"),
      has_preset_style: !!searchParams.get("style"),
      has_preset_color: !!searchParams.get("color"),
      is_logged_in: !!user,
      credits: credits,
      guest_usage_remaining: !user ? guestUsageCount : null
    });
  }, [user, credits, guestUsageCount]);

  // get image URL, preset hairstyle, and preset color from URL parameters
  useEffect(() => {
    const imageUrl = searchParams.get("image");
    const presetStyle = searchParams.get("style");
    const presetColor = searchParams.get("color");

    if (imageUrl) {
      setUploadedImageUrl(decodeURIComponent(imageUrl));
    }

    // handle preset color
    if (presetColor) {
      const decodedColor = decodeURIComponent(presetColor);
      const colorExists = hairColors.find((color) => color.id === decodedColor);
      if (colorExists) {
        setSelectedColor(decodedColor);
      }
    }

    // handle preset hairstyle
    if (presetStyle) {
      const decodedStyle = decodeURIComponent(presetStyle);

      // check if it is a male hairstyle
      const maleStyle = maleStyles.find(
        (style) =>
          style.style.toLowerCase() === decodedStyle.toLowerCase() ||
          style.description.toLowerCase() === decodedStyle.toLowerCase()
      );

      if (maleStyle) {
        setSelectedGender("Male");
        setSelectedStyle(maleStyle.style);
        setDefaultStyle(maleStyle.style);
        return;
      }

      // check if it is a female hairstyle
      const femaleStyle = femaleStyles.find(
        (style) =>
          style.style.toLowerCase() === decodedStyle.toLowerCase() ||
          style.description.toLowerCase() === decodedStyle.toLowerCase()
      );

      if (femaleStyle) {
        setSelectedGender("Female");
        setSelectedStyle(femaleStyle.style);
        setDefaultStyle(femaleStyle.style);
      }
    }
  }, [searchParams]);

  // initialize default style (fallback when no URL parameters)
  useEffect(() => {
    if (
      !searchParams.get("style") &&
      defaultStyle &&
      !selectedStyle &&
      selectedGender === "Female"
    ) {
      const femaleStyle = femaleStyles.find(
        (style) => style.style === defaultStyle
      );
      if (femaleStyle) {
        setSelectedGender("Female");
        setSelectedStyle(defaultStyle);
      } else {
        const maleStyle = maleStyles.find(
          (style) => style.style === defaultStyle
        );
        if (maleStyle) {
          setSelectedGender("Male");
          setSelectedStyle(defaultStyle);
        }
      }
    }
  }, [defaultStyle, searchParams]);

  const currentStyles = selectedGender === "Female" ? femaleStyles : maleStyles;

  const handleStyleClick = (style: string) => {
    // if click the selected hairstyle, cancel selection
    if (selectedStyle === style) {
      setSelectedStyle("");
      logActivity('button_click', 'hairstyle_deselected', {
        style: style,
        gender: selectedGender
      });
    } else {
      setSelectedStyle(style);
      logActivity('button_click', 'hairstyle_selected', {
        style: style,
        gender: selectedGender,
        previous_style: selectedStyle || null
      });
    }
  };

  // 添加自动滚动到选中发型的功能
  useEffect(() => {
    if (selectedStyle && selectedStyleRef.current) {
      // 延迟执行滚动，确保DOM已更新
      setTimeout(() => {
        selectedStyleRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
          inline: "center",
        });
      }, 100);
    }
  }, [selectedStyle, selectedGender]);

  // merge the polling function from SelectStyle component - 优化为30秒最大等待时间
  const pollTaskStatus = async (taskId: string, maxAttempts = 10, taskStartTime?: number) => { // 10次轮询，最多30秒
    console.log(`Starting task polling, taskId: ${taskId}`);
    const startTime = Date.now();
    const processingStartTime = taskStartTime || startTime; // 用于计算总处理时间
    const maxWaitTime = 30000; // 30秒最大等待时间
    let error422Count = 0; // 添加422错误计数器

    // 启动按秒倒计时
    const countdownInterval = setInterval(() => {
      const elapsedTime = Date.now() - startTime;
      const remaining = Math.max(0, Math.ceil((maxWaitTime - elapsedTime) / 1000));
      
      if (remaining > 0) {
        toast.loading(`Processing your image... ${remaining}s remaining`, {
          id: "processing-status",
          duration: Infinity, // 防止自动消失
        });
      } else {
        clearInterval(countdownInterval);
      }
    }, 1000); // 每秒更新一次

    for (let i = 0; i < maxAttempts; i++) {
      try {
        console.log(`Polling attempt ${i + 1} of ${maxAttempts}`);

        const pollStartTime = Date.now();
        const response = await analytics?.trackedFetch(
          `/api/submit?taskId=${taskId}`,
          { method: 'GET', credentials: 'include' },
          { 
            actionName: 'poll_hairstyle_status',
            taskId: taskId,
            additionalData: { attempt: i + 1, maxAttempts }
          }
        ) || await fetch(`/api/submit?taskId=${taskId}`, { credentials: 'include' });

        if (!response.ok) {
          console.log(`Polling request failed, status: ${response.status}`);
          // Handle different HTTP error types
          if (response.status === 404) {
            throw new Error(
              "Task not found. Please try uploading a new image."
            );
          } else if (response.status === 408) {
            // Handle timeout - check if we should stop polling
            try {
              const errorData = await response.json();
              if (errorData.shouldStopPolling) {
                console.log(
                  "Received shouldStopPolling flag, stopping polling"
                );
                throw new Error(
                  errorData.error ||
                    "Sorry, we couldn’t generate the hairstyle after several tries. Please upload a clearer front-facing photo."
                );
              }
            } catch (parseError) {
              console.log("Failed to parse 408 response, treating as timeout");
              throw new Error(
                "Sorry, we couldn’t generate the hairstyle after several tries. Please upload a clearer front-facing photo. Try not to use full and half body shots to make it easier for us to match your hairstyle!"
              );
            }
          } else if (response.status === 422) {
            // 处理422错误
            let errorData;
            try {
              errorData = await response.json();
            } catch (parseError) {
              errorData = null;
            }
            
            error422Count++;
            console.log(`Received 422 error, count: ${error422Count}/2, shouldStopPolling: ${errorData?.shouldStopPolling}`);
            
            if (errorData?.shouldStopPolling || error422Count >= 2) {
              // 收到停止信号或2次422错误，立即停止并报错
              clearInterval(countdownInterval);
              toast.dismiss("processing-status"); // 立即关闭processing toast
              const error = new Error(
                errorData?.error || "Photo not suitable for hairstyle changes.\nPlease check our guidelines."
              );
              (error as any).is422Error = true;
              throw error;
            }
            
            // 第一次422错误，继续重试
            await new Promise((resolve) => setTimeout(resolve, 2000));
            continue;
          } else if (response.status >= 500) {
            console.log("Server error, retrying...");
            await new Promise((resolve) => setTimeout(resolve, 5000));
            continue;
          } else if (response.status === 429) {
            throw new Error(
              "Too many requests. Please wait a moment and try again."
            );
          } else {
            console.error(
              `HTTP error: ${response.status} ${response.statusText}`
            );
            await new Promise((resolve) => setTimeout(resolve, 5000));
            continue;
          }
        }

        const data = await response.json();
        console.log(`Polling response:`, {
          task_status: data.task_status,
          hasImages: !!data.data?.images,
          error_detail: data.error_detail,
          fromCache: data.fromCache,
          shouldStopPolling: data.shouldStopPolling
        });

        // 如果是从缓存返回的已完成结果，立即返回
        if (data.fromCache && data.task_status === 2) {
          console.log('Received completed result from cache');
          clearInterval(countdownInterval);
          return data;
        }

        // 检查是否应该停止轮询（服务器指导）
        if (data.shouldStopPolling) {
          clearInterval(countdownInterval);
          if (data.task_status === 2) {
            return data; // 任务成功完成
          } else {
            throw new Error(data.error || 'Task failed or timed out');
          }
        }

        // Check task completion status
        if (data.task_status === 2) {
          if (data.data?.images) {
            // Validate image data integrity
            const imageKeys = Object.keys(data.data.images);
            if (imageKeys.length > 0) {
              const firstStyleImages = data.data.images[imageKeys[0]];
              if (
                Array.isArray(firstStyleImages) &&
                firstStyleImages.length > 0 &&
                firstStyleImages[0]
              ) {
                console.log("Task completed successfully, found valid images");
                clearInterval(countdownInterval);
                return data;
              }
            }
            console.warn(
              "Task completed but image data is invalid:",
              data.data.images
            );
            clearInterval(countdownInterval);
            throw new Error(
              "Image processing completed but result is invalid. Please try with a different photo."
            );
          } else {
            console.warn("Task completed but no image data returned");
            clearInterval(countdownInterval);
            throw new Error(
              "Processing completed but no result image. Please try uploading a clearer photo."
            );
          }
        } else if (data.task_status === 3) {
          // Task failed - provide specific guidance based on error
          console.error("Task processing failed:", data);
          const errorDetail = data.error_detail || data.error_msg || "";

          if (errorDetail.includes("face") || errorDetail.includes("face")) {
            throw new Error(
              "No clear face detected in your photo. Please upload a photo with a clearly visible face looking forward."
            );
          } else if (
            errorDetail.includes("quality") ||
            errorDetail.includes("resolution")
          ) {
            throw new Error(
              "Image quality is too low. Please upload a higher quality photo with better lighting."
            );
          } else if (
            errorDetail.includes("format") ||
            errorDetail.includes("type")
          ) {
            throw new Error(
              "Unsupported image format. Please upload a JPG, JPEG, or PNG image."
            );
          } else if (
            errorDetail.includes("size") ||
            errorDetail.includes("large")
          ) {
            clearInterval(countdownInterval);
            throw new Error(
              "Image file is too large. Please upload an image smaller than 3MB."
            );
          } else {
            clearInterval(countdownInterval);
            throw new Error(
              "Unable to process this image. Please try with a different photo with clear lighting and visible face."
            );
          }
        } else if (data.task_status === 1) {
          console.log("Task is still processing...");
        } else {
          console.log(`Unknown task status: ${data.task_status}`);
        }

        // 检查是否超时
        const elapsed = Date.now() - startTime;
        if (elapsed >= maxWaitTime) {
          console.log('Polling timeout reached (30s)');
          clearInterval(countdownInterval);
          break;
        }

        // 优化轮询间隔：前3次2秒，之后3秒
        const pollInterval = i < 3 ? 2000 : 3000;
        console.log(`Waiting ${pollInterval}ms before next poll... (${Math.ceil((maxWaitTime - elapsed) / 1000)}s remaining)`);
        await new Promise((resolve) => setTimeout(resolve, pollInterval));
      } catch (error) {
        console.error(`Polling attempt ${i + 1} error:`, error);
        // If it's a specific error we want to show immediately, throw it
        if (
          error instanceof Error &&
          (error.message.includes("face detected") ||
            error.message.includes("quality") ||
            error.message.includes("format") ||
            error.message.includes("Task not found") ||
            error.message.includes("Processing timeout") ||
            error.message.includes("not be suitable for hairstyle changes") ||
            error.message.includes("couldn't generate the hairstyle") ||
            error.message.includes("Photo not suitable") ||
            (error as any).is422Error)
        ) {
          clearInterval(countdownInterval); // 确保清理倒计时
          throw error;
        }
        // For other errors, continue trying if not the last attempt
        if (i < maxAttempts - 1) {
          await new Promise((resolve) => setTimeout(resolve, 5000));
          continue;
        }
      }
    }

    console.error(`Polling timeout after ${maxAttempts} attempts - task may still be processing`);
    throw new Error(
      "Sorry, we couldn’t generate the hairstyle after several tries. Please upload a clearer front-facing photo. Try not to use full and half body shots to make it easier for us to match your hairstyle!"
    );
  };

  // merge the generate function from SelectStyle component
  const handleGenerate = async () => {
    if (!uploadedImageUrl) {
      toast.error("Please upload a photo first");
      logActivity('generation_attempt', 'failed_no_image', {
        reason: 'no_image_uploaded'
      });
      return;
    }

    // 记录生成尝试
    const generationActivity = await logActivity('generation_attempt', 'hairstyle_generation_started', {
      selected_style: selectedStyle || 'default',
      selected_color: selectedColor,
      selected_gender: selectedGender,
      has_image: !!uploadedImageUrl,
      credits: credits,
      is_guest: !user,
      guest_usage_remaining: !user ? guestUsageCount : null
    });

    // 检查未登录用户使用次数限制
    if (!user && guestUsageCount <= 0) {
      logActivity('generation_blocked', 'guest_limit_reached', {
        guest_usage_count: 0
      });
      setConfirmDialogConfig({
        title: "Free hairstyle attempts are gone!",
        message:
          "Log in and buy Credits to continue creating new styles — your perfect look awaits.",
        confirmText: "Log In & Buy Credits",
        cancelText: "Cancel",
        onConfirm: () => {
          setShowConfirmDialog(false);
          // 存储当前页面URL到localStorage
          const currentPathname = window.location.pathname;
          console.log('🔍 AI Hairstyle handleConfirm - Current pathname:', currentPathname);
          localStorage.setItem('auth_return_url', currentPathname);
          const returnUrl = encodeURIComponent(currentPathname);
          console.log('🔍 AI Hairstyle handleConfirm - returnUrl:', returnUrl);
          window.location.href = `/signin?returnUrl=${returnUrl}`;
        },
        onCancel: () => {
          setShowConfirmDialog(false);
        },
      });
      setShowConfirmDialog(true);
      return;
    }

    // 检查已登录用户积分是否足够
    if (user && credits !== null && credits < 10) {
      logActivity('generation_blocked', 'insufficient_credits', {
        current_credits: credits,
        required_credits: 10
      });
      setConfirmDialogConfig({
        title: "🎨 Insufficient Credits for Hairstyle Generation!",
        message: `You need at least 10 credits to generate a hairstyle, but you currently have ${credits} credits.\n\nTop up your credits now to continue the hairstyle party and discover your perfect look!`,
        confirmText: "Top Up Credits",
        cancelText: "Cancel",
        onConfirm: () => {
          setShowConfirmDialog(false);
          window.location.href = "/pricing";
        },
        onCancel: () => {
          setShowConfirmDialog(false);
        },
      });
      setShowConfirmDialog(true);
      return;
    }

    try {
      setIsLoading(true);
      console.log("Starting hairstyle generation:", {
        selectedStyle,
        selectedColor,
      });

      const finalColor =
        selectedColor === "random"
          ? hairColors.filter((c) => c.id !== "random")[
              Math.floor(Math.random() * (hairColors.length - 1))
            ].id
          : selectedColor;

      console.log("Final selected color:", finalColor);

      const requestBody = {
        imageUrl: uploadedImageUrl,
        hairStyle: selectedStyle || "color-only", // if no hairstyle selected, only change color
        hairColor: finalColor,
      };

      const response = await analytics?.trackedFetch(
        "/api/submit",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        },
        {
          actionName: 'hairstyle_generation_request',
          additionalData: {
            selected_style: selectedStyle || "color-only",
            selected_color: finalColor,
            selected_gender: selectedGender,
            activity_log_id: generationActivity?.id
          }
        }
      ) || await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (response.status === 429) {
        toast.dismiss("generation-status");
        const errorData = await response.json().catch(() => ({}));

        if (errorData.errorType === "daily_limit") {
          // 显示友好的订阅提示框
          const confirmSubscribe = window.confirm(
            `${errorData.error}\n\nWould you like to go to the pricing page to subscribe now?`
          );

          if (confirmSubscribe) {
            window.location.href = "/pricing";
            return;
          }
        } else {
          toast.error(
            errorData.error ||
              "You have reached your daily limit. Please try again tomorrow.",
            {
              duration: 5000,
              style: {
                background: "#1F2937",
                color: "#fff",
              },
            }
          );
        }
        return;
      }

      if (response.status === 402) {
        toast.dismiss("generation-status");
        const errorData = await response.json().catch(() => ({}));

        if (errorData.errorType === "insufficient_credits") {
          // 显示友好的充值提示框
          const confirmTopUp = window.confirm(
            `You need at least 10 credits to generate a hairstyle, but you only have ${errorData.currentCredits} credits.\n\nWould you like to go to the pricing page to top up your credits?`
          );

          if (confirmTopUp) {
            window.location.href = "/pricing";
            return;
          }
        } else {
          toast.error(
            errorData.error ||
              "Insufficient credits. Please top up your credits.",
            {
              duration: 5000,
              style: {
                background: "#1F2937",
                color: "#fff",
              },
            }
          );
        }
        return;
      }

      if (!response.ok) {
        toast.dismiss("generation-status");
        const errorData = await response.json().catch(() => ({}));
        console.error("API submission failed:", response.status, errorData);

        // Provide specific guidance based on HTTP status
        if (response.status === 400) {
          throw new Error(
            "Invalid image or parameters. Please try uploading a different photo."
          );
        } else if (response.status === 413) {
          throw new Error(
            "Image file is too large. Please upload an image smaller than 3MB."
          );
        } else if (response.status === 422) {
          // 422错误，直接显示错误并触发guidelines
          const error = new Error(
            errorData.error ||
              "Sorry, your photo is not suitable for hairstyle changes.\nPlease check our guidelines."
          );
          // 标记为422错误，便于后续处理
          (error as any).is422Error = true;
          throw error;
        } else if (response.status >= 500) {
          throw new Error(
            "Server is temporarily unavailable. Please try again in a few moments."
          );
        } else {
          throw new Error(
            errorData.error ||
              `Request failed (${response.status}). Please try again.`
          );
        }
      }

      const data = await response.json();
      console.log("API response received:", data);

      if (data.status === "processing" && data.taskId) {
        toast.dismiss("generation-status");
        // 不在这里创建processing toast，让pollTaskStatus处理

        // 记录任务创建
        await analytics?.logHairstyleTask(data.taskId, 'processing', {
          selectedStyle: selectedStyle || "color-only",
          selectedColor: finalColor,
          selectedGender: selectedGender,
          imageUrl: uploadedImageUrl,
          creditsUsed: 10
        });

        const taskProcessingStartTime = Date.now();
        let taskProcessingTime = 0;

        try {
          const result = await pollTaskStatus(data.taskId, 10, taskProcessingStartTime);
          taskProcessingTime = Date.now() - taskProcessingStartTime;
          toast.dismiss("processing-status");

          if (result.data?.images) {
            const firstStyle = Object.keys(result.data.images)[0];
            const imageUrl = result.data.images[firstStyle][0];

            // Validate the generated image URL
            if (
              !imageUrl ||
              typeof imageUrl !== "string" ||
              !imageUrl.startsWith("http")
            ) {
              console.error("Invalid generated image URL:", imageUrl);
              throw new Error(
                "Generated image URL is invalid. Please try again."
              );
            }

            console.log("Generation successful, image URL:", imageUrl);

            const currentStyle = currentStyles.find(
              (style) => style.style === selectedStyle
            );
            const imageUrlWithStyle = `${imageUrl}?style=${encodeURIComponent(
              currentStyle?.description || "hairstyle"
            )}`;

            handleStyleSelect(imageUrlWithStyle);

            // 立即更新积分显示（如果后端返回了新余额）
            if (typeof result.newCreditBalance === 'number') {
              updateCredits(result.newCreditBalance);
              console.log(`🚀 Credits updated immediately: ${result.newCreditBalance}`);
            } else {
              // 如果没有返回新余额，则异步刷新积分
              await refreshCredits();
            }

            // 更新未登录用户使用次数
            if (!user) {
              const newCount = Math.max(0, guestUsageCount - 1);
              setGuestUsageCount(newCount);
              localStorage.setItem(
                "guest_hairstyle_usage_count",
                newCount.toString()
              );
            }

            // 记录成功生成
            await analytics?.logHairstyleTask(data.taskId, 'completed', {
              processingTimeMs: taskProcessingTime
            });

            logActivity('generation_success', 'hairstyle_generated', {
              task_id: data.taskId,
              style: selectedStyle || "color-only",
              color: finalColor,
              gender: selectedGender,
              processing_time_ms: taskProcessingTime,
              credits_used: 10
            });

            toast.success("Hairstyle generated successfully! 🎉", {
              duration: 3000,
              position: "top-center",
              style: {
                background: "#1F2937",
                color: "#fff",
                padding: "16px",
                borderRadius: "8px",
                marginTop: "100px",
                boxShadow:
                  "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
              },
              icon: "✨",
            });
          } else {
            throw new Error(
              "Processing completed but no result image was generated. Please try with a different photo."
            );
          }
        } catch (pollError) {
          toast.dismiss("processing-status");
          console.error("Processing error:", pollError);
          
          // 记录任务失败
          const failureReason = classifyFailureReason(pollError);
          await analytics?.logHairstyleTask(data.taskId, 'failed', {
            failureReason: failureReason,
            failureDetails: {
              error: pollError instanceof Error ? pollError.message : String(pollError)
            },
            processingTimeMs: taskProcessingTime || 0
          });
          
          throw pollError; // Re-throw to be handled by outer catch
        }
      } else if (!data.success) {
        toast.dismiss("generation-status");
        const errorMsg = data.error || "Failed to process image";
        console.error("API processing failed:", errorMsg);
        throw new Error(errorMsg);
      } else {
        toast.dismiss("generation-status");
        throw new Error("Unexpected response format. Please try again.");
      }
    } catch (error) {
      console.error("Generation error:", error);
      console.log("Error details:", {
        isError: error instanceof Error,
        message: error instanceof Error ? error.message : String(error),
        is422Error: (error as any).is422Error,
        errorObject: error
      });

      // Clean up any existing toasts
      toast.dismiss("generation-status");
      toast.dismiss("processing-status");

      // Show user-friendly error message
      let errorMessage =
        error instanceof Error
          ? error.message
          : "Hairstyle generation failed. Please try again.";

      // 检查是否是422错误（图片质量问题）
      const is422Error = (error as any).is422Error || (error instanceof Error && (
        error.message.includes("couldn't generate the hairstyle") ||
        error.message.includes("Please upload a clearer") ||
        error.message.includes("face") ||
        error.message.includes("quality") ||
        error.message.includes("Photo not suitable")
      ));

      console.log("Is 422 error check result:", is422Error);

      if (is422Error) {
        // 缩短错误消息到2行内
        errorMessage = "Photo not suitable for hairstyle changes.\nPlease check our guidelines.";
        // 立即显示Perfect photo guidelines弹窗
        console.log("Showing guideline modal...");
        handleShowGuideline(true);
      }

      // 记录生成失败
      const failureReason = classifyFailureReason(error);
      logActivity('generation_failed', 'hairstyle_generation_error', {
        error_message: errorMessage,
        failure_reason: failureReason,
        is_422_error: is422Error,
        selected_style: selectedStyle || "default",
        selected_color: selectedColor,
        selected_gender: selectedGender,
        activity_log_id: generationActivity?.id
      });

      // 确保之前的toast已经被清理
      setTimeout(() => {
        toast.error(errorMessage, {
          duration: 6000,
          style: {
            background: "#1F2937",
            color: "#fff",
            maxWidth: "400px",
            whiteSpace: "pre-line", // 允许换行
          },
        });
      }, 100);
    } finally {
      setIsLoading(false);
    }
  };

  // 修改 handleStyleSelect 函数
  const handleStyleSelect = (imageUrl: string) => {
    console.log("Setting generation result:", imageUrl);

    if (!imageUrl || typeof imageUrl !== "string") {
      console.error("Invalid image URL provided:", imageUrl);
      toast.error("Generated image link is invalid");
      return;
    }

    // Extract clean URL for validation
    const cleanUrl = imageUrl.split("?")[0];

    // Validate URL format
    if (!cleanUrl.startsWith("http")) {
      console.error("Invalid image URL format:", imageUrl);
      toast.error("Generated image link format is invalid");
      return;
    }

    // Update result image state
    setResultImageUrl(imageUrl);
    console.log("Result image URL set:", imageUrl);

    // Update displayed image
    setUploadedImageUrl(imageUrl);
    console.log("Display image URL updated:", imageUrl);

    // Preload image to ensure it displays properly
    const img = document.createElement("img");

    img.onload = () => {
      console.log("Result image preloaded successfully");
      // Image loaded successfully, no further action needed
    };

    img.onerror = (event) => {
      console.error("Result image failed to load:", event);
      toast.error(
        "Generated image cannot be loaded. Please try generating again.",
        {
          duration: 5000,
          style: {
            background: "#1F2937",
            color: "#fff",
          },
        }
      );

      // Reset to original image if result image fails to load
      const originalUrl = searchParams.get("image");
      if (originalUrl) {
        setUploadedImageUrl(decodeURIComponent(originalUrl));
      }
    };

    // Set crossOrigin to handle CORS issues if any
    img.crossOrigin = "anonymous";
    img.src = cleanUrl;

    // Also try to preload with the full URL (with parameters)
    if (cleanUrl !== imageUrl) {
      const imgWithParams = document.createElement("img");
      imgWithParams.crossOrigin = "anonymous";
      imgWithParams.src = imageUrl;
    }
  };

  // modify the download function
  const handleDownload = async (imageUrl: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();

      // get style name
      const styleMatch = imageUrl.match(/style=([^&]+)/);
      const styleName = styleMatch
        ? decodeURIComponent(styleMatch[1]).toLowerCase().replace(/\s+/g, "-")
        : "hairstyle";
      const fileName = `${styleName}-${new Date().getTime()}.jpg`;

      // check if it is a iOS device
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

      if (isIOS) {
        // iOS 设备：在新标签页中打开图片
        const imageUrl = URL.createObjectURL(blob);
        window.open(imageUrl, "_blank");
        // 延迟释放 URL
        setTimeout(() => URL.revokeObjectURL(imageUrl), 1000);

        toast.success("Image opened in new tab. Long press to save.", {
          duration: 5000,
          style: {
            background: "#1F2937",
            color: "#fff",
          },
        });
      } else {
        // 其他设备：正常下载
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;

        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        toast.success("Download started!", {
          duration: 3000,
          style: {
            background: "#1F2937",
            color: "#fff",
          },
        });
      }
    } catch (error) {
      console.error("Download failed:", error);
      toast.error("Failed to download image");
    }
  };

  // 检查是否需要显示 guideline 弹窗
  const shouldShowGuideline = () => {
    const alwaysShow = localStorage.getItem('guideline_always_show');
    // 默认显示，只有明确设置为false时才不显示
    return alwaysShow !== 'false';
  };

  // 处理 guideline 弹窗显示
  const handleShowGuideline = (forceShow = false) => {
    console.log("handleShowGuideline called, forceShow:", forceShow);
    console.log("Current showGuidelineModal state:", showGuidelineModal);
    if (forceShow || shouldShowGuideline()) {
      console.log("Setting showGuidelineModal to true");
      setShowGuidelineModal(true);
    }
  };





  // 处理 guideline 弹窗取消（用户主动关闭）
  const handleGuidelineDismiss = () => {
    setShowGuidelineModal(false);
    // 用户点击取消，设置为不总是显示
    setAlwaysShowGuidelines(false);
    localStorage.setItem('guideline_always_show', 'false');
  };

  // Guideline Modal 组件
  const GuidelineModal = () => {
    console.log("GuidelineModal render, showGuidelineModal:", showGuidelineModal);
    if (!showGuidelineModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9997] p-4">
        <div className="bg-white rounded-lg max-w-xl w-full mx-auto max-h-[90vh] overflow-y-auto shadow-xl">
          {/* Header */}
          <div className="text-center py-2 px-2">
            <h2 className="text-sm text-gray-900">Image Guidelines</h2>
          </div>

          {/* Content */}
          <div className="px-2 pb-2">
            {/* Good Examples */}
            <div className="mb-3 max-w-xs w-full mx-auto">
              <h3 className="text-base md:text-lg font-semibold text-green-600 mb-3 text-center">✓ Good Examples</h3>
              <div className="grid grid-cols-2 md:grid-cols-2 gap-1 md:gap-0.5">
                <div className="text-center">
                  <div className="mb-2">
                    <Image
                      src="/images/guideline/right1-good-light.webp"
                      alt="Good lighting example"
                      width={300}
                      height={300}
                      className="h-24 w-24  sm:h-28 sm:w-28 object-cover rounded-lg shadow-md mx-auto"
                    />
                  </div>
                  <p className="text-xs md:text-sm font-medium text-gray-900">Good lighting</p>
                </div>

                <div className="text-center">
                  <div className="mb-2">
                    <Image
                      src="/images/guideline/right2-Above Shoulder-Photo.webp"
                      alt="Good angle example"
                      width={300}
                      height={300}
                      className="h-24 w-24 sm:h-28 sm:w-28 object-cover rounded-lg shadow-md mx-auto"
                    />
                  </div>
                  <p className="text-xs md:text-sm font-medium text-gray-900">Slightly elevated side angle</p>
                </div>
              </div>
            </div>

            {/* Bad Examples */}
            <div className="max-w-md w-full mx-auto">
              <h3 className="text-base md:text-lg font-semibold text-red-600 mb-3 text-center">✗ Avoid These</h3>
              <div className="grid grid-cols-3 md:grid-cols-3 gap-1 md:gap-0.5">
                <div className="text-center">
                  <div className="mb-1">
                    <Image
                      src="/images/guideline/wrong1-Half-or-full body-shots.webp"
                      alt="Avoid half or full body shots"
                      width={200}
                      height={200}
                      className="h-24 w-24 sm:h-28 sm:w-28 object-cover rounded-lg shadow-md mx-auto"
                    />
                  </div>
                  <p className="text-xs md:text-sm font-medium text-gray-900">Half or full body shots</p>
                </div>

                <div className="text-center">
                  <div className="mb-1">
                    <Image
                      src="/images/guideline/wrong2-hair-or shadows-on face.webp"
                      alt="Avoid hair/shadows on face"
                      width={100}
                      height={100}
                      className="h-24 w-24 sm:h-28 sm:w-28 object-cover rounded-lg shadow-md mx-auto"
                    />
                  </div>
                  <p className="text-xs md:text-sm font-medium text-gray-900">Hair/shadows</p>
                </div>

                <div className="text-center">
                  <div className="mb-1">
                    <Image
                      src="/images/guideline/wrong3-blurry-close up.webp"
                      alt="Avoid blurry close up photos"
                      width={200}
                      height={200}
                      className="h-24 w-24  sm:h-28 sm:w-28 object-cover rounded-lg shadow-md mx-auto"
                    />
                  </div>
                  <p className="text-xs md:text-sm font-medium text-gray-900">Blurry photos</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-3 bg-gray-50 rounded-b-lg">
            <div className="flex justify-center space-x-3">
              <button
                onClick={handleGuidelineDismiss}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowGuidelineModal(false);
                  fileInputRef.current?.click();
                }}
                className="px-6 py-2 bg-purple-700 text-white hover:bg-purple-800 rounded-lg transition-colors text-sm"
              >
                Upload Photo
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 添加文件上传处理函数
  const handleImageUpload = async (file: File) => {
    try {
      // 检查文件类型 - 只支持 JPG, JPEG, PNG
      const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
      if (!allowedTypes.includes(file.type.toLowerCase())) {
        toast.error("Only JPG, JPEG, PNG formats are supported");
        logActivity('file_upload', 'upload_failed_invalid_type', {
          file_type: file.type,
          file_size: file.size
        });
        return;
      }

      // 检查文件大小 (限制为 3MB)
      if (file.size > 3 * 1024 * 1024) {
        toast.error("Please upload an image less than 3MB");
        logActivity('file_upload', 'upload_failed_size_limit', {
          file_size: file.size,
          file_type: file.type,
          size_limit_mb: 3
        });
        return;
      }

      // 记录上传开始
      logActivity('file_upload', 'image_upload_started', {
        file_size: file.size,
        file_type: file.type
      });

      // 创建 FormData
      const formData = new FormData();
      formData.append("image", file);

      // 读取文件并显示预览
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImageUrl(reader.result as string);
        logActivity('file_upload', 'image_upload_success', {
          file_size: file.size,
          file_type: file.type
        });
      };

      reader.onerror = () => {
        toast.error("Failed to read file");
        logActivity('file_upload', 'upload_failed_read_error', {
          file_size: file.size,
          file_type: file.type
        });
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload image");
    }
  };

  // 添加示例图片加载函数
  const loadSampleImage = async (imagePath: string) => {
    try {
      logActivity('button_click', 'sample_image_selected', {
        image_path: imagePath
      });

      const response = await fetch(imagePath);
      if (!response.ok) {
        throw new Error("Failed to load sample image");
      }

      const blob = await response.blob();
      const reader = new FileReader();

      reader.onloadend = () => {
        setUploadedImageUrl(reader.result as string);
        logActivity('file_upload', 'sample_image_loaded', {
          image_path: imagePath,
          file_size: blob.size
        });
      };

      reader.onerror = () => {
        toast.error("Failed to load sample image");
      };

      reader.readAsDataURL(blob);
    } catch (error) {
      console.error("Sample image loading error:", error);
      toast.error("Failed to load sample image");
    }
  };

  // 修改 UploadArea 组件，添加 guideline 弹窗触发
  const UploadArea = () => {
    const [isDragging, setIsDragging] = useState(false);

    const handleUploadClick = () => {
      // 如果选中了Always show guidelines，显示弹窗，停止上传
      if (alwaysShowGuidelines) {
        handleShowGuideline(true);
        return;
      }
      // 否则直接触发文件选择
      fileInputRef.current?.click();
    };

    return (
      <div
        className={`
                    w-full h-full flex flex-col items-center justify-center
                    border-2 border-dashed rounded-lg
                    ${
                      isDragging
                        ? "border-purple-600 bg-purple-50"
                        : "border-purple-300 hover:border-purple-500"
                    }
                    transition-all duration-200 ease-in-out
                    cursor-pointer
                `}
        onClick={handleUploadClick}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          const file = e.dataTransfer.files[0];
          if (file) {
            // 如果选中了Always show guidelines，显示弹窗，停止上传
            if (alwaysShowGuidelines) {
              handleShowGuideline(true);
              return;
            }
            // 否则直接处理上传
            handleImageUpload(file);
          }
        }}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleImageUpload(file);
          }}
          accept="image/jpeg,image/jpg,image/png"
          className="hidden"
        />
        <div className="flex flex-col items-center space-y-4 p-4 md:p-8">
          <svg
            className="w-12 h-12 md:w-16 md:h-16 text-purple-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          <div className="text-center">
            <p className="text-lg md:text-xl font-medium text-gray-900">
              Click or drag image here to upload
            </p>
            <p className="mt-2 text-sm text-gray-500">
              JPG, JPEG, PNG, Less Than 3MB
            </p>
          </div>
          <button
            className="mt-4 px-4 md:px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm md:text-base"
            onClick={(e) => {
              e.stopPropagation();
              handleUploadClick();
            }}
          >
            Upload Image
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-2 py-0 lg:py-2 min-h-screen h-screen overflow-hidden max-w-full">
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            marginTop: "100px",
            zIndex: 9999, // 确保低于Image Guidelines的z-[9999]
          },
        }}
        containerStyle={{
          zIndex: 9999, // 容器层级也设置为低于Guidelines
        }}
      />

      {/* Guideline Modal */}
      <GuidelineModal />

      {/* 自定义确认对话框 */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9998] p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {confirmDialogConfig.title}
            </h3>
            <p className="text-gray-600 mb-6 whitespace-pre-line">
              {confirmDialogConfig.message}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={confirmDialogConfig.onCancel}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {confirmDialogConfig.cancelText}
              </button>
              <button
                onClick={confirmDialogConfig.onConfirm}
                className="px-4 py-2 bg-purple-700 text-white hover:bg-purple-800 rounded-lg transition-colors"
              >
                {confirmDialogConfig.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto overflow-x-hidden">
        {/* Logo 区域作为 h1 标题 */}
        <div className="flex items-center justify-between mb-4 h-[48px]">
          <Link
            href="/"
            className="flex items-center gap-2"
            title="Return to Hair-style.ai Homepage"
          >
            <Image
              src="/images/logo/logo.png"
              alt="Hair-style.ai Logo"
              width={32}
              height={32}
              priority
            />
            <h1 className="text-xl  hidden lg:inline   md:text-2xl font-semibold hover:text-purple-700 transition-colors">
              HairStyle AI
            </h1>
          </Link>

          <ButtonSignin />
        </div>

        {/* 浮动按钮 - 移动端只显示图标，PC端隐藏，避免遮挡Credits */}
        {uploadedImageUrl && (
          <div className="lg:hidden absolute top-16 left-1/2 -translate-x-1/2 flex flex-row gap-2">
            {resultImageUrl && (
              <button
                onClick={() => handleDownload(resultImageUrl)}
                className="w-10 h-10 lg:w-auto lg:h-auto lg:px-4 lg:py-2 bg-white text-purple-700 border-2 border-purple-700 hover:bg-purple-50 rounded-lg flex items-center justify-center lg:gap-2 shadow-lg"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                <span className="hidden lg:inline text-sm">Download</span>
              </button>
            )}
                              <div>
                    <input
                      type="file"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(file);
                      }}
                      accept="image/*"
                      className="hidden"
                      id="photo-upload-new-mobile"
                    />
                    <label
                      htmlFor="photo-upload-new-mobile"
                      onClick={() => {
                        if (alwaysShowGuidelines) {
                          handleShowGuideline(true);
                        }
                      }}
                      className="w-10 h-10 lg:w-auto lg:h-auto lg:px-4 lg:py-2 bg-white text-purple-700 hover:bg-purple-50 rounded-lg border-1 border-purple-700 flex items-center justify-center lg:gap-2 cursor-pointer shadow-lg font-medium"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                        />
                      </svg>
                      <span className="hidden lg:inline text-sm">Upload New</span>
                    </label>
                  </div>
          </div>
        )}

        {/* PC端布局 - 使用响应式网格布局，左右分栏 */}
        <div className="hidden lg:grid lg:grid-cols-12 gap-2 md:gap-3 max-w-full">
          {/* PC端左侧区域 - 图片上传/预览区域 */}
          <section
            className="lg:col-span-9 h-fit"
            aria-label="Photo Upload Area"
          >
            <h2 className="sr-only">Upload Your Photo</h2>
            {!uploadedImageUrl ? (
              <>
                {/* 上传区域 */}
                <div className="rounded-lg h-[400px] flex flex-col items-center justify-center mb-2">
                  <div className="w-full max-w-md md:max-w-lg mx-auto px-4">
                    <UploadArea />
                  </div>
                </div>



                {/* 示例图片区域 - 更紧凑 */}
                <div className="text-center px-4 pb-1">
                <p className="text-lg text-gray-600 mb-1 mt-3">
                    No photos?    Try these examples:
                  </p>
                  <div className="flex justify-center gap-1.5">
                    <button
                      className="w-20 h-20 rounded-md overflow-hidden border border-transparent hover:border-purple-500 transition-all"
                      onClick={() =>
                        loadSampleImage("/images/examles/david.jpg")
                      }
                    >
                      <Image
                        src="/images/examles/david.jpg"
                        alt="Male example 1"
                        width={100}
                        height={100}
                        className="w-full h-full object-cover"
                      />
                    </button>
                    <button
                      className="w-20 h-20 rounded-md overflow-hidden border border-transparent hover:border-purple-500 transition-all"
                      onClick={() =>
                        loadSampleImage("/images/examles/michael.jpg")
                      }
                    >
                      <Image
                        src="/images/examles/michael.jpg"
                        alt="Male example 2"
                        width={40}
                        height={40}
                        className="w-full h-full object-cover"
                      />
                    </button>
                    <button
                      className="w-20 h-20 rounded-md overflow-hidden border border-transparent hover:border-purple-500 transition-all"
                      onClick={() => loadSampleImage("/images/examles/k.jpg")}
                    >
                      <Image
                        src="/images/examles/k.jpg"
                        alt="Female example 1"
                        width={40}
                        height={40}
                        className="w-full h-full object-cover"
                      />
                    </button>
                    <button
                      className="w-20 h-20 rounded-md overflow-hidden border border-transparent hover:border-purple-500 transition-all"
                      onClick={() =>
                        loadSampleImage("/images/examles/nana.jpg")
                      }
                    >
                      <Image
                        src="/images/examles/nana.jpg"
                        alt="Female example 2"
                        width={40}
                        height={40}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  </div>                  

                  
                  {/* Guideline 入口 - 未上传图片时也显示 */}
                  <div className="text-center mt-4">
                    <button
                      onClick={() => handleShowGuideline(true)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-purple-700 hover:text-purple-800 text-xs rounded-lg transition-colors"
                    >
                      <span className="font-medium">Perfect photo guidelines</span>
                      <span>✨</span>
                    </button>
                    <div className="flex items-center justify-center space-x-2 mt-1">
                      <input
                        type="checkbox"
                        id="always-show-guidelines-pc-no-image"
                        checked={alwaysShowGuidelines}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setAlwaysShowGuidelines(checked);
                          localStorage.setItem('guideline_always_show', checked ? 'true' : 'false');
                        }}
                        className="h-3 w-3 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                      />
                      <label htmlFor="always-show-guidelines-pc-no-image" className="text-xs text-gray-500 cursor-pointer">
                        Always show guidelines
                      </label>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              // PC端预览区域
              <div className="p-1 sm:p-2 rounded-lg shadow-sm relative h-[680px]  flex flex-col items-center">
                {/* 顶部按钮区域 */}
                <div className="h-[40px] sm:h-[10px] flex justify-center items-center gap-2 sm:gap-4 mb-2 sm:mb-4">
                  {resultImageUrl && (
                    <button
                      onClick={() => handleDownload(resultImageUrl)}
                      className="h-8 sm:h-10 bg-purple-700 text-white hover:bg-purple-800 px-4 sm:px-6 rounded-lg text-sm flex items-center justify-center gap-1 sm:gap-2 shadow-lg"
                    >
                      <svg
                        className="w-3 h-3 sm:w-4 sm:h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                        />
                      </svg>
                      Download
                    </button>
                  )}
                </div>

                {/* 图片显示区域 */}
                <div className="flex-grow w-full flex items-center justify-center">
                  {uploadedImageUrl && (
                    <div className="max-w-md mx-auto w-full">
                      <Image
                        src={uploadedImageUrl}
                        alt="Original"
                        width={1024}
                        height={1024}
                        className="w-full h-full object-contain rounded-lg"
                        unoptimized
                      />
                    </div>
                  )}
                </div>

                {/* 底部上传按钮和guideline入口 */}
                <div className="flex flex-col items-center gap-2 mt-2 mb-2 sm:mb-4">
                  <div>
                    <input
                      type="file"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(file);
                      }}
                      accept="image/*"
                      className="hidden"
                      id="photo-upload-new-pc"
                    />
                    <label
                      htmlFor="photo-upload-new-pc"
                      onClick={() => {
                        if (alwaysShowGuidelines) {
                          handleShowGuideline(true);
                        }
                      }}
                      className="h-8 sm:h-10 bg-white text-gray-800 hover:bg-gray-50 px-4 sm:px-6 rounded-lg text-sm border border-gray-300 flex items-center justify-center gap-1 sm:gap-2 shadow-sm cursor-pointer"
                    >
                      <svg
                        className="w-3 h-3 sm:w-4 sm:h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                        />
                      </svg>
                      Upload new
                    </label>
                  </div>
                  
                  {/* Guideline 入口 */}
                  <div className="text-center">
                    <button
                      onClick={() => handleShowGuideline(true)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-purple-700 hover:text-purple-800 text-xs rounded-lg transition-colors"
                    >
                      <span className="font-medium">Perfect photo guidelines</span>
                      <span>✨</span>
                    </button>
                    <div className="flex items-center justify-center space-x-2 mt-1">
                      <input
                        type="checkbox"
                        id="always-show-guidelines-pc-preview"
                        checked={alwaysShowGuidelines}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setAlwaysShowGuidelines(checked);
                          localStorage.setItem('guideline_always_show', checked ? 'true' : 'false');
                        }}
                        className="h-3 w-3 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                      />
                      <label htmlFor="always-show-guidelines-pc-preview" className="text-xs text-gray-500 cursor-pointer">
                        Always show guidelines
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>
          {/* PC Right side */}
          <section className="lg:col-span-3" aria-label="Style Selection">
            <h2 className="sr-only">Select Hairstyle</h2>
            <div className="w-full lg:w-[340px] mx-auto max-w-full">
              <div className="w-full">
                <div className="mb-4 bg-gray-50 p-2 rounded-lg">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setSelectedGender("Female");
                        setSelectedStyle("");
                        logActivity('button_click', 'gender_selected', {
                          gender: 'Female',
                          previous_gender: selectedGender
                        });
                      }}
                      className={`flex-1 py-2 px-4 rounded-lg text-sm ${
                        selectedGender === "Female"
                          ? "bg-purple-700 text-white"
                          : "bg-white text-gray-700"
                      }`}
                    >
                      Female Hairstyle
                    </button>
                    <button
                      onClick={() => {
                        setSelectedGender("Male");
                        setSelectedStyle("");
                        logActivity('button_click', 'gender_selected', {
                          gender: 'Male',
                          previous_gender: selectedGender
                        });
                      }}
                      className={`flex-1 py-2 px-4 rounded-lg text-sm ${
                        selectedGender === "Male"
                          ? "bg-purple-700 text-white"
                          : "bg-white text-gray-700"
                      }`}
                    >
                      Male Hairstyle
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-3 lg:grid-cols-3 gap-2 mb-4 overflow-y-auto h-[380px]">
                  {currentStyles.map((style) => (
                    <button
                      key={style.style}
                      ref={
                        selectedStyle === style.style ? selectedStyleRef : null
                      }
                      onClick={() => handleStyleClick(style.style)}
                      className={`p-1 rounded-2xl border transition-all flex flex-col ${
                        selectedStyle === style.style
                          ? "border-purple-700 bg-purple-700 shadow-md"
                          : "border-transparent hover:border-gray-200 bg-gray-100 hover:shadow-sm"
                      }`}
                    >
                      <div
                        className={`w-full ${styleImageHeight} mb-1 overflow-hidden rounded-xl`}
                      >
                        <img
                          src={style.imageUrl}
                          alt={`Trendy ${style.description} hairstyle - a popular modern haircut choice for fashion-forward individuals`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <p
                        className={`text-xs font-medium min-h-[2.0em] flex items-center justify-center text-center w-full ${
                          selectedStyle === style.style
                            ? "text-white"
                            : "text-gray-700"
                        }`}
                      >
                        {style.description}
                      </p>
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-1">
                  {hairColors.map((color) => (
                    <button
                      key={color.id}
                      onClick={() => {
                        setSelectedColor(color.id);
                        logActivity('button_click', 'color_selected', {
                          color: color.id,
                          color_label: color.label,
                          previous_color: selectedColor
                        });
                      }}
                      className={`flex-shrink-0 w-10 h-10 rounded-md transition-all ${
                        selectedColor === color.id
                          ? color.id === "white"
                            ? "ring-2 ring-purple-700 ring-offset-1 border-2 border-purple-700"
                            : "ring-2 ring-purple-700 ring-offset-2"
                          : "border border-gray-200 hover:border-gray-300"
                      }`}
                      style={{
                        background:
                          color.id === "random"
                            ? color.color
                            : `linear-gradient(45deg, 
                                                        ${color.color} 0%, 
                                                        white 1%, 
                                                        ${color.color} 30%, 
                                                        ${color.color} 90%,
                                                        white 99%
                                                    )`,
                        boxShadow:
                          color.id === "white" && selectedColor !== color.id
                            ? "inset 0 0 0 1px rgba(0,0,0,0.1)"
                            : undefined,
                      }}
                      title={color.label}
                    >
                      {color.id === "random" && (
                        <span className="text-xs font-bold">?</span>
                      )}
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleGenerate}
                  className={`w-full mt-8 py-4 rounded-lg font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
                    !user && guestUsageCount <= 0
                      ? "bg-purple-900 text-white hover:bg-purple-800"
                      : "bg-purple-700 text-white hover:bg-purple-800"
                  }`}
                  disabled={!uploadedImageUrl || isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
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
                      Generating...
                    </div>
                  ) : !uploadedImageUrl ? (
                    "Upload Photo"
                  ) : !user && guestUsageCount <= 0 ? (
                    "Log In & Buy Credits"
                  ) : !selectedStyle ? (
                    user ? (
                      `Generate with ${
                        selectedGender === "Female" ? "Long Wavy" : "Slick Back"
                      }`
                    ) : (
                      `Generate (${guestUsageCount} tries left)`
                    )
                  ) : user ? (
                    "Generate"
                  ) : (
                    `Generate (${guestUsageCount} tries left)`
                  )}
                </button>
              </div>
            </div>
          </section>
        </div>

        {/* 移动端布局 - 垂直布局，居中显示，固定高度不滚动 */}
        <div className="lg:hidden flex flex-col h-[calc(100vh-48px)] overflow-hidden relative max-w-full">
          {/* 移动端图片上传/预览区域 - 居中显示，增加空间 */}
          <section
            className="flex-1 flex items-center justify-center py-8 px-4"
            aria-label="Photo Upload Area"
          >
            <h2 className="sr-only">Upload Your Photo</h2>
            {!uploadedImageUrl ? (
              <div className="w-full max-w-md mx-auto flex flex-col items-center justify-center space-y-8">
                {/* 上传区域 - 居中 */}
                <div className="w-full">
                  <UploadArea />
                </div>

                {/* Want perfect photo 按钮 - 移动端 */}
                <div className="text-center">
                  <div className="flex flex-col items-center space-y-2">
                    <button
                      onClick={() => handleShowGuideline(true)}
                      className="inline-flex items-center gap-2 px-4 py-2  text-purple-700 "
                    >
                      <span className="text-sm font-medium">Click to see perfect photo guidelines</span>
                      <span>✨</span>
                    </button>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="always-show-guidelines-mobile"
                        checked={alwaysShowGuidelines}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setAlwaysShowGuidelines(checked);
                          localStorage.setItem('guideline_always_show', checked ? 'true' : 'false');
                        }}
                        className="h-3 w-3 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                      />
                      <label htmlFor="always-show-guidelines-mobile" className="text-xs text-gray-500 cursor-pointer">
                        Always show guidelines
                      </label>
                    </div>
                  </div>
                </div>

                {/* 示例图片区域 - 居中，增加间距 */}
                <div className="text-center w-full">

                  <div className="flex justify-center gap-3">
                    <button
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-md overflow-hidden border border-transparent hover:border-purple-500 transition-all"
                      onClick={() =>
                        loadSampleImage("/images/examles/david.jpg")
                      }
                    >
                      <Image
                        src="/images/examles/david.jpg"
                        alt="Male example 1"
                        width={80}
                        height={80}
                        className="w-full h-full object-cover"
                      />
                    </button>
                    <button
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-md overflow-hidden border border-transparent hover:border-purple-500 transition-all"
                      onClick={() =>
                        loadSampleImage("/images/examles/michael.jpg")
                      }
                    >
                      <Image
                        src="/images/examles/michael.jpg"
                        alt="Male example 2"
                        width={80}
                        height={80}
                        className="w-full h-full object-cover"
                      />
                    </button>
                    <button
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-md overflow-hidden border border-transparent hover:border-purple-500 transition-all"
                      onClick={() => loadSampleImage("/images/examles/k.jpg")}
                    >
                      <Image
                        src="/images/examles/k.jpg"
                        alt="Female example 1"
                        width={80}
                        height={80}
                        className="w-full h-full object-cover"
                      />
                    </button>
                    <button
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-md overflow-hidden border border-transparent hover:border-purple-500 transition-all"
                      onClick={() =>
                        loadSampleImage("/images/examles/nana.jpg")
                      }
                    >
                      <Image
                        src="/images/examles/nana.jpg"
                        alt="Female example 2"
                        width={80}
                        height={80}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  </div>
                  <p className="text-base text-gray-600 mb-6 mt-3">
                    Try these examples:
                  </p>
                </div>
              </div>
            ) : (
              // 移动端预览区域 - 选中图片后，减少上方空白
              <div className="h-full flex flex-col">
                {/* 图片显示区域 - 靠上显示，减少上方空白 */}
                <div className="flex-1 flex items-start justify-center px-4 pt-4 relative">
                  <div className="max-w-xs w-full">
                    <Image
                      src={uploadedImageUrl}
                      alt="Preview"
                      width={400}
                      height={400}
                      className="w-full h-auto object-contain rounded-lg"
                      unoptimized
                    />
                  </div>
                </div>
                
                {/* 移动端 Guideline 入口 */}
                <div className="text-center px-4 pb-4">
                  <button
                    onClick={() => handleShowGuideline(true)}
                    className="inline-flex items-center gap-1 px-3 py-2 text-purple-700 hover:text-purple-800 text-sm rounded-lg transition-colors"
                  >
                    <span className="font-medium">Perfect photo guidelines</span>
                    <span>✨</span>
                  </button>
                  <div className="flex items-center justify-center space-x-2 mt-1">
                    <input
                      type="checkbox"
                      id="always-show-guidelines-mobile-preview"
                      checked={alwaysShowGuidelines}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setAlwaysShowGuidelines(checked);
                        localStorage.setItem('guideline_always_show', checked ? 'true' : 'false');
                      }}
                      className="h-3 w-3 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                    />
                    <label htmlFor="always-show-guidelines-mobile-preview" className="text-xs text-gray-500 cursor-pointer">
                      Always show guidelines
                    </label>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* 移动端样式选择区域 - 固定在底部 */}
          {uploadedImageUrl && (
            <section
              className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 pb-safe-area-inset-bottom shadow-lg z-50 max-w-full overflow-x-hidden"
              aria-label="Style Selection"
            >
              <h2 className="sr-only">Select Hairstyle</h2>

              {/* 性别选择 - 更紧凑 */}
              <div className="bg-white p-1.5 rounded-lg">
                <div className="flex space-x-1.5 mt-2">
                  <button
                    onClick={() => {
                      setSelectedGender("Female");
                      setSelectedStyle("");
                    }}
                    className={`flex-1 py-1.5 px-3 rounded-md text-xs transition-colors ${
                      selectedGender === "Female"
                        ? "bg-purple-50 text-purple-700 font-bold "
                        : "bg-white text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    Female
                  </button>
                  <button
                    onClick={() => {
                      setSelectedGender("Male");
                      setSelectedStyle("");
                    }}
                    className={`flex-1 py-1.5 px-3 rounded-md text-xs transition-colors ${
                      selectedGender === "Male"
                        ? "bg-purple-50 text-purple-700 font-bold "
                        : "bg-white text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    Male
                  </button>
                </div>
              </div>

              {/* 发型选择 - 横向滚动，移除标题 */}
              <div className="mb-2">
                <div className="overflow-x-auto scrollbar-hide">
                  <div
                    className="flex gap-0.5 "
                    style={{ width: "max-content" }}
                  >
                    {currentStyles.map((style) => (
                      <button
                        key={style.style}
                        ref={
                          selectedStyle === style.style
                            ? selectedStyleRef
                            : null
                        }
                        onClick={() => handleStyleClick(style.style)}
                        className={`flex-shrink-0 w-12 p-0.5 rounded-lg border transition-all ${
                          selectedStyle === style.style
                            ? "border-purple-700 bg-purple-700 shadow-md"
                            : "border-transparent bg-gray-100 hover:border-gray-200"
                        }`}
                      >
                        <div
                          className={`w-12 ${
                            styleImageHeight === "h-24"
                              ? "h-12"
                              : styleImageHeight === "h-32"
                              ? "h-14"
                              : styleImageHeight === "h-32"
                              ? "h-16"
                              : styleImageHeight === "h-36"
                              ? "h-18"
                              : "h-14"
                          } overflow-hidden rounded-md`}
                        >
                          <img
                            src={style.imageUrl}
                            alt={style.description}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 颜色选择 - 横向滚动，移除标题 */}
              <div className="mb-2 px-1 py-1">
                <div className="overflow-x-auto scrollbar-hide">
                  <div className="flex gap-2" style={{ width: "max-content" }}>
                    {hairColors.map((color) => (
                      <button
                        key={color.id}
                        onClick={() => {
                        setSelectedColor(color.id);
                        logActivity('button_click', 'color_selected', {
                          color: color.id,
                          color_label: color.label,
                          previous_color: selectedColor
                        });
                      }}
                        className={`flex-shrink-0 w-10 h-10 rounded-md transition-all ${
                          selectedColor === color.id
                            ? color.id === "white"
                              ? "ring-2 ring-purple-700 ring-offset-1 border-2 border-purple-700"
                              : "ring-2 ring-purple-700 ring-offset-2"
                            : "border border-gray-200 hover:border-gray-300"
                        }`}
                        style={{
                          background:
                            color.id === "random"
                              ? color.color
                              : `linear-gradient(45deg, 
                                                        ${color.color} 0%, 
                                                        white 1%, 
                                                        ${color.color} 30%, 
                                                        ${color.color} 90%,
                                                        white 99%
                                                    )`,
                          boxShadow:
                            color.id === "white" && selectedColor !== color.id
                              ? "inset 0 0 0 1px rgba(0,0,0,0.1)"
                              : undefined,
                        }}
                        title={color.label}
                      >
                        {color.id === "random" && (
                          <span className="text-xs font-bold">?</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 生成按钮 - 更紧凑 */}
              <button
                onClick={handleGenerate}
                className={`w-full py-2.5 rounded-lg font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed mb-4 ${
                  !user && guestUsageCount <= 0
                    ? "bg-purple-700 text-white hover:bg-purple-800"
                    : "bg-purple-700 text-white hover:bg-purple-800"
                }`}
                disabled={!uploadedImageUrl || isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
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
                    Generating...
                  </div>
                ) : !uploadedImageUrl ? (
                  "Upload Photo First"
                ) : !user && guestUsageCount <= 0 ? (
                  "Sign up for more tries"
                ) : !selectedStyle ? (
                  user ? (
                    `Generate with ${
                      selectedGender === "Female" ? "Long Wavy" : "Slick Back"
                    }`
                  ) : (
                    `Generate (${guestUsageCount} left)`
                  )
                ) : user ? (
                  "Generate"
                ) : (
                  `Generate (${guestUsageCount} left)`
                )}
              </button>
            </section>
          )}
        </div>
      </div>

      {/* 添加隐藏滚动条的全局样式 */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
                    .scrollbar-hide {
                        -ms-overflow-style: none;
                        scrollbar-width: none;
                    }
                    .scrollbar-hide::-webkit-scrollbar {
                        display: none;
                    }
                    
                    /* 自定义滚动条样式 */
                    ::-webkit-scrollbar {
                        width: 8px;
                        height: 8px;
                    }
                    
                    ::-webkit-scrollbar-track {
                        background: #f1f1f1;
                        border-radius: 4px;
                    }
                    
                    ::-webkit-scrollbar-thumb {
                        background: #c1c1c1;
                        border-radius: 4px;
                        transition: background 0.3s ease;
                    }
                    
                    ::-webkit-scrollbar-thumb:hover {
                        background: #a8a8a8;
                    }
                    
                    /* Firefox 滚动条样式 */
                    * {
                        scrollbar-width: thin;
                        scrollbar-color: #c1c1c1 #f1f1f1;
                    }
                `,
        }}
      />
    </div>
  );
}
