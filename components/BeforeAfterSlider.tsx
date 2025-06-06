'use client'

import dynamic from 'next/dynamic';
import { useState, useEffect, useRef } from 'react';

const ReactBeforeSliderComponent = dynamic(() => import('react-before-after-slider-component'), { ssr: false });

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
  const [isMobile, setIsMobile] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // 检查是否为移动设备
  useEffect(() => {
    const checkMobile = () => {
      // 更严格的移动设备判断：只基于屏幕宽度
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 处理鼠标移动
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isMobile && isHovered && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
      setPosition(percentage);
    }
  };

  const handleMouseEnter = () => {
    if (!isMobile) {
      setIsHovered(true);
    }
  };

  const handleMouseLeave = () => {
    if (!isMobile) {
      setIsHovered(false);
      // 保持在最后位置，不重置
    }
  };

  // 根据设备类型调整高度
  const responsiveHeight = isMobile ? 342 : height;
  

  return (
    <div 
      ref={containerRef}
      className="w-full max-w-xl rounded-lg overflow-hidden"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}

      style={{ userSelect: 'none', background: 'transparent' }}
    >
      <div style={{ 
        width: '100%', 
        height: responsiveHeight, 
        position: 'relative',
        background: 'transparent'
      }}>
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
          withResizeFeel={!isHovered || isMobile} // PC端悬停时禁用原生交互
          feelsOnlyTheDelimiter={false}
          className="before-after-slider"
        />
      </div>
    </div>
  );
} 