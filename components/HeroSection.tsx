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
  }
  imageConfig: {
    displayHeight: number
    image: string
    alt: string
  }
}

export default function HeroSection({ heroSection, imageConfig }: HeroSectionProps) {
  return (
    <section className="bg-white py-2 sm:py-10 mb-10 mt-2 sm:mt-6">
      <div className="w-full max-w-6xl mx-auto px-2 sm:px-4">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-2 items-center">
    
          <div className="pr-1 order-2 lg:order-1 lg:col-span-2">
            <h1 className="text-4xl sm:text-5xl font-extrabold mb-6 text-gray-900">
              {heroSection.title}
            </h1>
            <p className="text-base md:text-lg text-gray-800 mb-4 sm:mb-2">
              {heroSection.description}
            </p>
            
            <div className="flex items-center justify-center lg:justify-start gap-3 mb-3 mt-8">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <i 
                    key={star}
                    className="fas fa-star text-yellow-400 text-sm"
                  />
                ))}
              </div>
              <span className="text-gray-600 font-medium text-sm sm:text-base">{heroSection.statsText}</span>
            </div>
            
            <div className="flex justify-center lg:justify-start">
              <Link 
                href={heroSection.ctaLink}
                className="btn text-white bg-purple-600 hover:bg-purple-700 btn-lg rounded-xl border-purple-600 gap-2 text-base font-semibold px-6 py-3"
              >
                {heroSection.ctaText}
                <i className="fas fa-arrow-right"></i>
              </Link>
            </div>
          </div>
          
          {/* right side show image */}
          <div className="flex justify-center lg:justify-end order-1 lg:order-2 lg:col-span-3">
            <div className="relative rounded-lg overflow-hidden w-full max-w-sm sm:max-w-md lg:max-w-none">
              <Image
                src={imageConfig.image}
                alt={imageConfig.alt}
                width={1000}
                height={imageConfig.displayHeight}
                className="object-contain rounded-lg w-full h-auto max-h-80 sm:max-h-96 lg:max-h-none"
                priority
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
} 