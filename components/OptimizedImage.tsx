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
  const [currentUnoptimized, setCurrentUnoptimized] = useState(unoptimized)

  const handleError = () => {
    if (retryCount < 2) {
      // 第一次失败：尝试使用unoptimized模式
      if (retryCount === 0) {
        setRetryCount(1)
        setCurrentUnoptimized(true)
        // 强制重新加载图片
        setCurrentSrc(src + '?retry=1')
        return
      }
      // 第二次失败：尝试不同的图片格式
      if (retryCount === 1) {
        setRetryCount(2)
        if (currentSrc.includes('.webp')) {
          setCurrentSrc(src.replace('.webp', '.jpg') + '?retry=2')
        } else if (currentSrc.includes('.jpg')) {
          setCurrentSrc(src.replace('.jpg', '.webp') + '?retry=2')
        } else if (currentSrc.includes('.png')) {
          setCurrentSrc(src.replace('.png', '.jpg') + '?retry=2')
        } else {
          // 如果原图没有扩展名，尝试添加常见扩展名
          setCurrentSrc(src + '.jpg?retry=2')
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


  if (imageError) {
    return (
      <div 
        className={`bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center rounded-lg ${className}`}
        style={{ width, height }}
      >
        <div className="text-center px-4">
          <div className="text-2xl mb-2">📷</div>
          <span className="text-gray-500 text-sm">图片加载失败</span>
          <div className="text-xs text-gray-400 mt-1">{alt}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative">
      {!imageLoaded && (
        <div 
          className={`absolute inset-0 bg-gray-200 animate-pulse rounded ${className}`}
          style={{ width, height }}
        />
      )}
      <Image
        src={currentSrc}
        alt={alt}
        width={width}
        height={height}
        className={`${imageLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300 ${className}`}
        priority={priority}
        loading={priority ? 'eager' : loading}
        placeholder={placeholder}
        blurDataURL={blurDataURL}
        quality={quality}
        unoptimized={currentUnoptimized}
        onError={handleError}
        onLoad={handleLoad}
        {...props}
      />
    </div>
  )
} 