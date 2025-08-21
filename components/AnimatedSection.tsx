'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface AnimatedSectionProps {
  children: ReactNode
  className?: string
  delay?: number
  direction?: 'up' | 'down' | 'left' | 'right' | 'scale'
  duration?: number
  viewport?: {
    once?: boolean
    amount?: number
  }
}

export default function AnimatedSection({
  children,
  className = '',
  delay = 0,
  direction = 'up',
  duration = 0.6,
  viewport = { once: true, amount: 0.1 }
}: AnimatedSectionProps) {
  const getInitialState = () => {
    switch (direction) {
      case 'up':
        return { opacity: 0, y: 20 }
      case 'down':
        return { opacity: 0, y: -20 }
      case 'left':
        return { opacity: 0, x: 20 }
      case 'right':
        return { opacity: 0, x: -20 }
      case 'scale':
        return { opacity: 0, scale: 0.95 }
      default:
        return { opacity: 0, y: 20 }
    }
  }

  const getAnimateState = () => {
    switch (direction) {
      case 'up':
        return { opacity: 1, y: 0 }
      case 'down':
        return { opacity: 1, y: 0 }
      case 'left':
        return { opacity: 1, x: 0 }
      case 'right':
        return { opacity: 1, x: 0 }
      case 'scale':
        return { opacity: 1, scale: 1 }
      default:
        return { opacity: 1, y: 0 }
    }
  }

  return (
    <motion.div
      initial={getInitialState()}
      whileInView={getAnimateState()}
      viewport={viewport}
      transition={{ duration, delay }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// Additional component for grid animations
interface AnimatedGridProps {
  children: ReactNode[]
  className?: string
  itemClassName?: string
  staggerDelay?: number
  direction?: 'up' | 'down' | 'left' | 'right' | 'scale'
  viewport?: {
    once?: boolean
    amount?: number
  }
}

export function AnimatedGrid({
  children,
  className = '',
  itemClassName = '',
  staggerDelay = 0.1,
  direction = 'up',
  viewport = { once: true, amount: 0.1 }
}: AnimatedGridProps) {
  const getInitialState = () => {
    switch (direction) {
      case 'up':
        return { opacity: 0, y: 20 }
      case 'down':
        return { opacity: 0, y: -20 }
      case 'left':
        return { opacity: 0, x: 20 }
      case 'right':
        return { opacity: 0, x: -20 }
      case 'scale':
        return { opacity: 0, scale: 0.95 }
      default:
        return { opacity: 0, y: 20 }
    }
  }

  const getAnimateState = () => {
    switch (direction) {
      case 'up':
        return { opacity: 1, y: 0 }
      case 'down':
        return { opacity: 1, y: 0 }
      case 'left':
        return { opacity: 1, x: 0 }
      case 'right':
        return { opacity: 1, x: 0 }
      case 'scale':
        return { opacity: 1, scale: 1 }
      default:
        return { opacity: 1, y: 0 }
    }
  }

  return (
    <div className={className}>
      {children.map((child, index) => (
        <motion.div
          key={index}
          initial={getInitialState()}
          whileInView={getAnimateState()}
          viewport={viewport}
          transition={{ duration: 0.6, delay: index * staggerDelay }}
          className={itemClassName}
        >
          {child}
        </motion.div>
      ))}
    </div>
  )
}