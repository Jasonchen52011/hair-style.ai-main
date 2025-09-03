"use client";

import { useState, ChangeEvent, DragEvent, useRef } from 'react';
import Image from 'next/image';
import { Upload, LoaderCircle, AlertTriangle, CheckCircle } from 'lucide-react';

// 发质分析结果接口
interface HairTypeAnalysis {
  hairType: string;
  confidence: number;
  characteristics: string[];
  commonIssues: string[];
  suitableStyles: string[];
  careAdvice: string[];
  productRecommendations: string[];
}

interface APIResponse {
  results: HairTypeAnalysis[];
  processingTime: number;
  success: boolean;
  error?: string;
}

// 示例图片 - 使用ai-hairstyle的真实案例
const sampleImages = [
  { src: '/images/examles/david.jpg', alt: 'Male Hair Example - David', type: 'Male' },
  { src: '/images/examles/michael.jpg', alt: 'Male Hair Example - Michael', type: 'Male' },
  { src: '/images/examles/k.jpg', alt: 'Female Hair Example - K', type: 'Female' },
  { src: '/images/examles/nana.jpg', alt: 'Female Hair Example - Nana', type: 'Female' },
];


// 发型图片映射 - 使用实际存在的58个发型图片
const getHairstyleImage = (styleName: string) => {
  const styleMap: { [key: string]: string } = {
    // Female styles (34个)
    'Bob cut': '/images/hairstyles/female/bob-cut.webp',
    'Bowl cut': '/images/hairstyles/female/bowl-cut.webp',
    'Curly bob': '/images/hairstyles/female/curly-bob.webp', 
    'Neat bob': '/images/hairstyles/female/neat-bob.webp',
    'Wavy bob': '/images/hairstyles/female/wavy-french-bob.webp',
    'Stacked curls bob': '/images/hairstyles/female/stacked-curls-bob.webp',
    'Pixie cut': '/images/hairstyles/female/pixie-cut.webp',
    'Short pixie': '/images/hairstyles/female/short-pixie.webp',
    'Short curly pixie': '/images/hairstyles/female/short-curly-pixie.webp',
    'Buzz cut female': '/images/hairstyles/female/buzzcutfemale.webp',
    'Long straight': '/images/hairstyles/female/long-straight.webp',
    'Long wavy': '/images/hairstyles/female/long-wavy.webp',
    'Long curly': '/images/hairstyles/female/long-curly.webp',
    'Long hime cut': '/images/hairstyles/female/long-hime-cut.webp',
    'Long twintails': '/images/hairstyles/female/long-twintails.webp',
    'Medium layered': '/images/hairstyles/female/medium-long-layered.webp',
    'Shoulder length': '/images/hairstyles/female/shoulder-length.webp',
    'Japanese short': '/images/hairstyles/female/japanese-short.webp',
    'French bangs': '/images/hairstyles/female/french-bangs.webp',
    'Ponytail': '/images/hairstyles/female/ponytail.webp',
    'Updo': '/images/hairstyles/female/updo.webp',
    'Chignon': '/images/hairstyles/female/chignon.webp',
    'Double bun': '/images/hairstyles/female/double-bun.webp',
    'Short twintails': '/images/hairstyles/female/short-twintails.webp',
    'Twin braids': '/images/hairstyles/female/twin-braids.webp',
    'Fishtail braid': '/images/hairstyles/female/fishtail-braid.webp',
    'Box braids': '/images/hairstyles/female/box-braids.webp',
    'Cornrows': '/images/hairstyles/female/cornrows.webp',
    'Dreadlocks': '/images/hairstyles/female/dreadlocks.webp',
    'Side part fade': '/images/hairstyles/female/side-part-fade.webp',
    'Slicked back': '/images/hairstyles/female/slicked-back.webp',
    'Spiked': '/images/hairstyles/female/spiked.webp',
    'Loose curly afro': '/images/hairstyles/female/loose-curly-afro.webp',
    'Black female': '/images/hairstyles/female/black female.webp',
    
    // Male styles (24个)
    'Afro': '/images/hairstyles/male/afro.webp',
    'Blunt bowl cut': '/images/hairstyles/male/blunt-bowl-cut.webp',
    'Buzz cut': '/images/hairstyles/male/buzz-cut.webp',
    'Chestnut': '/images/hairstyles/male/chestnut.webp',
    'Choppy bangs': '/images/hairstyles/male/choppy-bangs.webp',
    'Comb over': '/images/hairstyles/male/comb-over.webp',
    'Cornrow braids': '/images/hairstyles/male/cornrow-braids.webp',
    'Curly shag': '/images/hairstyles/male/curly-shag.webp',
    'Faux hawk': '/images/hairstyles/male/faux-hawk.webp',
    'High tight fade': '/images/hairstyles/male/high-tight-fade.webp',
    'Long hair tied up': '/images/hairstyles/male/long-hair-tied-up.webp',
    'Long wavy curtain': '/images/hairstyles/male/long-wavy-curtain.webp',
    'Low fade': '/images/hairstyles/male/low-fade.webp',
    'Man bun': '/images/hairstyles/male/man-bun.webp',
    'Messy tousled': '/images/hairstyles/male/messy-tousled.webp',
    'Pompadour': '/images/hairstyles/male/pompadour.webp',
    'Slick back': '/images/hairstyles/male/slick-back.webp',
    'Spiky': '/images/hairstyles/male/spiky.webp',
    'Textured fringe': '/images/hairstyles/male/textured-fringe.webp',
    'Tinfoil perm': '/images/hairstyles/male/tinfoil-perm.webp',
    'Two block': '/images/hairstyles/male/two-block.webp',
    'Undercut': '/images/hairstyles/male/undercut.webp',
    'Undercut long hair': '/images/hairstyles/male/undercut-long-hair.webp',
    'Wavy shag': '/images/hairstyles/male/wavy-shag.webp',
  };
  
  // 尝试精确匹配
  if (styleMap[styleName]) {
    return styleMap[styleName];
  }
  
  // 部分匹配
  const lowerStyleName = styleName.toLowerCase();
  if (lowerStyleName.includes('bob')) return '/images/hairstyles/female/bob-cut.webp';
  if (lowerStyleName.includes('pixie')) return '/images/hairstyles/female/pixie-cut.webp';
  if (lowerStyleName.includes('wavy')) return '/images/hairstyles/female/long-wavy.webp';
  if (lowerStyleName.includes('curly')) return '/images/hairstyles/female/curly-bob.webp';
  if (lowerStyleName.includes('braid')) return '/images/hairstyles/female/twin-braids.webp';
  if (lowerStyleName.includes('fade')) return '/images/hairstyles/male/low-fade.webp';
  if (lowerStyleName.includes('buzz')) return '/images/hairstyles/male/buzz-cut.webp';
  if (lowerStyleName.includes('undercut')) return '/images/hairstyles/male/undercut.webp';
  if (lowerStyleName.includes('afro')) return '/images/hairstyles/male/afro.webp';
  if (lowerStyleName.includes('shag')) return '/images/hairstyles/male/curly-shag.webp';
  
  // 默认图片
  return '/images/hairstyles/female/bob-cut.webp';
};


// 生成赞美语句
const getCompliment = (hairType: string) => {
  const compliments: { [key: string]: string } = {
    'Type 1A': 'Your silky smooth hair has a naturally elegant flow!',
    'Type 1B': 'Your straight hair has beautiful body and movement!',
    'Type 1C': 'Your hair has gorgeous thickness and natural shine!',
    'Type 2A': 'Your gentle waves create such a romantic, effortless look!',
    'Type 2B': 'Your natural waves give you that perfect beachy texture!',
    'Type 2C': 'Your bold waves create stunning volume and character!',
    'Type 3A': 'Your soft curls have such beautiful bounce and definition!',
    'Type 3B': 'Your spiraled curls create amazing texture and personality!',
    'Type 3C': 'Your tight curls have incredible volume and natural beauty!',
    'Type 4A': 'Your coils have such beautiful definition and natural elegance!',
    'Type 4B': 'Your unique texture creates amazing versatility and style options!',
    'Type 4C': 'Your dense coils have incredible strength and natural beauty!',
  };
  
  // 提取类型前缀（如 "Type 2A"）
  const typePrefix = hairType.split(' - ')[0];
  return compliments[typePrefix] || 'Your hair has its own unique beauty and character!';
};

export default function HairTypeIdentifierTool() {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [results, setResults] = useState<HairTypeAnalysis[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // 处理文件上传
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleImageSelection(file);
    }
  };

  // 处理拖拽上传
  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      handleImageSelection(file);
    }
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  // 处理图片选择
  const handleImageSelection = (file: File) => {
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      setError('Image size must be less than 10MB');
      return;
    }

    setSelectedImage(file);
    setError(null);
    setResults(null);

    // 创建预览
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // 处理示例图片选择
  const handleSampleImageSelect = (imageSrc: string) => {
    fetch(imageSrc)
      .then(res => res.blob())
      .then(blob => {
        const file = new File([blob], 'sample-hair.jpg', { type: 'image/jpeg' });
        handleImageSelection(file);
      })
      .catch(() => {
        setError('Failed to load sample image');
      });
  };

  // 分析发质
  const analyzeHairType = async () => {
    if (!selectedImage) {
      setError('Please select an image first');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('image', selectedImage);

      const response = await fetch('/api/hair-type-identifier', {
        method: 'POST',
        body: formData,
      });

      const data: APIResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Analysis failed');
      }

      setResults(data.results);
      
      // 滚动到结果部分
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }, 100);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <section className="bg-gray-50 py-2 sm:py-10 mt-2 sm:mt-6">
      <div className="container mx-auto px-4 max-w-5xl">

        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            AI Hair Type Identifier
          </h1>
          <p className="text-lg text-gray-600 max-w-4xl mx-auto leading-relaxed">
            Upload a photo and let our hair type identifier analyze your unique hair texture, curl pattern, and thickness. Get personalized recommendations for products and styles that work best for your specific hair type.
          </p>
        </div>

        {/* Tool Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-2">
          {/* Right Side Image - Mobile: Show first */}
          <div className="flex items-center justify-center order-1 lg:order-2">
            <div className="w-full">
              <img
                src="/images/hair-type-identifier.webp"
                alt="Hair Type Analysis Demo - Before and after comparison showing AI hair type identification results"
                className="w-full h-auto rounded-2xl shadow-lg"
              />
            </div>
          </div>

          {/* Upload Section - Mobile: Show second */}
          <div className="bg-white rounded-2xl p-4 order-2 lg:order-1">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Upload Your Hair Photo</h2>
            
            {/* Upload Area */}
            <div className="relative">
              <div
                className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:border-purple-400 transition-colors cursor-pointer"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => document.getElementById('file-upload')?.click()}
              >
                {previewUrl ? (
                  <div className="space-y-2">
                    <Image
                      src={previewUrl}
                      alt="Preview"
                      width={120}
                      height={120}
                      className="mx-auto rounded-lg object-cover"
                    />
                    <p className="text-sm text-gray-600">Image selected successfully!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Upload className="w-10 h-10 text-gray-400 mx-auto" />
                    <div>
                      <p className="text-base font-medium text-gray-700">
                        Drag and drop your hair photo here
                      </p>
                      <p className="text-sm text-gray-500">or click to browse files</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Supports JPG, PNG up to 10MB
                      </p>
                    </div>
                  </div>
                )}
              </div>
              <input
                id="file-upload"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          </div>

          {/* Sample Images */}
          <div className="mb-4">
            <h3 className="text-base font-medium text-gray-900 mb-2">Or try with sample images:</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {sampleImages.map((sample, index) => (
                <div
                  key={index}
                  className="relative cursor-pointer group"
                  onClick={() => handleSampleImageSelect(sample.src)}
                >
                  <Image
                    src={sample.src}
                    alt={sample.alt}
                    width={150}
                    height={150}
                    className="w-full h-24 object-cover rounded-lg transition-transform group-hover:scale-105"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Analyze Button */}
          <button
            onClick={analyzeHairType}
            disabled={!selectedImage || isLoading}
            className={`w-full py-3 px-6 rounded-xl font-semibold text-white transition-all ${
              !selectedImage || isLoading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-purple-600 hover:bg-purple-700 active:transform active:scale-95'
            }`}
          >
            {isLoading ? (
              <div className="flex items-center justify-center space-x-2">
                <LoaderCircle className="w-5 h-5 animate-spin" />
                <span>Analyzing Hair Type...</span>
              </div>
            ) : (
              'Analyze My Hair Type'
            )}
          </button>

            {/* Error Message */}
            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                <p className="text-red-700">{error}</p>
              </div>
            )}
          </div>
        </div>

        {/* Results Section */}
        {results && (
          <div ref={resultsRef} className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Hair Type Analysis</h2>
              <p className="text-gray-600">Here are the top 3 matches for your hair type:</p>
            </div>

            {results.map((result, index) => (
              <div
                key={index}
                className={`bg-white rounded-2xl shadow-lg overflow-hidden ${
                  index === 0 ? 'border-2 border-purple-200' : 'border border-gray-200'
                }`}
              >
                <div className="p-6">
                  {/* Title with confidence percentage */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <span className="text-4xl font-black text-purple-700">
                        {result.confidence}%
                      </span>
                      <h3 className={`font-bold ${index === 0 ? 'text-xl text-purple-900' : 'text-lg text-gray-900'}`}>
                        {result.hairType}
                      </h3>
                    </div>
                  </div>

                  {/* Characteristics with Compliment */}
                  <div className="mb-6 p-4 bg-purple-50 rounded-lg">
                    <p className="text-purple-700 font-medium mb-2">{getCompliment(result.hairType)}</p>
                    <p className="text-gray-700 text-sm">
                      Your hair shows {result.characteristics.join(', ').toLowerCase()}.
                    </p>
                  </div>

                  {/* 1. Issues and Care Advice + Product Recommendations */}
                  <div className="mb-6">
                    <div className="flex items-start space-x-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center text-sm font-bold">1</span>
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Common Issues</h4>
                          <ul className="space-y-1">
                            {result.commonIssues.map((issue, i) => (
                              <li key={i} className="text-sm text-gray-600 flex items-start">
                                <AlertTriangle className="w-3 h-3 text-amber-500 mt-1 mr-2 flex-shrink-0" />
                                {issue}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Care Advice</h4>
                          <ul className="space-y-1">
                            {result.careAdvice.map((advice, i) => (
                              <li key={i} className="text-sm text-gray-600 flex items-start">
                                <CheckCircle className="w-3 h-3 text-green-500 mt-1 mr-2 flex-shrink-0" />
                                {advice}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Product Recommendations</h4>
                          <ul className="space-y-1">
                            {result.productRecommendations.map((product, i) => (
                              <li key={i} className="text-sm text-gray-600 flex items-start">
                                <CheckCircle className="w-3 h-3 text-blue-500 mt-1 mr-2 flex-shrink-0" />
                                {product}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 2. Recommended Styles with Images */}
                  <div className="mb-6">
                    <div className="flex items-start space-x-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">2</span>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 mb-3">Recommended Styles</h4>
                        <div className="flex flex-wrap gap-4">
                          {result.suitableStyles.map((style, i) => (
                            <div key={i} className="flex items-center space-x-3">
                              <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                                <Image
                                  src={getHairstyleImage(style)}
                                  alt={style}
                                  width={64}
                                  height={64}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <p className="text-sm text-gray-700 font-medium">{style}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}