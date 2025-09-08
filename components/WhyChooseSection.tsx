'use client'

import Link from 'next/link'
import Testimonials from '@/components/testimonials'

interface WhyChooseSectionProps {
  whyChooseSection: {
    title: string
    features: Array<{
      icon: string
      title: string
      description: string
    }>
    ctaText?: string
    ctaLink?: string
    ctaSubText?: string
  }
  testimonialsConfig: any[]
}

export default function WhyChooseSection({ whyChooseSection, testimonialsConfig }: WhyChooseSectionProps) {
  return (
    <section className="py-10 mt-10 bg-white">
      <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 lg:px-6">
        <div className="text-center mb-16">
          <h2 className="text-2xl md:text-4xl font-bold mb-2 sm:mb-6 text-gray-800">
            {whyChooseSection.title}
          </h2>
        </div>
        
        <div className="grid w-full grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
          {whyChooseSection.features.map((feature, index) => (
            <div key={index} className="bg-white rounded-xl p-6 text-center shadow-sm border border-gray-100">
              <i className={`${feature.icon} text-5xl md:text-6xl text-purple-600 mb-6`}></i>
              <h3 className="text-lg font-bold text-gray-800 mb-3">{feature.title}</h3>
              <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
        
        <div className="w-full max-w-5xl mx-auto px-2 sm:px-4 lg:px-6 mt-10">
          <div className="w-full">
            <Testimonials testimonials={testimonialsConfig} />
          </div>
        </div>

        {whyChooseSection.ctaText && whyChooseSection.ctaLink && (
          <div className="flex flex-col items-center mt-12">
            <Link 
              href={whyChooseSection.ctaLink}
              className="btn text-white bg-purple-600 hover:bg-purple-700 btn-lg rounded-xl border-purple-600 gap-2 text-base font-semibold px-6 py-3 mb-3"
            >
              {whyChooseSection.ctaText}
              <i className="fas fa-arrow-right"></i>
            </Link>
            {whyChooseSection.ctaSubText && (
              <p className="text-sm text-gray-600 text-center max-w-md">
                {whyChooseSection.ctaSubText}
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  )
} 