import Image from 'next/image'
import Link from 'next/link'

interface HeroSectionProps {
  heroSection: {
    title: string
    description: string
    rating: number
    statsText: string
    ctaText: string
    ctaLink: string
    styleConfig?: {
      layout?: {
        leftRatio?: string
        rightRatio?: string
        gap?: string
        imageOrder?: 'left' | 'right'
        textOrder?: 'left' | 'right'
      }
      title?: {
        fontSize?: {
          mobile?: string
          desktop?: string
        }
        fontWeight?: string
        color?: string
        spacing?: string
      }
      description?: {
        fontSize?: {
          mobile?: string
          desktop?: string
        }
        color?: string
        spacing?: string
      }
      statsText?: {
        fontSize?: {
          mobile?: string
          desktop?: string
        }
        color?: string
        fontWeight?: string
      }
      button?: {
        background?: string
        backgroundHover?: string
        textColor?: string
        fontSize?: string
        fontWeight?: string
        padding?: string
        borderRadius?: string
      }
    }
  }
  imageConfig: {
    displayHeight: number
    image: string
    alt: string
  }
}

export default function HeroSection({ heroSection, imageConfig }: HeroSectionProps) {
  // 默认样式配置
  const defaultConfig = {
    layout: {
      leftRatio: "2",
      rightRatio: "3",
      gap: "gap-2",
      imageOrder: "right" as const,
      textOrder: "left" as const
    },
    title: {
      fontSize: {
        mobile: "text-4xl",
        desktop: "text-4xl"
      },
      fontWeight: "font-extrabold",
      color: "text-gray-900",
      spacing: "mb-6"
    },
    description: {
      fontSize: {
        mobile: "text-base",
        desktop: "text-lg"
      },
      color: "text-gray-800",
      spacing: "mb-4 sm:mb-2"
    },
    statsText: {
      fontSize: {
        mobile: "text-sm",
        desktop: "text-base"
      },
      color: "text-gray-600",
      fontWeight: "font-medium"
    },
    button: {
      background: "bg-purple-600",
      backgroundHover: "hover:bg-purple-700",
      textColor: "text-white",
      fontSize: "text-base",
      fontWeight: "font-semibold",
      padding: "px-6 py-3",
      borderRadius: "rounded-xl"
    }
  }

  // 合并用户配置和默认配置
  const config = {
    layout: { ...defaultConfig.layout, ...heroSection.styleConfig?.layout },
    title: { ...defaultConfig.title, ...heroSection.styleConfig?.title },
    description: { ...defaultConfig.description, ...heroSection.styleConfig?.description },
    statsText: { ...defaultConfig.statsText, ...heroSection.styleConfig?.statsText },
    button: { ...defaultConfig.button, ...heroSection.styleConfig?.button }
  }

  return (
    <section className="bg-white py-2 sm:py-10 mb-10 mt-2 sm:mt-6">
      <div className="w-full max-w-6xl mx-auto px-2 sm:px-4">
        <div className={`grid grid-cols-1 lg:grid-cols-${Number(config.layout.leftRatio) + Number(config.layout.rightRatio)} ${config.layout.gap} items-center`}>
    
          <div className={`pr-1 order-2 lg:order-${config.layout.textOrder === 'left' ? '1' : '2'} lg:col-span-${config.layout.leftRatio}`}>
            <h1 className={`${config.title.fontSize.mobile} sm:${config.title.fontSize.desktop} ${config.title.fontWeight} ${config.title.spacing} ${config.title.color}`}>
              {heroSection.title}
            </h1>
            <p className={`${config.description.fontSize.mobile} md:${config.description.fontSize.desktop} ${config.description.color} ${config.description.spacing}`}>
              {heroSection.description}
            </p>
            
         
            <div className="flex items-center justify-center lg:justify-start gap-3 mb-8 mt-16">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => {
                  const rating = heroSection.rating;
                  if (star <= Math.floor(rating)) {
                  
                    return (
                      <i 
                        key={star}
                        className="fas fa-star text-yellow-400 text-sm"
                      />
                    );
                  } else if (star <= rating) {
                    // 半填充的星星
                    return (
                      <i 
                        key={star}
                        className="fas fa-star-half text-yellow-400 text-sm"
                      />
                    );
                  } else {
                 
                    return (
                      <i 
                        key={star}
                        className="fas fa-star text-gray-300 text-sm"
                      />
                    );
                  }
                })}
              </div>
              <span className={`${config.statsText.color} ${config.statsText.fontWeight} ${config.statsText.fontSize.mobile} sm:${config.statsText.fontSize.desktop}`}>{heroSection.statsText}</span>
            </div>
            
            <div className="flex justify-center lg:justify-start">
              <Link 
                href={heroSection.ctaLink}
                className={`btn ${config.button.textColor} ${config.button.background} ${config.button.backgroundHover} btn-lg ${config.button.borderRadius} border-purple-600 gap-2 ${config.button.fontSize} ${config.button.fontWeight} ${config.button.padding}`}
              >
                {heroSection.ctaText}
                <i className="fas fa-arrow-right"></i>
              </Link>
            </div>
          </div>
          
          {/* left side show image */}
          <div className={`flex justify-center lg:justify-end order-1 lg:order-${config.layout.imageOrder === 'left' ? '1' : '2'} lg:col-span-${config.layout.rightRatio}`}>
            <div className="relative rounded-lg overflow-hidden" style={{ height: `${imageConfig.displayHeight}px` }}>
              <Image
                src={imageConfig.image}
                alt={imageConfig.alt}
                width={900}
                height={imageConfig.displayHeight}
                className="object-cover rounded-lg w-full h-full"
                priority
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
} 