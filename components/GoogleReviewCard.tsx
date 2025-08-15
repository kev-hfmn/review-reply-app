'use client';

import { useState, useEffect } from 'react';
import { Star, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TypewriterEffect } from '@/components/TypewriterEffect';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

interface GoogleReviewCardProps {
  // User information
  userName: string;
  userRole?: string;
  userReviewCount?: number;
  userPhotoCount?: number;
  userAvatar?: string;

  // Review content
  rating: number;
  reviewText: string;
  reviewDate: string;

  // Business reply
  showReply?: boolean;
  replyText?: string;
  replyDate?: string;
  businessName?: string;

  // Visual styling
  className?: string;
}

export function GoogleReviewCard({
  userName,
  userRole,
  userReviewCount,
  userPhotoCount,
  userAvatar,
  rating,
  reviewText,
  reviewDate,
  showReply = false,
  replyText,
  replyDate,
  businessName = "Business Owner",
  className = ""
}: GoogleReviewCardProps) {
  const [shouldStartTypewriter, setShouldStartTypewriter] = useState(false);
  const [isTypewriterComplete, setIsTypewriterComplete] = useState(false);
  const [showTumbleweed, setShowTumbleweed] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);

  // Generate random animation values for this card instance
  const randomValues = useState(() => ({
    startDelay: Math.random() * 2000 + 500, // 0.5-2.5s delay
    duration: Math.random() * 3 + 6, // 6-9s duration
    bounceHeight: Math.random() * 8 + 4, // 4-12px bounce
    rotations: Math.random() * 360 + 540, // 1.5-2.5 rotations
    pauseDelay: Math.random() * 2 + 2, // 2-4s pause between cycles
    bounceTiming: Math.random() * 0.5 + 1.5, // 1.5-2s bounce cycle
  }))[0];

  // Start typewriter effect when showReply becomes true
  useEffect(() => {
    if (showReply && replyText) {
      // Small delay to make it feel more natural
      const timer = setTimeout(() => {
        setShouldStartTypewriter(true);
        setIsTypewriterComplete(false);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setShouldStartTypewriter(false);
      setIsTypewriterComplete(false);
    }
  }, [showReply, replyText]);

  // Handle tumbleweed animation
  useEffect(() => {
    if (!showReply) {
      // Start tumbleweed animation after random delay
      const timer = setTimeout(() => {
        setShowTumbleweed(true);
      }, randomValues.startDelay);
      return () => clearTimeout(timer);
    } else {
      // Fade out tumbleweed when reply appears
      setShowTumbleweed(false);
    }
  }, [showReply, randomValues.startDelay]);

  // Reset animation key to restart animation
  useEffect(() => {
    if (showTumbleweed) {
      const interval = setInterval(() => {
        setAnimationKey(prev => prev + 1);
      }, (randomValues.duration + randomValues.pauseDelay) * 1000);

      return () => clearInterval(interval);
    }
  }, [showTumbleweed, randomValues.duration, randomValues.pauseDelay]);

  const handleTypewriterComplete = () => {
    setIsTypewriterComplete(true);
  };
  // Generate star display
  const renderStars = () => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={`h-3 w-3 ${
          index < rating
            ? 'fill-yellow-400 text-yellow-400'
            : 'fill-gray-200 text-gray-200'
        }`}
      />
    ));
  };

  // Generate user stats text
  const getUserStats = () => {
    const stats = [];
    if (userRole) stats.push(userRole);
    if (userReviewCount) stats.push(`${userReviewCount} reviews`);
    if (userPhotoCount) stats.push(`${userPhotoCount} photos`);
    return stats.join(' · ');
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 max-w-md ${className}`}>
      {/* User Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          {/* User Avatar */}
          <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
            {userAvatar ? (
              <Image
                src={userAvatar}
                alt={userName}
                width={40}
                height={40}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-blue-500 text-white font-medium text-sm">
                {userName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* User Info */}
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium text-gray-900 truncate">
              {userName}
            </h4>
            {getUserStats() && (
              <p className="text-xs text-gray-500 truncate">
                {getUserStats()}
              </p>
            )}
          </div>
        </div>

        {/* More options */}
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-gray-400">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </div>

      {/* Rating and Date */}
      <div className="flex items-center space-x-2 mb-2">
        <div className="flex space-x-0.5">
          {renderStars()}
        </div>
        <span className="text-xs text-gray-500">{reviewDate}</span>
      </div>

      {/* Review Text */}
      <div className="mb-4">
        <p className="text-sm text-gray-800 leading-relaxed">
          {reviewText}
        </p>
      </div>

      {/* Tumbleweed Animation */}
      <AnimatePresence>
        {!showReply && showTumbleweed && (
          <div className="relative h-16 -mx-4 mt-auto overflow-hidden" style={{ marginBottom: '-14px' }}>
            <motion.div
              key={`tumbleweed-${animationKey}`}
              initial={{
                x: -100,
                opacity: 1,
                rotate: 0,
                y: 10
              }}
              animate={{
                x: 420,
                rotate: randomValues.rotations,
              }}
              transition={{
                x: {
                  duration: randomValues.duration,
                  ease: [0.25, 0.1, 0.25, 1],
                },
                rotate: {
                  duration: randomValues.duration,
                  ease: "linear",
                }
              }}
              exit={{
                opacity: 0,
                transition: { duration: 0.5 }
              }}
              className="absolute"
            >
              <motion.div
                animate={{
                  y: [-randomValues.bounceHeight, randomValues.bounceHeight]
                }}
                transition={{
                  duration: randomValues.bounceTiming,
                  ease: "easeInOut",
                  repeat: Infinity,
                  repeatType: "reverse"
                }}
              >
                <Image
                  src="/icons/tumbleweed.png"
                  alt="Tumbleweed"
                  width={64}
                  height={64}
                  className="w-16 h-16"
                />
              </motion.div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Business Reply */}
      {showReply && replyText && (
        <div className="border-t border-gray-100 py-4">
          <div className="flex items-start space-x-3">
            {/* Business Avatar */}
            <div className="w-8 h-8 rounded-full bg-gray-100 flex-shrink-0 flex items-center justify-center">
              <div className="w-6 h-6 bg-blue-600/50 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-normal">
                  {businessName.charAt(0)}
                </span>
              </div>
            </div>

            {/* Reply Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <h5 className="text-sm font-medium text-gray-900">
                  Response from the owner
                </h5>
                {replyDate && (
                  <span className="text-xs text-gray-500">{replyDate}</span>
                )}
              </div>
              <div className="text-sm text-gray-700 leading-relaxed">
                {shouldStartTypewriter ? (
                  <span className="inline-flex items-baseline">
                    <TypewriterEffect
                      text={replyText || ''}
                      delay={25}
                      onComplete={handleTypewriterComplete}
                    />
                    {!isTypewriterComplete && (
                      <span className="animate-pulse ml-0.5 text-blue-500">|</span>
                    )}
                  </span>
                ) : (
                  <span className="text-gray-400 italic flex items-center">
                    <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse mr-2"></span>
                    Generating AI reply...
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
