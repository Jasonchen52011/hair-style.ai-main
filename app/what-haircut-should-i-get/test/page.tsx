"use client";

import { useState, Suspense, useEffect } from 'react';
import Link from 'next/link';
import pageConfig from '../config.json';

// 问题数据从config导入
const questions = pageConfig.tool.questions;
const TOTAL_QUESTIONS = pageConfig.tool.totalQuestions;

type QuizStage = 'loading_data' | 'quiz_questions' | 'submitting' | 'showing_results' | 'error_state';

interface HaircutRecommendation {
  name: string;
  description: string;
  whyItWorks: string;
  maintenance: string;
  styleTip: string;
  images: string[];
  additionalTips?: {
    maintenanceGuide: string[];
    communicationTips: string[];
  };
}

interface QuizResult {
  primaryRecommendation: HaircutRecommendation;
  alternativeOptions: HaircutRecommendation[];
}

function QuizAndResultContent() {
  const [quizStage, setQuizStage] = useState<QuizStage>('quiz_questions');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);

  const handleOptionSelect = (optionId: string) => {
    setSelectedOption(optionId);
  };

  const handleNextStep = async () => {
    if (quizStage === 'quiz_questions') {
      if (!selectedOption) {
        alert("Please select an option before continuing.");
        return;
      }

      // 保存答案
      setAnswers(prev => ({ 
        ...prev, 
        [questions[currentQuestionIndex].id]: selectedOption 
      }));
      setSelectedOption(null);

      // 检查是否是最后一个问题
      if (currentQuestionIndex < TOTAL_QUESTIONS - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
      } else {
        // 所有问题完成，提交分析
        await submitForAnalysis({
          ...answers,
          [questions[currentQuestionIndex].id]: selectedOption
        });
      }
    }
  };

  const submitForAnalysis = async (finalAnswers: Record<string, string>) => {
    setQuizStage('submitting');
    setApiError(null);

    try {
      const response = await fetch('/what-haircut-should-i-get/api', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          answers: finalAnswers
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error occurred' }));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const result: QuizResult = await response.json();
      setQuizResult(result);
      setQuizStage('showing_results');

    } catch (error: any) {
      console.error('API Error:', error);
      setApiError(error.message || 'Failed to analyze your answers. Please try again.');
      setQuizStage('error_state');
    }
  };

  const restartQuiz = () => {
    setQuizStage('quiz_questions');
    setCurrentQuestionIndex(0);
    setAnswers({});
    setSelectedOption(null);
    setQuizResult(null);
    setApiError(null);
  };

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / TOTAL_QUESTIONS) * 100;

  // 渲染问题阶段
  if (quizStage === 'quiz_questions') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100 py-8 px-4 flex items-center justify-center">
        <div className="max-w-2xl mx-auto w-full">
          
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Question {currentQuestionIndex + 1} of {TOTAL_QUESTIONS}</span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>

          {/* Question Card */}
          <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 mb-6">
            <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-6 text-center">
              {currentQuestion.text}
            </h2>

            <div className="grid grid-cols-1 gap-3 max-w-md mx-auto">
              {currentQuestion.options.map((option) => (
                <button
                  key={option.id}
                  onClick={() => handleOptionSelect(option.id)}
                  className={`w-full text-center py-2 px-3 rounded-lg border-2 transition-all duration-200 hover:shadow-sm ${
                    selectedOption === option.id
                      ? 'border-purple-500 bg-purple-50 shadow-lg'
                      : 'border-gray-200 hover:border-purple-300 hover:bg-purple-25'
                  }`}
                >
                  <span className="text-gray-700 font-medium text-sm">{option.text}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center">
            <button
              onClick={() => {
                if (currentQuestionIndex > 0) {
                  setCurrentQuestionIndex(prev => prev - 1);
                  setSelectedOption(null);
                }
              }}
              disabled={currentQuestionIndex === 0}
              className="text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ← Previous
            </button>

            <button
              onClick={handleNextStep}
              disabled={!selectedOption}
              className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold px-8 py-3 rounded-xl transition-all duration-200"
            >
              {currentQuestionIndex === TOTAL_QUESTIONS - 1 ? 'Get My Results' : 'Next →'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 渲染提交阶段
  if (quizStage === 'submitting') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-xl p-12 text-center max-w-md mx-auto">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-500 mx-auto mb-6"></div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Analyzing Your Preferences...
          </h2>
          <p className="text-gray-600">
            Our AI is finding the perfect haircut recommendations for you. This may take a moment.
          </p>
        </div>
      </div>
    );
  }

  // 渲染错误阶段
  if (quizStage === 'error_state') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md mx-auto">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Oops! Something went wrong
          </h2>
          <p className="text-gray-600 mb-6">
            {apiError}
          </p>
          <button
            onClick={restartQuiz}
            className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-200"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // 渲染结果阶段
  if (quizStage === 'showing_results' && quizResult) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100 py-8 px-4">
        <div className="max-w-6xl mx-auto">
          

          {/* Primary Recommendation */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8">
            <div className="p-8">
              <div className="text-center mb-8">
                <h2 className="text-3xl md:text-4xl font-bold text-purple-600 mb-2">
                  {quizResult.primaryRecommendation.name}
                </h2>
                <p className="text-lg text-gray-600">
                  {quizResult.primaryRecommendation.description}
                </p>
              </div>


              {/* Why It Works For You - Full Width */}
              <div className="bg-purple-50 rounded-xl p-6 mb-6">
                <h3 className="text-xl font-bold text-gray-800 mb-3">
                  Why It Works For You
                </h3>
                <p className="text-gray-600">
                  {quizResult.primaryRecommendation.whyItWorks}
                </p>
              </div>

              {/* Maintenance and Style Tip - Side by Side */}
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div className="bg-pink-50 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-2">
                    Maintenance
                  </h3>
                  <p className="text-gray-600">
                    {quizResult.primaryRecommendation.maintenance}
                  </p>
                </div>

                <div className="bg-blue-50 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-2">
                    Style Tip
                  </h3>
                  <p className="text-gray-600">
                    {quizResult.primaryRecommendation.styleTip}
                  </p>
                </div>
              </div>

              {/* English Recommendation */}
              <div className="text-center mb-4">
                <p className="text-lg text-gray-700 font-medium">
                  Perfect hairstyle recommendation for you based on your preferences
                </p>
              </div>

              {/* Images - Third Row */}
              {quizResult.primaryRecommendation.images && quizResult.primaryRecommendation.images.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  {quizResult.primaryRecommendation.images.map((image, index) => (
                    <div key={index} className="text-center">
                      <div className="aspect-square rounded-xl overflow-hidden mb-3">
                        <img
                          src={image}
                          alt={`${quizResult.primaryRecommendation.name} style ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <h4 className="text-md font-semibold text-gray-800">
                        {quizResult.primaryRecommendation.name}
                      </h4>
                    </div>
                  ))}
                </div>
              )}

              {/* Additional Tips */}
              {quizResult.primaryRecommendation.additionalTips && (
                <div className="mt-8 grid md:grid-cols-2 gap-6">
                  {quizResult.primaryRecommendation.additionalTips.maintenanceGuide && (
                    <div className="bg-green-50 rounded-xl p-6">
                      <h3 className="text-lg font-bold text-gray-800 mb-3">
                        💡 Maintenance Guide
                      </h3>
                      <ul className="text-gray-600 space-y-2">
                        {quizResult.primaryRecommendation.additionalTips.maintenanceGuide.map((tip, index) => (
                          <li key={index} className="flex items-start">
                            <span className="text-green-500 mr-2">•</span>
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {quizResult.primaryRecommendation.additionalTips.communicationTips && (
                    <div className="bg-yellow-50 rounded-xl p-6">
                      <h3 className="text-lg font-bold text-gray-800 mb-3">
                        💬 How to Communicate with Your Stylist
                      </h3>
                      <ul className="text-gray-600 space-y-2">
                        {quizResult.primaryRecommendation.additionalTips.communicationTips.map((tip, index) => (
                          <li key={index} className="flex items-start">
                            <span className="text-yellow-500 mr-2">•</span>
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>


          {/* Actions */}
          <div className="text-center">
            <button
              onClick={restartQuiz}
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-8 py-3 rounded-xl transition-all duration-200 mr-4"
            >
              Take Quiz Again
            </button>
            <Link
              href="/what-haircut-should-i-get"
              className="bg-gray-600 hover:bg-gray-700 text-white font-semibold px-8 py-3 rounded-xl transition-all duration-200 inline-block"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

export default function HaircutQuizPage() {
  useEffect(() => {
    // 添加 no index meta 标签
    const metaRobots = document.createElement('meta');
    metaRobots.name = 'robots';
    metaRobots.content = 'noindex, nofollow';
    document.head.appendChild(metaRobots);

    // 添加 canonical 标签
    const linkCanonical = document.createElement('link');
    linkCanonical.rel = 'canonical';
    linkCanonical.href = window.location.href;
    document.head.appendChild(linkCanonical);

    return () => {
      // 清理 robots meta 标签
      const existingMeta = document.querySelector('meta[name="robots"]');
      if (existingMeta) {
        document.head.removeChild(existingMeta);
      }

      // 清理 canonical 标签
      const existingCanonical = document.querySelector('link[rel="canonical"]');
      if (existingCanonical) {
        document.head.removeChild(existingCanonical);
      }
    };
  }, []);

  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading quiz...</p>
        </div>
      </div>
    }>
      <QuizAndResultContent />
    </Suspense>
  );
}