"use client";

import Image from 'next/image'
import Link from 'next/link'

interface HowToStepsSectionProps {
  title: string
  description: string
  ctaText: string
  ctaLink: string
}

export default function HowToStepsSection({ 
  title, 
  description, 
  ctaText, 
  ctaLink 
}: HowToStepsSectionProps) {
  const handleImageError = (
    e: React.SyntheticEvent<HTMLImageElement, Event>
  ) => {
    const target = e.target as HTMLImageElement;
    target.onerror = null;
    target.src = "/images/fallback/placeholder.jpg";
  };

  return (
    <div className="container mx-auto px-4 max-w-6xl">
      <h2 className="text-2xl sm:text-4xl text-center font-bold mb-6 text-gray-800">
        {title}
      </h2>
      <p className="text-base sm:text-lg text-gray-800 text-center mb-12">
        {description}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-full mx-auto mb-12">
        {/* Step 1 */}
        <div className="text-center">
          <Link href={ctaLink} className="block group">
            <div className="aspect-video mb-6 rounded-lg overflow-hidden group-hover:shadow-lg transition-shadow cursor-pointer">
              <Image
                src="/images/steps/upload.jpg"
                alt="Simple illustration showing how to upload your photo for AI haircut simulator"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                width={400}
                height={300}
                onError={handleImageError}
              />
            </div>
          </Link>
          <h3 className="text-xl md:text-2xl font-bold mb-2 text-gray-800">
            Step1: Upload Image
          </h3>
          <p className="text-base md:text-lg text-gray-800">
            Upload your photo if you want to change your hairstyle with AI
            hairstyle changer.
          </p>
        </div>

        {/* Step 2 */}
        <div className="text-center">
          <Link href={ctaLink} className="block group">
            <div className="aspect-video mb-6 rounded-lg overflow-hidden group-hover:shadow-lg transition-shadow cursor-pointer">
              <Image
                src="/images/steps/choose.jpg"
                alt="Interactive interface demonstrating hairstyle and color selection process"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                width={400}
                height={300}
                onError={handleImageError}
              />
            </div>
          </Link>
          <h3 className="text-xl md:text-2xl font-bold mb-2 text-gray-800">
            Step2: Choose Hairstyle Filter and Hair Color
          </h3>
          <p className="text-base md:text-lg text-gray-800">
            Choose from our AI hairstyle changer, and pick the hairstyle
            filter and hair color you want to try.
          </p>
        </div>

        {/* Step 3 */}
        <div className="text-center">
          <Link href={ctaLink} className="block group">
            <div className="aspect-video mb-6 rounded-lg overflow-hidden group-hover:shadow-lg transition-shadow cursor-pointer">
              <Image
                src="/images/steps/download.jpg"
                alt="Example of downloading your transformed hairstyle result"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                width={400}
                height={300}
                onError={handleImageError}
              />
            </div>
          </Link>
          <h3 className="text-xl md:text-2xl font-bold mb-2 text-gray-800">
            Step3: Download Photo!
          </h3>
          <p className="text-base md:text-lg text-gray-800">
            Our AI hairstyle changer will change your hairstyle. Once
            complete, download the photo with your new AI virtual hairstyle
            and see how the transformation suits you.
          </p>
        </div>
      </div>

      <div className="flex justify-center items-center relative mt-4">
        <Link
          href={ctaLink}
          className="btn bg-purple-700 text-white btn-lg rounded-xl"
        >
          {ctaText}
        </Link>
      </div>
    </div>
  )
}