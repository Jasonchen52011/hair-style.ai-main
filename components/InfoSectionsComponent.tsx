import Link from 'next/link'

interface InfoSectionsProps {
  infoSections: Array<{
    title: string
    content: string[]
    image: string
    ctaText: string
    ctaLink: string
    styleConfig: {
      layout: {
        textRatio: string
        imageRatio: string
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

export default function InfoSectionsComponent({ infoSections }: InfoSectionsProps) {
  return (
    <>
      {infoSections.map((section, index) => {
        // 交替显示：第一个左图右文，第二个左文右图
        const imageFirst = index % 2 === 0;
        
        return (
          <section key={index} className="sm:py-16 py-6 bg-white">
            <div className="w-full max-w-6xl mx-auto px-2 sm:px-4 lg:px-6">
              <div className="max-w-full mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                  {/* Image */}
                  <div className={`flex justify-center ${imageFirst ? 'order-1 lg:order-1' : 'order-1 lg:order-2'}`}>
                    <div className="w-full max-w-lg bg-white rounded-xl overflow-hidden">
                      <img
                        src={section.image}
                        alt={section.title}
                        className="w-full h-auto object-contain rounded-2xl shadow-lg"
                      />
                    </div>
                  </div>
                  
                  {/* Text content */}
                  <div className={`space-y-6 ${imageFirst ? 'order-2 lg:order-2' : 'order-2 lg:order-1'}`}>
                    <h2 className={`${section.styleConfig.title.fontSize.mobile} lg:${section.styleConfig.title.fontSize.desktop} ${section.styleConfig.title.fontWeight} ${section.styleConfig.title.color} ${section.styleConfig.title.spacing}`}>
                      {section.title}
                    </h2>
                    <div className={`${section.styleConfig.text.fontSize.mobile} lg:${section.styleConfig.text.fontSize.desktop} ${section.styleConfig.text.color} ${section.styleConfig.text.lineHeight} space-y-4`}>
                      {section.content.map((paragraph, pIndex) => (
                        <p key={pIndex}>{paragraph}</p>
                      ))}
                    </div>
                    
                    <div className="flex justify-start">
                      <Link 
                        href={section.ctaLink}
                        className={`${section.styleConfig.button.background} ${section.styleConfig.button.backgroundHover} ${section.styleConfig.button.textColor} ${section.styleConfig.button.fontSize} ${section.styleConfig.button.fontWeight} ${section.styleConfig.button.padding} ${section.styleConfig.button.borderRadius} inline-flex items-center gap-2 transition-all duration-300 shadow-lg hover:shadow-xl`}
                      >
                        {section.ctaText}
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