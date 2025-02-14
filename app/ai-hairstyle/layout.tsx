import { aiHairstyleMetadata } from '../metadata'

export const metadata = aiHairstyleMetadata

export default function AiHairstyleLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return <>{children}</>
} 