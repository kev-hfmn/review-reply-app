import { motion } from 'framer-motion';
import { CheckCircle, Circle, ExternalLink } from 'lucide-react';
import type { OnboardingStep } from '@/types/dashboard';

interface OnboardingCardProps {
  steps: OnboardingStep[];
  onStepAction?: (stepId: string) => void;
}

export default function OnboardingCard({ steps, onStepAction }: OnboardingCardProps) {
  const completedSteps = steps.filter(step => step.completed).length;
  const totalSteps = steps.length;
  const progressPercentage = (completedSteps / totalSteps) * 100;

  const handleStepClick = (step: OnboardingStep) => {
    if (step.action) {
      step.action();
    } else if (onStepAction) {
      onStepAction(step.id);
    }
  };

  return (
    <div className="bg-white dark:bg-neutral-dark rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
          Getting Started
        </h3>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-slate-600 dark:text-slate-400">
            {completedSteps}/{totalSteps}
          </span>
          <div className="w-16 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {steps.map((step, index) => (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`p-4 rounded-lg border-2 transition-all ${
              step.completed 
                ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20' 
                : 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50 hover:border-primary/30'
            } ${step.action || onStepAction ? 'cursor-pointer' : ''}`}
            onClick={() => handleStepClick(step)}
          >
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 mt-0.5">
                {step.completed ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <Circle className="h-5 w-5 text-slate-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className={`text-sm font-medium ${
                    step.completed 
                      ? 'text-green-900 dark:text-green-100' 
                      : 'text-slate-900 dark:text-white'
                  }`}>
                    {step.title}
                  </h4>
                  {!step.completed && step.actionText && (
                    <div className="flex items-center space-x-1 text-primary text-xs font-medium">
                      <span>{step.actionText}</span>
                      <ExternalLink className="h-3 w-3" />
                    </div>
                  )}
                </div>
                <p className={`text-xs mt-1 ${
                  step.completed 
                    ? 'text-green-700 dark:text-green-300' 
                    : 'text-slate-600 dark:text-slate-400'
                }`}>
                  {step.description}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {completedSteps === totalSteps && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-4 p-3 bg-green-100 dark:bg-green-900/30 rounded-lg text-center"
        >
          <CheckCircle className="h-6 w-6 text-green-500 mx-auto mb-2" />
          <p className="text-sm font-medium text-green-900 dark:text-green-100">
            🎉 Setup Complete!
          </p>
          <p className="text-xs text-green-700 dark:text-green-300 mt-1">
            You&apos;re all set to start managing your reviews
          </p>
        </motion.div>
      )}
    </div>
  );
}