'use client'

import { useEffect, useState } from 'react'

declare global {
  interface Window {
    adsbygoogle: any[]
  }
}

interface AdSenseProps {
  adSlot: string
  adFormat?: string
  fullWidthResponsive?: boolean
  className?: string
  style?: React.CSSProperties
}

export default function AdSense({ 
  adSlot, 
  adFormat = 'auto',
  fullWidthResponsive = true,
  className = '',
  style = { display: 'block' }
}: AdSenseProps) {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    
    // 延迟加载AdSense，避免hydration冲突
    const timer = setTimeout(() => {
      try {
        if (typeof window !== 'undefined') {
          (window.adsbygoogle = window.adsbygoogle || []).push({})
        }
      } catch (err) {
        console.error('AdSense loading error:', err)
      }
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  // 避免hydration不匹配，只在客户端渲染
  if (!isMounted) {
    return (
      <div 
        className={className} 
        style={{ ...style, minHeight: '200px', backgroundColor: '#f5f5f5' }}
      >
        {/* 占位符，避免布局跳动 */}
      </div>
    )
  }

  return (
    <ins
      className={`adsbygoogle ${className}`}
      style={style}
      data-ad-client="ca-pub-2318931889728296"
      data-ad-slot={adSlot}
      data-ad-format={adFormat}
      data-full-width-responsive={fullWidthResponsive.toString()}
    />
  )
}