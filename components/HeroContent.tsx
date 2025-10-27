import { Button } from '@/components/ui/button'
import { Sparkles, ArrowRight } from 'lucide-react'
import HeroAnimations from './HeroAnimations'

export default function HeroContent() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
      <div className="pt-5 pb-20 sm:pt-24 sm:pb-16">
        <div className="text-center">
          {/* SEO Badge - Static for server rendering */}
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-slate-50/50 dark:bg-blue-900/30 backdrop-blur-sm text-primary/85 dark:text-blue-300 text-sm font-medium mb-8">
            <Sparkles className="h-4 w-4 mr-2" />
            For Businesses Who Care About Reviews
          </div>

          {/* SEO Critical Content - Server Rendered */}
          <div className="max-w-3xl mx-auto">
            <h1 className="text-5xl lg:text-6xl font-bold text-slate-900 dark:text-white !leading-[1.2]">
              Automatic Replies for Your Google Reviews
            </h1>
            <p className="mt-4 lg:mt-6 text-lg lg:text-[1.375rem] lg:leading-normal text-foreground/80">
              RepliFast responds to every review in your tone of voice, helping you save time, build trust with customers, and keep your reputation strong.
            </p>
          </div>

          {/* Interactive Elements - Enhanced by Client Component */}
          <HeroAnimations>
            <div className="mt-6 lg:mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <div className="flex flex-col items-center">
                <Button
                  size="lg"
                  className="px-6 py-4 text-md mb-2 group !font-normal shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
                  variant="primary"
                >
                  Start within minutes
                  <ArrowRight className="h-5 w-5 ml-0 group-hover:translate-x-2 transition-all duration-200" />
                </Button>
                <p className="text-xs text-muted-foreground/70 mt-2">
                  Safe autopilot • Brand-safe tone • Full control anytime
                </p>
              </div>
            </div>
          </HeroAnimations>
        </div>
      </div>
    </div>
  )
}
