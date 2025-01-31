"use client"

import { useState, useEffect, Suspense, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';
import PhotoUpload from '@/components/photoupload';
import SelectStyle from '@/components/selectstyle';
import Image from 'next/image';
import Upload from '@/components/upload';


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

    // 处理结果图片的回调函数
    const handleStyleSelect = async (style: string) => {
        try {
            const formData = new FormData();
            formData.append('hairStyle', style);
            formData.append('hairColor', 'default');
            
            if (uploadedImageUrl) {
                // 获取图片文件
                const response = await fetch(uploadedImageUrl);
                const blob = await response.blob();
                formData.append('image', blob, 'image.jpg');
            }

            // 明确设置 Content-Type
            const submitResponse = await fetch('/api/submit', {
                method: 'POST',
                body: formData,
                headers: {
                    // 注意：当使用 FormData 时，不要设置 Content-Type
                    // 浏览器会自动添加正确的 Content-Type 和 boundary
                    'Accept': 'application/json'
                }
            });

            if (!submitResponse.ok) {
                const errorData = await submitResponse.json();
                throw new Error(errorData.error || 'Failed to process image');
            }

            const result = await submitResponse.json();
            if (result.success && result.imageUrl) {
                setUploadedImageUrl(result.imageUrl);
            }
        } catch (error) {
            console.error('Style selection error:', error);
            toast.error('Failed to apply hairstyle');
        }
    };

    // 添加下载函数
    const handleDownload = async (imageUrl: string) => {
        try {
            // 获取图片
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            
            // 获取当前选中的发型名称
            const styleMatch = imageUrl.match(/style=([^&]+)/);
            const styleName = styleMatch ? decodeURIComponent(styleMatch[1]).toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') : 'hairstyle';
            
            // 创建下载链接
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${styleName}-${new Date().getTime()}.jpg`; // 使用发型名称作为文件名前缀
            
            // 触发下载
            document.body.appendChild(a);
            a.click();
            
            // 清理
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            
            // 显示成功提示 - 增加显示时间
            toast.success('Download started!', {
                duration: 3000,
                style: {
                    background: '#1F2937',
                    color: '#fff',
                },
            });
        } catch (error) {
            console.error('Download failed:', error);
            toast.error('Failed to download image', {
                duration: 3000
            });
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

            const loadingToast = toast.loading('Uploading image...');
            
            // 创建 FormData
            const formData = new FormData();
            formData.append('image', file);

            // 读取文件并显示预览
            const reader = new FileReader();
            reader.onloadend = () => {
                setUploadedImageUrl(reader.result as string);
                toast.dismiss(loadingToast);
                toast.success('Image uploaded successfully!');
            };

            reader.onerror = () => {
                toast.dismiss(loadingToast);
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
                        src="/images/hero/logo.png"
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
                    {/* 左侧区域增加宽度 */}
                    <div className="lg:col-span-9 h-fit">
                        {!uploadedImageUrl ? (
                            // 上传区域 - 调整边框样式和背景
                            <div className="bg-gray-200 p-2 rounded-lg shadow-sm border border-gray-200 h-[680px] w-[calc(100%+30px)] -ml-[30px] flex flex-col items-center justify-center">
                                <UploadArea />
                            </div>
                        ) : (
                            // 预览区域 - 调整边框样式和宽度
                            <div className="bg-gray-200 p-4 rounded-lg shadow-sm border border-gray-200 relative h-[680px] w-[calc(100%+30px)] -ml-[30px] flex flex-col">
                                {/* 顶部按钮区域 */}
                                <div className="h-[50px] flex justify-center items-center gap-4 mb-4">
                                    {resultImageUrl && (
                                        <button 
                                            onClick={() => handleDownload(resultImageUrl)}
                                            className="w-32 h-9 bg-purple-700 text-white hover:bg-purple-800 px-6 md:px-5 rounded-lg text-sm flex items-center justify-center gap-2"
                                        >
                                            <svg 
                                                className="w-4 h-4" 
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

                                {/* 图片显示区域 - 添加拖拽功能 */}
                                <div 
                                    className="relative flex-grow overflow-hidden"
                                    onDragOver={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        e.currentTarget.classList.add('bg-purple-50', 'bg-opacity-30');
                                    }}
                                    onDragLeave={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        e.currentTarget.classList.remove('bg-purple-50', 'bg-opacity-30');
                                    }}
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        e.currentTarget.classList.remove('bg-purple-50', 'bg-opacity-30');
                                        
                                        const files = e.dataTransfer.files;
                                        if (files && files.length > 0) {
                                            const file = files[0];
                                            if (file.type.startsWith('image/')) {
                                                const input = document.querySelector('input[type="file"]') as HTMLInputElement;
                                                if (input) {
                                                    const dataTransfer = new DataTransfer();
                                                    dataTransfer.items.add(file);
                                                    input.files = dataTransfer.files;
                                                    input.dispatchEvent(new Event('change', { bubbles: true }));
                                                }
                                            } else {
                                                toast.error('Please upload an image file');
                                            }
                                        }
                                    }}
                                >
                                    {/* 原有的图片显示 */}
                                    <Image 
                                        src={uploadedImageUrl} 
                                        alt="Original" 
                                        width={1024}
                                        height={1024}
                                        className="w-full h-full object-contain rounded-lg"
                                        unoptimized
                                    />
                                    
                                    {/* 拖拽提示遮罩 - 只在拖拽时显示 */}
                                    <div className="absolute inset-0 bg-black bg-opacity-50 hidden items-center justify-center rounded-lg group-hover:flex opacity-0 hover:opacity-100 transition-opacity">
                                        <div className="text-white text-center">
                                            <svg 
                                                className="w-12 h-12 mx-auto mb-2" 
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
                                            <p className="text-lg font-medium">Drop to upload new image</p>
                                        </div>
                                    </div>
                            </div>

                                {/* 底部上传按钮 */}
                                <div className="h-[50px] flex justify-center items-center gap-4 mt-8">
                                        <PhotoUpload 
                                            onUploadSuccess={setUploadedImageUrl} 
                                            buttonClassName="w-45 h-9 bg-white text-gray-800 hover:bg-gray-50 md:px-2 rounded-lg text-sm border border-gray-800 flex items-center justify-center"
                                            buttonContent={
                                                <>
                                                    <svg 
                                                        className="w-4 h-4" 
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
                                                </>
                                            }
                                        />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 右侧区域 - 移除外框 */}
                    <div className="lg:col-span-3">
                        <div className="w-[340px]">
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