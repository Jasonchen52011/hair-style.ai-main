'use client'

import dynamic from 'next/dynamic';
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';

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

  // Check if it's a mobile device
  useEffect(() => {
    const checkMobile = () => {
      // Stricter mobile device detection: based on screen width only
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handle mouse movement
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
      // Keep at last position, don't reset
    }
  };

  // Adjust height based on device type
  const responsiveHeight = isMobile ? 342 : height;
  
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
          withResizeFeel={!isHovered || isMobile} // Disable native interaction on PC when hovering
          feelsOnlyTheDelimiter={false}
          className="before-after-slider"
        />
      </div>
    </div>
  );
} 