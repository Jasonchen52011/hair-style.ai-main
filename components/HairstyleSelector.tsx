"use client";

import { useState, useEffect, useRef } from "react";
import {
  femaleStyles,
  maleStyles,
  hairColors,
  HairStyle,
} from "@/libs/hairstyles";
import Image from "next/image";
import Link from "next/link";

type TabType = "Female" | "Male" | "Color";

// Add image skeleton component
const ImageSkeleton = ({ className = "" }: { className?: string }) => (
  <div className={`animate-pulse bg-gray-200 ${className}`} />
);

// Add optimized image component
const OptimizedImage = ({
  src,
  alt,
  width,
  height,
  className = "",
  priority = false,
  aspectRatio = "1:1",
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  priority?: boolean;
  aspectRatio?: string;
}) => {
  const [imageSrc, setImageSrc] = useState(src);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const handleLoad = () => setImageLoaded(true);
  const handleError = () => {
    setHasError(true);
    setImageLoaded(true);
  };

  if (hasError) {
    return (
      <div
        className={`relative ${className} bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center`}
        style={{ aspectRatio }}
      >
        <div className="text-center px-4">
          <div className="text-2xl mb-2">📷</div>
          <div className="text-sm text-gray-500">{alt}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} style={{ aspectRatio }}>
      {!imageLoaded && (
        <ImageSkeleton className="absolute inset-0 rounded-lg" />
      )}
      <Image
        src={imageSrc}
        alt={alt}
        width={width}
        height={height}
        className={`${
          imageLoaded ? "opacity-100" : "opacity-0"
        } transition-opacity duration-300 w-full h-full object-cover rounded-lg`}
        onLoad={handleLoad}
        onError={handleError}
        priority={priority}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      />
    </div>
  );
};

export default function HairstyleSelector() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("Female");
  const [displayStyles, setDisplayStyles] = useState<HairStyle[]>([]);
  const [displayColors, setDisplayColors] = useState<
    Array<{ id: string; color: string; label: string }>
  >([]);
  const [isAutoScrolling, setIsAutoScrolling] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Define color image mapping
  const colorImages = {
    black: "/images/colors/black-hair.jpg",
    red: "/images/colors/red-hair.jpg",
    silver: "/images/colors/silver-hair.jpg",
    purple: "/images/colors/purple-hair.jpg",
    blue: "/images/colors/blue-hair.jpg",
    pink: "/images/colors/pink-hair.jpg",
    brown: "/images/colors/brown-hair.jpg",
    green: "/images/colors/green-hair.jpg",
    orange: "/images/colors/orange-hair.jpg",
    white: "/images/colors/white-hair.jpg",
    lightBrown: "/images/colors/light-brown-hair.jpg",
    lightBlue: "/images/colors/light-blue-hair.jpg",
    blonde: "/images/colors/blonde-hair.jpg",
    lightPurple: "/images/colors/light-purple-hair.jpg",
  };

  // Data update function
  const updateDisplayData = (tabType: TabType) => {
    requestAnimationFrame(() => {
      if (tabType === "Color") {
        const availableColors = hairColors.filter(
          (color) => color.id in colorImages
        );
        setDisplayColors(availableColors);
        setDisplayStyles([]);
      } else {
        const styles = tabType === "Female" ? femaleStyles : maleStyles;
        const limitedStyles = styles.slice(0, 12);
        setDisplayStyles(limitedStyles);
        setDisplayColors([]);

        setTimeout(() => {
          setDisplayStyles(styles);
        }, 1000);
      }
    });
  };

  useEffect(() => {
    updateDisplayData(activeTab);
  }, [activeTab]);

  useEffect(() => {
    setMounted(true);
    const timer = setTimeout(() => {
      updateDisplayData(activeTab);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!mounted || activeTab === "Color" || !isAutoScrolling) return;

    const container = scrollContainerRef.current;
    if (!container) return;

    const timer = setTimeout(() => {
      const autoScroll = setInterval(() => {
        const maxScrollLeft = container.scrollWidth - container.clientWidth;

        if (container.scrollLeft >= maxScrollLeft) {
          container.scrollTo({ left: 0, behavior: "smooth" });
        } else {
          container.scrollBy({ left: 200, behavior: "smooth" });
        }
      }, 5000);

      return () => clearInterval(autoScroll);
    }, 5000);

    return () => clearTimeout(timer);
  }, [mounted, activeTab, isAutoScrolling]);

  const handleScrollInteraction = () => {
    setIsAutoScrolling(false);
    setTimeout(() => setIsAutoScrolling(true), 5000);
  };

  if (!mounted) {
    return (
      <div className="container mx-auto px-4 pb-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="h-8 bg-gray-200 rounded mb-6 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="flex justify-center mb-12 px-4">
            <div className="h-12 bg-gray-200 rounded w-80 animate-pulse"></div>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="aspect-[3/4] bg-gray-200 rounded-2xl animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 pb-20">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-2xl md:text-3xl font-bold mb-6 text-gray-800">
            Try on Popular Hairstyles for Men and Women with Hairstyle AI
          </h2>
          <p className="text-base sm:text-lg text-gray-600 max-w-5xl mx-auto leading-relaxed">
            Looking for hairstyle inspiration? Our AI hairstyle changer helps
            you explore the hottest hairstyles for men and women in seconds!
            Whether you want a classic cut, bold fade, curly waves, or a sleek
            ponytail, AI hairstyle changer makes it super easy. No more
            guessing—just upload your photo, try on different AI hairstyle
            simulators, and find your perfect look! Ready for a new hairstyle?
            Give it a try today!
          </p>
        </div>

        <div className="flex justify-center mb-12 px-4">
          <div className="flex rounded-lg overflow-hidden w-full max-w-md">
            {(["Female", "Male", "Color"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  updateDisplayData(tab);
                }}
                className={`flex-1 py-3 text-base sm:text-base font-medium transition-all ${
                  activeTab === tab
                    ? "bg-purple-700 text-white shadow-lg"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-300"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="relative">
          {activeTab === "Color" ? (
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-4 overflow-hidden">
              {displayColors.map((color, index) => (
                <Link
                  key={index}
                  href={`/ai-hairstyle?color=${encodeURIComponent(color.id)}`}
                  className="group transition-all duration-300 hover:scale-105 cursor-pointer"
                >
                  <div className="aspect-[3/4] rounded-2xl overflow-hidden mb-3 relative group-hover:shadow-lg transition-shadow">
                    {colorImages[color.id as keyof typeof colorImages] ? (
                      <OptimizedImage
                        src={
                          colorImages[color.id as keyof typeof colorImages]
                        }
                        alt={color.label}
                        className="group-hover:opacity-90 transition-opacity"
                        width={400}
                        height={300}
                        aspectRatio="4:3"
                      />
                    ) : (
                      <div
                        className="w-full h-full"
                        style={{
                          background:
                            color.id === "random" ? color.color : color.color,
                          opacity: 0.8,
                        }}
                      />
                    )}
                    <div className="absolute inset-0 bg-purple-600 bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
                      <span className="text-white font-medium opacity-0 group-hover:opacity-100 transition-opacity text-sm">
                        Try This Color
                      </span>
                    </div>
                  </div>
                  <p className="text-center text-gray-800 font-medium group-hover:text-purple-700 transition-colors">
                    {color.label}
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            <div
              ref={scrollContainerRef}
              className="overflow-x-auto overflow-y-hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] touch-pan-x"
              style={{ WebkitOverflowScrolling: 'touch' }}
              onMouseEnter={handleScrollInteraction}
              onTouchStart={handleScrollInteraction}
              onScroll={handleScrollInteraction}
            >
              <div className="grid grid-rows-2 grid-flow-col gap-4 pb-4 auto-cols-max">
                {displayStyles.map((style, index) => (
                  <Link
                    key={`${activeTab}-${style.description}-${index}`}
                    href={`/ai-hairstyle?style=${encodeURIComponent(
                      style.style
                    )}`}
                    className="hairstyle-item transition-all duration-300 hover:scale-105 w-[140px] sm:w-[160px] cursor-pointer group"
                  >
                    <div className="aspect-[3/4] hairstyle-image relative bg-gray-100 rounded-2xl overflow-hidden mb-2 group-hover:shadow-lg transition-shadow">
                      <OptimizedImage
                        key={`img-${activeTab}-${style.description}`}
                        src={style.imageUrl}
                        alt={style.description}
                        className="w-full h-full group-hover:opacity-90 transition-opacity"
                        width={300}
                        height={300}
                        aspectRatio="4:3"
                      />
                      <div className="absolute inset-0 bg-purple-600 bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
                        <span className="text-white font-medium opacity-0 group-hover:opacity-100 transition-opacity text-sm">
                          Try This Style
                        </span>
                      </div>
                    </div>
                    <h3 className="text-center text-gray-800 font-medium text-xs sm:text-sm leading-tight group-hover:text-purple-700 transition-colors">
                      {style.description}
                    </h3>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-center items-center relative mt-4">
          <Link
            href="/ai-hairstyle"
            className="btn bg-purple-700 text-white btn-lg rounded-xl"
          >
            Try on Free AI Hairstyle Changer Now
          </Link>
        </div>
      </div>
      
      <style jsx>{`
        .touch-pan-x {
          touch-action: pan-x;
          -webkit-user-select: none;
          user-select: none;
        }
        
        @media (pointer: coarse) {
          .overflow-x-auto {
            cursor: grab;
          }
          
          .overflow-x-auto:active {
            cursor: grabbing;
          }
        }
      `}</style>
    </div>
  );
}