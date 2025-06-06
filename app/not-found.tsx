import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">404 - Page Not Found</h1>
        <p className="text-gray-600 mb-8">The page you&apos;re looking for doesn&apos;t exist.</p>
        <Link 
          href="/"
          className="px-6 py-3 bg-purple-700 text-white rounded-lg hover:bg-purple-800 transition-colors"
        >
          Go Home
        </Link>
      </div>
    </div>
  )
}