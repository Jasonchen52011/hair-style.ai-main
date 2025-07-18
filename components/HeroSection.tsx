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

// 随机选择用户头像
const getRandomReviewImages = () => {
  const reviewImages = [
    '/images/review/review1.webp',
    '/images/review/review2.webp', 
    '/images/review/review3.webp',
    '/images/review/review4.webp',
    '/images/review/review6.webp',
    '/images/review/review7.webp',
    '/images/review/review8.webp',
    '/images/review/review9.webp',
    '/images/review/review10.webp'
  ]
  
  
  const shuffled = [...reviewImages].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, 4)
}

export default function HeroSection({ heroSection, imageConfig }: HeroSectionProps) {
  const randomReviewImages = getRandomReviewImages()
  
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
            
            {/* 用户头像和统计文本 */}
            <div className="flex items-start justify-center lg:justify-start gap-3 mb-3 mt-8">
              {/* 随机用户头像 */}
              <div className="flex items-center -space-x-2">
                {randomReviewImages.map((image, index) => (
                  <div key={index} className="relative w-8 h-8 rounded-full overflow-hidden border-2 border-white">
                    <Image
                      src={image}
                      alt={`User review ${index + 1}`}
                      width={32}
                      height={32}
                      className="object-cover w-full h-full"
                    />
                  </div>
                ))}
              </div>
              
              {/* 星星和统计文本的垂直布局 */}
              <div className="flex flex-col">
                {/* 星星评分 */}
                <div className="flex items-center gap-1 mb-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <i 
                      key={star}
                      className="fas fa-star text-yellow-400 text-sm"
                    />
                  ))}
                </div>
                {/* 统计文本 */}
                <span className="text-gray-600 font-medium text-sm sm:text-base">{heroSection.statsText}</span>
              </div>
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