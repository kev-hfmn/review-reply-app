'use client'

import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface MobileScrollWrapperProps {
  children: ReactNode
  className?: string
  showPartialCards?: boolean
  cardWidth?: string
  gap?: string
}

export function MobileScrollWrapper({ 
  children, 
  className,
  showPartialCards = true,
  cardWidth = "280px",
  gap = "1.5rem"
}: MobileScrollWrapperProps) {
  return (
    <>
      {/* Desktop: Show original children (AnimatedGrid) */}
      <div className="hidden md:block">
        {children}
      </div>
      
      {/* Mobile: Horizontal scroll container */}
      <div className="block md:hidden">
        <div 
          className={cn(
            "mobile-scroll-container overflow-x-auto scrollbar-hide",
            "pb-4 -mx-4 px-4",
            className
          )}
          style={{
            scrollSnapType: 'x mandatory',
            scrollBehavior: 'smooth',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          <div 
            className="flex space-x-6"
            style={{
              width: 'max-content',
              gap: gap
            }}
          >
            {/* Extract children from AnimatedGrid and render as horizontal cards */}
            {/* This will be handled by extracting the mapped items */}
          </div>
        </div>
      </div>
    </>
  )
}

// Higher-order component version for more complex usage
export function withMobileScroll<T extends object>(
  WrappedComponent: React.ComponentType<T>,
  mobileScrollProps?: Partial<MobileScrollWrapperProps>
) {
  return function MobileScrollHOC(props: T) {
    return (
      <MobileScrollWrapper {...mobileScrollProps}>
        <WrappedComponent {...props} />
      </MobileScrollWrapper>
    )
  }
}

// Utility component for individual cards in mobile scroll
export function MobileScrollCard({ children, className }: { children: ReactNode, className?: string }) {
  return (
    <div 
      className={cn(
        "flex-shrink-0 w-[280px] scroll-snap-align-center",
        className
      )}
      style={{
        scrollSnapAlign: 'center'
      }}
    >
      {children}
    </div>
  )
}