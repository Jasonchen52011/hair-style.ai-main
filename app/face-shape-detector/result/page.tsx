'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ChevronsRight, ArrowLeft } from 'lucide-react';
import { femaleStyles, maleStyles, HairStyle } from '@/lib/hairstyles';

// 图片尺寸配置
const IMAGE_CONFIG = {
  width: 400,
  height: 400,
  maxWidth: 800,
  maxHeight: 800,
  minWidth: 200,
  minHeight: 200
};

// 分析结果数据结构
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

// 根据性别获取对应的发型数据
const getHairstylesByGender = (gender: 'male' | 'female'): HairStyle[] => {
  return gender === 'female' ? femaleStyles : maleStyles;
};

const ResultPage = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const resultId = searchParams.get('id');

  useEffect(() => {
    // 从 localStorage 获取结果数据
    const loadResult = () => {
      if (!resultId) {
        setError('No result ID provided.');
        setLoading(false);
        return;
      }

      try {
        const storedResult = localStorage.getItem(`face-analysis-${resultId}`);
        const storedImage = localStorage.getItem(`face-image-${resultId}`);
        
        if (storedResult && storedImage) {
          setResult(JSON.parse(storedResult));
          setImage(storedImage);
        } else {
          setError('Result not found. Please try analyzing again.');
        }
      } catch (err) {
        setError('Failed to load result data.');
      } finally {
        setLoading(false);
      }
    };

    loadResult();
  }, [resultId]);


  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-700 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your results...</p>
        </div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Oops! Something went wrong</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/face-shape-detector')}
            className="bg-purple-700 hover:bg-purple-800 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 顶部导航和操作按钮 */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <button
            onClick={() => router.push('/face-shape-detector')}
            className="flex items-center text-purple-600 hover:text-purple-800 font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            New Analysis
          </button>
        </div>

        {/* 页面标题 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-800 tracking-tight">
            Your Face Shape <span className="text-purple-700">Analysis Results</span>
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Personalized hairstyle recommendations based on your unique features
          </p>
        </div>

        {/* 结果展示区域 */}
        <div className="bg-white/90 rounded-2xl p-8 backdrop-blur-sm shadow-lg">
          <div className="space-y-8">
            {/* 第一行 - 用户图片和脸型介绍 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* 左侧 - 用户上传的图片 */}
              <div className="bg-white/90 rounded-lg p-6 backdrop-blur-sm ">
                <div 
                  className="rounded-lg overflow-hidden mx-auto"
                  style={{ 
                    width: `${Math.min(IMAGE_CONFIG.width, 400)}px`, 
                    height: `${Math.min(IMAGE_CONFIG.height, 400)}px`,
                    maxWidth: '100%'
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={image || ''} 
                    alt="Your uploaded photo" 
                    className="object-cover w-full h-full"
                  />
                </div>
              </div>

              {/* 右侧 - 脸型和特点 */}
              <div className="bg-purple-50 rounded-lg p-6 backdrop-blur-sm ">
                <h3 className="text-3xl font-bold text-gray-800 mb-4">
                  Your Face Shape: 
                  <span className="text-purple-700">{result.faceShape}</span>
                </h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-gray-700 text-lg whitespace-pre-line">{result.characteristics}</p>
                  </div>
                  
                  {/* 明星同款脸型 */}
                  <div className="pt-1">
                    <div className="space-y-2">
                      {(() => {
                        // 根据脸型返回对应的明星示例
                        const getCelebrityExamples = (faceShape: string) => {
                          const celebrities: Record<string, string[]> = {
                            'Oval': ['Emma Watson', 'Beyoncé', 'Blake Lively'],
                            'Round': ['Selena Gomez', 'Mila Kunis', 'Chrissy Teigen'],
                            'Square': ['Angelina Jolie', 'Keira Knightley', 'Sandra Bullock'],
                            'Heart': ['Reese Witherspoon', 'Scarlett Johansson', 'Taylor Swift'],
                            'Diamond': ['Tyra Banks', 'Jennifer Lopez', 'Halle Berry'],
                            'Oblong': ['Sarah Jessica Parker', 'Liv Tyler', 'Gwyneth Paltrow']
                          };
                          return celebrities[faceShape] || ['Many celebrities', 'Famous personalities', 'Popular stars'];
                        };
                        
                        const examples = getCelebrityExamples(result.faceShape);
                        
                        return examples.map((celebrity, index) => (
                          <p key={index} className="text-gray-700 flex items-center">
                            <span className="w-2 h-2 bg-purple-500 rounded-full mr-3 flex-shrink-0"></span>
                            <span className="font-medium text-purple-700">{celebrity}</span>
                            <span className="ml-2 text-gray-600">also has {result.faceShape.toLowerCase()} face shape</span>
                          </p>
                        ));
                      })()}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xl font-semibold text-gray-800 mb-2">The Beauty of Your Shape</h4>
                    <p className="text-gray-700 text-lg whitespace-pre-line">{result.positiveVibes}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 第二行 - 根据性别显示对应的推荐发型 */}
            <div>
              <h3 className="text-3xl font-bold text-gray-800 mb-6 text-center">
                Recommended {result.gender === 'male' ? 'Men\'s' : 'Women\'s'} Hairstyles
              </h3>
              
              {/* 垂直排列的左图右文布局 */}
              <div className="space-y-6">
                {/* Cute Style */}
                <div className="bg-white/60 rounded-lg p-6 backdrop-blur-sm border border-gray-100">
                  <div className="flex gap-6">
                    {/* 左侧图片 */}
                    <div className="w-1/3 flex-shrink-0">
                      {(() => {
                        const genderStyles = getHairstylesByGender(result.gender);
                        const hairstyleData = genderStyles.find(s => 
                          s.description.toLowerCase() === result.recommendations.cute.hairstyleName.toLowerCase() ||
                          s.style.toLowerCase() === result.recommendations.cute.hairstyleName.toLowerCase() ||
                          s.description.toLowerCase().includes(result.recommendations.cute.hairstyleName.toLowerCase()) ||
                          result.recommendations.cute.hairstyleName.toLowerCase().includes(s.description.toLowerCase())
                        );
                        const hairstyleLink = `https://hair-style.ai/ai-hairstyle?style=${result.recommendations.cute.hairstyleName.replace(/\s+/g, '').toLowerCase()}`;
                        
                        return hairstyleData ? (
                          <a href={hairstyleLink} target="_blank" rel="noopener noreferrer" className="block rounded-lg overflow-hidden group">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img 
                              src={hairstyleData.imageUrl} 
                              alt={hairstyleData.alt} 
                              className="w-full h-80 object-cover transition-transform duration-300 group-hover:scale-105" 
                            />
                          </a>
                        ) : (
                          <div className="w-full h-80 bg-gray-200 rounded-lg flex items-center justify-center">
                            <span className="text-gray-500">No image</span>
                          </div>
                        );
                      })()}
                    </div>
                    
                    {/* 右侧内容 */}
                    <div className="w-3/5">
                      <h4 className="text-2xl font-bold text-gray-800 mb-3">Cute Style: {result.recommendations.cute.hairstyleName}</h4>
                      <p className="text-gray-700 text-lg leading-relaxed mb-4">{result.recommendations.cute.reason}</p>
                      <a 
                        href={`https://hair-style.ai/ai-hairstyle?style=${result.recommendations.cute.hairstyleName.replace(/\s+/g, '').toLowerCase()}`}
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="inline-flex items-center text-purple-600 hover:text-purple-800 font-medium"
                      >
                        Try it with AI <ChevronsRight className="w-4 h-4 ml-1" />
                      </a>
                    </div>
                  </div>
                </div>

                {/* Gentle Style */}
                <div className="bg-white/60 rounded-lg p-6 backdrop-blur-sm border border-gray-100">
                  <div className="flex gap-6">
                    {/* 左侧图片 */}
                    <div className="w-1/3 flex-shrink-0">
                      {(() => {
                        const genderStyles = getHairstylesByGender(result.gender);
                        const hairstyleData = genderStyles.find(s => 
                          s.description.toLowerCase() === result.recommendations.gentle.hairstyleName.toLowerCase() ||
                          s.style.toLowerCase() === result.recommendations.gentle.hairstyleName.toLowerCase() ||
                          s.description.toLowerCase().includes(result.recommendations.gentle.hairstyleName.toLowerCase()) ||
                          result.recommendations.gentle.hairstyleName.toLowerCase().includes(s.description.toLowerCase())
                        );
                        const hairstyleLink = `https://hair-style.ai/ai-hairstyle?style=${result.recommendations.gentle.hairstyleName.replace(/\s+/g, '').toLowerCase()}`;
                        
                        return hairstyleData ? (
                          <a href={hairstyleLink} target="_blank" rel="noopener noreferrer" className="block rounded-lg overflow-hidden group">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img 
                              src={hairstyleData.imageUrl} 
                              alt={hairstyleData.alt} 
                              className="w-full h-80 object-cover transition-transform duration-300 group-hover:scale-105" 
                            />
                          </a>
                        ) : (
                          <div className="w-full h-80 bg-gray-200 rounded-lg flex items-center justify-center">
                            <span className="text-gray-500">No image</span>
                          </div>
                        );
                      })()}
                    </div>
                    
                    {/* 右侧内容 */}
                    <div className="w-3/5">
                      <h4 className="text-2xl font-bold text-gray-800 mb-3">Gentle Style: {result.recommendations.gentle.hairstyleName}</h4>
                      <p className="text-gray-700 text-lg leading-relaxed mb-4">{result.recommendations.gentle.reason}</p>
                      <a 
                        href={`https://hair-style.ai/ai-hairstyle?style=${result.recommendations.gentle.hairstyleName.replace(/\s+/g, '').toLowerCase()}`}
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="inline-flex items-center text-purple-600 hover:text-purple-800 font-medium"
                      >
                        Try it with AI <ChevronsRight className="w-4 h-4 ml-1" />
                      </a>
                    </div>
                  </div>
                </div>

                {/* Cool Style */}
                <div className="bg-white/60 rounded-lg p-6 backdrop-blur-sm border border-gray-100">
                  <div className="flex gap-6">
                    {/* 左侧图片 */}
                    <div className="w-1/3 flex-shrink-0">
                      {(() => {
                        const genderStyles = getHairstylesByGender(result.gender);
                        const hairstyleData = genderStyles.find(s => 
                          s.description.toLowerCase() === result.recommendations.cool.hairstyleName.toLowerCase() ||
                          s.style.toLowerCase() === result.recommendations.cool.hairstyleName.toLowerCase() ||
                          s.description.toLowerCase().includes(result.recommendations.cool.hairstyleName.toLowerCase()) ||
                          result.recommendations.cool.hairstyleName.toLowerCase().includes(s.description.toLowerCase())
                        );
                        const hairstyleLink = `https://hair-style.ai/ai-hairstyle?style=${result.recommendations.cool.hairstyleName.replace(/\s+/g, '').toLowerCase()}`;
                        
                        return hairstyleData ? (
                          <a href={hairstyleLink} target="_blank" rel="noopener noreferrer" className="block rounded-lg overflow-hidden group">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img 
                              src={hairstyleData.imageUrl} 
                              alt={hairstyleData.alt} 
                              className="w-full h-80 object-cover transition-transform duration-300 group-hover:scale-105" 
                            />
                          </a>
                        ) : (
                          <div className="w-full h-80 bg-gray-200 rounded-lg flex items-center justify-center">
                            <span className="text-gray-500">No image</span>
                          </div>
                        );
                      })()}
                    </div>
                    
                    {/* 右侧内容 */}
                    <div className="w-3/5">
                      <h4 className="text-2xl font-bold text-gray-800 mb-3">Cool Style: {result.recommendations.cool.hairstyleName}</h4>
                      <p className="text-gray-700 text-lg leading-relaxed mb-4">{result.recommendations.cool.reason}</p>
                      <a 
                        href={`https://hair-style.ai/ai-hairstyle?style=${result.recommendations.cool.hairstyleName.replace(/\s+/g, '').toLowerCase()}`}
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="inline-flex items-center text-purple-600 hover:text-purple-800 font-medium"
                      >
                        Try it with AI <ChevronsRight className="w-4 h-4 ml-1" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 第三行 - 不适合的发型 */}
            <div>
              <div className="bg-red-50 rounded-lg p-6 border border-red-200">
                <h3 className="text-xl font-bold text-gray-700 mb-3">{result.unsuitable.title}</h3>
                <p className="text-gray-700 whitespace-pre-line">{result.unsuitable.reason}</p>
              </div>
            </div>

            {/* 底部行动呼吁 */}
            <div className="text-center bg-purple-50 rounded-lg p-8 backdrop-blur-sm border border-purple-100">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Ready to Try Your New Look?</h3>
              <p className="text-gray-600 mb-6">Use our AI hairstyle generator to see how these styles would look on you!</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="https://hair-style.ai/ai-hairstyle"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-purple-700 hover:bg-purple-800 text-white font-semibold py-3 px-6 rounded-lg transition-colors inline-flex items-center justify-center"
                >
                  Try AI Hairstyle Generator
                  <ChevronsRight className="w-5 h-5 ml-2" />
                </a>
                <button
                  onClick={() => router.push('/face-shape-detector')}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-6 rounded-lg transition-colors"
                >
                  Analyze Another Photo
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultPage; 