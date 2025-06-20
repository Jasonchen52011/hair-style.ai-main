interface FaceShapesSectionProps {
  isRightSection: {
    title: string
    tableData: Array<{
      feature: string
      description: string
    }>
    textContent: string[]
    styleConfig?: {
      layout?: {
        leftRatio?: string
        rightRatio?: string
        gap?: string
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
      tableHeader?: {
        fontSize?: {
          mobile?: string
          desktop?: string
        }
        fontWeight?: string
        color?: string
        background?: string
      }
      tableContent?: {
        fontSize?: {
          mobile?: string
          desktop?: string
        }
        color?: string
        featureFontWeight?: string
      }
      textContent?: {
        fontSize?: {
          mobile?: string
          desktop?: string
        }
        color?: string
        lineHeight?: string
        spacing?: string
      }
    }
  }
}

export default function FaceShapesSection({ isRightSection }: FaceShapesSectionProps) {
  // 默认样式配置
  const defaultConfig = {
    layout: {
      leftRatio: "1",
      rightRatio: "1", 
      gap: "gap-4"
    },
    title: {
      fontSize: {
        mobile: "text-2xl",
        desktop: "text-4xl"
      },
      fontWeight: "font-bold",
      color: "text-gray-800",
      spacing: "mb-12"
    },
    tableHeader: {
      fontSize: {
        mobile: "text-sm",
        desktop: "text-base"
      },
      fontWeight: "font-semibold", 
      color: "text-gray-800",
      background: "bg-gray-100"
    },
    tableContent: {
      fontSize: {
        mobile: "text-sm",
        desktop: "text-lg"
      },
      color: "text-gray-800",
      featureFontWeight: "font-medium"
    },
    textContent: {
      fontSize: {
        mobile: "text-sm",
        desktop: "text-lg"
      },
      color: "text-gray-800",
      lineHeight: "leading-relaxed",
      spacing: "space-y-4"
    }
  }

  // 合并用户配置和默认配置
  const config = {
    layout: { ...defaultConfig.layout, ...isRightSection.styleConfig?.layout },
    title: { ...defaultConfig.title, ...isRightSection.styleConfig?.title },
    tableHeader: { ...defaultConfig.tableHeader, ...isRightSection.styleConfig?.tableHeader },
    tableContent: { ...defaultConfig.tableContent, ...isRightSection.styleConfig?.tableContent },
    textContent: { ...defaultConfig.textContent, ...isRightSection.styleConfig?.textContent }
  }

  return (
    <section className="py-10 bg-white">
      <div className="w-full max-w-6xl mx-auto px-2 sm:px-4 lg:px-6">
        <h2 className={`${config.title.fontSize.mobile} sm:${config.title.fontSize.desktop} ${config.title.fontWeight} ${config.title.spacing} text-center ${config.title.color}`}>
          {isRightSection.title}
        </h2>
        
        <div className={`grid grid-cols-1 lg:grid-cols-${Number(config.layout.leftRatio) + Number(config.layout.rightRatio)} ${config.layout.gap} items-start`}>
          {/* Left table */}
          <div className={`bg-white rounded-lg shadow-sm overflow-hidden lg:col-span-${config.layout.leftRatio}`}>
            <div className={`${config.tableHeader.background} px-6 py-4 grid grid-cols-2 gap-4`}>
              <div className={`${config.tableHeader.fontWeight} ${config.tableHeader.color} ${config.tableHeader.fontSize.mobile} sm:${config.tableHeader.fontSize.desktop}`}>Feature</div>
              <div className={`${config.tableHeader.fontWeight} ${config.tableHeader.color} ${config.tableHeader.fontSize.mobile} sm:${config.tableHeader.fontSize.desktop}`}>Description</div>
            </div>
            
            {isRightSection.tableData.map((row, index) => (
              <div key={index} className={`px-6 py-4 ${index !== isRightSection.tableData.length - 1 ? 'border-b border-gray-100' : ''} grid grid-cols-2 gap-4`}>
                <div className={`${config.tableContent.fontSize.mobile} sm:${config.tableContent.fontSize.desktop} ${config.tableContent.featureFontWeight} ${config.tableContent.color}`}>{row.feature}</div>
                <div className={`${config.tableContent.color} ${config.tableContent.fontSize.mobile} sm:${config.tableContent.fontSize.desktop}`}>
                  {row.feature === "Popularity in 2025" ? (
                    <div className="flex items-center">
                      <span className="text-yellow-400">★★★★★</span>
                      <span className="ml-2">{row.description}</span>
                    </div>
                  ) : (
                    row.description
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {/* Right text */}
          <div className={`${config.textContent.spacing} ${config.textContent.color} ${config.textContent.fontSize.mobile} sm:${config.textContent.fontSize.desktop} ${config.textContent.lineHeight} lg:col-span-${config.layout.rightRatio}`}>
            {isRightSection.textContent.map((paragraph, index) => (
              <p key={index}>
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
} 