'use client'

import '@fortawesome/fontawesome-free/css/all.min.css'
import { useState } from 'react'

interface FAQItem {
  question: string
  answer: string
}

interface FAQProps {
  faqs: FAQItem[]
}

export default function FAQ({ faqs }: FAQProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  const toggleFAQ = (index: number) => {
    setActiveIndex(activeIndex === index ? null : index)
  }

  return (
    <section className="py-2 bg-white mb-10">
      <div className="w-full max-w-3xl mx-auto px-2 sm:px-4 lg:px-6">
        <div className="text-center mb-16">
          <h2 className="text-2xl sm:text-4xl font-bold mb-6 text-gray-800">
            Frequently Asked Questions
          </h2>
        </div>
        
        <div className="w-full max-w-4xl mx-auto">
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div 
                key={index} 
                className="bg-white rounded-lg  border border-gray-200 shadow-sm overflow-hidden"
              >
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-purple-50 transition-colors"
                >
                  <h3 className="text-base sm:text-xl text-gray-800 pr-4">
                    {faq.question}
                  </h3>
                  <i 
                    className={`fas fa-chevron-down text-purple-500 transition-transform duration-200 flex-shrink-0 ${
                      activeIndex === index ? 'transform rotate-180' : ''
                    }`}
                  />
                </button>
                
                <div 
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    activeIndex === index ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  <div className="px-6 pb-4 pt-0">
                    <p 
                      className="text-gray-600 text-sm sm:text-lg leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: faq.answer }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
} 