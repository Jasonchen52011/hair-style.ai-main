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
  }
}

export default function HairRegretsSection({ regretsSection }: HairRegretsSectionProps) {
  return (
    <section className="py-10 sm:py-20">
      <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 lg:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-center">
          
          {/* 文本内容 */}
          <div className="space-y-6 order-2 lg:order-2">
            <h2 className="text-2xl sm:text-4xl font-bold text-gray-800 mb-6">
              {regretsSection.title}
            </h2>
            
            <div className="space-y-4">
              {regretsSection.textContent.map((paragraph, index) => (
                <p key={index} className="text-gray-700 text-sm sm:text-lg leading-relaxed">
                  {paragraph}
                </p>
              ))}
            </div>
            
            {/* CTA按钮 */}
            <div className="pt-6">
              <Link 
                href={regretsSection.ctaLink}
                className="inline-flex items-center px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl transition-colors duration-200 gap-2"
              >
                {regretsSection.ctaText}
                <i className="fas fa-arrow-right"></i>
              </Link>
            </div>
          </div>
          
          {/* 图片 */}
          <div className="flex justify-center order-1 lg:order-1">
            <div className="w-full max-w-2xl">
              <div className="relative bg-white rounded-xl ">
                <Image
                  src={regretsSection.image.src}
                  alt={regretsSection.image.alt}
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