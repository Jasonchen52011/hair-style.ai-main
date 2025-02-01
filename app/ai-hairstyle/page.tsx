"use client"

import { useState, useEffect, Suspense, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';
import PhotoUpload from '@/components/photoupload';
import SelectStyle from '@/components/selectstyle';
import Image from 'next/image';



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
    const searchParams = useSearchParams();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // 从 URL 参数中获取图片 URL
    useEffect(() => {
        const imageUrl = searchParams.get('image');
        if (imageUrl) {
            setUploadedImageUrl(decodeURIComponent(imageUrl));
        }
    }, [searchParams]);

    // 修改 handleStyleSelect 函数
    const handleStyleSelect = (imageUrl: string) => {
        // 更新结果图片
        setResultImageUrl(imageUrl);
        // 将结果图片设置为当前显示的图片
        setUploadedImageUrl(imageUrl);
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
            // 检查文件类型
            if (!file.type.startsWith('image/')) {
                toast.error('Please upload an image file');
                return;
            }

            // 检查文件大小 (例如限制为 5MB)
            if (file.size > 5 * 1024 * 1024) {
                toast.error('Image size should be less than 5MB');
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
                    accept="image/*"
                    className="hidden"
                />
                <div className="flex flex-col items-center space-y-4 p-8">
                    <svg 
                        className="w-16 h-16 text-purple-600" 
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
                        <p className="text-xl font-medium text-gray-900">
                            Click or drag image here to upload
                        </p>
                        <p className="mt-2 text-sm text-gray-500">
                            JPG, JPEG, PNG, BMP, WEBP
                        </p>
                    </div>
                    <button 
                        className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
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
        <div className="container mx-auto px-4 py-2 min-h-screen">
            <Toaster
                position="top-center"
                toastOptions={{
                    style: {
                        marginTop: '100px',
                    },
                }}
            />
            
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center gap-2 mb-2">
                    <Image
                        src="/images/logo/logo.png"
                        alt="Hair-style.ai Logo"
                        width={32}
                        height={32}
                        priority
                    />
                    <h1 className="text-2xl  font-semibold">
                        Hair-style.ai
                    </h1>
                </div>
                
                {/* 使用响应式网格布局 - 调整左右比例 */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 md:gap-3">
                    {/* 左侧区域 */}
                    <div className="lg:col-span-9 h-fit">
                        {!uploadedImageUrl ? (
                            // 上传区域 - 减小高度和内边距
                            <div className="bg-gray-200 p-2 rounded-lg shadow-sm border border-gray-200 h-[600px] sm:h-[680px] flex flex-col items-center justify-center">
                                <div className="w-full max-w-md mx-auto px-4"> {/* 添加水平内边距 */}
                                    <UploadArea />
                                </div>
                            </div>
                        ) : (
                            // 预览区域 - 减小高度和间距
                            <div className="bg-gray-200 p-2 sm:p-4 rounded-lg shadow-sm border border-gray-200 relative h-[600px] sm:h-[680px] flex flex-col items-center">
                                {/* 顶部按钮区域 - 减小间距 */}
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

                                {/* 图片显示区域 - 减小间距 */}
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

                                {/* 底部上传按钮 - 减小尺寸 */}
                                <div className="flex justify-center mb-2 sm:mb-4">
                                        <PhotoUpload 
                                            onUploadSuccess={setUploadedImageUrl} 
                                        buttonClassName="h-8 sm:h-10 bg-white text-gray-800 hover:bg-gray-50 px-4 sm:px-6 rounded-lg text-sm border border-gray-300 flex items-center justify-center gap-1 sm:gap-2 shadow-sm"
                                            buttonContent={
                                                <>
                                                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                                    </svg>
                                                    Upload new
                                                </>
                                            }
                                        />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 右侧区域 - 移除外框 */}
                    <div className="lg:col-span-3">
                        <div className="w-full lg:w-[340px] mx-auto">
                        <SelectStyle 
                            uploadedImageUrl={uploadedImageUrl}
                                onStyleSelect={handleStyleSelect}
                        />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
} 