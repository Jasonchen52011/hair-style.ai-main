// [中文注释]：将其标记为客户端组件，因为我们需要使用状态（useState）和事件处理（onClick, onChange）。
'use client';

import { useState, ChangeEvent } from 'react';
import { Sparkles, Image as ImageIcon, LoaderCircle, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import FaceShapeGuide from '@/components/FaceShapeGuide';
import MoreFreeAITools from '@/components/MoreFreeAITools';
import configData from './config.json';


const IMAGE_CONFIG = {
  width: 700,  // 可修改的默认宽度
  height: 500, // 可修改的默认高度
  minWidth: 200,
  minHeight: 200
};

// [中文注释]：定义示例图片数据
const sampleImages = [
  { src: '/images/examles/david.jpg', alt: 'Male example 1' },
  { src: '/images/examles/michael.jpg', alt: 'Male example 2' },
  { src: '/images/examles/k.jpg', alt: 'Female example 1' },
  { src: '/images/examles/nana.jpg', alt: 'Female example 2' },
];

// [中文注释]：定义从API接收的分析结果的数据结构。
interface AnalysisResult {
  faceShape: string;
  gender: 'male' | 'female';
  characteristics: string;
  positiveVibes: string;
  recommendations: {
    cute: { hairstyleName: string; reason: string };
    gentle: { hairstyleName: string; reason: string };
    cool: { hairstyleName: string; reason: string };
  };
  unsuitable: {
    title: string;
    reason: string;
  };
}

// [中文注释]：生成短的唯一ID
const generateShortId = (): string => {
  return Math.random().toString(36).substring(2, 10);
};

// [中文注释]：主工具页面组件。
const ToolPage = () => {
  const config = configData as any;
  const { toolPageConfig } = config;
  const [image, setImage] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();

  // [中文注释]：处理拖拽事件的函数
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      const selectedFile = files[0];
      // [中文注释]：检查文件类型
      if (!selectedFile.type.startsWith('image/')) {
        setError('Please upload an image file.');
        return;
      }
      // [中文注释]：检查文件大小（例如：最大10MB）
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError('File is too large. Please upload an image under 10MB.');
        return;
      }
      
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
      setError(null);
    }
  };

  // [中文注释]：处理文件上传的函数。
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // [中文注释]：检查文件大小（例如：最大10MB）。
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError('File is too large. Please upload an image under 10MB.');
        return;
      }
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
      setError(null);
    }
  };

  // [中文注释]：处理示例图片选择的函数
  const handleSampleImageClick = async (imageSrc: string) => {
    try {
      const response = await fetch(imageSrc);
      const blob = await response.blob();
      const file = new File([blob], 'sample-image.jpg', { type: blob.type });
      
      setFile(file);
      setImage(imageSrc);
      setError(null);
    } catch (err) {
      setError('Failed to load sample image. Please try again.');
    }
  };

  // [中文注释]：提交分析的函数。
  const handleSubmit = async () => {
    if (!file) {
      setError('Please upload an image first.');
      return;
    }
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch('/api/face-shape-detector', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Something went wrong on the server.');
      }

      const data: AnalysisResult = await response.json();
      
      // [中文注释]：生成短的唯一ID
      const newResultId = generateShortId();
      
      // [中文注释]：将结果和图片存储到localStorage
      localStorage.setItem(`face-analysis-${newResultId}`, JSON.stringify(data));
      localStorage.setItem(`face-image-${newResultId}`, image || '');
      
      // [中文注释]：跳转到结果页面
      router.push(`/face-shape-detector/result?id=${newResultId}`);
    } catch (err: any) {
      setError(err.message || 'Failed to analyze the image. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 sm:py-6
      ">
        {/* [中文注释]：工具的标题和介绍 */}
        <div className="text-center mb-4">
          <h1 className="text-3xl sm:text-5xl font-extrabold text-gray-800 tracking-tight">
          AI Face Shape Detector Online Free
          </h1>
          <p className="mt-4 max-w-5xl mx-auto text-base text-gray-600">
          With Hairstyle AI’s face shape detector, you can find the perfect hairstyle for your face shape in just a few simple steps. Upload your photo and let the AI analyze your face to provide the most flattering style options. Whether you're looking for something bold or classic, we offer tailored recommendations that enhance your unique features and elevate your confidence.
          </p>
        </div>

        {/* [中文注释]：上传区域 - 左右布局 */}
        <div className="bg-white/80 p-2 sm:p-6 max-w-7xl mx-auto rounded-2xl">
          <div className="w-full max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row gap-2 md:gap-4">
              {/* 左侧图片展示区 */}
              <div className="flex justify-center lg:justify-center w-3/5 mt-2 md:mt-5">
                <div className="relative rounded-lg overflow-hidden" style={{ height: `${IMAGE_CONFIG.height}px` }}>
                  <Image
                    src="/images/face-shape-hero.webp"
                    alt="Face shape analysis example"
                    width={IMAGE_CONFIG.width}
                    height={IMAGE_CONFIG.height}
                    className="object-cover rounded-lg w-full h-full"
                    priority
                  />
                </div>
              </div>

              {/* 右侧操作区 */}
              <div className="w-2/5">
                {/* 步骤指示器 - 居中显示 */}
                <div className="flex justify-center items-center space-x-1 text-base mb-8">
                  {['Upload Photo', 'Submit Image', 'View Results'].map((label, idx) => (
                    <div key={label} className="flex items-center">
                      <div
                        className={`flex items-center justify-center rounded-full w-8 h-8 text-white font-bold mr-2 ${
                          idx === 0 || (idx === 1 && image) || (idx === 2 && loading)
                            ? 'bg-purple-700'
                            : 'bg-gray-300'
                        }`}
                      >
                        {idx + 1}
                      </div>
                      <span className="text-sm whitespace-nowrap">{label}</span>
                    </div>
                  ))}
                </div>

                {/* 上传区域 */}
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  className="border-2 border-dashed border-gray-300 hover:border-purple-700 rounded-lg p-3 md:p-4 text-center cursor-pointer transition-colors bg-white mb-4"
                  onClick={() => document.getElementById('file-upload')?.click()}
                >
                  {image ? (
                    <div className="flex flex-col items-center">
                      <div className="relative w-full max-w-sm h-40 mb-2 transition-transform duration-300 hover:scale-105">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={image}
                          alt="Face preview"
                          style={{ objectFit: 'contain', width: '100%', height: '150px', borderRadius: '0.5rem' }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-40 md:h-48 py-6">
                      <ImageIcon className="w-12 h-12 text-gray-400 mb-2" />
                      <p className="text-gray-600 text-base mb-1">Drag and drop or click to upload image</p>
                      <p className="text-xs text-gray-500">JPG, JPEG, PNG, BMP, WEBP</p>
                    </div>
                  )}
                  <input
                    type="file"
                    id="file-upload"
                    className="hidden"
                    accept="image/png, image/jpeg, image/webp, image/bmp"
                    onChange={handleFileChange}
                    disabled={loading}
                  />
                </div>

                {/* 预设图片选择区域 */}
                <div className="mb-4">
                  <p className="block text-sm text-gray-600 font-semibold mb-2">Or select a preset example</p>
                  <div className="grid grid-cols-4 gap-2">
                    {sampleImages.map((sample, index) => (
                      <div 
                        key={index} 
                        className="relative cursor-pointer hover:opacity-80 transition-opacity rounded-md overflow-hidden border-2 border-gray-300 hover:border-purple-700"
                        onClick={() => handleSampleImageClick(sample.src)}
                      >
                        <div className="aspect-square relative">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={sample.src}
                            alt={sample.alt}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 分析按钮 */}
                <button
                  onClick={handleSubmit}
                  disabled={!file || loading}
                  className="w-full bg-purple-700 hover:bg-purple-800 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-300 ease-in-out disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed flex items-center justify-center text-lg focus:outline-none focus:ring-2 focus:ring-purple-700 focus:ring-opacity-75"
                >
                  {loading ? (
                    <>
                      <LoaderCircle className="animate-spin mr-3 h-5 w-5" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-5 w-5" />
                      Analyze My Face Shape
                    </>
                  )}
                </button>

                {error && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg text-center">
                    <div className="flex items-center justify-center">
                      <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0" />
                      <p className="text-sm"><strong>Error:</strong> {error}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

  
      </div>
      
      {/* 脸型指南 Section */}
      <FaceShapeGuide />
    </div>
  );
};

export default ToolPage;