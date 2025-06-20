import Image from 'next/image'
import Link from 'next/link'

interface UsageScenariosSectionProps {
  ctaSections: Array<{
    title: string
    description: string
    image: {
      src: string
      alt: string
    }
    ctaText: string
    ctaLink: string
  }>
}

export default function UsageScenariosSection({ ctaSections }: UsageScenariosSectionProps) {
  return (
    <>
      {ctaSections.map((section, index) => (
        <section key={index} className="sm:py-16 py-6 bg-white">
          <div className="w-full max-w-6xl mx-auto px-2 sm:px-4 lg:px-6">
            <div className="max-w-full mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-center">
                {/* Image */}
                <div className={`flex justify-center ${index % 2 === 0 ? 'order-1 lg:order-1 lg:col-span-3' : 'order-1 lg:order-2 lg:col-span-3'}`}>
                  <div className="w-full max-w-6xl bg-white rounded-xl overflow-hidden ">
                    <Image
                      src={section.image.src}
                      alt={section.image.alt}
                      width={1200}
                      height={900}
                      className="w-full h-auto object-contain"
                    />
                  </div>
                </div>
                
                {/* Text content */}
                <div className={`space-y-10 ${index % 2 === 0 ? 'order-2 lg:order-2 lg:col-span-2' : 'order-2 lg:order-1 lg:col-span-2'}`}>
                  <h2 className="text-2xl sm:text-4xl font-bold text-gray-800">
                    {section.title}
                  </h2>
                  <p className="text-gray-800 text-sm sm:text-lg">
                    {section.description}
                  </p>
                  
                  <div className="flex justify-center lg:justify-start">
                    <Link 
                      href={section.ctaLink}
                      className="btn text-white bg-purple-600 btn-lg rounded-xl border-purple-600 gap-2"
                    >
                      {section.ctaText}
                      <i className="fas fa-arrow-right"></i>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      ))}
    </>
  )
} 