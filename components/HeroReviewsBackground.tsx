'use client'

import { motion, useScroll, useTransform } from 'framer-motion'
import { Star } from 'lucide-react'
import Image from 'next/image'
import { useMemo, useRef } from 'react'

// Generate diverse sample reviews for background animation
const backgroundReviews = [
  {
    userName: "Sarah Johnson",
    userAvatar: "/icons/sarah.jpeg",
    rating: 5,
    reviewText: "Amazing service! The team went above and beyond to help us. Highly recommend!",
    reviewDate: "2 days ago"
  },
  {
    userName: "Mike Chen",
    userAvatar: "/icons/tommy.jpeg",
    rating: 4,
    reviewText: "Great experience overall. Fast delivery and excellent customer support.",
    reviewDate: "1 week ago"
  },
  {
    userName: "Emma Davis",
    userAvatar: "/icons/karen.jpeg",
    rating: 5,
    reviewText: "Outstanding quality and service. Will definitely come back again!",
    reviewDate: "3 days ago"
  },
  {
    userName: "James Wilson",
    userAvatar: "/icons/sarah.jpeg",
    rating: 5,
    reviewText: "Perfect! Everything was exactly as promised. Couldn't be happier.",
    reviewDate: "5 days ago"
  },
  {
    userName: "Lisa Rodriguez",
    userAvatar: "/icons/tommy.jpeg",
    rating: 4,
    reviewText: "Very professional service. The staff was friendly and knowledgeable.",
    reviewDate: "1 week ago"
  },
  {
    userName: "David Kim",
    userAvatar: "/icons/karen.jpeg",
    rating: 5,
    reviewText: "Exceeded my expectations in every way. Truly exceptional experience!",
    reviewDate: "4 days ago"
  },
  {
    userName: "Rachel Green",
    userAvatar: "/icons/sarah.jpeg",
    rating: 5,
    reviewText: "Best decision ever! The quality is top-notch and the price is fair.",
    reviewDate: "6 days ago"
  },
  {
    userName: "Tom Anderson",
    userAvatar: "/icons/tommy.jpeg",
    rating: 4,
    reviewText: "Solid service with attention to detail. Would recommend to others.",
    reviewDate: "2 weeks ago"
  },
  {
    userName: "Maria Garcia",
    userAvatar: "/icons/karen.jpeg",
    rating: 5,
    reviewText: "Fantastic! Quick response time and excellent results. Very satisfied.",
    reviewDate: "3 days ago"
  },
  {
    userName: "Alex Turner",
    userAvatar: "/icons/sarah.jpeg",
    rating: 5,
    reviewText: "Incredible service from start to finish. They really care about customers.",
    reviewDate: "1 week ago"
  },
  {
    userName: "Jessica Lee",
    userAvatar: "/icons/tommy.jpeg",
    rating: 4,
    reviewText: "Great value for money. Professional and reliable service every time.",
    reviewDate: "5 days ago"
  },
  {
    userName: "Ryan Murphy",
    userAvatar: "/icons/karen.jpeg",
    rating: 5,
    reviewText: "Absolutely perfect experience. They delivered exactly what they promised.",
    reviewDate: "2 days ago"
  },
  {
    userName: "Sophie Brown",
    userAvatar: "/icons/sarah.jpeg",
    rating: 5,
    reviewText: "Outstanding customer service! They went the extra mile to ensure satisfaction.",
    reviewDate: "1 week ago"
  },
  {
    userName: "Kevin Park",
    userAvatar: "/icons/tommy.jpeg",
    rating: 4,
    reviewText: "Very impressed with the quality and attention to detail. Highly recommended!",
    reviewDate: "4 days ago"
  },
  {
    userName: "Anna White",
    userAvatar: "/icons/karen.jpeg",
    rating: 5,
    reviewText: "Exceptional service! Professional, friendly, and delivered on time.",
    reviewDate: "6 days ago"
  }
]

interface ReviewCardProps {
  review: typeof backgroundReviews[0]
  className?: string
}

function BackgroundReviewCard({ review, className = "" }: ReviewCardProps) {
  const renderStars = () => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={`h-2.5 w-2.5 ${
          index < review.rating
            ? 'fill-yellow-400 text-yellow-400'
            : 'fill-gray-300 text-gray-300'
        }`}
      />
    ))
  }

  return (
    <div className={`bg-white/95 backdrop-blur-sm rounded-lg shadow-xl border border-gray-200/50 p-2.5 max-w-[260px] mb-3 ${className}`}>
      {/* User Header */}
      <div className="flex items-center space-x-2 mb-1.5">
        <div className="w-5 h-5 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
          {review.userAvatar ? (
            <Image
              src={review.userAvatar}
              alt={review.userName}
              width={20}
              height={20}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-blue-500 text-white font-medium text-xs">
              {review.userName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-xs font-medium text-gray-900 truncate">
            {review.userName}
          </h4>
        </div>
      </div>

      {/* Rating */}
      <div className="flex items-center space-x-1 mb-1.5">
        <div className="flex space-x-0.5">
          {renderStars()}
        </div>
      </div>

      {/* Review Text - Truncated */}
      <div className="mb-1.5">
        <p className="text-xs text-gray-700 leading-relaxed line-clamp-3">
          {review.reviewText.length > 50
            ? `${review.reviewText.substring(0, 75)}...`
            : review.reviewText
          }
        </p>
      </div>

      {/* Date */}
      <div className="text-xs text-gray-500">
        {review.reviewDate}
      </div>
    </div>
  )
}

export default function HeroReviewsBackground() {
  const containerRef = useRef<HTMLDivElement>(null)

  // Get scroll progress
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  })

  // Transform scroll progress to Y positions - both move down
  const topRightY = useTransform(scrollYProgress, [0, 1], [-100, 150])
  const bottomLeftY = useTransform(scrollYProgress, [0, 1], [0, 200])

  // Generate review stacks for different positions
  const topRightReviews = useMemo(() => {
    return backgroundReviews.slice(0, 4).map((review, index) => ({
      ...review,
      id: `top-right-${review.userName}-${index}`,
    }))
  }, [])

  const bottomLeftReviews = useMemo(() => {
    return backgroundReviews.slice(4, 8).map((review, index) => ({
      ...review,
      id: `bottom-left-${review.userName}-${index}`,
    }))
  }, [])

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Top Right Reviews - Scroll down moves them up */}
      <motion.div
        className="absolute right-8 md:right-16 lg:right-24 top-0"
        style={{ y: topRightY }}
      >
        <motion.div
          className="opacity-40 blur-[0.8px] scale-100"
          animate={{
            y: [-5, 5, -5],
          }}
          transition={{
            duration: 8,
            ease: 'easeInOut',
            repeat: Infinity,
          }}
        >
          {topRightReviews.map((review, index) => (
            <motion.div
              key={review.id}
              className="mb-0"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.2, duration: 0.6 }}
            >
              <BackgroundReviewCard review={review} />
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      {/* Bottom Left Reviews - Scroll down moves them down */}
      <motion.div
        className="absolute left-8 md:left-16 lg:left-24 bottom-20"
        style={{ y: bottomLeftY }}
      >
        <motion.div
          className="opacity-40 blur-[0.8px]"
          animate={{
            y: [3, -3, 3],
          }}
          transition={{
            duration: 7,
            delay: 2,
            ease: 'easeInOut',
            repeat: Infinity,
          }}
        >
          {bottomLeftReviews.map((review, index) => (
            <motion.div
              key={review.id}
              className="mb-0"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1 + index * 0.2, duration: 0.6 }}
            >
              <BackgroundReviewCard review={review} />
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      {/* Gradient overlay to fade reviews at edges */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-primary/5 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-primary/5 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-primary/5 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-primary/5 pointer-events-none" />
    </div>
  )
}
