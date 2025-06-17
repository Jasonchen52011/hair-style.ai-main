import Image from 'next/image'
import Link from 'next/link'

interface HowToUseSectionProps {
  howToUseSection: {
    title: string
    description: string
    steps: Array<{
      title: string
      icon: string
      description: string
    }>
    image: {
      src: string
      alt: string
    }
    ctaText: string
    ctaLink: string
  }
}

export default function HowToUseSection({ howToUseSection }: HowToUseSectionProps) {
  return (
    <section className="py-10 sm:py-20">
      <div className="w-full max-w-6xl mx-auto px-2 sm:px-4 lg:px-6">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-4xl font-bold mb-6 text-gray-800">
            {howToUseSection.title}
          </h2>
          <p className="text-gray-800 text-sm sm:text-lg max-w-5xl mx-auto">
            {howToUseSection.description}
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
      
          <div className="space-y-6 order-2 lg:order-1">
            {howToUseSection.steps.map((step, index) => (
              <div key={index}>
                <h3 className="text-xl font-bold text-gray-800 mb-3">
                  <i className={`${step.icon} mr-2 text-purple-600`}></i>
                  {step.title}
                </h3>
                <p className="text-gray-800 text-sm sm:text-base">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
           
       
          <div className="flex justify-center order-1 lg:order-2">
            <div className="w-full max-w-2xl bg-gray-200 rounded-lg overflow-hidden">
              <Image
                src={howToUseSection.image.src}
                alt={howToUseSection.image.alt}
                width={700}
                height={800}
                className="w-full h-auto object-contain"
              />
            </div>
          </div>
        </div>
        
       
        <div className="flex justify-center mt-10">
          <Link 
            href={howToUseSection.ctaLink}
            className="btn text-white bg-purple-600 btn-lg rounded-xl border-purple-600 gap-2"
          >
            {howToUseSection.ctaText}
            <i className="fas fa-arrow-right"></i>
          </Link>
        </div>
      </div>
    </section>
  )
} 