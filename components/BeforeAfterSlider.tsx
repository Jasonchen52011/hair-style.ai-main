'use client'

import dynamic from 'next/dynamic';
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Skeleton } from './Skeleton';

// 动态导入组件，添加加载状态，防止CLS
const ReactBeforeSliderComponent = dynamic(() => import('react-before-after-slider-component'), { 
  ssr: false,
  loading: () => (
    <div className="w-full aspect-square max-w-xl">
      <Skeleton width="100%" height="100%" className="rounded-lg" />
    </div>
  )
});

interface BeforeAfterSliderProps {
  beforeImage: string;
  afterImage: string;
  beforeAlt: string;
  afterAlt: string;
  height?: number;
}

export default function BeforeAfterSlider({ 
  beforeImage, 
  afterImage, 
  beforeAlt, 
  afterAlt, 
  height = 500 
}: BeforeAfterSliderProps) {
  const [position, setPosition] = useState(50);
  const [isHovered, setIsHovered] = useState(false);
  // 使用CSS媒体查询而不是JavaScript检测，避免布局跳跃
  const [isMounted, setIsMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // 仅在客户端挂载后设置状态，避免SSR不一致
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Handle mouse movement - 使用CSS媒体查询检测而不是JS
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isHovered && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
      setPosition(percentage);
    }
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };
  
  // Preload images
  useEffect(() => {
    const preloadImages = () => {
      const beforeImg = new window.Image();
      const afterImg = new window.Image();
      beforeImg.src = beforeImage;
      afterImg.src = afterImage;
    };
    
    preloadImages();
  }, [beforeImage, afterImage]);

  // 如果还未挂载，显示骨架屏避免CLS
  if (!isMounted) {
    return (
      <div className="w-full max-w-xl aspect-square rounded-lg">
        <Skeleton width="100%" height="100%" className="rounded-lg" />
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="w-full max-w-xl rounded-lg overflow-hidden before-after-container prevent-layout-shift"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
      style={{ 
        userSelect: 'none', 
        background: 'transparent',
        /* 使用CSS设置响应式高度，避免JS计算导致的CLS */
        height: 'clamp(342px, 50vw, 500px)',
        aspectRatio: '1 / 1',
        contain: 'layout style paint'
      }}
    >
      <div 
        className="w-full h-full relative"
        style={{ background: 'transparent' }}
      >
        <ReactBeforeSliderComponent
          firstImage={{
            imageUrl: beforeImage,
            alt: beforeAlt
          }}
          secondImage={{
            imageUrl: afterImage,
            alt: afterAlt
          }}
          currentPercentPosition={position}
          delimiterColor="#ffffff"
          withResizeFeel={!isHovered} // 始终允许原生交互，除非正在hover（桌面端）
          feelsOnlyTheDelimiter={false}
          className="before-after-slider w-full h-full"
        />
      </div>
    </div>
  );
} 