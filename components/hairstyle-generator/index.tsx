"use client";

import { useState, useRef, useEffect } from "react";
import toast from 'react-hot-toast';
import { femaleStyles, maleStyles, hairColors, HairStyle } from '@/lib/hairstyles';



interface HairStyleGeneratorProps {
  onStyleGenerated?: (resultImageUrl: string) => void;
}

export default function HairStyleGenerator({ 
  onStyleGenerated 
}: HairStyleGeneratorProps) {
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | undefined>();
  const [selectedGender, setSelectedGender] = useState<"Female" | "Male">("Female");
  const [selectedStyle, setSelectedStyle] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("brown");
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<"upload" | "select">("upload");

  const currentStyles = selectedGender === "Female" ? femaleStyles : maleStyles;

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        
        // 这里添加你的文件上传逻辑
        // const response = await fetch('/api/upload', {
        //   method: 'POST',
        //   body: formData
        // });
        // const data = await response.json();
        
        // 临时使用本地 URL 进行测试
        const localUrl = URL.createObjectURL(file);
        setUploadedImageUrl(localUrl);
        setCurrentStep("select");
        toast.success('picture uploaded successfully!');
      } catch (error) {
        console.error('Upload failed:', error);
        toast.error('picture upload failed, please try again');
      }
    }
  };

  const handleStyleClick = (style: string) => {
    setSelectedStyle(style);
  };

  const pollTaskStatus = async (taskId: string, maxAttempts = 12) => {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const response = await fetch(`/api/task-status?taskId=${taskId}`);
        const data = await response.json();
        
        if (data.status === 'completed' && data.result) {
          return data.result;
        } else if (data.status === 'failed') {
          throw new Error(data.message || '任务处理失败');
        }
        
        // 等待3秒后再次检查
        await new Promise(resolve => setTimeout(resolve, 3000));
      } catch (error) {
        console.error('Error polling task status:', error);
        throw error;
      }
    }
    throw new Error('Processing timeout');
  };

  const handleGenerate = async () => {
    if (!selectedStyle || !uploadedImageUrl) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageUrl: uploadedImageUrl,
          style: selectedStyle,
          color: selectedColor,
        }),
      });

      if (response.status === 429) {
        toast.error('You have reached the daily 5 free generation limit, please try again tomorrow.', {
          duration: 5000,
          style: {
            background: '#1F2937',
            color: '#fff',
          },
        });
        return;
      }

      const data = await response.json();
      
      if (data.status === 'processing' && data.taskId) {
        const result = await pollTaskStatus(data.taskId);
        if (result.data.images) {
          const firstStyle = Object.keys(result.data.images)[0];
          const imageUrl = result.data.images[firstStyle][0];
          
          const currentStyle = currentStyles.find(style => style.style === selectedStyle);
          const imageUrlWithStyle = `${imageUrl}?style=${encodeURIComponent(currentStyle?.description || 'hairstyle')}`;
          
          onStyleGenerated?.(imageUrlWithStyle);
          
          toast.success('Generation successful!', {
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
          throw new Error('Failed to get result image');
        }
      } else if (!data.success) {
        throw new Error(data.error || 'Failed to process image');
      }

    } catch (error) {
      console.error('Style selection error:', error);
      toast.error(error instanceof Error ? error.message : 'picture processing failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToUpload = () => {
    setCurrentStep("upload");
    setUploadedImageUrl(undefined);
    setSelectedStyle("");
    setSelectedGender("Female");
    setSelectedColor("brown");
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-6">
      {/* 进度指示器 */}
      <div className="flex items-center mb-6">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
          currentStep === "upload" ? "bg-purple-700 text-white" : "bg-green-500 text-white"
        }`}>
          {currentStep === "upload" ? "1" : "✓"}
        </div>
        <div className={`flex-1 h-1 mx-2 ${
          currentStep === "select" ? "bg-purple-700" : "bg-gray-200"
        }`}></div>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
          currentStep === "select" ? "bg-purple-700 text-white" : "bg-gray-200 text-gray-500"
        }`}>
          2
        </div>
        <div className="ml-4 text-sm text-gray-600">
          {currentStep === "upload" ? "Upload photo" : "Choose hairstyle"}
        </div>
      </div>

      {currentStep === "upload" ? (
        // 照片上传界面
        <div className="text-center">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">AI Hair Style Generator</h2>
            <p className="text-gray-600">Upload your photo, let AI recommend the most suitable hairstyle for you</p>
          </div>
          
          <div className="mb-8">
            <input
              type="file"
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
              id="photo-upload"
            />
            <label 
              htmlFor="photo-upload" 
              className="inline-flex items-center justify-center px-8 py-4 bg-purple-700 text-white font-medium rounded-lg hover:bg-purple-800 transition-colors cursor-pointer"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Choose photo
            </label>
          </div>

          <div className="text-sm text-gray-500">
            Support JPG、PNG format, file size less than 10MB
          </div>
        </div>
      ) : (
        // 发型选择界面
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800">Choose hairstyle and color</h2>
            <button
              onClick={handleBackToUpload}
              className="text-purple-700 hover:text-purple-800 text-sm font-medium"
            >
              ← Reupload photo
            </button>
          </div>

          {/* 上传的照片预览 */}
          {uploadedImageUrl && (
            <div className="mb-6 text-center">
              <img
                src={uploadedImageUrl}
                alt="uploaded photo"
                className="w-32 h-32 object-cover rounded-lg mx-auto border-2 border-gray-200"
              />
            </div>
          )}

          {/* 性别选择 */}
          <div className="mb-6 bg-gray-50 p-2 rounded-lg">
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
                Female hairstyle
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
                Male hairstyle
              </button>
            </div>
          </div>

          {/* 发型选择 */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-800 mb-3">Choose hairstyle</h3>
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 max-h-96 overflow-y-auto">
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
                  <div className="w-full h-20 mb-1 overflow-hidden rounded-xl bg-gray-100 flex items-center justify-center">
                    <img
                      src={style.imageUrl}
                      alt={style.alt}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.parentElement?.insertAdjacentHTML('beforeend', 
                          `<div class="w-full h-full flex items-center justify-center text-xs text-gray-400">
                            ${style.description}
                          </div>`
                        );
                      }}
                    />
                  </div>
                  <p className={`text-xs font-medium text-center min-h-[2.0em] flex items-center justify-center ${
                    selectedStyle === style.style ? "text-white" : "text-gray-700"
                  }`}>
                    {style.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* 颜色选择 */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-800 mb-3">Choose color</h3>
            <div className="grid grid-cols-7 gap-2">
              {hairColors.map((color) => (
                <button
                  key={color.id}
                  onClick={() => setSelectedColor(color.id)}
                  className={`w-10 h-10 rounded-md transition-all ${
                    selectedColor === color.id 
                      ? "ring-2 ring-purple-700 ring-offset-1" 
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
                    boxShadow: color.id === "white" 
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

          {/* 生成按钮 */}
          <button
            onClick={handleGenerate}
            className="w-full py-4 bg-purple-700 text-white rounded-lg font-medium hover:bg-purple-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            disabled={!selectedStyle || !uploadedImageUrl || isLoading}
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
            ) : (
              "Generate Hairstyle"
            )}
          </button>
        </div>
      )}
    </div>
  );
}