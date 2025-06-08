'use client'

import React, { useState, useEffect } from 'react'
import { useLazyLoad } from '@/hooks/useLazyLoad'

interface LazySectionProps {
  children: React.ReactNode
  className?: string
  threshold?: number
  rootMargin?: string
  fallback?: React.ReactNode
  id?: string
  minHeight?: string
  preserveHeight?: boolean
}

// 优化的骨架屏组件
const OptimizedSkeleton = ({ className }: { className?: string }) => (
  <div className={`animate-pulse bg-gray-200 rounded-lg ${className}`} />
);

export default function LazySection({ 
  children, 
  className = '', 
  threshold = 0.1,
  rootMargin = '100px', // 增加rootMargin提前加载
  fallback,
  id,
  minHeight = 'auto',
  preserveHeight = false
}: LazySectionProps) {
  const { isVisible, isLoaded, elementRef } = useLazyLoad({
    threshold,
    rootMargin,
    triggerOnce: true
  })

  const [contentHeight, setContentHeight] = useState<number | null>(null);

  // 测量内容高度以防止布局偏移
  useEffect(() => {
    if (preserveHeight && isLoaded && elementRef.current) {
      const height = elementRef.current.offsetHeight;
      if (height > 0) {
        setContentHeight(height);
      }
    }
  }, [isLoaded, preserveHeight, elementRef]);

  // 优化的默认fallback，减少布局偏移
  const defaultFallback = (
    <div 
      className="flex items-center justify-center" 
      style={{ 
        minHeight: contentHeight ? `${contentHeight}px` : minHeight,
        height: preserveHeight && contentHeight ? `${contentHeight}px` : 'auto'
      }}
    >
      <OptimizedSkeleton className="w-full h-32" />
    </div>
  );

  return (
    <div 
      ref={elementRef} 
      id={id}
      className={`transition-opacity duration-500 ease-out prevent-layout-shift ${className} ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      style={{
        minHeight: minHeight,
        contain: 'layout style paint', // 优化渲染性能
      }}
    >
      {isLoaded ? children : (fallback || defaultFallback)}
    </div>
  )
} 