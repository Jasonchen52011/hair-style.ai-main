'use client'

import { useEffect, useState } from 'react'

export default function CLSMonitor() {
  const [clsValue, setCLSValue] = useState<number>(0)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // 只在开发环境显示
    if (process.env.NODE_ENV !== 'development') return

    let clsScore = 0

    // 监听布局偏移
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        // 只记录非用户输入导致的布局偏移
        if (!(entry as any).hadRecentInput) {
          clsScore += (entry as any).value
          setCLSValue(clsScore)
        }
      }
    })

    observer.observe({ type: 'layout-shift', buffered: true })
    setIsVisible(true)

    return () => {
      observer.disconnect()
    }
  }, [])

  if (!isVisible) return null

  // CLS评分标准
  const getScoreColor = (score: number) => {
    if (score <= 0.1) return 'text-green-600 bg-green-50'
    if (score <= 0.25) return 'text-yellow-600 bg-yellow-50'
    return 'text-red-600 bg-red-50'
  }

  const getScoreLabel = (score: number) => {
    if (score <= 0.1) return 'Good'
    if (score <= 0.25) return 'Needs Improvement'
    return 'Poor'
  }

  return (
    <div 
      className={`fixed bottom-4 right-4 px-4 py-2 rounded-lg border shadow-lg z-50 ${getScoreColor(clsValue)}`}
      style={{ fontFamily: 'monospace', fontSize: '12px' }}
    >
      <div className="font-bold">CLS Monitor</div>
      <div>Score: {clsValue.toFixed(4)}</div>
      <div>Status: {getScoreLabel(clsValue)}</div>
      <div className="text-xs mt-1">
        Target: ≤ 0.1 (Good)
      </div>
    </div>
  )
}