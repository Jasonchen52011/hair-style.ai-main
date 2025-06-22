import Image from 'next/image'
import Link from 'next/link'

interface HowToMaintainSectionProps {
  additionalSection: Array<{
    title: string
    textContent: string[]
    image: {
      src: string
      alt: string
    }
    ctaText: string
    ctaLink: string
    styleConfig?: {
      layout: {
        imageRatio: string
        textRatio: string
        imageOrder: string
        textOrder: string
      }
      title: {
        fontSize: {
          mobile: string
          desktop: string
        }
        fontWeight: string
        color: string
        spacing: string
      }
      text: {
        fontSize: {
          mobile: string
          desktop: string
        }
        color: string
        lineHeight: string
        spacing: string
      }
      button: {
        background: string
        backgroundHover: string
        textColor: string
        fontSize: string
        fontWeight: string
        padding: string
        borderRadius: string
      }
    }
  }>
}

export default function HowToMaintainSection({ additionalSection }: HowToMaintainSectionProps) {
  // 默认样式配置
  const defaultStyles = {
    layout: {
      imageRatio: "3/5",
      textRatio: "2/5", 
      imageOrder: "right",
      textOrder: "left"
    },
    title: {
      fontSize: { mobile: "text-2xl", desktop: "text-3xl" },
      fontWeight: "font-bold",
      color: "text-gray-800",
      spacing: "mb-6"
    },
    text: {
      fontSize: { mobile: "text-sm", desktop: "text-lg" },
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
  };

  // 根据图文比例和顺序设置grid类的函数
  const getGridCols = (styleConfig: any) => {
    const styles = { ...defaultStyles.layout, ...styleConfig?.layout };
    const imageRatio = parseInt(styles.imageRatio.split('/')[0]);
    const textRatio = parseInt(styles.textRatio.split('/')[0]);
    const total = imageRatio + textRatio;
    return `grid-cols-1 lg:grid-cols-${total}`;
  };

  const getImageColSpan = (styleConfig: any) => {
    const styles = { ...defaultStyles.layout, ...styleConfig?.layout };
    const imageRatio = parseInt(styles.imageRatio.split('/')[0]);
    return `lg:col-span-${imageRatio}`;
  };

  const getTextColSpan = (styleConfig: any) => {
    const styles = { ...defaultStyles.layout, ...styleConfig?.layout };
    const textRatio = parseInt(styles.textRatio.split('/')[0]);
    return `lg:col-span-${textRatio}`;
  };

  const getImageOrder = (styleConfig: any) => {
    const styles = { ...defaultStyles.layout, ...styleConfig?.layout };
    return styles.imageOrder === 'left' ? 'order-1 lg:order-1' : 'order-1 lg:order-2';
  };

  const getTextOrder = (styleConfig: any) => {
    const styles = { ...defaultStyles.layout, ...styleConfig?.layout };
    return styles.textOrder === 'left' ? 'order-2 lg:order-1' : 'order-2 lg:order-2';
  };

  return (
    <>
      {additionalSection.map((config, index) => {
        // 合并用户配置和默认配置
        const styles = {
          layout: { ...defaultStyles.layout, ...config.styleConfig?.layout },
          title: { ...defaultStyles.title, ...config.styleConfig?.title },
          text: { ...defaultStyles.text, ...config.styleConfig?.text },
          button: { ...defaultStyles.button, ...config.styleConfig?.button }
        };

        return (
          <section key={index} className="py-10 sm:py-20 bg-white">
            <div className="w-full max-w-6xl mx-auto px-2 sm:px-4 lg:px-6">
              <div className={`grid ${getGridCols(config.styleConfig)} gap-4 items-center`}>
                {/* 文本内容 */}
                <div className={`space-y-6 ${getTextOrder(config.styleConfig)} ${getTextColSpan(config.styleConfig)}`}>
                  <h2 className={`${styles.title.fontSize.mobile} sm:${styles.title.fontSize.desktop} ${styles.title.fontWeight} ${styles.title.color} ${styles.title.spacing}`}>
                    {config.title}
                  </h2>
                  <div className={`${styles.text.spacing} ${styles.text.color} ${styles.text.lineHeight}`}>
                    {config.textContent.map((paragraph: string, pIndex: number) => (
                      <p key={pIndex} className={`${styles.text.fontSize.mobile} sm:${styles.text.fontSize.desktop}`}>
                        {paragraph}
                      </p>
                    ))}
                  </div>
                  
                  <div className="flex justify-center lg:justify-start">
                    <Link 
                      href={config.ctaLink}
                      className={`inline-flex items-center gap-2 ${styles.button.padding} ${styles.button.background} ${styles.button.backgroundHover} ${styles.button.textColor} ${styles.button.fontSize} ${styles.button.fontWeight} ${styles.button.borderRadius} transition-colors duration-200`}
                    >
                      {config.ctaText}
                      <i className="fas fa-arrow-right"></i>
                    </Link>
                  </div>
                </div>
                
                {/* 图片 */}
                <div className={`flex justify-center ${getImageOrder(config.styleConfig)} ${getImageColSpan(config.styleConfig)}`}>
                  <div className="w-full max-w-3xl rounded-lg overflow-hidden">
                    <Image
                      src={config.image.src}
                      alt={config.image.alt}
                      width={800}
                      height={600}
                      className="w-full h-auto object-contain"
                    />
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