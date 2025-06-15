import Image from 'next/image'
import { useState } from 'react'

interface OptimizedImageProps {
  src: string
  alt: string
  width: number
  height: number
  className?: string
  priority?: boolean
  loading?: 'lazy' | 'eager'
  placeholder?: 'blur' | 'empty'
  blurDataURL?: string
  quality?: number
  unoptimized?: boolean
  onError?: () => void
  onLoad?: () => void
}

export default function OptimizedImage({
  src,
  alt,
  width,
  height,
  className = '',
  priority = false,
  loading = 'lazy',
  placeholder,
  blurDataURL,
  quality = 75,
  unoptimized = true, // 默认不使用优化，避免线上问题
  onError,
  onLoad,
  ...props
}: OptimizedImageProps) {
  const [imageError, setImageError] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const [currentSrc, setCurrentSrc] = useState(src)

  const handleError = () => {
    if (retryCount < 2) {
      // 第一次失败：尝试使用unoptimized模式
      if (retryCount === 0) {
        setRetryCount(1)
        // 强制重新加载，使用unoptimized模式
        return
      }
      // 第二次失败：尝试不同的图片格式
      if (retryCount === 1) {
        setRetryCount(2)
        if (currentSrc.endsWith('.webp')) {
          setCurrentSrc(currentSrc.replace('.webp', '.jpg'))
        } else if (currentSrc.endsWith('.jpg')) {
          setCurrentSrc(currentSrc.replace('.jpg', '.webp'))
        }
        return
      }
    }
    
    // 所有重试都失败了
    setImageError(true)
    onError?.()
  }

  const handleLoad = () => {
    setImageLoaded(true)
    setImageError(false)
    onLoad?.()
  }

  // 如果图片加载失败，显示占位符
  if (imageError) {
    return (
      <div 
        className={`bg-gray-200 flex items-center justify-center ${className}`}
        style={{ width, height }}
      >
        <div className="text-center px-4">
          <div className="text-2xl mb-2">📷</div>
          <span className="text-gray-500 text-sm">图片加载失败</span>
        </div>
      </div>
    )
  }

  return (
    <Image
      src={currentSrc}
      alt={alt}
      width={width}
      height={height}
      className={className}
      priority={priority}
      loading={priority ? 'eager' : loading}
      placeholder={placeholder}
      blurDataURL={blurDataURL}
      quality={quality}
      unoptimized={unoptimized}
      onError={handleError}
      onLoad={handleLoad}
      {...props}
    />
  )
} 