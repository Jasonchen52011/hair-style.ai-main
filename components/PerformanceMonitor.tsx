'use client'

import { useEffect } from 'react'

// 简化的性能监控组件
export default function PerformanceMonitor() {
  useEffect(() => {
    if (typeof window === 'undefined') return

    // 只在开发环境中启用性能监控
    if (process.env.NODE_ENV !== 'development') return

    console.log('🚀 Performance Monitor initialized')

    // 简单的页面加载时间监控
    const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    if (navigationEntry) {
      const loadTime = navigationEntry.loadEventEnd - navigationEntry.fetchStart
      console.log('📊 Page Load Time:', `${Math.round(loadTime)}ms`)
    }

    // 基本的资源监控（不使用动态导入）
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.name.includes('hero4.webp') || entry.name.includes('font')) {
          console.log('🖼️ Resource Load:', {
            resource: entry.name.split('/').pop(),
            loadTime: `${Math.round(entry.duration)}ms`
          })
        }
      })
    })
    
    try {
      if ('PerformanceObserver' in window) {
        observer.observe({ entryTypes: ['resource'] })
      }
    } catch (error) {
      console.warn('Performance observer failed:', error)
    }

    return () => {
      try {
        observer.disconnect()
      } catch (error) {
        // 忽略错误
      }
    }
  }, [])

  return null
}

// 为了TypeScript支持，扩展Window接口
declare global {
  interface Window {
    gtag: (...args: any[]) => void
  }
} 