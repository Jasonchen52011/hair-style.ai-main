'use client'

import '@fortawesome/fontawesome-free/css/all.min.css'
import { useState } from 'react'

interface Testimonial {
  quote: string
  author: string
  title: string
  rating: number
  avatar?: string
}

interface TestimonialsProps {
  testimonials?: Testimonial[]
}

const defaultTestimonials: Testimonial[] = [

]

export default function Testimonials({ testimonials = defaultTestimonials }: TestimonialsProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  const nextTestimonial = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % testimonials.length)
  }

  const prevTestimonial = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? testimonials.length - 1 : prevIndex - 1
    )
  }

  const goToTestimonial = (index: number) => {
    setCurrentIndex(index)
  }

  const currentTestimonial = testimonials[currentIndex]

  return (
    <div className="relative">
      {/* Desktop Layout */}
      <div className="hidden md:flex items-center">
        {/* Left Navigation Arrow - Outside Card */}
        <button 
          onClick={prevTestimonial}
          className="w-12 h-12 bg-white hover:bg-gray-50 border border-gray-200 rounded-full flex items-center justify-center transition-colors shadow-md mr-6 flex-shrink-0"
        >
          <i className="fas fa-chevron-left text-gray-600"></i>
        </button>

        {/* Main Testimonial Card */}
        <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-lg flex-1">
          {/* Quote */}
          <div className="text-center mb-8">
            <blockquote className="text-lg md:text-xl text-gray-700 italic leading-relaxed font-medium">
              "{currentTestimonial.quote}"
            </blockquote>
          </div>

          {/* Author Info */}
          <div className="text-center mb-6">
            <div className="font-semibold text-gray-900 text-lg">
              {currentTestimonial.author}
            </div>
            <div className="text-gray-600">
              {currentTestimonial.title}
            </div>
          </div>

          {/* Rating */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-1 mb-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <i 
                  key={star}
                  className={`fas fa-star ${star <= Math.floor(currentTestimonial.rating) ? 'text-yellow-400' : 'text-gray-300'}`}
                />
              ))}
            </div>
            <div className="text-gray-600 font-medium">
              {currentTestimonial.rating}
            </div>
          </div>

          {/* Dots Indicator */}
          <div className="flex justify-center space-x-2">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => goToTestimonial(index)}
                className={`w-3 h-3 rounded-full transition-colors ${
                  index === currentIndex ? 'bg-gray-800' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Right Navigation Arrow - Outside Card */}
        <button 
          onClick={nextTestimonial}
          className="w-12 h-12 bg-white hover:bg-gray-50 border border-gray-200 rounded-full flex items-center justify-center transition-colors shadow-md ml-6 flex-shrink-0"
        >
          <i className="fas fa-chevron-right text-gray-600"></i>
        </button>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden flex items-center">
        {/* Left Navigation Arrow - Outside Card */}
        <button 
          onClick={prevTestimonial}
          className="w-10 h-10 bg-white hover:bg-gray-50 border border-gray-200 rounded-full flex items-center justify-center transition-colors shadow-md mr-3 flex-shrink-0"
        >
          <i className="fas fa-chevron-left text-gray-600 text-sm"></i>
        </button>

        {/* Main Testimonial Card */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 border border-gray-100 shadow-lg flex-1">
          {/* Quote */}
          <div className="text-center mb-6">
            <blockquote className="text-base sm:text-lg text-gray-700 italic leading-relaxed font-medium px-2">
              "{currentTestimonial.quote}"
            </blockquote>
          </div>

          {/* Author Info */}
          <div className="text-center mb-4">
            <div className="font-semibold text-gray-900 text-base sm:text-lg">
              {currentTestimonial.author}
            </div>
            <div className="text-gray-600 text-sm sm:text-base">
              {currentTestimonial.title}
            </div>
          </div>

          {/* Rating */}
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-1 mb-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <i 
                  key={star}
                  className={`fas fa-star text-sm ${star <= Math.floor(currentTestimonial.rating) ? 'text-yellow-400' : 'text-gray-300'}`}
                />
              ))}
            </div>
            <div className="text-gray-600 font-medium text-sm">
              {currentTestimonial.rating}
            </div>
          </div>

          {/* Dots Indicator */}
          <div className="flex justify-center space-x-2">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => goToTestimonial(index)}
                className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-colors ${
                  index === currentIndex ? 'bg-gray-800' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Right Navigation Arrow - Outside Card */}
        <button 
          onClick={nextTestimonial}
          className="w-10 h-10 bg-white hover:bg-gray-50 border border-gray-200 rounded-full flex items-center justify-center transition-colors shadow-md ml-3 flex-shrink-0"
        >
          <i className="fas fa-chevron-right text-gray-600 text-sm"></i>
        </button>
      </div>


    </div>
  )
} 