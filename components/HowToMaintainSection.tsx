import Image from 'next/image'
import Link from 'next/link'

interface HowToMaintainSectionProps {
  additionalSection: Array<{
    title: string
    textContent: string[]
    image?: {
      src: string
      alt: string
    }
    hairTypeTable?: Array<{
      type: string
      characteristics: string
      care: string
    }>
    ctaText: string
    ctaLink: string
    styleConfig?: {
      layout: {
        imageRatio?: string
        textRatio: string
        tableRatio?: string
        imageOrder?: string
        tableOrder?: string
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
      tableRatio: "3/5",
      imageOrder: "right",
      tableOrder: "right", 
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
  const getGridCols = (styleConfig: any, hasTable: boolean = false) => {
    const styles = { ...defaultStyles.layout, ...styleConfig?.layout };
    if (hasTable) {
      const textRatio = parseInt(styles.textRatio.split('/')[0]);
      const tableRatio = parseInt(styles.tableRatio?.split('/')[0] || '3');
      const total = textRatio + tableRatio;
      return `grid-cols-1 lg:grid-cols-${total}`;
    } else {
      const imageRatio = parseInt(styles.imageRatio?.split('/')[0] || '3');
      const textRatio = parseInt(styles.textRatio.split('/')[0]);
      const total = imageRatio + textRatio;
      return `grid-cols-1 lg:grid-cols-${total}`;
    }
  };

  const getImageColSpan = (styleConfig: any) => {
    const styles = { ...defaultStyles.layout, ...styleConfig?.layout };
    const imageRatio = parseInt(styles.imageRatio?.split('/')[0] || '3');
    return `lg:col-span-${imageRatio}`;
  };

  const getTextColSpan = (styleConfig: any) => {
    const styles = { ...defaultStyles.layout, ...styleConfig?.layout };
    const textRatio = parseInt(styles.textRatio.split('/')[0]);
    return `lg:col-span-${textRatio}`;
  };

  const getTableColSpan = (styleConfig: any) => {
    const styles = { ...defaultStyles.layout, ...styleConfig?.layout };
    const tableRatio = parseInt(styles.tableRatio?.split('/')[0] || '3');
    return `lg:col-span-${tableRatio}`;
  };

  const getImageOrder = (styleConfig: any) => {
    const styles = { ...defaultStyles.layout, ...styleConfig?.layout };
    return styles.imageOrder === 'left' ? 'order-1 lg:order-1' : 'order-1 lg:order-2';
  };

  const getTableOrder = (styleConfig: any) => {
    const styles = { ...defaultStyles.layout, ...styleConfig?.layout };
    return styles.tableOrder === 'left' ? 'order-1 lg:order-1' : 'order-1 lg:order-2';
  };

  const getTextOrder = (styleConfig: any, hasTable: boolean = false) => {
    const styles = { ...defaultStyles.layout, ...styleConfig?.layout };
    if (hasTable) {
      return styles.textOrder === 'left' ? 'order-2 lg:order-1' : 'order-2 lg:order-2';
    }
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

        const hasTable = config.hairTypeTable && config.hairTypeTable.length > 0;

        return (
          <section key={index} className="py-10 sm:py-20 bg-white">
            <div className="w-full max-w-6xl mx-auto px-2 sm:px-4 lg:px-6">
              <div className={`grid ${getGridCols(config.styleConfig, hasTable)} gap-4 items-center`}>
                {/* 文本内容 */}
                <div className={`space-y-6 ${getTextOrder(config.styleConfig, hasTable)} ${getTextColSpan(config.styleConfig)}`}>
                  <h2 className={`${styles.title.fontSize.mobile} sm:${styles.title.fontSize.desktop} ${styles.title.fontWeight} ${styles.title.color} ${styles.title.spacing}`}>
                    {config.title}
                  </h2>
                  <div className={`${styles.text.spacing} ${styles.text.color} ${styles.text.lineHeight}`}>
                    {config.textContent.map((paragraph: string, pIndex: number) => (
                      <p 
                        key={pIndex} 
                        className={`${styles.text.fontSize.mobile} sm:${styles.text.fontSize.desktop}`}
                        dangerouslySetInnerHTML={{ __html: paragraph }}
                      />
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
                
                {/* 表格或图片 */}
                {hasTable ? (
                  <div className={`${getTableOrder(config.styleConfig)} ${getTableColSpan(config.styleConfig)}`}>
                    <div className="bg-gray-50 rounded-xl p-6">
                      <div className="max-h-96 overflow-y-auto">
                        <table className="w-full text-sm">
                          <thead className="sticky top-0 bg-gray-100">
                            <tr>
                              <th className="text-left p-3 font-semibold text-gray-800">Hair Type</th>
                              <th className="text-left p-3 font-semibold text-gray-800">Characteristics</th>
                              <th className="text-left p-3 font-semibold text-gray-800">Care Tips</th>
                            </tr>
                          </thead>
                          <tbody>
                            {config.hairTypeTable?.map((row, rowIndex) => (
                              <tr key={rowIndex} className="border-t border-gray-200 hover:bg-gray-50">
                                <td className="p-3 font-medium text-purple-700">{row.type}</td>
                                <td className="p-3 text-gray-600">{row.characteristics}</td>
                                <td className="p-3 text-gray-600">{row.care}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                ) : config.image ? (
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
                ) : null}
              </div>
            </div>
          </section>
        );
      })}
    </>
  )
} 