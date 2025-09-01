'use client'

import { useEffect, useRef, useState } from 'react';
import { Skeleton } from './Skeleton';

interface AdContainerProps {
  slot: string;
  width?: number | string;
  height?: number | string;
  format?: 'auto' | 'rectangle' | 'banner' | 'leaderboard';
  responsive?: boolean;
  className?: string;
}

export default function AdContainer({
  slot,
  width = '100%',
  height = 250,
  format = 'auto',
  responsive = true,
  className = ''
}: AdContainerProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const adRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadAd = async () => {
      try {
        // 确保adsbygoogle脚本已加载
        if (typeof window !== 'undefined' && window.adsbygoogle) {
          // 延迟加载广告，避免阻塞首屏渲染
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          if (adRef.current) {
            (window.adsbygoogle = window.adsbygoogle || []).push({});
            setIsLoaded(true);
          }
        } else {
          // 如果脚本未加载，设置错误状态
          setHasError(true);
        }
      } catch (error) {
        console.warn('AdSense loading error:', error);
        setHasError(true);
      }
    };

    const timer = setTimeout(loadAd, 500);
    return () => clearTimeout(timer);
  }, []);

  // 根据格式预设尺寸，减少CLS
  const getAdDimensions = () => {
    switch (format) {
      case 'banner':
        return { width: 728, height: 90 };
      case 'leaderboard':
        return { width: 728, height: 90 };
      case 'rectangle':
        return { width: 300, height: 250 };
      default:
        return { width, height };
    }
  };

  const dimensions = getAdDimensions();

  if (hasError) {
    return null; // 如果加载失败，不显示任何内容
  }

  return (
    <div 
      className={`ad-container prevent-layout-shift ${className}`}
      style={{
        width: dimensions.width,
        height: dimensions.height,
        maxWidth: '100%',
        position: 'relative',
        contain: 'layout style paint'
      }}
    >
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Skeleton 
            width="100%" 
            height="100%" 
            className="rounded-lg opacity-50"
          />
          <span className="absolute text-xs text-gray-400 pointer-events-none">
            Advertisement
          </span>
        </div>
      )}
      
      <div
        ref={adRef}
        className={`transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ width: '100%', height: '100%' }}
      >
        <ins
          className="adsbygoogle"
          style={{
            display: 'block',
            width: '100%',
            height: '100%'
          }}
          data-ad-client="ca-pub-2318931889728296"
          data-ad-slot={slot}
          data-ad-format={responsive ? format : undefined}
          data-full-width-responsive={responsive ? 'true' : 'false'}
        />
      </div>
    </div>
  );
}

// 常用广告尺寸的预设组件
export const BannerAd = ({ slot, className }: { slot: string; className?: string }) => (
  <AdContainer
    slot={slot}
    format="banner"
    width={728}
    height={90}
    responsive={false}
    className={className}
  />
);

export const RectangleAd = ({ slot, className }: { slot: string; className?: string }) => (
  <AdContainer
    slot={slot}
    format="rectangle"
    width={300}
    height={250}
    responsive={false}
    className={className}
  />
);

export const ResponsiveAd = ({ slot, className }: { slot: string; className?: string }) => (
  <AdContainer
    slot={slot}
    format="auto"
    responsive={true}
    className={className}
  />
);