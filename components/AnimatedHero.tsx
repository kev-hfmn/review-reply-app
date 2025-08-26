'use client'

import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { VideoModal } from '@/components/VideoModal'
import { ArrowRight, Sparkles } from 'lucide-react'

// Declare global particlesJS
declare global {
  interface Window {
    particlesJS: {
      load: (id: string, path: string, callback?: () => void) => void;
    };
  }
}

export default function AnimatedHero() {
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="pt-16 pb-16 sm:pt-24 sm:pb-16">
            <motion.div
              ref={heroRef}
              initial={{ opacity: 0, y: 20 }}
              animate={heroInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-100/30 dark:bg-blue-900/30 backdrop-blur-sm text-blue-800 dark:text-blue-300 text-sm font-medium mb-8">
                <Sparkles className="h-4 w-4 mr-2" />
                Your Reputation, On Autopilot
              </div>
              <div className="max-w-3xl mx-auto">
                <h1 className="text-4xl sm:text-6xl lg:text-6xl font-bold text-slate-900 dark:text-white !leading-[1.2]">
                  Automatic Replies for Your Google Reviews
                </h1>
                <p className="mt-8 text-[1.375rem] text-foreground/80">
                  RepliFast makes sure every review gets a reply in your tone of voice, helping you save time, build trust with customers, and keep your reputation strong.
                </p>
              </div>

              {/* CTA Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={heroInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="mt-12 flex flex-col sm:flex-row gap-4 justify-center"
              >
                <div className="flex flex-col items-center">
                  <Button
                    size="lg"
                    onClick={() => router.push('/dashboard')}
                    className="px-6 py-4 text-md mb-2 group !font-normal"
                    variant="primary"
                  >
                    Start now
                    <ArrowRight className="h-5 w-5 ml-0 group-hover:translate-x-2 transition-all duration-200" />
                  </Button>
                </div>
              </motion.div>
            </motion.div>
        </div>
      </div>

      {/* Video Modal */}
      <VideoModal
        isOpen={isVideoModalOpen}
        onClose={() => setIsVideoModalOpen(false)}
        videoId="S1cnQG0-LP4"
      />
    </>
  )
}
