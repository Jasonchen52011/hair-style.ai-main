'use client'

import Image from 'next/image'

interface BeforeAfterSectionProps {
  beforeAfterGallery: {
    title: string
    description: string
    images: Array<{
      src: string
      alt: string
      name: string
    }>
  }
}

export default function BeforeAfterSection({ beforeAfterGallery }: BeforeAfterSectionProps) {
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <section className="py-2 sm:py-20 bg-gray-50">
      <div className="w-full max-w-6xl mx-auto px-2 sm:px-4 lg:px-6">
        <div className="text-center mb-16">
          <h2 className="text-2xl sm:text-4xl font-bold mb-6 text-gray-800">
            {beforeAfterGallery.title}
          </h2>
          <p className="text-lg text-gray-800 max-w-5xl mx-auto">
            {beforeAfterGallery.description}
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-5">
          {beforeAfterGallery.images.map((image, index) => (
            <div key={index} className="bg-white rounded-lg cursor-pointer hover:shadow-xl transition-shadow duration-300" onClick={scrollToTop}>
              <Image
                src={image.src}
                alt={image.alt}
                width={300}
                height={300}
                className="w-full h-auto object-contain"
              />
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-800 text-center">
                  {image.name}
                </h3>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
} 