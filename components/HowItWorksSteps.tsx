'use client';

import { motion, useScroll } from 'framer-motion';
import { ControlledVideo } from './ControlledVideo';
import { useRef, useState, useEffect } from 'react';

// How It Works Steps Data
const stepsData = [
  {
    id: 1,
    title: "Connect with your Google account",
    description: "After creating your RepliFast account, in the settings, securely grant access to your Google Business Profile. No extra setup needed - just confirm the connection and you're in.",
    videoSrc: "/screenshots/googlelogin.mp4",
    videoAlt: "Google consent screen showing the approval process for RepliFast to access Google Business Profile",
    hasExpandable: false,
    expandableContent: ""
  },

  {
    id: 2,
    title: "Set your tone and brand voice",
    description: "Choose from professional, casual, friendly, or add custom instructions so replies always sound like you. Come back to adjust your tone, style and brand voice at any time.",
    videoSrc: "/screenshots/brandtone.mp4",
    videoAlt: "RepliFast dashboard showing bulk import of Google reviews with reply options",
    hasExpandable: false
  },
  {
    id: 3,
    title: "Sync all your existing reviews",
    description: "Instantly import existing reviews from your Google Business Profile so you can reply and catch up in minutes. After the initial sync, you can easily sync new reviews by clicking the button again.",
    videoSrc: "/screenshots/sync.mp4",
    videoAlt: "RepliFast tone and brand voice settings page showing customization options",
    hasExpandable: false
  },
  {
    id: 4,
    title: "Generate review replies and post them directly to Google",
    description: "One-click or batch generation of review replies. Then, approve or edit replies and publish them instantly to your Google Maps profile. Optionally set up daily auto-sync & auto-post to switch your review handling to auto-pilot. No need to leave RepliFast, manage everything in one place.",
    videoSrc: "/screenshots/post.mp4",
    videoAlt: "RepliFast dashboard showing new review notifications and auto-generated replies",
    hasExpandable: false
  }
];

// Optimized scroll hook with throttling for better performance
function useActiveStep() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeStep, setActiveStep] = useState(1);
  const lastUpdateRef = useRef(0);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start center", "end center"]
  });

  // Throttled step calculation to reduce re-renders
  useEffect(() => {
    const unsubscribe = scrollYProgress.on("change", (progress) => {
      const now = Date.now();
      // Throttle updates to max 60fps
      if (now - lastUpdateRef.current < 16) return;

      const step = Math.min(Math.floor(progress * stepsData.length) + 1, stepsData.length);
      if (step !== activeStep) {
        setActiveStep(step);
        lastUpdateRef.current = now;
      }
    });

    return unsubscribe;
  }, [scrollYProgress, activeStep]);

  return { containerRef, activeStep };
}

// Screenshot Placeholder Component
function ScreenshotPlaceholder({ alt, isActive }: { alt: string; isActive: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{
        opacity: isActive ? 1 : 0.3,
        scale: isActive ? 1 : 0.95,
        y: isActive ? 0 : 10
      }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={`absolute inset-0 rounded-xl border-2 shadow-lg overflow-hidden ${
        isActive
          ? 'border-blue-300 dark:border-blue-600 shadow-blue-200/50 dark:shadow-blue-900/50'
          : 'border-gray-200 dark:border-gray-700'
      }`}
    >
      <div className="w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center p-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{alt}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">Screenshot placeholder</p>
        </div>
      </div>
    </motion.div>
  );
}

// Step Number Component
function StepNumber({ number }: { number: number }) {
  return (
    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-accent/80 text-foreground/80 flex items-center justify-center font-normal text-lg">
      {number}
    </div>
  );
}

// Simple Step Component with better performance
function SimpleStep({
  step,
  index,
  isActive
}: {
  step: typeof stepsData[0];
  index: number;
  isActive: boolean;
}) {
  return (
    <div
      className="sticky top-[20vh]"
      style={{
        zIndex: 10 + index,
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 60, scale: 0.9 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, amount: 0.3 }}
        animate={{
          y: isActive ? 0 : index * 10,
          scale: isActive ? 1 : 1 - index * 0.1,
          opacity: isActive ? 1 : Math.max(0.6 - index * 0.15, 0.3),

        }}
        transition={{
          duration: 0.5,
          ease: [0.16, 1, 0.3, 1]
        }}
        style={{
          transform: 'translateZ(0)',
          willChange: 'transform, opacity',
        }}
        className="bg-gradient-to-br from-card/80 to-card/70 backdrop-blur-lg border border-muted rounded-2xl shadow-xl overflow-hidden mx-4 lg:mx-8"
      >
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-0 items-center min-h-[500px]">
          {/* Content Section */}
          <div className="col-span-2 px-8 pb-0 flex flex-col justify-center">
            <div className="flex flex-col space-y-3 mb-4">
              <motion.div
                animate={{
                  opacity: isActive ? 1 : 0.4,
                }}
                transition={{ duration: 0.4 }}
              >
                <StepNumber number={step.id} />

              </motion.div>
              <motion.h4
                className="text-xl lg:text-2xl font-medium"
                animate={{
                  color: isActive ? 'var(--foreground/80)' : 'var(--muted-foreground)',
                  opacity: isActive ? 0.9 : 0.5,
                }}
                transition={{ duration: 0.4 }}
              >
                {step.title}
              </motion.h4>
            </div>
            <motion.p
              className="text-lg leading-tight"
              animate={{
                color: isActive ? 'var(--foreground/60)' : 'var(--muted-foreground)',
                opacity: isActive ? 0.7 : 0.4,
              }}
              transition={{ duration: 0.4 }}
            >
              {step.description}
            </motion.p>
          </div>

          {/* Video Section */}
          <div className="lg:col-span-4 relative p-4">
            <motion.div
              className="relative aspect-video rounded-xl overflow-hidden object-cover "
              animate={{
                scale: isActive ? 1 : 0.95,
                opacity: isActive ? 1 : 0.4,
              }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              <ControlledVideo
                src={step.videoSrc}
                className="w-full h-full object-fill"
                isActive={isActive}
              />
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// How It Works Steps Component
export function HowItWorksSteps() {
  const { containerRef, activeStep } = useActiveStep();

  return (
    <>
      {/* Desktop: Elegant Card Stacking */}
      <div ref={containerRef} className="hidden lg:block pb-20 relative" style={{ zIndex: 1 }}> {/* Low z-index to stay below navigation */}
        <div className="space-y-12">
          {stepsData.map((step, index) => (
            <SimpleStep
              key={step.id}
              step={step}
              index={index}
              isActive={activeStep === step.id}
            />
          ))}
        </div>

      </div>

      {/* Mobile: Horizontal Scroll (unchanged) */}
      <div className="block lg:hidden">
        <div
          className="mobile-scroll-container overflow-x-auto overflow-y-hidden h-full scrollbar-hide pb-4 -mx-4 px-4"
          style={{
            scrollSnapType: 'x mandatory',
            scrollBehavior: 'smooth',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          <div className="flex space-x-6" style={{ width: 'max-content' }}>
            {stepsData.map((step, index) => (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{
                  delay: index * 0.1,
                  duration: 0.5,
                  ease: "easeOut"
                }}
                className="relative flex-shrink-0 w-[calc(100vw-48px)] sm:w-[400px] scroll-snap-align-center bg-card p-5 px-4 rounded-2xl shadow-lg border border-border"
                style={{ scrollSnapAlign: 'center' }}
              >

                <div className="mb-6 -mx-4 -mt-5 top-0 left-0 right-0 ">
                  <ControlledVideo
                    src={step.videoSrc}
                    className="w-full h-full object-cover rounded-t-2xl border-b border-border"
                  />
                </div>

                <div className="flex items-start space-x-4 mb-6">
                  <StepNumber number={step.id} />
                  <h4 className="flex-1 text-xl font-semibold text-slate-900 dark:text-white">
                    {step.title}
                  </h4>
                </div>

                <p className="text-slate-600 dark:text-slate-300 leading-normal mb-6">
                  {step.description}
                </p>

                {step.hasExpandable && step.expandableContent && (
                  <details className="group/details">
                    <summary className="cursor-pointer text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium flex items-center gap-2 transition-colors">
                      <span>Why Google approval is required</span>
                      <svg
                        className="w-4 h-4 transition-transform group-open/details:rotate-180"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </summary>
                    <div className="mt-3 p-4 bg-blue-50/50 dark:bg-blue-900/20 rounded-lg border border-blue-200/50 dark:border-blue-800/50">
                      <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                        {step.expandableContent}
                      </p>
                    </div>
                  </details>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
