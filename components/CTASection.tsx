import Link from 'next/link'

interface CTASectionProps {
  finalCta: {
    title: string
    description: string
    ctaText: string
    ctaLink: string
    ctaSubText?: string
  }
}

export default function CTASection({ finalCta }: CTASectionProps) {
  return (
    <section className="py-2 sm:py-16 bg-gray-50">
      <div className="w-full px-2 sm:px-4 lg:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-6">
            {finalCta.title}
          </h2>
          <p className="text-xl text-gray-700 mb-8">
            {finalCta.description}
          </p>
          <div className="flex flex-col items-center">
            <Link 
              href={finalCta.ctaLink}
              className="btn text-white bg-purple-600 btn-lg rounded-xl border-purple-600 gap-2 mb-3"
            >
              {finalCta.ctaText}
            </Link>
            {finalCta.ctaSubText && (
              <p className="text-sm text-gray-600 text-center max-w-md">
                {finalCta.ctaSubText}
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  )
} 