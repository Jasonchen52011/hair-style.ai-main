import { Metadata } from 'next'

export const metadata: Metadata = {
    metadataBase: new URL('https://hair-style.ai'),
    alternates: {
        canonical: 'https://hair-style.ai/ai-hairstyle',
    },
    title: 'AI Hairstyle Changer - Try New Hairstyles',
    description: 'Transform your look with our AI hairstyle changer. Upload your photo and instantly see yourself with different hairstyles.'
}

export default function AiHairstyleLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return children
} 