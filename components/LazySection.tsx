'use client'

import React from 'react'
import { useLazyLoad } from '@/hooks/useLazyLoad'

interface LazySectionProps {
  children: React.ReactNode
  className?: string
  threshold?: number
  rootMargin?: string
  fallback?: React.ReactNode
  animationClass?: string
  animation?: string  // 添加 animation 属性支持
  delay?: number      // 添加 delay 属性支持
  id?: string         // 添加 id 属性支持
}

export default function LazySection({ 
  children, 
  className = '', 
  threshold = 0.1,
  rootMargin = '50px',
  fallback,
  animationClass = 'animate-fadeInUp',
  animation,
  delay = 0,
  id
}: LazySectionProps) {
  const { isVisible, isLoaded, elementRef } = useLazyLoad({
    threshold,
    rootMargin,
    triggerOnce: true
  })

  const defaultFallback = (
    <div className="min-h-[200px] flex items-center justify-center">
      <div className="loading loading-spinner loading-lg"></div>
    </div>
  )

  // 根据 animation 属性生成动画类名
  const getAnimationClass = () => {
    if (animation) {
      switch (animation) {
        case 'fadeIn':
          return 'animate-fadeIn'
        case 'slideUp':
          return 'animate-fadeInUp'
        case 'slideLeft':
          return 'animate-fadeInLeft'
        case 'slideRight':
          return 'animate-fadeInRight'
        case 'zoomIn':
          return 'animate-fadeIn'
        default:
          return 'animate-fadeInUp'
      }
    }
    return animationClass
  }

  // 处理延迟
  const delayClass = delay > 0 ? `animate-delay-${delay}` : ''

  return (
    <div 
      ref={elementRef} 
      id={id}
      className={`transition-all duration-700 ${className} ${delayClass} ${
        isVisible ? `opacity-100 ${getAnimationClass()}` : 'opacity-0'
      }`}
    >
      {isLoaded ? children : (fallback || defaultFallback)}
    </div>
  )
} 