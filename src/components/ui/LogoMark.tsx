import React from 'react'

export interface LogoMarkProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string
}

const LogoMark = React.forwardRef<SVGSVGElement, LogoMarkProps>(
  ({ size = 24, className, ...props }, ref) => {
    // If size is 'auto', we omit width and height so they can be defined via Tailwind classes
    const dimensions = size === 'auto' ? {} : { width: size, height: size }

    return (
      <svg
        ref={ref}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 64 64"
        fill="none"
        role="img"
        aria-label="My CookBooks"
        className={className}
        {...dimensions}
        {...props}
      >
        <title>My CookBooks Logo Mark</title>
        
        <path d="M22 8 C 18 12, 26 14, 22 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M32 5 C 28 10, 36 13, 32 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M42 8 C 38 12, 46 14, 42 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        
        <path d="M6 26 L 32 30 L 58 26 L 58 52 L 32 56 L 6 52 Z" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" fill="none" />
        <line x1="32" y1="30" x2="32" y2="56" stroke="currentColor" strokeWidth="3" />
        <path d="M14 36 L 26 38" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M14 42 L 26 44" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M38 38 L 50 36" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M38 44 L 50 42" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    )
  }
)

LogoMark.displayName = 'LogoMark'

export default LogoMark
