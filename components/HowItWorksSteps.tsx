'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';

// How It Works Steps Data
const stepsData = [
  {
    id: 1,
    title: "Connect with your Google account",
    description: "Log in securely with the same Google account you use for your Business Profile. No extra setup needed - just connect and you’re in.",
    screenshot: "step1.png",
    screenshotAlt: "Google consent screen showing the approval process for RepliFast to access Google Business Profile",
    hasExpandable: false,
    expandableContent: ""
  },
  {
    id: 2,
    title: "Sync all your existing reviews",
    description: "Instantly import past reviews from your Google Business Profile so you can reply and catch up in minutes.",
    screenshot: "step2.png",
    screenshotAlt: "RepliFast tone and brand voice settings page showing customization options",
    hasExpandable: false
  },
  {
    id: 3,
    title: "Set your tone and brand voice",
    description: "Choose from professional, casual, friendly, or add custom instructions so replies always sound like you.",
    screenshot: "step3.png",
    screenshotAlt: "RepliFast dashboard showing bulk import of Google reviews with reply options",
    hasExpandable: false
  },
  {
    id: 4,
    title: "Post review replies directly to Google",
    description: "Approve or edit your reply, then publish it instantly to your Google Maps listing with one click. No need to leave RepliFast, manage everything in one place.",
    screenshot: "step4.png",
    screenshotAlt: "RepliFast dashboard showing new review notifications and auto-generated replies",
    hasExpandable: false
  }
];

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
    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-lg">
      {number}
    </div>
  );
}

// How It Works Steps Component
export function HowItWorksSteps() {
  return (
    <div className="space-y-16 lg:space-y-24">
      {stepsData.map((step, index) => {
        const isEven = step.id % 2 === 0;

        return (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{
              delay: index * 0.1,
              duration: 0.8,
              ease: "easeOut"
            }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-0 lg:gap-16 items-center"
          >
            {/* Content Section */}
            <div className={`${isEven ? 'lg:order-2' : 'lg:order-1'}`}>
              <div className="flex items-start space-x-4 ">
                <StepNumber number={step.id} />

                <div className="flex-1">
                  <h4 className="text-xl lg:text-2xl font-semibold text-slate-900 dark:text-white mb-4">
                    {step.title}
                  </h4>

                  <p className="text-md lg:text-lg text-slate-600 dark:text-slate-300 leading-normal mb-6">
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
                </div>
              </div>
            </div>

            {/* Image Section */}
            <div className={`${isEven ? 'lg:order-1' : 'lg:order-2'}`}>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 + 0.2, duration: 0.6 }}
                className="relative aspect-auto rounded-xl overflow-hidden shadow-xl bg-white dark:bg-slate-800"
              >

                <Image
                  src={`/screenshots/${step.screenshot}`}
                  alt={step.screenshotAlt}
                  width={1000}
                  height={1000}
                  className="w-full h-full object-cover"
                />
              </motion.div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
