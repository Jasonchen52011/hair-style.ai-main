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

  const handleError = () => {
    setImageError(true)
    onError?.()
  }

  const handleLoad = () => {
    setImageLoaded(true)
    onLoad?.()
  }

  // 如果图片加载失败，显示占位符
  if (imageError) {
    return (
      <div 
        className={`bg-gray-200 flex items-center justify-center ${className}`}
        style={{ width, height }}
      >
        <span className="text-gray-500 text-sm">图片加载失败</span>
      </div>
    )
  }

  return (
    <Image
      src={src}
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