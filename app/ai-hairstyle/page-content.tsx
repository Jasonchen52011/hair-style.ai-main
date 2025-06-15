"use client"

import { useState, useEffect, Suspense, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';
import Image from 'next/image';
import Link from 'next/link';
import { hairColors, femaleStyles, maleStyles, type HairStyle } from '@/lib/hairstyles';

// 创建一个包装组件来处理搜索参数
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

// 将原来的组件内容移到这里
function SelectStylePageContent() {
    const [uploadedImageUrl, setUploadedImageUrl] = useState<string>();
    const [resultImageUrl, setResultImageUrl] = useState<string>();
    const [defaultStyle, setDefaultStyle] = useState<string>("PixieCut");
    const searchParams = useSearchParams();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // 新增的状态 - 合并自 SelectStyle 组件
    const [selectedGender, setSelectedGender] = useState<"Female" | "Male">("Female");
    const [selectedStyle, setSelectedStyle] = useState<string>("");
    const [selectedColor, setSelectedColor] = useState<string>("brown");
    const [isLoading, setIsLoading] = useState(false);

    // 从 URL 参数中获取图片 URL 和预设发型
    useEffect(() => {
        const imageUrl = searchParams.get('image');
        const presetStyle = searchParams.get('style');
        
        if (imageUrl) {
            setUploadedImageUrl(decodeURIComponent(imageUrl));
        }
        
        // 处理预设发型
        if (presetStyle) {
            const decodedStyle = decodeURIComponent(presetStyle);
            
            // 检查是否是男性发型
            const maleStyle = maleStyles.find(style => 
                style.style.toLowerCase() === decodedStyle.toLowerCase() || 
                style.description.toLowerCase() === decodedStyle.toLowerCase()
            );
            
            if (maleStyle) {
                setSelectedGender("Male");
                setSelectedStyle(maleStyle.style);
                setDefaultStyle(maleStyle.style);
                return;
            }
            
            // 检查是否是女性发型
            const femaleStyle = femaleStyles.find(style => 
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

    // 初始化默认样式（当没有URL参数时的fallback）
    useEffect(() => {
        if (!searchParams.get('style') && defaultStyle && !selectedStyle && selectedGender === "Female") {
            const femaleStyle = femaleStyles.find(style => style.style === defaultStyle);
            if (femaleStyle) {
                setSelectedGender("Female");
                setSelectedStyle(defaultStyle);
            } else {
                const maleStyle = maleStyles.find(style => style.style === defaultStyle);
                if (maleStyle) {
                    setSelectedGender("Male");
                    setSelectedStyle(defaultStyle);
                }
            }
        }
    }, [defaultStyle, searchParams]);

    const currentStyles = selectedGender === "Female" ? femaleStyles : maleStyles;

    const handleStyleClick = (style: string) => {
        // 如果点击的是已选中的发型，则取消选中
        if (selectedStyle === style) {
            setSelectedStyle("");
        } else {
            setSelectedStyle(style);
        }
    };

    // 合并自 SelectStyle 组件的轮询函数
    const pollTaskStatus = async (taskId: string, maxAttempts = 20) => {
        console.log(`Starting task polling, taskId: ${taskId}`);
        
        for (let i = 0; i < maxAttempts; i++) {
            try {
                console.log(`Polling attempt ${i + 1} of ${maxAttempts}`);
                
                const response = await fetch(`/api/submit?taskId=${taskId}`);
                
                if (!response.ok) {
                    console.log(`Polling request failed, status: ${response.status}`);
                    // Handle different HTTP error types
                    if (response.status === 404) {
                        throw new Error('Task not found. Please try uploading a new image.');
                    } else if (response.status >= 500) {
                        console.log('Server error, retrying...');
                        await new Promise(resolve => setTimeout(resolve, 5000));
                        continue;
                    } else if (response.status === 429) {
                        throw new Error('Too many requests. Please wait a moment and try again.');
                    } else {
                        console.error(`HTTP error: ${response.status} ${response.statusText}`);
                        await new Promise(resolve => setTimeout(resolve, 5000));
                        continue;
                    }
                }
                
                const data = await response.json();
                console.log(`Polling response:`, {
                    task_status: data.task_status,
                    hasImages: !!data.data?.images,
                    error_detail: data.error_detail
                });
                
                // Check task completion status
                if (data.task_status === 2) {
                    if (data.data?.images) {
                        // Validate image data integrity
                        const imageKeys = Object.keys(data.data.images);
                        if (imageKeys.length > 0) {
                            const firstStyleImages = data.data.images[imageKeys[0]];
                            if (Array.isArray(firstStyleImages) && firstStyleImages.length > 0 && firstStyleImages[0]) {
                                console.log('Task completed successfully, found valid images');
                                return data;
                            }
                        }
                        console.warn('Task completed but image data is invalid:', data.data.images);
                        throw new Error('Image processing completed but result is invalid. Please try with a different photo.');
                    } else {
                        console.warn('Task completed but no image data returned');
                        throw new Error('Processing completed but no result image. Please try uploading a clearer photo.');
                    }
                } else if (data.task_status === 3) {
                    // Task failed - provide specific guidance based on error
                    console.error('Task processing failed:', data);
                    const errorDetail = data.error_detail || data.error_msg || '';
                    
                    if (errorDetail.includes('face') || errorDetail.includes('人脸')) {
                        throw new Error('No clear face detected in your photo. Please upload a photo with a clearly visible face looking forward.');
                    } else if (errorDetail.includes('quality') || errorDetail.includes('resolution')) {
                        throw new Error('Image quality is too low. Please upload a higher quality photo with better lighting.');
                    } else if (errorDetail.includes('format') || errorDetail.includes('type')) {
                        throw new Error('Unsupported image format. Please upload a JPG, JPEG, or PNG image.');
                    } else if (errorDetail.includes('size') || errorDetail.includes('large')) {
                        throw new Error('Image file is too large. Please upload an image smaller than 3MB.');
                    } else {
                        throw new Error('Unable to process this image. Please try with a different photo with clear lighting and visible face.');
                    }
                } else if (data.task_status === 1) {
                    console.log('Task is still processing...');
                } else {
                    console.log(`Unknown task status: ${data.task_status}`);
                }
                
                // Wait 5 seconds before next polling
                await new Promise(resolve => setTimeout(resolve, 5000));
            } catch (error) {
                console.error(`Polling attempt ${i + 1} error:`, error);
                // If it's a specific error we want to show immediately, throw it
                if (error instanceof Error && 
                    (error.message.includes('face detected') || 
                     error.message.includes('quality') || 
                     error.message.includes('format') || 
                     error.message.includes('Task not found'))) {
                    throw error;
                }
                // For other errors, continue trying if not the last attempt
                if (i < maxAttempts - 1) {
                    await new Promise(resolve => setTimeout(resolve, 5000));
                    continue;
                }
            }
        }
        
        console.error('Polling timeout - task may still be processing');
        throw new Error('Processing is taking longer than expected. Please try again with a different photo or check your internet connection.');
    };

    // 合并自 SelectStyle 组件的生成函数
    const handleGenerate = async () => {
        if (!uploadedImageUrl) {
            toast.error('Please upload a photo first');
            return;
        }

        try {
            setIsLoading(true);
            console.log('Starting hairstyle generation:', { selectedStyle, selectedColor });

            const finalColor = selectedColor === 'random' 
                ? hairColors.filter(c => c.id !== 'random')[Math.floor(Math.random() * (hairColors.length - 1))].id
                : selectedColor;

            console.log('Final selected color:', finalColor);

            const response = await fetch("/api/submit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    imageUrl: uploadedImageUrl,
                    hairStyle: selectedStyle || "color-only", // 如果没有选中发型，只改变颜色
                    hairColor: finalColor,
                }),
            });

            if (response.status === 429) {
                toast.dismiss('generation-status');
                toast.error('You have reached your daily limit of 5 free generations. Please try again tomorrow.', {
                    duration: 5000,
                    style: {
                        background: '#1F2937',
                        color: '#fff',
                    },
                });
                return;
            }

            if (!response.ok) {
                toast.dismiss('generation-status');
                const errorData = await response.json().catch(() => ({}));
                console.error('API submission failed:', response.status, errorData);
                
                // Provide specific guidance based on HTTP status
                if (response.status === 400) {
                    throw new Error('Invalid image or parameters. Please try uploading a different photo.');
                } else if (response.status === 413) {
                    throw new Error('Image file is too large. Please upload an image smaller than 3MB.');
                } else if (response.status === 422) {
                    throw new Error(errorData.error || 'Unable to process this image. Please try with a clearer photo showing your face.');
                } else if (response.status >= 500) {
                    throw new Error('Server is temporarily unavailable. Please try again in a few moments.');
                } else {
                    throw new Error(errorData.error || `Request failed (${response.status}). Please try again.`);
                }
            }

            const data = await response.json();
            console.log('API response received:', data);
            
            if (data.status === 'processing' && data.taskId) {
                toast.dismiss('generation-status');
                toast.loading('Processing your image ...', {
                    id: 'processing-status',
                    duration: 120000, // 2 minutes
                });

                try {
                    const result = await pollTaskStatus(data.taskId);
                    toast.dismiss('processing-status');
                    
                    if (result.data?.images) {
                        const firstStyle = Object.keys(result.data.images)[0];
                        const imageUrl = result.data.images[firstStyle][0];
                        
                        // Validate the generated image URL
                        if (!imageUrl || typeof imageUrl !== 'string' || !imageUrl.startsWith('http')) {
                            console.error('Invalid generated image URL:', imageUrl);
                            throw new Error('Generated image URL is invalid. Please try again.');
                        }
                        
                        console.log('Generation successful, image URL:', imageUrl);
                        
                        const currentStyle = currentStyles.find(style => style.style === selectedStyle);
                        const imageUrlWithStyle = `${imageUrl}?style=${encodeURIComponent(currentStyle?.description || 'hairstyle')}`;
                        
                        handleStyleSelect(imageUrlWithStyle);
                        
                        toast.success('Hairstyle generated successfully! 🎉', {
                            duration: 3000,
                            position: 'top-center',
                            style: {
                                background: '#1F2937',
                                color: '#fff',
                                padding: '16px',
                                borderRadius: '8px',
                                marginTop: '100px',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                            },
                            icon: '✨',
                        });
                    } else {
                        throw new Error('Processing completed but no result image was generated. Please try with a different photo.');
                    }
                } catch (pollError) {
                    toast.dismiss('processing-status');
                    console.error('Processing error:', pollError);
                    throw pollError; // Re-throw to be handled by outer catch
                }
            } else if (!data.success) {
                toast.dismiss('generation-status');
                const errorMsg = data.error || 'Failed to process image';
                console.error('API processing failed:', errorMsg);
                throw new Error(errorMsg);
            } else {
                toast.dismiss('generation-status');
                throw new Error('Unexpected response format. Please try again.');
            }

        } catch (error) {
            console.error('Generation error:', error);
            
            // Clean up any existing toasts
            toast.dismiss('generation-status');
            toast.dismiss('processing-status');
            
            // Show user-friendly error message
            const errorMessage = error instanceof Error ? error.message : 'Hairstyle generation failed. Please try again.';
            
            toast.error(errorMessage, {
                duration: 6000,
                style: {
                    background: '#1F2937',
                    color: '#fff',
                    maxWidth: '400px',
                },
            });
        } finally {
            setIsLoading(false);
        }
    };

    // 修改 handleStyleSelect 函数
    const handleStyleSelect = (imageUrl: string) => {
        console.log('Setting generation result:', imageUrl);
        
        if (!imageUrl || typeof imageUrl !== 'string') {
            console.error('Invalid image URL provided:', imageUrl);
            toast.error('Generated image link is invalid');
            return;
        }
        
        // Extract clean URL for validation
        const cleanUrl = imageUrl.split('?')[0];
        
        // Validate URL format
        if (!cleanUrl.startsWith('http')) {
            console.error('Invalid image URL format:', imageUrl);
            toast.error('Generated image link format is invalid');
            return;
        }
        
        // Update result image state
        setResultImageUrl(imageUrl);
        console.log('Result image URL set:', imageUrl);
        
        // Update displayed image
        setUploadedImageUrl(imageUrl);
        console.log('Display image URL updated:', imageUrl);
        
        // Preload image to ensure it displays properly
        const img = document.createElement('img');
        
        img.onload = () => {
            console.log('Result image preloaded successfully');
            // Image loaded successfully, no further action needed
        };
        
        img.onerror = (event) => {
            console.error('Result image failed to load:', event);
            toast.error('Generated image cannot be loaded. Please try generating again.', {
                duration: 5000,
                style: {
                    background: '#1F2937',
                    color: '#fff',
                },
            });
            
            // Reset to original image if result image fails to load
            const originalUrl = searchParams.get('image');
            if (originalUrl) {
                setUploadedImageUrl(decodeURIComponent(originalUrl));
            }
        };
        
        // Set crossOrigin to handle CORS issues if any
        img.crossOrigin = 'anonymous';
        img.src = cleanUrl;
        
        // Also try to preload with the full URL (with parameters)
        if (cleanUrl !== imageUrl) {
            const imgWithParams = document.createElement('img');
            imgWithParams.crossOrigin = 'anonymous';
            imgWithParams.src = imageUrl;
        }
    };

    // 修改下载处理函数
    const handleDownload = async (imageUrl: string) => {
        try {
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            
            // 获取样式名称
            const styleMatch = imageUrl.match(/style=([^&]+)/);
            const styleName = styleMatch ? decodeURIComponent(styleMatch[1]).toLowerCase().replace(/\s+/g, '-') : 'hairstyle';
            const fileName = `${styleName}-${new Date().getTime()}.jpg`;

            // 检测是否是 iOS 设备
            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
            
            if (isIOS) {
                // iOS 设备：在新标签页中打开图片
                const imageUrl = URL.createObjectURL(blob);
                window.open(imageUrl, '_blank');
                // 延迟释放 URL
                setTimeout(() => URL.revokeObjectURL(imageUrl), 1000);
                
                toast.success('Image opened in new tab. Long press to save.', {
                    duration: 5000,
                    style: {
                        background: '#1F2937',
                        color: '#fff',
                    },
                });
            } else {
                // 其他设备：正常下载
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
                a.download = fileName;
            
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            
            toast.success('Download started!', {
                duration: 3000,
                style: {
                    background: '#1F2937',
                    color: '#fff',
                },
            });
            }
        } catch (error) {
            console.error('Download failed:', error);
            toast.error('Failed to download image');
        }
    };

    // 添加文件上传处理函数
    const handleImageUpload = async (file: File) => {
        try {
            // 检查文件类型 - 只支持 JPG, JPEG, PNG
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
            if (!allowedTypes.includes(file.type.toLowerCase())) {
                toast.error('Only JPG, JPEG, PNG formats are supported');
                return;
            }

            // 检查文件大小 (限制为 3MB)
            if (file.size > 3 * 1024 * 1024) {
                toast.error('Please upload an image less than 3MB');
                return;
            }

            // 创建 FormData
            const formData = new FormData();
            formData.append('image', file);

            // 读取文件并显示预览
            const reader = new FileReader();
            reader.onloadend = () => {
                setUploadedImageUrl(reader.result as string);
            };

            reader.onerror = () => {
                toast.error('Failed to read file');
            };

            reader.readAsDataURL(file);

        } catch (error) {
            console.error('Upload error:', error);
            toast.error('Failed to upload image');
        }
    };

    // 添加示例图片加载函数
    const loadSampleImage = async (imagePath: string) => {
        try {
            const response = await fetch(imagePath);
            if (!response.ok) {
                throw new Error('Failed to load sample image');
            }
            
            const blob = await response.blob();
            const reader = new FileReader();
            
            reader.onloadend = () => {
                setUploadedImageUrl(reader.result as string);
            };
            
            reader.onerror = () => {
                toast.error('Failed to load sample image');
            };
            
            reader.readAsDataURL(blob);
        } catch (error) {
            console.error('Sample image loading error:', error);
            toast.error('Failed to load sample image');
        }
    };

    // 修改 UploadArea 组件，添加更明显的样式
    const UploadArea = () => {
        const [isDragging, setIsDragging] = useState(false);

        return (
            <div 
                className={`
                    w-full h-full flex flex-col items-center justify-center
                    border-2 border-dashed rounded-lg
                    ${isDragging ? 'border-purple-600 bg-purple-50' : 'border-purple-300 hover:border-purple-500'}
                    transition-all duration-200 ease-in-out
                    cursor-pointer
                `}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    const file = e.dataTransfer.files[0];
                    if (file) handleImageUpload(file);
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
                            fileInputRef.current?.click();
                        }}
                    >
                        Upload Image
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="container mx-auto px-2 py-2 min-h-screen">
            <Toaster
                position="top-center"
                toastOptions={{
                    style: {
                        marginTop: '100px',
                    },
                }}
            />
            
            <div className="max-w-7xl mx-auto">
                {/* Logo 区域作为 h1 标题 */}
                <h1 className="flex items-center gap-3 mb-2 h-[48px]">
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
                        <span className="text-xl  hidden lg:inline   md:text-2xl font-semibold hover:text-purple-700 transition-colors">
                            Hair Style AI
                        </span>
                    </Link>

                          {/* 浮动按钮 - 移动端只显示图标，PC端隐藏 */}
                          {uploadedImageUrl && (
                          <div className="lg:hidden absolute top-2 left-1/2 -translate-x-1/2 flex flex-row gap-2">
                                        {resultImageUrl && (
                                            <button 
                                                onClick={() => handleDownload(resultImageUrl)}
                                                className="w-10 h-10 lg:w-auto lg:h-auto lg:px-4 lg:py-2 bg-white text-purple-700 border-2 border-purple-700 hover:bg-purple-50 rounded-lg flex items-center justify-center lg:gap-2 shadow-lg"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
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
                                                className="w-10 h-10 lg:w-auto lg:h-auto lg:px-4 lg:py-2 bg-white text-purple-700 hover:bg-purple-50 rounded-lg border-1 border-purple-700 flex items-center justify-center lg:gap-2 cursor-pointer shadow-lg font-medium"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                                </svg>
                                                <span className="hidden lg:inline text-sm">Upload New</span>
                                            </label>
                                        </div>
                                    </div>
                          )}
                </h1>
                
                {/* PC端布局 - 使用响应式网格布局 */}
                <div className="hidden lg:grid lg:grid-cols-12 gap-2 md:gap-3">
                    {/* PC端左侧区域 */}
                    <section className="lg:col-span-9 h-fit" aria-label="Photo Upload Area">
                        <h2 className="sr-only">Upload Your Photo</h2>
                        {!uploadedImageUrl ? (
                            <>
                                {/* 上传区域 */}
                                <div className="p-2 rounded-lg h-[400px] flex flex-col items-center justify-center mb-2">
                                    <div className="w-full max-w-md md:max-w-xl mx-auto px-4">
                                        <UploadArea />
                                    </div>
                                </div>
                                
                                {/* 示例图片区域 - 更紧凑 */}
                                <div className="text-center px-4 pb-1">
                                    <p className="text-lg text-gray-600 mb-1">Try these examples:</p>
                                    <div className="flex justify-center gap-1.5">
                                        <button 
                                            className="w-20 h-20 rounded-md overflow-hidden border border-transparent hover:border-purple-500 transition-all"
                                            onClick={() => loadSampleImage('/images/examles/david.jpg')}
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
                                            onClick={() => loadSampleImage('/images/examles/michael.jpg')}
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
                                            className="w-20 h-20  rounded-md overflow-hidden border border-transparent hover:border-purple-500 transition-all"
                                            onClick={() => loadSampleImage('/images/examles/k.jpg')}
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
                                            className="w-20 h-20  rounded-md overflow-hidden border border-transparent hover:border-purple-500 transition-all"
                                            onClick={() => loadSampleImage('/images/examles/nana.jpg')}
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
                                </div>
                            </>
                        ) : (
                            // PC端预览区域
                            <div className="p-1 sm:p-2 rounded-lg shadow-sm relative h-[700px] sm:h-[800px] flex flex-col items-center">
                                {/* 顶部按钮区域 */}
                                <div className="h-[40px] sm:h-[50px] flex justify-center items-center gap-2 sm:gap-4 mb-2 sm:mb-4">
                                    {resultImageUrl && (
                                        <button 
                                            onClick={() => handleDownload(resultImageUrl)}
                                            className="h-8 sm:h-10 bg-purple-700 text-white hover:bg-purple-800 px-4 sm:px-6 rounded-lg text-sm flex items-center justify-center gap-1 sm:gap-2 shadow-lg"
                                        >
                                            <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                            </svg>
                                            Download
                                        </button>
                                    )}
                                </div>

                                {/* 图片显示区域 */}
                                <div className="flex-grow overflow-hidden mb-2 sm:mb-4 w-full flex items-center justify-center px-2 sm:px-4">
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

                                {/* 底部上传按钮 */}
                                <div className="flex justify-center mb-2 sm:mb-4">
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
                                            className="h-8 sm:h-10 bg-white text-gray-800 hover:bg-gray-50 px-4 sm:px-6 rounded-lg text-sm border border-gray-300 flex items-center justify-center gap-1 sm:gap-2 shadow-sm cursor-pointer"
                                        >
                                                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                                    </svg>
                                                    Upload new
                                        </label>
                                    </div>
                                </div>
                            </div>
                        )}
                    </section>

                    {/* PC端右侧区域 */}
                    <section className="lg:col-span-3" aria-label="Style Selection">
                        <h2 className="sr-only">Select Hairstyle</h2>
                        <div className="w-full lg:w-[340px] mx-auto">
                            <div className="w-full">
                                <div className="mb-4 bg-gray-50 p-2 rounded-lg">
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => {
                                                setSelectedGender("Female");
                                                setSelectedStyle("");
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
                                            onClick={() => handleStyleClick(style.style)}
                                            className={`p-1 rounded-2xl border transition-all flex flex-col ${
                                                selectedStyle === style.style
                                                    ? "border-purple-700 bg-purple-700 shadow-md"
                                                    : "border-transparent hover:border-gray-200 bg-gray-100 hover:shadow-sm"
                                            }`}
                                        >
                                            <div className="w-full h-28 mb-1 overflow-hidden rounded-xl">
                                                <img
                                                    src={style.imageUrl}
                                                    alt={`Trendy ${style.description} hairstyle - a popular modern haircut choice for fashion-forward individuals`}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            <p className={`text-xs font-medium min-h-[2.0em] flex items-center justify-center text-center w-full ${
                                                selectedStyle === style.style ? "text-white" : "text-gray-700"
                                            }`}>
                                                {style.description}
                                            </p>
                                        </button>
                                    ))}
                                </div>

                                <div className="grid grid-cols-7 gap-1">
                                    {hairColors.map((color) => (
                                        <button
                                            key={color.id}
                                            onClick={() => setSelectedColor(color.id)}
                                            className={`flex-shrink-0 w-10 h-10 rounded-md transition-all ${
                                                selectedColor === color.id 
                                                    ? (color.id === "white" 
                                                        ? "ring-2 ring-purple-700 ring-offset-1 border-2 border-purple-700" 
                                                        : "ring-2 ring-purple-700 ring-offset-2") 
                                                    : "border border-gray-200 hover:border-gray-300"
                                            }`}
                                            style={{
                                                background: color.id === "random" 
                                                    ? color.color 
                                                    : `linear-gradient(45deg, 
                                                        ${color.color} 0%, 
                                                        white 1%, 
                                                        ${color.color} 30%, 
                                                        ${color.color} 90%,
                                                        white 99%
                                                    )`,
                                                boxShadow: color.id === "white" && selectedColor !== color.id
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
                                    className="w-full mt-8 py-4 bg-purple-700 text-white rounded-lg font-medium hover:bg-purple-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
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
                                    ) : !selectedStyle ? (
                                        "Change Color Only"
                                    ) : (
                                        "Generate"
                                    )}
                                </button>
                            </div>
                        </div>
                    </section>
                </div>

                {/* 移动端布局 - 垂直布局，一屏显示 */}
                <div className="lg:hidden flex flex-col h-screen max-h-screen overflow-hidden relative">
                    {/* 移动端图片上传/预览区域 - 调整高度 */}
                    <section className="flex-shrink-0 h-60 mb-4" aria-label="Photo Upload Area">
                        <h2 className="sr-only">Upload Your Photo</h2>
                        {!uploadedImageUrl ? (
                            <div className="h-full flex flex-col">
                                {/* 上传区域 */}
                                <div className="flex-1 flex items-center justify-center px-4">
                                    <div className="w-full max-w-sm">
                                        <UploadArea />
                                    </div>
                                </div>
                                
                                {/* 示例图片区域 - 更紧凑 */}
                                <div className="text-center mt-6 px-4 pb-1">
                                    <p className="text-sm text-gray-600 mb-1">Try these examples:</p>
                                    <div className="flex justify-center mt-4 gap-1.5">
                                        <button 
                                            className="w-20 h-20 rounded-md overflow-hidden border border-transparent hover:border-purple-500 transition-all"
                                            onClick={() => loadSampleImage('/images/examles/david.jpg')}
                                        >
                                            <Image 
                                                src="/images/examles/david.jpg" 
                                                alt="Male example 1" 
                                                width={40} 
                                                height={40} 
                                                className="w-full h-full object-cover"
                                            />
                                        </button>
                                        <button 
                                            className="w-20 h-20 rounded-md overflow-hidden border border-transparent hover:border-purple-500 transition-all"
                                            onClick={() => loadSampleImage('/images/examles/michael.jpg')}
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
                                            onClick={() => loadSampleImage('/images/examles/k.jpg')}
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
                                            onClick={() => loadSampleImage('/images/examles/nana.jpg')}
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
                                </div>
                            </div>
                        ) : (
                            // 移动端预览区域
                            <div className="h-full flex flex-col">
                                {/* 图片显示区域 */}
                                <div className="flex-1 flex items-center justify-center px-4 relative">
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
                            </div>
                        )}
                    </section>

                    {/* 移动端样式选择区域 - 固定在底部 */}
                    {uploadedImageUrl && (
                    <section className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 pb-safe-area-inset-bottom shadow-lg z-50" aria-label="Style Selection">
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
                                <div className="flex gap-0.5 " style={{ width: 'max-content' }}>
                                    {currentStyles.map((style) => (
                                        <button
                                            key={style.style}
                                            onClick={() => handleStyleClick(style.style)}
                                            className={`flex-shrink-0 w-18 p-0.5 rounded-lg border transition-all ${
                                                selectedStyle === style.style
                                                    ? "border-purple-700 bg-purple-700 shadow-md"
                                                    : "border-transparent bg-gray-100 hover:border-gray-200"
                                            }`}
                                        >
                                            <div className="w-20 h-24 overflow-hidden rounded-md">
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
                                <div className="flex gap-2" style={{ width: 'max-content' }}>
                                    {hairColors.map((color) => (
                                        <button
                                            key={color.id}
                                            onClick={() => setSelectedColor(color.id)}
                                            className={`flex-shrink-0 w-10 h-10 rounded-md transition-all ${
                                                selectedColor === color.id 
                                                    ? (color.id === "white" 
                                                        ? "ring-2 ring-purple-700 ring-offset-1 border-2 border-purple-700" 
                                                        : "ring-2 ring-purple-700 ring-offset-2") 
                                                    : "border border-gray-200 hover:border-gray-300"
                                            }`}
                                            style={{
                                                background: color.id === "random" 
                                                    ? color.color 
                                                    : `linear-gradient(45deg, 
                                                        ${color.color} 0%, 
                                                        white 1%, 
                                                        ${color.color} 30%, 
                                                        ${color.color} 90%,
                                                        white 99%
                                                    )`,
                                                boxShadow: color.id === "white" && selectedColor !== color.id
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
                            className="w-full py-2.5 bg-purple-700 text-white rounded-lg font-medium hover:bg-purple-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed mb-4"
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
                            ) : !selectedStyle ? (
                                "Change Color Only"
                            ) : (
                                "Generate"
                            )}
                        </button>
                    </section>
                    )}
                </div>
            </div>

            {/* 添加隐藏滚动条的全局样式 */}
            <style dangerouslySetInnerHTML={{
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
                `
            }} />
        </div>
    );
} 