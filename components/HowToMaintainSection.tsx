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
  }>
}

export default function HowToMaintainSection({ additionalSection }: HowToMaintainSectionProps) {
  return (
    <section className="py-10 sm:py-20 bg-white">
      <div className="w-full max-w-6xl mx-auto px-2 sm:px-4 lg:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-center">
          {/* 左侧文本内容 */}
          <div className="space-y-6 order-2 lg:order-1">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">
              {additionalSection[0].title}
            </h2>
            <div className="space-y-4 text-gray-800 leading-relaxed">
              {additionalSection[0].textContent.map((paragraph: string, pIndex: number) => (
                <p key={pIndex} className="text-sm sm:text-lg">
                  {paragraph}
                </p>
              ))}
            </div>
            
            <div className="flex justify-center lg:justify-start">
              <Link 
                href={additionalSection[0].ctaLink}
                className="btn text-white bg-purple-600 btn-lg rounded-xl border-purple-600 gap-2"
              >
                {additionalSection[0].ctaText}
                <i className="fas fa-arrow-right"></i>
              </Link>
            </div>
          </div>
          
          {/* 右侧图片 */}
          <div className="flex justify-center order-1 lg:order-2">
            <div className="w-full max-w-3xl rounded-lg overflow-hidden shadow-lg">
              <Image
                src={additionalSection[0].image.src}
                alt={additionalSection[0].image.alt}
                width={800}
                height={600}
                className="w-full h-auto object-contain"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
} 