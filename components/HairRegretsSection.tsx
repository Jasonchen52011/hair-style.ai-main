import Image from 'next/image'
import Link from 'next/link'

interface HairRegretsSectionProps {
  regretsSection: {
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
  }
}

export default function HairRegretsSection({ regretsSection }: HairRegretsSectionProps) {
  const config = regretsSection;
  const styleConfig = config.styleConfig;
  
  // 默认样式配置
  const defaultStyles = {
    layout: {
      imageRatio: "3/5",
      textRatio: "2/5", 
      imageOrder: "left",
      textOrder: "right"
    },
    title: {
      fontSize: { mobile: "text-2xl", desktop: "text-4xl" },
      fontWeight: "font-bold",
      color: "text-gray-800",
      spacing: "mb-6"
    },
    text: {
      fontSize: { mobile: "text-sm", desktop: "text-lg" },
      color: "text-gray-700",
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

  // 合并用户配置和默认配置
  const styles = {
    layout: { ...defaultStyles.layout, ...styleConfig?.layout },
    title: { ...defaultStyles.title, ...styleConfig?.title },
    text: { ...defaultStyles.text, ...styleConfig?.text },
    button: { ...defaultStyles.button, ...styleConfig?.button }
  };

  // 根据图文比例和顺序设置grid类
  const getGridCols = () => {
    const imageRatio = parseInt(styles.layout.imageRatio.split('/')[0]);
    const textRatio = parseInt(styles.layout.textRatio.split('/')[0]);
    const total = imageRatio + textRatio;
    return `grid-cols-1 lg:grid-cols-${total}`;
  };

  const getImageColSpan = () => {
    const imageRatio = parseInt(styles.layout.imageRatio.split('/')[0]);
    return `lg:col-span-${imageRatio}`;
  };

  const getTextColSpan = () => {
    const textRatio = parseInt(styles.layout.textRatio.split('/')[0]);
    return `lg:col-span-${textRatio}`;
  };

  const getImageOrder = () => {
    return styles.layout.imageOrder === 'left' ? 'order-1 lg:order-1' : 'order-1 lg:order-2';
  };

  const getTextOrder = () => {
    return styles.layout.textOrder === 'left' ? 'order-2 lg:order-1' : 'order-2 lg:order-2';
  };

  return (
    <section className="py-10 sm:py-20">
      <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 lg:px-6">
        <div className={`grid ${getGridCols()} gap-4 items-center`}>
          
          {/* 文本内容 */}
          <div className={`space-y-6 ${getTextOrder()} ${getTextColSpan()}`}>
            <h2 className={`${styles.title.fontSize.mobile} sm:${styles.title.fontSize.desktop} ${styles.title.fontWeight} ${styles.title.color} ${styles.title.spacing}`}>
              {config.title}
            </h2>
            
            <div className={styles.text.spacing}>
              {config.textContent.map((paragraph, index) => (
                <p key={index} className={`${styles.text.color} ${styles.text.fontSize.mobile} sm:${styles.text.fontSize.desktop} ${styles.text.lineHeight}`}>
                  {paragraph}
                </p>
              ))}
            </div>
            
            {/* CTA按钮 */}
            <div className="pt-6">
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
          <div className={`flex justify-center ${getImageOrder()} ${getImageColSpan()}`}>
            <div className="w-full max-w-2xl">
              <div className="relative bg-white rounded-xl">
                <Image
                  src={config.image.src}
                  alt={config.image.alt}
                  width={600}
                  height={800}
                  className="w-full h-auto rounded-xl object-cover"
                />
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </section>
  )
} 