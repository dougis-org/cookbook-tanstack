interface CardImageProps {
  src?: string | null
  alt: string
  className: string
  'data-testid'?: string
}

export default function CardImage({ src, alt, className, 'data-testid': testId }: CardImageProps) {
  if (!src) return null
  return (
    <div className={className} data-testid={testId}>
      <img src={src} alt={alt} className="w-full h-full object-cover" />
    </div>
  )
}
