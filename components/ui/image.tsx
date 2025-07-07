import Image from 'next/image'
import { ComponentProps } from 'react'

interface EagerImageProps extends Omit<ComponentProps<typeof Image>, 'loading'> {
  loading?: 'lazy' | 'eager'
}

export default function EagerImage({ 
  loading = 'eager', 
  ...props 
}: EagerImageProps) {
  return (
    <Image
      loading={loading}
      {...props}
    />
  )
} 