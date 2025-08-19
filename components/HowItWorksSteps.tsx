'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';

// How It Works Steps Data
const stepsData = [
  {
    id: 1,
    title: "We request approval from Google for you",
    description: "Google requires each business to approve access before review management tools like ours can connect. We take care of the request process on your behalf so you don't have to deal with any of the technical steps.",
    expandableContent: "We have already applied for general access with Google, which will eventually remove the need for individual approvals. Since this process can take time, we currently follow the individual approval approach so you can start using RepliFast right away.",
    hasExpandable: true
  },
  {
    id: 2,
    title: "Google approves your access",
    description: "Once Google approves, you will receive a confirmation. This is the green light for you to connect your account to RepliFast.",
    hasExpandable: false
  },
  {
    id: 3,
    title: "Connect and bring in your reviews",
    description: "After approval, you simply enter your Google connection details into RepliFast. From there, you can bring in your existing reviews and start replying to them.",
    hasExpandable: false
  },
  {
    id: 4,
    title: "Keep your reviews up to date",
    description: "From that moment on, new reviews will appear in RepliFast so you can respond quickly and keep your reputation in great shape.",
    hasExpandable: false
  }
];

// Step Number Component with enhanced animations
function AnimatedStepNumber({ number, isVisible }: { number: number; isVisible: boolean }) {
  return (
    <motion.div
      initial={{ scale: 0, rotate: -180 }}
      animate={isVisible ? {
        scale: 1,
        rotate: 0,
background: "linear-gradient(135deg, #60a5fa, #a78bfa)"
      } : {
        scale: 0.8,
        rotate: -180,
 background: "linear-gradient(135deg, #94a3b8, #64748b)"
      }}
      transition={{
        duration: 0.6,
        type: "spring",
        stiffness: 200,
        damping: 15
      }}
      className="relative flex-shrink-0 w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg border-2 border-white/20 dark:border-slate-700/50"
    >
      <motion.span
        initial={{ opacity: 0 }}
        animate={isVisible ? { opacity: 1 } : { opacity: 0.6 }}
        transition={{ delay: 0.2, duration: 0.3 }}
        className="text-xl font-bold text-white"
      >
        {number}
      </motion.span>

      {/* One-time highlight effect when visible */}
      {isVisible && (
        <motion.div
          initial={{ scale: 1, opacity: 0 }}
          animate={{ scale: 1.3, opacity: [0, 0.4, 0] }}
          transition={{
            duration: 1.5,
            ease: "easeOut"
          }}
          className="absolute inset-0 rounded-2xl border-2 border-blue-400"
        />
      )}
    </motion.div>
  );
}

// How It Works Steps Component
export function HowItWorksSteps() {
  const [visibleSteps, setVisibleSteps] = useState<number[]>([]);

  return (
    <div className="relative">
      {/* Animated connecting line */}
      <div className="absolute left-8 top-8 h-[calc(100%-4rem)] w-0.5 hidden lg:block">
        <motion.div
          initial={{ height: 0 }}
          whileInView={{ height: "87%" }}
          viewport={{ once: true }}
          transition={{ duration: 2, ease: "easeInOut" }}
          className="w-full bg-gradient-to-b from-blue-200 via-blue-400 to-purple-400 dark:from-blue-800 dark:via-blue-600 dark:to-purple-600 rounded-full"
        />
      </div>

      <div className="space-y-8">
        {stepsData.map((step, index) => (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, x: -60 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{
              delay: index * 0.15,
              duration: 0.8,
              type: "spring",
              stiffness: 100
            }}
            onViewportEnter={() => {
              setVisibleSteps(prev => [...new Set([...prev, step.id])]);
            }}
            className="relative group"
          >
            <div className="flex items-start space-x-8">
              <AnimatedStepNumber
                number={step.id}
                isVisible={visibleSteps.includes(step.id)}
              />

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15 + 0.2, duration: 0.6 }}
                className="flex-1 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-8 border border-white/30 dark:border-slate-700/50 shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 group-hover:border-blue-300/50 dark:group-hover:border-blue-600/50"
              >
                <motion.h4
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.15 + 0.3, duration: 0.5 }}
                  className="text-xl font-semibold text-slate-900 dark:text-white mb-4 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors"
                >
                  {step.title}
                </motion.h4>

                <motion.p
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.15 + 0.4, duration: 0.5 }}
                  className="text-slate-600 dark:text-slate-300 leading-relaxed mb-4"
                >
                  {step.description}
                </motion.p>

                {step.hasExpandable && (
                  <motion.details
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.15 + 0.5, duration: 0.5 }}
                    className="group/details"
                  >
                    <summary className="cursor-pointer text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium flex items-center gap-2 transition-colors">
                      <span>Why?</span>
                      <motion.svg
                        className="w-4 h-4 transition-transform group-open/details:rotate-180"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </motion.svg>
                    </summary>
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      transition={{ duration: 0.3 }}
                      className="mt-3 p-4 bg-blue-50/50 dark:bg-blue-900/20 rounded-lg border border-blue-200/50 dark:border-blue-800/50"
                    >
                      <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                        {step.expandableContent}
                      </p>
                    </motion.div>
                  </motion.details>
                )}
              </motion.div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
