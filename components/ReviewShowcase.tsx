'use client'

import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { useState } from 'react'
import { GoogleReviewCard } from '@/components/GoogleReviewCard'
import { CheckCircle } from 'lucide-react'
import Image from 'next/image'

// Sample reviews for showcase
const sampleReviews = [
  {
    userName: "Tommy Fearn",
    userRole: "Local Guide",
    userReviewCount: 17,
    userPhotoCount: 14,
    userAvatar: "/icons/tommy.jpeg",
    rating: 5,
    reviewText: "Love this shop! Bought my first surfboard from here, and they were super helpful making sure I found the right one. Also got a bag for the board and they went to their stock room to double check as we thought there weren't any in stock but they found it for me.",
    reviewDate: "a month ago",
    replyText: "Thanks for dropping by, Tommy. Glad we could help you pick out your first board and track down that bag in the stock room. Hope the board's treating you well! Enjoy the waves.",
    replyDate: "a month ago"
  },

  {
    "userName": "Karen Simmons",
    "userReviewCount": 15,
    "userPhotoCount": 4,
    "userAvatar": "/icons/karen.jpeg",
    "rating": 3,
    "reviewText": "The staff was friendly and helpful, but my order took much longer than expected and one item wasn't quite right. I appreciate the effort, but I was hoping for a smoother experience.",
    "reviewDate": "2 weeks ago",
    "replyText": "Karen, thanks for sharing both the good and the not-so-good. I'm glad our staff made you feel welcome, but I'm sorry about the wait and the mistake with your order. That's not the experience we want for anyone. If you give us another chance, we'll work to make it a smoother visit.",
    "replyDate": "2 weeks ago"
  },
  {
    userName: "Sarah Chen",
    userRole: "Local Guide",
    userReviewCount: 32,
    userPhotoCount: 8,
    userAvatar: "/icons/sarah.jpeg",
    rating: 1,
    reviewText: "We waited over 40 minutes for a table, even though we had a reservation. The host seemed overwhelmed and didn’t give any updates. Food was okay but not worth the wait.",
    reviewDate: "3 days ago",
    replyText: "Hi Sofia. I’m sorry about the wait. Even with a reservation, you shouldn’t have been left without updates. We’re checking what caused the delay that night and will be working with our team to communicate more clearly. If you’d like to talk further, just reach us at feedback@elmwoodbistro.com.",
    replyDate: "3 days ago"
  }
]

interface ReviewShowcaseProps {
  heroInView: boolean
}

export default function ReviewShowcase({ heroInView }: ReviewShowcaseProps) {
  const [showReplies, setShowReplies] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={heroInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, delay: 0.4 }}
      className="relative"
    >
      <div className="relative mx-auto max-w-6xl">
        {/* Toggle Section */}
        <div className="relative text-center mb-5">
          <div className="inline-flex items-center bg-white dark:bg-slate-800 rounded-full p-1 shadow-sm border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setShowReplies(false)}
              className={`px-6 py-3  rounded-full text-sm font-medium transition-all duration-200 ${
                !showReplies
                  ? 'bg-slate-100  text-muted-foreground dark:text-slate-300 border border-slate-200 dark:bg-slate-700'
                  : 'text-slate-600 border dark:border-transparent border-white dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Without Replies
            </button>
            <button
              onClick={() => setShowReplies(true)}
              className={`px-6 py-3 rounded-full text-sm font-medium transition-all duration-200 ${
                showReplies
                  ? 'bg-accent/80 border border-accent dark:text-background text-foreground'
                  : 'text-slate-600 border dark:border-transparent border-white dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              With Replies
            </button>
          </div>

          {/* Arrow pointing to toggle */}
          <div className="absolute -top-40 left-1/2 transform translate-x-36 flex flex-col items-center">
            <div className="translate-y-16">
              <p className="text-xl text-slate-600 dark:text-slate-200 translate-x-16 font-medium max-w-[200px] text-center leading-tight font-indie-flower">
                See the difference replies make to your reputation
              </p>
            </div>
            <motion.div
              animate={{
                x: [0, -8, 0],
                y: [0, 2, 0]
              }}
              transition={{
                duration: 3,
                ease: "easeInOut",
                repeat: Infinity,
                repeatType: "loop"
              }}
            >
              <Image
                src="/arrow.png"
                alt="Click to toggle"
                width={190}
                height={190}
                className="transform rotate-[25deg] filter drop-shadow-lg block dark:hidden"
              />
              <Image
                src="/arrow.png"
                alt="Click to toggle"
                width={190}
                height={190}
                className="transform rotate-[25deg] filter drop-shadow-lg hidden dark:block"
              />
            </motion.div>
          </div>
        </div>

        {/* Review Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sampleReviews.map((review, index) => (
            <motion.div
              key={review.userName}
              initial={{ opacity: 0, y: 20 }}
              animate={heroInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.6 + index * 0.1 }}
            >
              <GoogleReviewCard
                userName={review.userName}
                userRole={review.userRole}
                userReviewCount={review.userReviewCount}
                userPhotoCount={review.userPhotoCount}
                userAvatar={review.userAvatar}
                rating={review.rating}
                reviewText={review.reviewText}
                reviewDate={review.reviewDate}
                showReply={showReplies}
                replyText={review.replyText}
                replyDate={review.replyDate}
                className="h-full"
              />
            </motion.div>
          ))}
        </div>

        {/* Impact Note */}
        {showReplies && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="text-center mt-8"
          >
            <div className="inline-flex items-center px-4 py-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-full text-sm font-medium">
              <CheckCircle className="h-4 w-4 mr-2" />
              Reviews with replies build 3x more trust with potential customers
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}
