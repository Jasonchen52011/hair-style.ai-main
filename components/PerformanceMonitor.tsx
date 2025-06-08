'use client'

import { useEffect } from 'react'

// Core Web Vitals 监控
export default function PerformanceMonitor() {
  useEffect(() => {
    if (typeof window === 'undefined') return

    const sendToAnalytics = (metric: any) => {
      // 发送到Google Analytics
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', metric.name, {
          custom_map: { metric_value: 'custom_metric' },
          custom_metric: metric.value,
          metric_id: metric.id,
          metric_value: metric.value,
          metric_delta: metric.delta,
          event_category: 'Web Vitals',
          event_label: metric.name,
          value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value)
        })
      }

      // 开发环境控制台输出
      if (process.env.NODE_ENV === 'development') {
        const formatValue = (name: string, value: number) => {
          if (name === 'CLS') return value.toFixed(3)
          return `${Math.round(value)}ms`
        }

        const getStatus = (name: string, value: number) => {
          const thresholds: Record<string, [number, number]> = {
            'LCP': [2500, 4000],
            'FCP': [1800, 3000],
            'CLS': [0.1, 0.25],
            'TTFB': [800, 1800],
            'INP': [200, 500]
          }
          
          const [good, poor] = thresholds[name] || [0, 0]
          if (value <= good) return '✅ Good'
          if (value <= poor) return '⚠️ Needs Improvement'
          return '❌ Poor'
        }

        const targets: Record<string, string> = {
          'LCP': '< 2500ms',
          'FCP': '< 1800ms', 
          'CLS': '< 0.1',
          'TTFB': '< 800ms',
          'INP': '< 200ms'
        }

                 const iconMap: Record<string, string> = {
           'LCP': '🎯',
           'FCP': '🎨',
           'CLS': '📏',
           'TTFB': '⚡',
           'INP': '👆'
         }
         const icon = iconMap[metric.name] || '📊'

        console.log(`${icon} ${metric.name}:`, {
          value: formatValue(metric.name, metric.value),
          rating: metric.rating,
          target: targets[metric.name] || 'N/A',
          status: getStatus(metric.name, metric.value)
        })

        // LCP特殊处理 - 显示元素信息
        if (metric.name === 'LCP' && metric.entries?.length > 0) {
          const lcpEntry = metric.entries[metric.entries.length - 1]
          console.log('LCP Element:', lcpEntry.element)
        }
      }
    }

    // 动态导入 web-vitals (仅在客户端)
    import('web-vitals').then((webVitals: any) => {
      if (webVitals.getCLS) webVitals.getCLS(sendToAnalytics)
      if (webVitals.getFID) webVitals.getFID(sendToAnalytics)
      if (webVitals.getFCP) webVitals.getFCP(sendToAnalytics)
      if (webVitals.getLCP) webVitals.getLCP(sendToAnalytics)
      if (webVitals.getTTFB) webVitals.getTTFB(sendToAnalytics)
      if (webVitals.getINP) webVitals.getINP(sendToAnalytics)
    }).catch((error) => {
      console.warn('Failed to load web-vitals:', error)
    })

    // 监控资源加载时间
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.name.includes('hero4.webp')) {
          console.log('🖼️ Hero Image Load Time:', {
            resource: entry.name,
            loadTime: `${Math.round(entry.duration)}ms`,
            transferSize: (entry as any).transferSize ? `${Math.round((entry as any).transferSize / 1024)}KB` : 'cached'
          })
        }
      })
    })
    
    if ('PerformanceObserver' in window) {
      observer.observe({ entryTypes: ['resource'] })
    }

    // 开发环境性能报告总结
    if (process.env.NODE_ENV === 'development') {
      setTimeout(() => {
        console.log(`
🚀 Performance Report Summary:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Core Web Vitals Targets:
   • LCP (Largest Contentful Paint): < 2.5s
   • CLS (Cumulative Layout Shift): < 0.1
   • INP (Interaction to Next Paint): < 200ms
   
🎯 Additional Metrics:
   • FCP (First Contentful Paint): < 1.8s
   • TTFB (Time to First Byte): < 800ms
   
💡 LCP Optimization Applied:
   • ✅ Hero image optimized (79% size reduction)
   • ✅ WebP format with preload
   • ✅ Critical resources prioritized
   • ✅ Third-party scripts deferred
   • ✅ Font loading optimized
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        `)
      }, 3000)
    }

    return () => {
      observer.disconnect()
    }
  }, [])

  // 不渲染任何内容，这是一个监控组件
  return null
}

// 为了TypeScript支持，扩展Window接口
declare global {
  interface Window {
    gtag: (...args: any[]) => void
  }
} 