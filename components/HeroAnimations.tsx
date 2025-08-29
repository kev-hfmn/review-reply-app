'use client'

import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { useRouter } from 'next/navigation'
import { useState, useEffect, ReactNode } from 'react'
import { VideoModal } from '@/components/VideoModal'
import { ArrowRight } from 'lucide-react'

// Declare global particlesJS
declare global {
  interface Window {
    particlesJS: {
      load: (id: string, path: string, callback?: () => void) => void;
    };
  }
}

interface HeroAnimationsProps {
  children: ReactNode;
}

export default function HeroAnimations({ children }: HeroAnimationsProps) {
  const router = useRouter()
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false)

  const [heroRef, heroInView] = useInView({
    triggerOnce: true,
    threshold: 0.1
  })

  useEffect(() => {
    // Simple particles.js initialization
    const initParticles = async () => {
      // Load the script dynamically
      const script = document.createElement('script')
      script.src = 'https://cdn.jsdelivr.net/particles.js/2.0.0/particles.min.js'
      script.onload = () => {
        if (window.particlesJS) {
          window.particlesJS.load('particles-js', '/particlesjs-config.json')
        }
      }
      document.head.appendChild(script)
    }

    initParticles()
  }, [])

  return (
    <>
      {/* CTA Section with enhanced animations */}
      <motion.div
        ref={heroRef}
        initial={{ opacity: 0, y: 20 }}
        animate={heroInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6, delay: 0.3 }}
        onClick={() => router.push('/dashboard')}
        className="cursor-pointer"
      >
        {children}
      </motion.div>

      {/* Video Modal */}
      <VideoModal
        isOpen={isVideoModalOpen}
        onClose={() => setIsVideoModalOpen(false)}
        videoId="S1cnQG0-LP4"
      />
    </>
  )
}