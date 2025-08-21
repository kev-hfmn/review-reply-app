'use client';

import { motion } from 'framer-motion';

// How It Works Steps Data
const stepsData = [
  {
    id: 1,
    title: "We'll guide you through the application process",
    description: "Google requires a one-time approval before review tools can connect. We walk you through this in a free 10-minute video call. You never share your password — everything runs through the official Google Business Profile API and Google's secure login.",
    screenshot: "google-consent-screen",
    screenshotAlt: "Google consent screen showing the approval process for RepliFast to access Google Business Profile",
    hasExpandable: true,
    expandableContent: "The Google Business Profile API is a secure and official way to access Google reviews. It is not open for public use, and Google requires each business to apply for access individually. Applying and accessing the API is free, but it takes a few days for Google to approve access. We have already applied for platform-wide access, but until that’s live, each business approves individually. This ensures you can start using RepliFast right away without waiting."
  },
  {
    id: 2,
    title: "Set your tone and brand voice",
    description: "Choose how you want to sound: professional, casual, or fully customized instructions so replies always feel authentic and on-brand.",
    screenshot: "tone-settings",
    screenshotAlt: "RepliFast tone and brand voice settings page showing customization options",
    hasExpandable: false
  },
  {
    id: 3,
    title: "Bring in and reply to your reviews",
    description: "Import your existing reviews in bulk and start replying instantly. You can also create auto-approval rules for certain star ratings to save even more time.",
    screenshot: "bulk-import",
    screenshotAlt: "RepliFast dashboard showing bulk import of Google reviews with reply options",
    hasExpandable: false
  },
  {
    id: 4,
    title: "Stay on top of every new review",
    description: "New reviews appear automatically in your dashboard. RepliFast generates replies in your tone of voice, so you can approve them manually or let rules handle it while keeping your reputation in great shape.",
    screenshot: "dashboard-notifications",
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
            className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center"
          >
            {/* Content Section */}
            <div className={`${isEven ? 'lg:order-2' : 'lg:order-1'}`}>
              <div className="flex items-start space-x-4 mb-6 lg:mb-0">
                <StepNumber number={step.id} />
                
                <div className="flex-1">
                  <h4 className="text-2xl lg:text-3xl font-semibold text-slate-900 dark:text-white mb-4">
                    {step.title}
                  </h4>
                  
                  <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
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
                className="relative aspect-video rounded-xl overflow-hidden shadow-2xl bg-white dark:bg-slate-800"
              >
                <ScreenshotPlaceholder 
                  alt={step.screenshotAlt}
                  isActive={true}
                />
              </motion.div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
