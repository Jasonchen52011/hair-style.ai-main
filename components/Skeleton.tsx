import React from 'react'

interface SkeletonProps {
  className?: string
  width?: string
  height?: string
  rounded?: boolean
}

// 基础骨架屏组件
export const Skeleton: React.FC<SkeletonProps> = ({ 
  className = '', 
  width = '100%', 
  height = '1rem',
  rounded = false 
}) => (
  <div 
    className={`skeleton ${rounded ? 'rounded-full' : 'rounded'} ${className}`}
    style={{ 
      width, 
      height,
      contain: 'layout style paint'
    }}
    aria-hidden="true"
  />
)

// 头发样式卡片骨架屏
export const HairstyleCardSkeleton: React.FC = () => (
  <div className="prevent-layout-shift">
    <div className="aspect-square skeleton rounded-lg mb-3" />
    <Skeleton height="1rem" className="mb-2" width="80%" />
    <Skeleton height="0.75rem" width="60%" />
  </div>
)

// 头发样式网格骨架屏
export const HairstyleGridSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => (
  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 optimized-grid">
    {Array.from({ length: count }, (_, i) => (
      <div key={i} className="grid-item">
        <HairstyleCardSkeleton />
      </div>
    ))}
  </div>
)

// 用户头像骨架屏
export const UserAvatarSkeleton: React.FC = () => (
  <div className="flex items-center space-x-4 prevent-layout-shift">
    <Skeleton 
      width="5rem" 
      height="5rem" 
      rounded 
      className="flex-shrink-0"
    />
    <div className="space-y-2 flex-1">
      <Skeleton height="1rem" width="70%" />
      <Skeleton height="0.875rem" width="50%" />
    </div>
  </div>
)

// 头发风格转换结果骨架屏
export const TransformResultSkeleton: React.FC = () => (
  <div className="space-y-6 prevent-layout-shift">
    {/* Before/After 图片区域 */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-3">
        <Skeleton height="1rem" width="40%" />
        <div className="aspect-square skeleton rounded-lg" />
      </div>
      <div className="space-y-3">
        <Skeleton height="1rem" width="40%" />
        <div className="aspect-square skeleton rounded-lg" />
      </div>
    </div>
    
    {/* 操作按钮区域 */}
    <div className="flex flex-col sm:flex-row gap-3 justify-center">
      <Skeleton height="3rem" width="8rem" className="rounded-lg" />
      <Skeleton height="3rem" width="8rem" className="rounded-lg" />
    </div>
  </div>
)

// 导航栏骨架屏
export const NavbarSkeleton: React.FC = () => (
  <div className="navbar flex items-center justify-between p-4 prevent-layout-shift">
    {/* Logo */}
    <Skeleton height="2rem" width="8rem" />
    
    {/* Navigation items - 桌面端 */}
    <div className="hidden md:flex space-x-6">
      <Skeleton height="1rem" width="4rem" />
      <Skeleton height="1rem" width="5rem" />
      <Skeleton height="1rem" width="4rem" />
    </div>
    
    {/* User actions */}
    <div className="flex items-center space-x-3">
      <Skeleton height="2.5rem" width="6rem" className="rounded-lg" />
      <Skeleton height="2rem" width="2rem" rounded />
    </div>
  </div>
)

// 加载状态容器 - 平滑过渡
interface LoadingContainerProps {
  isLoading: boolean
  skeleton: React.ReactNode
  children: React.ReactNode
  minHeight?: string
}

export const LoadingContainer: React.FC<LoadingContainerProps> = ({
  isLoading,
  skeleton,
  children,
  minHeight = '200px'
}) => (
  <div 
    className="relative transition-opacity duration-300"
    style={{ minHeight }}
  >
    {isLoading ? (
      <div className="absolute inset-0">
        {skeleton}
      </div>
    ) : (
      <div className="image-fade-in">
        {children}
      </div>
    )}
  </div>
)

// Hero section 骨架屏
export const HeroSkeleton: React.FC = () => (
  <div className="hero-section flex flex-col lg:flex-row items-center justify-between gap-8 py-12">
    {/* 文本内容 */}
    <div className="flex-1 space-y-6">
      <div className="space-y-3">
        <Skeleton height="3rem" width="100%" />
        <Skeleton height="3rem" width="80%" />
      </div>
      <Skeleton height="1.5rem" width="90%" />
      <Skeleton height="1.5rem" width="85%" />
      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <Skeleton height="3rem" width="10rem" className="rounded-lg" />
        <Skeleton height="3rem" width="8rem" className="rounded-lg" />
      </div>
    </div>
    
    {/* Hero 图片 */}
    <div className="flex-1 max-w-md">
      <div className="hero-image skeleton rounded-lg" />
    </div>
  </div>
)

export default Skeleton