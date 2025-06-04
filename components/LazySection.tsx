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
}

export default function LazySection({ 
  children, 
  className = '', 
  threshold = 0.1,
  rootMargin = '50px',
  fallback,
  animationClass = 'animate-fadeInUp'
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

  return (
    <div 
      ref={elementRef} 
      className={`transition-all duration-700 ${className} ${
        isVisible ? `opacity-100 ${animationClass}` : 'opacity-0'
      }`}
    >
      {isLoaded ? children : (fallback || defaultFallback)}
    </div>
  )
} 