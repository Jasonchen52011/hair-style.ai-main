import Image from 'next/image'
import Link from 'next/link'

interface UniqueSectionProps {
  sections: Array<{
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

export default function UniqueSection({ sections }: UniqueSectionProps) {
  return (
    <>
      {sections.map((section, index) => {
        // Alternate layout: even index = text left/image right, odd index = image left/text right
        const isTextFirst = index % 2 === 0;
        
        return (
          <section key={index} className="py-16 bg-white">
            <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-center">
                {/* Image - Always first on mobile, alternates on desktop */}
                <div className={`flex justify-center order-1 ${isTextFirst ? 'lg:order-2' : 'lg:order-1'}`}>
                  <div className="w-full max-w-lg bg-white rounded-xl overflow-hidden">
                    <Image
                      src={section.image.src}
                      alt={section.image.alt}
                      width={600}
                      height={400}
                      className="w-full h-auto object-cover"
                    />
                  </div>
                </div>
                
                {/* Text Content - Always second on mobile, alternates on desktop */}
                <div className={`space-y-6 order-2 ${isTextFirst ? 'lg:order-1' : 'lg:order-2'}`}>
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">
                    {section.title}
                  </h2>
                  <p className="text-gray-600 text-base sm:text-lg leading-relaxed">
                    {section.description}
                  </p>
                  <div className="flex justify-start">
                    <Link 
                      href={section.ctaLink}
                      className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-6 py-3 rounded-xl inline-flex items-center gap-2 transition-colors duration-200"
                    >
                      {section.ctaText}
                      <i className="fas fa-arrow-right"></i>
                    </Link>
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