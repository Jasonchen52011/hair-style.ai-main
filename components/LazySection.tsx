'use client'

import React from 'react'
import { useLazyLoad } from '@/hooks/useLazyLoad'

interface LazySectionProps {
  children: React.ReactNode
  className?: string
  threshold?: number
  rootMargin?: string
  fallback?: React.ReactNode
  id?: string
}

export default function LazySection({ 
  children, 
  className = '', 
  threshold = 0.1,
  rootMargin = '50px',
  fallback,
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

  return (
    <div 
      ref={elementRef} 
      id={id}
      className={`transition-opacity duration-700 ${className} ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {isLoaded ? children : (fallback || defaultFallback)}
    </div>
  )
} 