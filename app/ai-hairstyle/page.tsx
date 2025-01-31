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
    const handleStyleSelect = (imageUrl: string) => {
        setResultImageUrl(imageUrl);
        // 将结果图片设置为新的上传图片
        setUploadedImageUrl(imageUrl);
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

    // 上传区域组件
    const UploadArea = () => {
        const [isDragging, setIsDragging] = useState(false);

        // 处理点击上传
        const handleClick = () => {
            console.log("Click upload area");  // 添加日志
            fileInputRef.current?.click();
        };

        // 处理文件选择
        const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            console.log("File selected");  // 添加日志
            const file = e.target.files?.[0];
            if (file) {
                handleImageUpload(file);
            }
        };

        // 处理拖放
        const handleDragOver = (e: React.DragEvent) => {
            e.preventDefault();
            console.log("Dragging over");  // 添加日志
            setIsDragging(true);
        };

        const handleDragLeave = () => {
            console.log("Drag leave");  // 添加日志
            setIsDragging(false);
        };

        const handleDrop = (e: React.DragEvent) => {
            e.preventDefault();
            console.log("File dropped");  // 添加日志
            setIsDragging(false);
            const file = e.dataTransfer.files[0];
            if (file) {
                handleImageUpload(file);
            }
        };

        return (
            <div 
                className={`upload-area ${isDragging ? 'dragging' : ''}`}
                onClick={handleClick}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                style={{
                    border: '2px dashed #9333ea',
                    borderRadius: '8px',
                    padding: '40px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    backgroundColor: isDragging ? 'rgba(147, 51, 234, 0.1)' : 'rgba(147, 51, 234, 0.05)',
                    transition: 'all 0.3s ease'
                }}
            >
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    style={{ display: 'none' }}
                />
                <div className="flex flex-col items-center justify-center">
                    <svg 
                        className="w-12 h-12 text-purple-600 mb-4" 
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
                    <p className="text-lg font-medium text-gray-900">
                        Click or drag image here to upload
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                        JPG, JPEG, PNG, BMP, WEBP
                    </p>
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