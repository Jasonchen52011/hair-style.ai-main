import Image from 'next/image'
import Link from 'next/link'

interface UsageScenariosSectionProps {
  ctaSections: Array<{
    title: string
    description?: string
    textContent?: string[]
    image: {
      src: string
      alt: string
    }
    ctaText: string
    ctaLink: string
  }>
  styleConfig?: {
    layout?: {
      imageRatio?: string
      textRatio?: string
      gap?: string
      alternateImageOrder?: boolean
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
    text?: {
      fontSize?: {
        mobile?: string
        desktop?: string
      }
      color?: string
      lineHeight?: string
      spacing?: string
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

export default function UsageScenariosSection({ ctaSections, styleConfig }: UsageScenariosSectionProps) {
  // 默认样式配置
  const defaultConfig = {
    layout: {
      imageRatio: "3",
      textRatio: "2",
      gap: "gap-4",
      alternateImageOrder: true
    },
    title: {
      fontSize: {
        mobile: "text-2xl",
        desktop: "text-4xl"
      },
      fontWeight: "font-bold",
      color: "text-gray-800",
      spacing: "mb-6"
    },
    text: {
      fontSize: {
        mobile: "text-sm",
        desktop: "text-lg"
      },
      color: "text-gray-800",
      lineHeight: "leading-relaxed",
      spacing: "space-y-4"
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
    layout: { ...defaultConfig.layout, ...styleConfig?.layout },
    title: { ...defaultConfig.title, ...styleConfig?.title },
    text: { ...defaultConfig.text, ...styleConfig?.text },
    button: { ...defaultConfig.button, ...styleConfig?.button }
  }

  return (
    <>
      {ctaSections.map((section, index) => {
        // 确定图片顺序 - 如果开启交替显示，奇偶行不同；否则都是左侧
        const imageFirst = config.layout.alternateImageOrder ? (index % 2 === 0) : true;
        
                  return (
            <section key={index} className="sm:py-16 py-6 bg-white">
              <div className="w-full max-w-6xl mx-auto px-2 sm:px-4 lg:px-6">
                <div className="max-w-full mx-auto">
                  <div className={`grid grid-cols-1 lg:grid-cols-${Number(config.layout.imageRatio) + Number(config.layout.textRatio)} ${config.layout.gap} items-center`}>
                    {/* Image */}
                    <div className={`flex justify-center ${imageFirst ? 'order-1 lg:order-1' : 'order-1 lg:order-2'} lg:col-span-${config.layout.imageRatio}`}>
                      <div className="w-full max-w-6xl bg-white rounded-xl overflow-hidden">
                        <Image
                          src={section.image.src}
                          alt={section.image.alt}
                          width={1200}
                          height={900}
                          className="w-full h-auto object-contain"
                        />
                      </div>
                    </div>
                    
                    {/* Text content */}
                    <div className={`space-y-10 ${imageFirst ? 'order-2 lg:order-2' : 'order-2 lg:order-1'} lg:col-span-${config.layout.textRatio}`}>
                      <h2 className={`${config.title.fontSize.mobile} sm:${config.title.fontSize.desktop} ${config.title.fontWeight} ${config.title.color} ${config.title.spacing}`}>
                        {section.title}
                      </h2>
                      {section.textContent ? (
                        <div className={config.text.spacing}>
                          {section.textContent.map((paragraph, pIndex) => (
                            <p 
                              key={pIndex} 
                              className={`${config.text.color} ${config.text.fontSize.mobile} sm:${config.text.fontSize.desktop} ${config.text.lineHeight}`}
                              dangerouslySetInnerHTML={{ __html: paragraph }}
                            />
                          ))}
                        </div>
                      ) : (
                        <p className={`${config.text.color} ${config.text.fontSize.mobile} sm:${config.text.fontSize.desktop} ${config.text.lineHeight}`}>
                          {section.description}
                        </p>
                      )}
                      
                      <div className="flex justify-center lg:justify-start">
                        <Link 
                          href={section.ctaLink}
                          className={`${config.button.background} ${config.button.backgroundHover} ${config.button.textColor} ${config.button.fontSize} ${config.button.fontWeight} ${config.button.padding} ${config.button.borderRadius} inline-flex items-center gap-2 transition-colors duration-200`}
                        >
                          {section.ctaText}
                          <i className="fas fa-arrow-right"></i>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          );
        })}
    </>
  )
} 