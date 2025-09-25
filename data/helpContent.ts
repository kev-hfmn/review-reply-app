export interface HelpTopic {
  id: string;
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  description: string;
  icon: string;
  content: {
    overview: string;
    sections: Array<{
      title: string;
      content: string;
      steps?: Array<{title: string; description: string}>;
    }>;
    tips?: string[];
    relatedTopics?: string[];
  };
  seoKeywords: string[];
  category: 'getting-started' | 'features' | 'setup' | 'troubleshooting' | 'advanced' | 'billing' | 'security';
  lastUpdated: string;
  schema?: object;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  seoKeywords: string[];
}

export const helpTopics: HelpTopic[] = [
  {
    id: 'what-is-replifast',
    slug: 'what-is-replifast',
    title: 'What is RepliFast?',
    metaTitle: 'What is RepliFast? AI-Powered Google Review Management Platform',
    metaDescription: 'RepliFast is the leading AI-powered review management platform that helps small businesses automatically respond to Google reviews with professional, branded replies.',
    description: 'Learn how RepliFast transforms Google review management with AI-powered automation.',
    icon: 'HelpCircle',
    content: {
      overview: 'RepliFast is a specialized AI-powered platform designed exclusively for small businesses to automate Google Business Profile review management. Unlike bloated, expensive all-in-one marketing suites, RepliFast focuses on one thing and does it exceptionally well: generating professional, on-brand responses to every Google review automatically.',
      sections: [
        {
          title: 'The Problem RepliFast Solves',
          content: 'Small business owners juggle countless daily tasks - managing customers, staff, suppliers, and operations. Review management often falls to the bottom of the priority list, yet it\'s crucial for online reputation and local SEO success.',
          steps: [
            {
              title: 'Time Constraints',
              description: 'Business owners spend 3-5 hours weekly manually crafting review responses, time that could be spent growing their business.'
            },
            {
              title: 'Inconsistent Responses',
              description: 'Without a system, review responses vary in quality, tone, and timing, creating an unprofessional appearance.'
            },
            {
              title: 'Missed Opportunities',
              description: 'Unanswered reviews signal to potential customers that the business doesn\'t care about feedback, hurting trust and conversions.'
            },
            {
              title: 'Local SEO Impact',
              description: 'Google\'s algorithm favors businesses that actively engage with reviews, improving local search rankings for responsive businesses.'
            }
          ]
        },
        {
          title: 'How RepliFast Works',
          content: 'RepliFast operates as your dedicated review management assistant, handling the entire workflow from detection to response.',
          steps: [
            {
              title: 'Automatic Review Detection',
              description: 'Connects securely to your Google Business Profile and allows you to sync all existing reviews and monitor for new reviews. RepliFast allows for manual sync and automated daily sync for full autopilot mode.'
            },
            {
              title: 'AI-Powered Response Generation',
              description: 'Advanced AI analyzes each review\'s content, sentiment, and rating to generate contextually appropriate responses that match your brand voice.'
            },
            {
              title: 'Smart Approval Workflow',
              description: 'Choose between manual approval for full control or set auto-approval rules for positive reviews to achieve true autopilot mode.'
            },
            {
              title: 'Direct Google Integration',
              description: 'Approved responses post directly to your Google Business Profile without requiring you to leave the RepliFast platform.'
            }
          ]
        },
        {
          title: 'Measurable Business Impact',
          content: 'RepliFast delivers quantifiable improvements to your online presence and customer relationships.',
          steps: [
            {
              title: 'Time Savings',
              description: 'Reduce review management time by 90%, freeing up 3-5 hours weekly for core business activities.'
            },
            {
              title: 'Improved Response Rate',
              description: 'Achieve 100% response rate to customer reviews, showing potential customers you value feedback.'
            },
            {
              title: 'Enhanced Local SEO',
              description: 'Google rewards active engagement - businesses using RepliFast see improved local search rankings within 30-60 days.'
            },
            {
              title: 'Customer Trust Building',
              description: '89% of consumers are more likely to use businesses that respond to all reviews (BrightLocal, 2023).'
            }
          ]
        }
      ],
      tips: [
        'Start with the 14-day risk-free money-back guarantee to experience the full platform without commitment',
        'Configure your brand voice before generating your first replies for optimal results',
        'Use the insights dashboard to track improvement in response rate and customer sentiment',
        'Set up auto-approval rules for 4-5 star reviews to achieve true autopilot functionality'
      ],
      relatedTopics: ['getting-started-guide', 'ai-replies', 'brand-voice', 'pricing-plans']
    },
    seoKeywords: ['AI review management', 'Google Business Profile automation', 'review response software', 'local SEO tool', 'small business reputation management'],
    category: 'getting-started',
    lastUpdated: '2024-12-07',
    schema: {
      "@type": "Article",
      "headline": "What is RepliFast? AI-Powered Google Review Management Platform",
      "description": "RepliFast is the leading AI-powered review management platform that helps small businesses automatically respond to Google reviews with professional, branded replies."
    }
  },
  {
    id: 'getting-started-guide',
    slug: 'getting-started-guide',
    title: 'Complete Getting Started Guide',
    metaTitle: 'Getting Started with RepliFast - Complete Setup Guide for Small Businesses',
    metaDescription: 'Step-by-step guide to setting up RepliFast for your business. Connect Google Business Profile, configure AI settings, and start automating review responses in under 5 minutes.',
    description: 'Your complete roadmap to automating Google review management with RepliFast.',
    icon: 'BookOpen',
    content: {
      overview: 'This comprehensive guide walks you through every step of setting up RepliFast, from initial account creation to your first automated review response. Most businesses complete setup in under 5 minutes and see their first AI-generated replies within the hour.',
      sections: [
        {
          title: 'Pre-Setup Requirements',
          content: 'Ensure you have the necessary access and information before beginning setup.',
          steps: [
            {
              title: 'Google Business Profile Access',
              description: 'You must have owner or manager permissions for the Google Business Profile you want to connect. If you\'re unsure about your access level, check your Google Business Profile dashboard before proceeding. <a href="https://business.google.com/" target="_blank" style="text-decoration: underline;">Click here</a> to access the Google Business Profile dashboard in a new tab, so you can check your access level.'
            },
            {
              title: 'Active Business Profile',
              description: 'Your Google Business Profile must be verified and active. Unverified profiles cannot use review management features. If your profile needs verification, complete that process first.'
            },
            {
              title: 'Review History',
              description: 'While not required, businesses with existing reviews see immediate value. RepliFast can help you catch up on unanswered reviews from the past.'
            }
          ]
        },
        {
          title: 'Account Creation & Initial Setup',
          content: 'Create your RepliFast account and configure basic business information.',
          steps: [
            {
              title: 'Sign Up Process',
              description: 'Visit replifast.com and click "Get Started". Create your account using email or Google sign-in (recommended). To use RepliFast with all its features, a subscription is required.'
            },
            {
              title: 'Connect your Google Business Profile',
              description: 'Navigate to Settings > Google Connection. Click "Connect Google Business Profile" to start the secure Authorization process. You\'ll be redirected to Google for authorization and to grant RepliFast access to your Google Business Profile.'
            },
            {
              title: 'Business Information',
              description: 'Complete your business profile with accurate information: business name, industry, location, and primary contact details (email and phone number). When a negative review appears, these details can be shared in replies so customers know how to contact you directly and resolve the issue. This information helps the AI understand your business context.'
            },
            {
              title: 'Set up your brand voice',
              description: 'Choose a brand voice preset or create a custom one to match your business personality. This helps the AI generate responses that align with your brand identity.'
            }
          ]
        },
        {
          title: 'Google Business Profile Integration',
          content: 'Connect your Google Business Profile to enable review synchronization and response posting.',
          steps: [
            {
              title: 'Navigate to Settings',
              description: 'From your dashboard, go to Settings > Google Connection. '
            },
            {
              title: 'Initiate Google Connection',
              description: 'Click "Connect Google Business Profile" to start the secure OAuth process. You\'ll be redirected to Google for authorization and to grant RepliFast access to your Google Business Profile.'
            },
            {
              title: 'Grant Necessary Permissions',
              description: 'Authorize RepliFast to read your reviews and post replies on your behalf. These permissions are essential for the platform to function.'
            },
            {
              title: 'Verify Connection Success',
              description: 'Return to RepliFast and confirm your business profile appears correctly. All your business locations will be listed if you own or manage multiple locations.'
            },
            {
              title: 'Initial Review Import',
              description: 'In the Reviews tab, click the "Fetch Reviews" button to trigger the import process. RepliFast automatically imports your existing reviews. For businesses with many reviews, this process may take 2-5 minutes. Once the import is complete, they will show up and you can start replying to reviews.'
            }
          ]
        },
        {
          title: 'Brand Voice Configuration',
          content: 'Set up your brand voice to ensure AI responses match your business personality.',
          steps: [
            {
              title: 'Choose Voice Preset',
              description: 'Select from Friendly, Professional, or Playful presets as a starting point. You can customize these settings later.'
            },
            {
              title: 'Adjust Tone Parameters',
              description: 'Fine-tune Formality (1-5), Warmth (1-5), and Brevity (1-5) levels to match your preferred communication style.'
            },
            {
              title: 'Add Custom Instructions',
              description: 'Include specific phrases, policies, or information that should appear in responses. For example: "Always end replies with "Best regards, Linda" or "Always thank the customer for their visit to our restaurant".'
            },
            {
              title: 'Test Voice Settings',
              description: 'Generate a sample response using your current settings to ensure the tone matches your expectations before going live. You can always come back and adjust your settings later. Using the "Regenerate Reply" button will generate a new response based on your current settings.'
            }
          ]
        },
        {
          title: 'First Review Response',
          content: 'Generate and post your first AI-powered review response.',
          steps: [
            {
              title: 'Navigate to Reviews',
              description: 'Go to the Reviews tab to see all imported Google reviews organized by date, rating, and response status.'
            },
            {
              title: 'Select a Review',
              description: 'Choose an unanswered review to practice with. Start with a positive review for your first experience.'
            },
            {
              title: 'Generate AI Response',
              description: 'Click "Generate Reply" and watch as AI creates a personalized response based on the review content and your brand voice settings.'
            },
            {
              title: 'Review and Edit',
              description: 'Read the generated response carefully. Edit any parts that need adjustment to better match your preferred messaging. You can always click "Regenerate Reply" to generate a new response based on your current settings.'
            },
            {
              title: 'Approve the Response',
              description: 'When satisfied with the response, click "Approve" to mark it as ready for posting. This changes the status from "pending" to "approved" but does not post the reply yet. You\'ve confirmed the response is ready to be sent.'
            },
            {
              title: 'Post to Google',
              description: 'After approval, click "Post Reply" to actually publish the response to your Google Business Profile. This is when the reply becomes visible to customers. With Pro plan automation enabled, approved replies post automatically during daily automation cycles.'
            },
            {
              title: 'Review reply appearance on Google',
              description: 'Note that it may take up to 24h for the reply to appear on Google Maps. This is due to Google Maps caching the reviews and updating them at regular intervals. However, you will be able to see the replies in your Google Business Profile already. No worries, the reply will appear on Google Maps in the next update, so then everyone will see it.'
            }
          ]
        },
        {
          title: 'Automation Setup (Optional)',
          content: 'Configure automation features for hands-off review management and full autopilot mode. To use autopilot mode, you need to have a pro plan.',
          steps: [
            {
              title: 'Auto-Sync Configuration',
              description: 'Enable automatic daily review syncing to detect new reviews without manual intervention. Choose your preferred sync time slot.'
            },
            {
              title: 'Auto-Approval Rules',
              description: 'Set rules to automatically approve and post responses for positive reviews (4-5 stars). This enables true autopilot mode.'
            },
            {
              title: 'Notification Preferences',
              description: 'Configure email notifications for new reviews, negative feedback, or daily summaries based on your preference.'
            }
          ]
        }
      ],
      tips: [
        'Complete the onboarding checklist in your dashboard for optimal setup',
        'Start with manual approval for your first 5-10 responses to get a feel for the AI responses',
        'Test different brand voice settings with various review types to find your perfect tone',
        'Set up automation gradually - start with auto-sync, then add auto-approval as you gain confidence',
      ],
      relatedTopics: ['google-business-setup', 'brand-voice', 'managing-reviews', 'automation-settings']
    },
    seoKeywords: ['RepliFast setup guide', 'Google Business Profile connection', 'automated review responses', 'review management setup'],
    category: 'getting-started',
    lastUpdated: '2024-12-07'
  },
  {
    id: 'managing-reviews',
    slug: 'managing-reviews',
    title: 'Advanced Review Management',
    metaTitle: 'Master Google Review Management with RepliFast - Complete Workflow Guide',
    metaDescription: 'Learn advanced review management techniques with RepliFast: bulk actions, filtering, automation rules, and strategies for handling positive and negative reviews.',
    description: 'Master the complete review management workflow from sync to response.',
    icon: 'MessageSquare',
    content: {
      overview: 'Effective review management goes beyond simple responses. This guide covers advanced techniques for organizing, filtering, and responding to reviews at scale, helping you maintain a professional online presence while minimizing time investment.',
      sections: [
        {
          title: 'Review Organization & Filtering',
          content: 'Master the tools that help you efficiently navigate and prioritize your reviews.',
          steps: [
            {
              title: 'Review Status Understanding',
              description: 'Reviews are categorized as New (no response), Pending (AI response generated, awaiting approval), Replied (response posted), or Failed (posting error occurred).'
            },
            {
              title: 'Smart Filtering Options',
              description: 'Filter by star rating, date range, response status, or specific keywords. Use filters to quickly identify urgent reviews requiring immediate attention.'
            },
            {
              title: 'Search Functionality',
              description: 'Search review text for specific terms, customer names, or complaint types to quickly locate relevant reviews for follow-up or pattern analysis.'
            },
            {
              title: 'Sorting Strategies',
              description: 'Sort by date (newest first for immediate attention), rating (lowest first for damage control), or response status (prioritize unanswered reviews).'
            }
          ]
        },
        {
          title: 'AI Response Generation Workflow',
          content: 'Optimize the AI response generation process for efficiency and quality.',
          steps: [
            {
              title: 'Single Review Processing',
              description: 'Click any review to generate an individual AI response. Best for unique situations requiring careful attention or complex reviews.'
            },
            {
              title: 'Bulk Generation',
              description: 'Select multiple reviews using checkboxes and click "Generate Replies" to process several reviews simultaneously. Ideal for catching up on backlogs.'
            },
            {
              title: 'AI Context Analysis',
              description: 'The AI analyzes review sentiment, specific mentions (staff names, services, issues), and rating to generate contextually appropriate responses.'
            },
            {
              title: 'Brand Voice Application',
              description: 'Each generated response automatically incorporates your configured brand voice settings, ensuring consistency across all interactions.'
            }
          ]
        },
        {
          title: 'Response Review & Editing',
          content: 'Ensure every response meets your standards before publication.',
          steps: [
            {
              title: 'Quality Assessment',
              description: 'Review each AI-generated response for accuracy, appropriateness, and brand alignment. Check that the response addresses specific points mentioned in the review.'
            },
            {
              title: 'Editing Best Practices',
              description: 'Add specific details about the customer experience, mention staff members by name, or include relevant business information like hours or contact details.'
            },
            {
              title: 'Tone Adjustment',
              description: 'Modify responses to better match your preferred communication style or to address specific situations requiring a different approach.'
            },
            {
              title: 'Template Integration',
              description: 'Incorporate standard phrases, policies, or calls-to-action that you want consistently included in responses.'
            }
          ]
        },
        {
          title: 'Approval & Publishing Process',
          content: 'Understanding the two-step workflow: approving responses for readiness, then posting them to Google.',
          steps: [
            {
              title: 'Step 1: Approval (Review Ready)',
              description: 'Clicking "Approve" changes the review status from "pending" to "approved," confirming the AI response is ready for publication. This does NOT post the reply yet - it simply marks it as approved for posting.'
            },
            {
              title: 'Step 2A: Manual Posting',
              description: 'In manual mode (default), you must click "Post Reply" after approval to actually send the response to Google Business Profile. This gives you complete control over timing and final review before publication.'
            },
            {
              title: 'Step 2B: Auto-Posting (Pro Plan)',
              description: 'With auto-posting enabled, approved responses automatically post during the next automation cycle (12:00 PM UTC or 12:00 AM UTC). This enables hands-off management for positive reviews while you focus on negative feedback.'
            },
            {
              title: 'Bulk Operations',
              description: 'Select multiple reviews to approve or post simultaneously. Filter by status to efficiently process groups: bulk approve positive reviews, then bulk post approved responses, or let automation handle the posting.'
            },
            {
              title: 'Status Tracking',
              description: 'Monitor the complete workflow: Pending → Approved → Posted. Track which responses are ready for posting versus actually published, and receive notifications if any posting attempts fail.'
            }
          ]
        },
        {
          title: 'Advanced Workflow Strategies',
          content: 'Optimize your review management process for different business scenarios.',
          steps: [
            {
              title: 'High-Volume Processing',
              description: 'For businesses receiving 20+ reviews monthly, use bulk actions and auto-approval rules to maintain efficiency while ensuring quality.'
            },
            {
              title: 'Crisis Management',
              description: 'When facing negative feedback, prioritize those reviews, craft thoughtful responses, and use the opportunity to demonstrate excellent customer service publicly.'
            },
            {
              title: 'Seasonal Adjustments',
              description: 'Modify brand voice settings or custom instructions during busy seasons, holiday periods, or special promotions to keep responses relevant.'
            },
            {
              title: 'Multi-Location Coordination',
              description: 'For businesses with multiple locations, develop consistent response strategies while allowing for location-specific details and personalities.'
            }
          ]
        }
      ],
      tips: [
        'Process negative reviews first to minimize potential damage to your reputation',
        'Set aside 15-20 minutes daily for review management to maintain consistency',
        'Use bulk actions during off-peak hours to efficiently process positive reviews',
        'Keep a list of frequently mentioned staff names, services, and policies for quick editing',
        'Monitor Google Business Profile directly to verify responses post correctly',
        'Save time by setting up auto-approval for 4-5 star reviews after you\'re comfortable with AI quality'
      ],
      relatedTopics: ['ai-replies', 'automation-settings', 'bulk-actions', 'negative-review-handling']
    },
    seoKeywords: ['Google review management workflow', 'bulk review responses', 'review filtering', 'AI review replies'],
    category: 'features',
    lastUpdated: '2024-12-07'
  },
  {
    id: 'ai-replies',
    slug: 'ai-replies',
    title: 'AI Reply Generation Deep Dive',
    metaTitle: 'How RepliFast AI Generates Perfect Review Responses - Complete Guide',
    metaDescription: 'Understanding RepliFast AI technology: how it analyzes reviews, generates responses, learns from your preferences, and maintains brand consistency.',
    description: 'Understand how AI creates personalized, professional review responses.',
    icon: 'Brain',
    content: {
      overview: 'RepliFast\'s AI system uses OpenAI\'s advanced language model with custom prompts and sophisticated quality controls to generate professional, contextually appropriate responses. Unlike simple template systems, every response is uniquely crafted to address the specific review content while maintaining your brand voice and avoiding robotic language patterns.',
      sections: [
        {
          title: 'AI Analysis Process',
          content: 'Understanding how AI interprets and processes review content.',
          steps: [
            {
              title: 'Sentiment Analysis',
              description: 'AI evaluates the emotional tone of the review (positive, negative, neutral) and identifies specific emotions like frustration, excitement, or disappointment to craft appropriate responses.'
            },
            {
              title: 'Content Extraction',
              description: 'The system identifies key elements: specific services mentioned, staff names, complaint details, praise points, and suggested improvements mentioned by the customer.'
            },
            {
              title: 'Context Understanding',
              description: 'AI considers the review rating, length, customer history (if available), and business type to understand the full context of the customer experience.'
            },
            {
              title: 'Intent Recognition',
              description: 'The system determines whether the customer is seeking resolution, expressing gratitude, warning others, or simply sharing their experience.'
            }
          ]
        },
        {
          title: 'Advanced Prompt Engineering',
          content: 'How RepliFast\'s sophisticated prompt system creates natural, professional responses.',
          steps: [
            {
              title: 'Dynamic Prompt Construction',
              description: 'Each request uses a carefully crafted system prompt that incorporates your business information, brand voice settings (1-5 scales), and custom instructions to ensure AI understands your specific requirements.'
            },
            {
              title: 'Contextual Length Adaptation',
              description: 'The system automatically adjusts response length based on review complexity and rating. Negative reviews (1-3 stars) receive longer, more comprehensive responses regardless of brevity settings to ensure proper issue resolution.'
            },
            {
              title: 'Anti-Generic Language Controls',
              description: 'Built-in forbidden word filtering automatically prevents robotic phrases like "thrilled," "delighted," or "means the world to us" to ensure responses sound naturally human-written.'
            },
            {
              title: 'Natural Punctuation Enforcement',
              description: 'AI is specifically instructed to avoid em dashes, en dashes, and other patterns that make text sound AI-generated, using natural punctuation for authentic communication.'
            }
          ]
        },
        {
          title: 'Smart Response Customization',
          content: 'How the system adapts responses based on review characteristics and your settings.',
          steps: [
            {
              title: 'Rating-Based Response Strategy',
              description: 'The AI automatically adjusts its approach: positive reviews (4-5 stars) focus on gratitude and specific acknowledgment, while negative reviews (1-3 stars) emphasize empathy, resolution, and contact information when available.'
            },
            {
              title: 'Review Length Consideration',
              description: 'Short reviews receive appropriately brief responses, while detailed reviews get more comprehensive replies. The system intelligently scales response length to match the customer\'s investment in their feedback.'
            },
            {
              title: 'Business Context Integration',
              description: 'Responses automatically include your contact email and phone number for negative reviews when configured, and incorporate custom instructions about policies, staff, or business-specific details.'
            },
            {
              title: 'Professional Tone Enforcement',
              description: 'Built-in controls ensure responses remain professional and appropriate, avoiding overly casual language or potential escalation of negative situations while maintaining your chosen brand voice level.'
            }
          ]
        },
        {
          title: 'Brand Voice Scale System',
          content: 'Understanding how the 1-5 scales control response personality and style.',
          steps: [
            {
              title: 'Formality Scale (1-5)',
              description: 'Level 1 = Very casual with contractions, Level 3 = Neutral business language, Level 5 = Very formal with no contractions. Each level precisely controls how formal or conversational your responses sound.'
            },
            {
              title: 'Warmth Scale (1-5)',
              description: 'Level 1 = Factual and restrained, Level 3 = Empathetic but not effusive, Level 5 = Very warm and people-oriented. Controls how friendly and personal responses feel without becoming unprofessional.'
            },
            {
              title: 'Brevity Scale (1-5)',
              description: 'Level 1 = Very detailed (35-60+ words), Level 3 = Moderate (20-35 words), Level 5 = Very concise (8-18 words). Automatically overridden for negative reviews which receive longer responses regardless of setting.'
            },
            {
              title: 'Custom Instructions Impact',
              description: 'Your custom instructions are directly incorporated into every AI prompt, allowing you to specify business policies, staff names, contact information, or specific phrases that should appear in responses.'
            }
          ]
        },
        {
          title: 'Advanced AI Quality Features',
          content: 'Sophisticated quality controls that ensure professional, human-sounding responses.',
          steps: [
            {
              title: 'Automatic Negative Review Expansion',
              description: 'When a review is rated 1-3 stars, the system automatically provides 40-100% more words than your brevity setting would normally allow, ensuring adequate space for empathy, issue acknowledgment, and resolution paths.'
            },
            {
              title: 'Contextual Temperature Control',
              description: 'Response creativity is automatically adjusted based on your brand voice preset and settings. Professional presets use lower creativity for consistency, while Playful presets allow more creative language variation.'
            },
            {
              title: 'Specific Detail Extraction',
              description: 'The AI is specifically prompted to identify and reference 1-2 specific details from each review, ensuring responses prove you read and understood the customer\'s individual experience rather than using generic templates.'
            },
            {
              title: 'Natural Language Enforcement',
              description: 'Built-in controls prevent AI-detection patterns by avoiding robotic phrases, varying sentence structures, and using natural punctuation. Every response is designed to sound genuinely human-written.'
            }
          ]
        }
      ],
      tips: [
        'Test different brand voice scale combinations (formality, warmth, brevity) with the same review to find your perfect settings',
        'Remember that negative reviews automatically get longer responses regardless of your brevity setting - this ensures proper issue resolution',
        'Include specific business details in custom instructions: staff names, policies, contact info, and unique services for more personalized responses',
        'Use the "Regenerate Reply" feature to see different response variations for the same review based on your current settings',
        'The AI automatically references specific details from each review - focus your custom instructions on business-specific information rather than generic response guidance',
        'Update custom instructions seasonally to keep automated responses current with promotions, hours, or policy changes'
      ],
      relatedTopics: ['brand-voice', 'custom-instructions', 'response-templates', 'quality-control']
    },
    seoKeywords: ['AI review responses', 'automated reply generation', 'natural language processing', 'brand voice AI'],
    category: 'features',
    lastUpdated: '2024-12-07'
  },
  {
    id: 'brand-voice',
    slug: 'brand-voice',
    title: 'Brand Voice Mastery',
    metaTitle: 'Perfect Your Brand Voice with RepliFast - Complete Customization Guide',
    metaDescription: 'Master RepliFast brand voice settings to ensure AI responses perfectly match your business personality. Includes presets, custom instructions, and optimization tips.',
    description: 'Configure your perfect brand voice for consistent, on-brand responses.',
    icon: 'Palette',
    content: {
      overview: 'Your brand voice is how your business personality comes through in every customer interaction. RepliFast\'s advanced brand voice system uses sophisticated AI prompts and contextual adaptations to ensure all responses maintain perfect consistency with your communication style, values, and customer service approach. The system automatically adjusts response length and tone based on review sentiment, complexity, and rating to deliver the most appropriate response every time.',
      sections: [
        {
          title: 'Understanding Brand Voice Components',
          content: 'Learn the three core elements that define your business communication style, each working together to create your unique voice.',
          steps: [
            {
              title: 'Formality Level (1-5 Scale)',
              description: 'Controls how formal or casual your responses sound. Level 1 = Very casual phrasing with contractions. Level 2 = Casual phrasing with contractions. Level 3 = Neutral, conversational business language. Level 4 = Formal business language with few contractions. Level 5 = Very formal business language with no contractions.'
            },
            {
              title: 'Warmth Level (1-5 Scale)',
              description: 'Adjusts how friendly and personal your responses feel. Level 1 = Factual and restrained. Level 2 = Polite and measured. Level 3 = Empathetic but not effusive. Level 4 = Warm and personable. Level 5 = Very warm and people-oriented (without sounding gushy).'
            },
            {
              title: 'Brevity Level (1-5 Scale)',
              description: 'Sets response length and detail level. Level 1 = Very detailed (35-60+ words). Level 2 = Detailed (25-45 words). Level 3 = Moderate (20-35 words). Level 4 = Concise (15-25 words). Level 5 = Very concise (8-18 words). Note: RepliFast automatically provides longer, more comprehensive responses for negative reviews (ratings 1-3 stars) regardless of your brevity setting, ensuring proper concern resolution with up to 40-100% more words when needed.'
            },
            {
              title: 'Smart Length Adaptation',
              description: 'The system intelligently adjusts response length based on review complexity. Long detailed reviews receive proportionally longer responses, while short reviews get appropriately brief replies. Negative reviews always receive adequate length to address concerns properly, even overriding high brevity settings.'
            }
          ]
        },
        {
          title: 'Brand Voice Presets',
          content: 'Pre-configured voice combinations optimized for different business types.',
          steps: [
            {
              title: 'Friendly (Formality: 2, Warmth: 4, Brevity: 3)',
              description: 'Perfect for hospitality, restaurants, retail, and customer-facing service businesses. Creates approachable, warm responses that make customers feel valued and heard.'
            },
            {
              title: 'Professional (Formality: 4, Warmth: 3, Brevity: 3)',
              description: 'Ideal for B2B services, financial services, healthcare, legal, and professional consulting. Maintains credibility while being appropriately responsive.'
            },
            {
              title: 'Playful (Formality: 2, Warmth: 5, Brevity: 3)',
              description: 'Great for creative businesses, entertainment, lifestyle brands, and younger demographics. Creates engaging, fun responses that reflect brand personality.'
            },
            {
              title: 'Custom Configuration',
              description: 'Create your own unique combination by adjusting each parameter individually. Start with a preset and modify based on your specific business needs.'
            }
          ]
        },
        {
          title: 'Custom Instructions & Guidelines',
          content: 'Add specific business information and response preferences to personalize AI output.',
          steps: [
            {
              title: 'Business Information Integration',
              description: 'Include key details: business hours, contact information, location details, parking information, website links, or special services offered.'
            },
            {
              title: 'Policy & Procedure References',
              description: 'Add standard policies: return/refund policies, booking procedures, safety protocols, or frequently asked questions with consistent answers.'
            },
            {
              title: 'Staff & Service Mentions',
              description: 'Provide context about team members, departments, or specific services so AI can reference them appropriately when mentioned in reviews.'
            },
            {
              title: 'Preferred Phrases & Terminology',
              description: 'Include specific language you want to use: branded terms, industry-specific terminology, or catchphrases that reinforce your brand identity.'
            },
            {
              title: 'Exclusion Guidelines',
              description: 'Specify words, phrases, or topics to avoid: competitor mentions, controversial topics, or language that doesn\'t align with your brand values.'
            }
          ]
        },
        {
          title: 'Industry-Specific Voice Strategies',
          content: 'Optimize your brand voice for your specific business type and customer expectations.',
          steps: [
            {
              title: 'Restaurants & Food Service',
              description: 'Formality (2-3), Warmth (4-5), Brevity (2-3). Emphasize gratitude, mention specific dishes, invite return visits. Include chef/staff names when mentioned.'
            },
            {
              title: 'Retail & Shopping',
              description: 'Formality (2-3), Warmth (3-4), Brevity (3-4). Thank for purchases, mention products by name, highlight customer service, include store policies.'
            },
            {
              title: 'Professional Services',
              description: 'Formality (4-5), Warmth (2-3), Brevity (1-2). Emphasize expertise, include relevant credentials, mention specific services, maintain credibility.'
            },
            {
              title: 'Healthcare & Wellness',
              description: 'Formality (3-4), Warmth (3-4), Brevity (2-3). Show empathy, maintain professionalism, include practice information, respect privacy concerns.'
            },
            {
              title: 'Entertainment & Events',
              description: 'Formality (1-2), Warmth (5), Brevity (2-3). Create excitement, use enthusiastic language, mention specific events or experiences, encourage sharing.'
            }
          ]
        },
        {
          title: 'Voice Optimization & Testing',
          content: 'Strategies for finding and refining your perfect brand voice settings.',
          steps: [
            {
              title: 'A/B Testing Approach',
              description: 'Try different voice settings for similar reviews and compare results.'
            },
            {
              title: 'Gradual Adjustment Method',
              description: 'Start with a preset and make small adjustments (1 point at a time) to individual parameters. Test changes for a week before making additional modifications.'
            },
            {
              title: 'Seasonal & Promotional Updates',
              description: 'Temporarily adjust custom instructions for holidays, special events, or promotional periods to keep responses relevant and engaging.'
            },
            {
              title: 'Multi-Location Coordination',
              description: 'For businesses with multiple locations, maintain consistent core voice settings while allowing location-specific custom instructions for local details.'
            }
          ]
        },
        {
          title: 'AI Quality & Natural Language',
          content: 'RepliFast ensures responses sound natural and human-written, never robotic or generic.',
          steps: [
            {
              title: 'Natural Response Generation',
              description: 'The AI automatically avoids robotic phrases, clichés, and overly formal language that makes responses sound automated. Every response is crafted to sound genuinely human and conversational.'
            },
            {
              title: 'Specific Content Focus',
              description: 'Responses always reference specific details from each review, proving you read and understood the customer\'s experience. Generic templates and stock phrases are automatically avoided.'
            },
            {
              title: 'Adaptive Tone Matching',
              description: 'The AI automatically adjusts its approach based on your brand voice settings, ensuring Playful responses sound more creative while Professional responses maintain appropriate formality.'
            },
            {
              title: 'Smart Problem Resolution',
              description: 'For negative reviews, responses automatically include appropriate next steps and contact information when available, ensuring customers have a clear path to resolution.'
            }
          ]
        }
      ],
      tips: [
        'Test voice settings with various review types (1-star, 3-star, 5-star) to see how the system automatically adapts length and tone',
        'Remember that negative reviews automatically get longer, more detailed responses regardless of your brevity setting',
        'Include your contact email and phone number in business settings to automatically offer resolution paths for complaints',
        'Use custom instructions to include specific business details like staff names, policies, and unique offerings',
        'The AI automatically varies response openings and avoids generic phrases - focus on your custom instructions for personalization',
        'Use the "Regenerate Reply" feature to explore different response variations for the same review',
        'Update custom instructions seasonally to keep responses current and relevant to your business'
      ],
      relatedTopics: ['ai-replies', 'custom-instructions', 'industry-best-practices', 'response-optimization']
    },
    seoKeywords: ['brand voice AI', 'business communication style', 'review response tone', 'customer service voice'],
    category: 'features',
    lastUpdated: '2024-12-07'
  },
  {
    id: 'google-business-setup',
    slug: 'google-business-setup',
    title: 'Google Business Profile Integration',
    metaTitle: 'Connect Google Business Profile to RepliFast - Complete Integration Guide',
    metaDescription: 'Step-by-step guide to securely connecting your Google Business Profile with RepliFast. Includes troubleshooting, permissions, and multi-location setup.',
    description: 'Secure Google Business Profile integration for seamless review management.',
    icon: 'Link',
    content: {
      overview: 'Connecting your Google Business Profile to RepliFast enables automatic review synchronization and direct response posting. This guide covers the complete integration process, troubleshooting common issues, and optimizing your connection for reliable performance.',
      sections: [
        {
          title: 'Pre-Integration Requirements',
          content: 'Ensure you meet all requirements before beginning the integration process.',
          steps: [
            {
              title: 'Google Business Profile Access Level',
              description: 'You must have Owner or Manager access to the Google Business Profile. Editors cannot authorize review management applications. Verify your access level in your Google Business Profile dashboard.'
            },
            {
              title: 'Profile Verification Status',
              description: 'Your Google Business Profile must be verified and active. Unverified profiles cannot access review management features. Complete Google\'s verification process if needed.'
            },
            {
              title: 'Review Functionality Check',
              description: 'Ensure your business can receive reviews on Google. Some business types or locations may have restrictions. Check that existing reviews are visible on your profile.'
            },
            {
              title: 'Google Account Access',
              description: 'Use the same Google account that manages your business profile for easiest integration. If using a different account, ensure it has appropriate permissions.'
            }
          ]
        },
        {
          title: 'Step-by-Step Integration Process',
          content: 'Complete walkthrough of connecting your Google Business Profile to RepliFast.',
          steps: [
            {
              title: 'Access Google Connection Settings',
              description: 'Log into your RepliFast dashboard and navigate to Settings > Google Connection.'
            },
            {
              title: 'Initiate Google Connection',
              description: 'Click "Connect Google Business Profile" to begin the secure OAuth authorization process. You\'ll be redirected to Google\'s authorization servers.'
            },
            {
              title: 'Google Account Selection',
              description: 'Choose the Google account that manages your business profile. If you\'re not logged into the correct account, sign out and sign in with the appropriate credentials.'
            },
            {
              title: 'Permission Authorization',
              description: 'Grant RepliFast permission to read your business profile information, access reviews, and post replies. These permissions are essential for platform functionality.'
            },
            {
              title: 'Business Profile Selection',
              description: 'If your Google account manages multiple business profiles, select the specific location you want to connect to RepliFast.'
            },
            {
              title: 'Connection Verification',
              description: 'Return to RepliFast and verify that your business shows up in the Google Connection section.'
            },
            {
              title: 'Initial Review Sync',
              description: 'Go to the Reviews page to initiate the review sync process. RepliFast automatically imports existing reviews. This process typically takes 2-5 minutes but may take longer for businesses with extensive review histories.'
            }
          ]
        },
        {
          title: 'Multi-Location Business Setup',
          content: 'RepliFast supports multi-business management for users who own or manage multiple Google Business Profile locations.',
          steps: [
            {
              title: 'Multi-Business Support',
              description: 'When you are the owner or manager of several businesses, you can manage them all from one RepliFast account. However, you will need the Pro Plus subscription to access multi-location features.'
            },
            {
              title: 'Individual Location Management',
              description: 'Each connected location can be managed separately with its own brand voice settings, custom instructions, and automation rules tailored specifically for that business.'
            },
            {
              title: 'Flexible Location Selection',
              description: 'You have full control over which locations to include in RepliFast. You can add or remove specific locations from your account if you only want to manage certain businesses.'
            }
          ]
        },
        {
          title: 'Security & Data Protection',
          content: 'Understanding how RepliFast securely handles your Google Business Profile data.',
          steps: [
            {
              title: 'OAuth Security Standards',
              description: 'RepliFast uses Google\'s secure OAuth 2.0 protocol for authorization. Your Google password is never stored or accessed by RepliFast systems.'
            },
            {
              title: 'Limited Permission Scope',
              description: 'RepliFast only requests necessary permissions: read business profile data, access reviews, and post replies. No access to other Google services or personal data.'
            },
            {
              title: 'Data Encryption',
              description: 'All data transmission between RepliFast and Google uses enterprise-grade encryption. Your business information and review data are protected during transfer and storage.'
            },
            {
              title: 'Access Revocation',
              description: 'You can revoke RepliFast\'s access at any time through your Google account settings or by disconnecting in RepliFast Settings > Integrations.'
            }
          ]
        }
      ],
      tips: [
        'Use the same Google account that you normally use to manage your business profile for smoothest integration',
        'Test the connection immediately after setup by syncing reviews',
        'Regularly verify your connection status in RepliFast settings, especially after Google account password changes'
      ],
      relatedTopics: ['troubleshooting-connection', 'multi-location-setup', 'security-privacy', 'getting-started-guide']
    },
    seoKeywords: ['Google Business Profile integration', 'OAuth setup', 'review API connection', 'business profile sync'],
    category: 'setup',
    lastUpdated: '2024-12-07'
  },
  {
    id: 'automation-settings',
    slug: 'automation-settings',
    title: 'Automation & Auto-Pilot Mode',
    metaTitle: 'RepliFast Automation Guide - Set Up Auto-Pilot Review Management',
    metaDescription: 'Configure RepliFast automation features: auto-sync, auto-approval rules, bulk actions, and complete hands-off review management for busy business owners.',
    description: 'Set up complete automation for hands-free review management.',
    icon: 'Settings',
    content: {
      overview: 'Transform your review management with RepliFast\'s complete automation system. The Pro plan enables true autopilot mode - automatically sync reviews daily, generate AI responses, and post replies without any manual work. Save 3-5 hours weekly while maintaining 100% response rates and professional customer engagement.',
      sections: [
        {
          title: 'Pro Plan Requirement',
          content: 'Complete automation features require a Pro subscription to unlock the full autopilot experience.',
          steps: [
            {
              title: 'Automation-Exclusive Features',
              description: 'Daily auto-sync, auto-approval rules, bulk AI generation, and email notifications are exclusively available with Pro plan subscriptions, designed for businesses seeking complete hands-off review management.'
            },
            {
              title: 'ROI Calculation',
              description: 'Responding to reviews can easily take 8–12 hours every month. At $17/hour, that’s $136–$204 in staff costs. RepliFast Pro handles it all for just $39/month - saving up to 80%. And it’s not just about the money. Those hours go back to your team, so they can focus on revenue-generating work like welcoming guests, upselling services, and improving the customer experience instead of repeating the same responses.'
            },
            {
              title: 'Scalability Benefits',
              description: 'As your business grows and receives more reviews, automation becomes increasingly valuable. Pro subscribers can handle unlimited reviews without proportional time increases.'
            },
            {
              title: 'Professional Consistency',
              description: 'Automated responses maintain consistent professional quality and timing, ensuring customers never wait days for replies and always receive thoughtful, branded responses.'
            }
          ]
        },
        {
          title: 'Daily Auto-Sync System',
          content: 'Automatically check for new Google reviews every day without any manual intervention.',
          steps: [
            {
              title: 'Two Time Slot Options',
              description: 'Choose between Slot 1 (12:00 PM UTC) or Slot 2 (12:00 AM UTC) for daily review synchronization. Select the time slot that best aligns with your business hours and customer activity patterns.'
            },
            {
              title: 'Automatic Review Detection',
              description: 'The system automatically connects to your Google Business Profile daily, fetches any new reviews, and imports them into your RepliFast dashboard without requiring any manual action.'
            },
            {
              title: 'Instant Email Notifications',
              description: 'Receive immediate email alerts when new reviews are discovered during automated sync, including review details, customer names, and ratings for quick awareness.'
            },
            {
              title: 'Seamless Integration',
              description: 'Auto-sync works with your existing Google Business Profile integration, using secure API connections to maintain data accuracy and security while providing hands-off operation.'
            }
          ]
        },
        {
          title: 'Complete Automation Pipeline',
          content: 'Enable full autopilot mode with automatic AI reply generation, approval, and posting.',
          steps: [
            {
              title: 'Automatic AI Reply Generation',
              description: 'When new reviews are detected, the system automatically generates personalized AI responses using your configured brand voice and custom instructions, ensuring every reply matches your business personality.'
            },
            {
              title: 'Smart Auto-Approval Rules',
              description: 'Configure which reviews get automatically approved (status changes from "pending" to "approved"). Typically 4-5 star reviews are safe for auto-approval, while 1-3 star reviews are held for manual review to ensure proper issue resolution. Auto-approval only marks reviews as ready - posting happens in the next step.'
            },
            {
              title: 'Automatic Google Posting',
              description: 'During each automation cycle (12:00 PM UTC or 12:00 AM UTC), the system finds all approved reviews and automatically posts their responses to Google Business Profile. This is when replies actually become visible to customers. Only reviews with "approved" status get posted - manually approved reviews and auto-approved reviews both get posted during automation runs.'
            },
            {
              title: 'Email Notification System',
              description: 'Receive detailed email summaries of automated activities: new reviews discovered, AI responses generated, replies posted, and any reviews requiring manual attention.'
            }
          ]
        },
        {
          title: 'Setting Up Automation',
          content: 'Step-by-step guide to configuring your complete automation system.',
          steps: [
            {
              title: 'Enable Auto-Sync',
              description: 'In Settings > Integrations, find the "Automated Review Sync" card and toggle it ON. Choose between Slot 1 (12:00 PM UTC) or Slot 2 (12:00 AM UTC) based on your preferred timing.'
            },
            {
              title: 'Configure Automation Pipeline',
              description: 'Enable "Automatic AI Reply Generation" to have the system create responses for new reviews, and "Automatic Reply Posting" to publish approved responses directly to Google.'
            },
            {
              title: 'Set Auto-Approval Rules',
              description: 'Choose which star ratings should be automatically approved and posted (recommended: 4-5 star reviews). Leave 1-3 star reviews for manual review to ensure proper issue handling.'
            },
            {
              title: 'Enable Email Notifications',
              description: 'Turn on email notifications to receive alerts about new reviews, automated activities, and any reviews requiring manual attention for complete oversight.'
            }
          ]
        },
        {
          title: 'Automation Benefits & ROI',
          content: 'Understanding the transformative impact of complete review automation.',
          steps: [
            {
              title: 'Massive Time Savings',
              description: 'Save 3-5 hours weekly that would otherwise be spent manually checking for reviews, crafting responses, and posting replies. This time can be reinvested in core business activities that drive growth.'
            },
            {
              title: '100% Response Rate Achievement',
              description: 'Never miss a review again. Automated systems ensure every customer receives a professional response within 24 hours, demonstrating exceptional customer service to all prospects viewing your profile.'
            },
            {
              title: 'Consistent Professional Image',
              description: 'Maintain consistently professional, on-brand responses that reflect your business personality. No more rushed or inconsistent replies during busy periods.'
            },
            {
              title: 'Competitive Advantage',
              description: 'Most small businesses respond to less than 30% of their reviews. With 100% response rates and professional consistency, you\'ll stand out significantly from competitors in your local market.'
            }
          ]
        },
        {
          title: 'Quality Control & Monitoring',
          content: 'Maintaining high standards while leveraging full automation capabilities.',
          steps: [
            {
              title: 'Intelligent Review Routing',
              description: 'The system automatically routes positive reviews (4-5 stars) to auto-approval while sending negative reviews (1-3 stars) for manual review, ensuring complaints receive proper personal attention.'
            },
            {
              title: 'Brand Voice Consistency',
              description: 'All automated responses use your configured brand voice and custom instructions, maintaining consistent personality and messaging across all customer interactions.'
            },
            {
              title: 'Email Oversight System',
              description: 'Receive detailed daily summaries of automated activities, allowing you to spot-check quality and intervene if needed without constant monitoring.'
            },
            {
              title: 'Easy Override Controls',
              description: 'Maintain full control with instant automation toggle switches. Disable any automation component immediately for special circumstances, crisis situations, or manual intervention needs.'
            }
          ]
        }
      ],
      tips: [
        'Start with 4-5 star auto-approval only - let 1-3 star reviews require manual attention to ensure proper issue resolution',
        'Pro plan automation typically saves 3-5 hours weekly, making the $39/month cost extremely cost-effective for busy business owners',
        'Email notifications provide complete oversight without constant monitoring - review daily summaries to spot-check automated responses',
        'Test the system with manual sync first to see AI response quality before enabling full automation pipeline',
        'Your brand voice settings and custom instructions directly control automated response quality - keep them updated and specific to your business'
      ],
      relatedTopics: ['bulk-actions', 'quality-control', 'notification-settings', 'advanced-workflows']
    },
    seoKeywords: ['automated review management', 'auto-approval rules', 'bulk review processing', 'hands-free review responses'],
    category: 'advanced',
    lastUpdated: '2024-12-07'
  },
  {
    id: 'pricing-plans',
    slug: 'pricing-plans',
    title: 'Pricing Plans & Subscription Guide',
    metaTitle: 'RepliFast Pricing Plans - Choose the Right Plan for Your Business',
    metaDescription: 'Complete guide to RepliFast pricing: Starter vs Pro plans, multi-location options, free trial details, and how to choose the right plan for your business size.',
    description: 'Understanding RepliFast pricing and choosing the right plan for your business.',
    icon: 'CreditCard',
    content: {
      overview: 'RepliFast offers simple, transparent pricing designed specifically for small businesses. Choose from Starter ($19/month) for basic review management or Pro ($39/month) for complete automation. All plans come with a 14-day money-back guarantee - try RepliFast risk-free and get your money back if not satisfied.',
      sections: [
        {
          title: 'Plan Comparison Overview',
          content: 'Understanding the key differences between Starter and Pro plans.',
          steps: [
            {
              title: 'Starter Plan ($19/month)',
              description: 'Perfect for small businesses with moderate review volume (up to 200 replies monthly). Includes AI reply generation, manual sync, bulk actions, brand voice presets, and manual approval workflow. Great for businesses wanting AI assistance with hands-on control.'
            },
            {
              title: 'Pro Plan ($39/month)',
              description: 'Ideal for businesses wanting complete automation and unlimited replies. Includes everything in Starter plus daily auto-sync, auto-approval rules, unlimited monthly replies, custom brand voice settings, and advanced insights. Perfect for busy owners seeking hands-off management or businesses with large backlogs of unanswered reviews to catch up on.'
            },
            {
              title: 'Pro Plus Multi-Location (+$19/month per location)',
              description: 'Extends Pro plan for businesses managing multiple locations. Each additional location gets full Pro features with separate dashboards, individual brand voice settings, and location-specific automation rules.'
            },
            {
              title: '14-Day Money-Back Guarantee',
              description: 'All paid subscriptions come with a risk-free 14-day money-back guarantee. If you\'re not satisfied with RepliFast within 14 days of your first payment, contact support for a full refund - no questions asked.'
            }
          ]
        },
        {
          title: 'Detailed Feature Breakdown',
          content: 'Comprehensive comparison of what\'s included in each subscription plan.',
          steps: [
            {
              title: 'Core Review Management',
              description: 'Starter: Manual Google sync, up to 200 AI replies monthly, manual approval workflow, bulk operations (up to 10 reviews). Pro: Daily auto-sync, unlimited AI replies (perfect for catching up with existing review backlogs), smart auto-approval rules, unlimited bulk operations.'
            },
            {
              title: 'AI & Brand Voice',
              description: 'Starter: AI reply generation, standard brand voice presets (Friendly, Professional, Playful), custom instructions. Pro: Everything in Starter plus full custom voice settings (1-5 scales), advanced insights and analytics.'
            },
            {
              title: 'Automation Features',
              description: 'Starter: Manual control only - you sync reviews and approve responses yourself. Pro: Complete automation - daily sync, automatic AI generation, smart auto-approval for 4-5 star reviews, email notifications.'
            },
            {
              title: 'Support & Integrations',
              description: 'Both plans: Google Business Profile integration, email support, comprehensive knowledge base, regular platform updates, and 14-day money-back guarantee.'
            }
          ]
        },
        {
          title: 'Choosing the Right Plan',
          content: 'Decision framework for selecting the optimal plan for your business needs.',
          steps: [
            {
              title: 'Monthly Review Volume & Backlog',
              description: 'Count your typical monthly Google reviews plus any existing unanswered reviews. If you receive fewer than 200 reviews monthly with no major backlog, Starter works well. If you get 200+ reviews monthly OR have many existing unanswered reviews to catch up on, choose Pro for unlimited replies.'
            },
            {
              title: 'Time Investment Preference',
              description: 'Starter requires daily engagement (15-30 minutes) to manually sync reviews and approve responses. Pro enables true autopilot mode, reducing your time to just 5-10 minutes weekly for monitoring.'
            },
            {
              title: 'Automation vs Control',
              description: 'Choose Starter if you want to review and approve every response personally. Choose Pro if you want the system to automatically handle positive reviews while you focus only on negative feedback that needs personal attention.'
            },
            {
              title: 'Business Growth Planning',
              description: 'Growing businesses often outgrow Starter\'s 200 monthly reply limit within 6-12 months. Pro provides unlimited replies and automation, scaling with your business without requiring plan changes.'
            }
          ]
        },
        {
          title: 'Multi-Location Business Options',
          content: 'Pricing and management options for businesses with multiple Google Business Profile locations.',
          steps: [
            {
              title: 'Pro Plus Multi-Location Plan',
              description: 'Designed for franchises, chains, or multi-location businesses. Start with Pro plan ($39/month) for your primary location, then add additional locations for $19/month each with full Pro features.'
            },
            {
              title: 'Individual Location Management',
              description: 'Each location gets separate brand voice settings, custom instructions, automation rules, and review management - all controlled from one centralized dashboard with unified billing.'
            },
            {
              title: 'Cost Savings at Scale',
              description: 'For 2 locations: Pro Plus = $58/month vs separate Pro accounts = $78/month (26% savings). For 3 locations: Pro Plus = $77/month vs separate accounts = $117/month (34% savings). Savings increase with more locations.'
            },
            {
              title: 'Unlimited Location Scaling',
              description: 'Pro Plus supports unlimited locations with the same $19/month rate per additional location. Perfect for growing franchise operations or businesses expanding to new markets.'
            }
          ]
        },
        {
          title: 'Getting Started Risk-Free',
          content: 'How to evaluate RepliFast with the 14-day money-back guarantee.',
          steps: [
            {
              title: 'Choose Your Starting Plan',
              description: 'Start with the plan that best matches your current needs. Most businesses begin with Starter to test AI quality and workflow, then upgrade to Pro when ready for automation.'
            },
            {
              title: 'Week 1: Core Setup & Testing',
              description: 'Connect Google Business Profile, configure brand voice settings, sync existing reviews, and generate your first AI replies. Test response quality with different voice settings to find your perfect tone.'
            },
            {
              title: 'Week 2: Advanced Features & Evaluation',
              description: 'Try bulk actions, test automation features (if on Pro), and measure time savings compared to manual review management. Track customer reactions to AI-generated responses.'
            },
            {
              title: 'Money-Back Guarantee Protection',
              description: 'If RepliFast doesn\'t meet your needs within 14 days, simply contact support for a full refund - no questions asked. This gives you complete peace of mind to thoroughly test the platform.'
            }
          ]
        }
      ],
      tips: [
        'Start with the plan that matches your current needs - you can upgrade or downgrade anytime without losing data',
        'Use the 14-day money-back guarantee to thoroughly test AI response quality and workflow efficiency',
        'Pro Plus becomes significantly more cost-effective with 3+ locations (34%+ savings vs separate accounts)',
        'Pro\'s unlimited replies are invaluable for catching up with large backlogs of unanswered reviews from the past',
        'Consider seasonal review volume fluctuations - Pro\'s unlimited replies handle traffic spikes without overage fees',
        'Calculate your current manual time cost: 12-15 hours monthly × $17/hour = $204 vs RepliFast Pro at $39/month',
        'Factor in local SEO benefits - consistent review responses can improve Google rankings and generate additional revenue'
      ],
      relatedTopics: ['getting-started-guide', 'plan-upgrades', 'multi-location-setup', 'automation-settings']
    },
    seoKeywords: ['RepliFast pricing', 'review management pricing', 'small business plans', 'multi-location pricing'],
    category: 'billing',
    lastUpdated: '2024-12-07'
  }
];

// Comprehensive FAQ Items with detailed, SEO-optimized content
export const faqItems: FAQItem[] = [
  // Getting Started & Trial Questions

  {
    id: 'getting-started-time',
    question: 'How long does it take to set up RepliFast?',
    answer: 'Most businesses complete RepliFast setup in under 5 minutes. The process involves: Google login (1 minute), Google Business Profile connection (1 minute), brand voice configuration (2-3 minutes). Then fetching existing reviews takes 1-5 minutes depending on your review volume, and you can start generating your first AI reply in under 2 minutes total.',
    category: 'setup',
    seoKeywords: ['quick setup', 'fast installation', 'easy configuration', 'setup time']
  },
  {
    id: 'technical-requirements',
    question: 'What are the technical requirements to use RepliFast?',
    answer: 'RepliFast is a web-based platform requiring only an internet connection and modern web browser (Chrome, Firefox, Safari, or Edge). No software installation is needed. You must have owner or manager access to a verified Google Business Profile. The platform works on desktop computers, tablets, and mobile devices, making it accessible from anywhere.',
    category: 'setup',
    seoKeywords: ['technical requirements', 'browser compatibility', 'no installation', 'web-based platform']
  },

  // Google Business Profile Integration
  {
    id: 'google-connection-process',
    question: 'How does connecting to Google Business Profile work?',
    answer: 'RepliFast uses Google\'s secure OAuth 2.0 protocol for connection. You\'ll click "Connect Google Business Profile" in your settings, be redirected to Google for authorization, and grant RepliFast permission to read reviews and post replies. Your Google password is never stored by RepliFast. The connection is encrypted and follows enterprise security standards. You can revoke access anytime through Google account settings.',
    category: 'integration',
    seoKeywords: ['OAuth security', 'Google integration', 'secure connection', 'authorization process']
  },
  {
    id: 'google-permissions',
    question: 'What permissions does RepliFast need from my Google Business Profile?',
    answer: 'RepliFast requests minimal necessary permissions: read your business profile information, access customer reviews, and post reply responses. RepliFast cannot access other Google services, personal email, or any data beyond your business profile and reviews. These limited permissions ensure security while enabling full review management functionality.',
    category: 'integration',
    seoKeywords: ['Google permissions', 'limited access', 'security permissions', 'business profile access']
  },
  {
    id: 'multiple-google-accounts',
    question: 'Can I connect multiple Google accounts or business profiles?',
    answer: 'Each RepliFast account connects to one Google Business Profile location. If you manage multiple locations, you can either create separate RepliFast accounts for each location or upgrade to Pro Plus which allows adding additional locations for $19/month each. Pro Plus provides centralized management while maintaining separate customization for each location.',
    category: 'integration',
    seoKeywords: ['multiple locations', 'multi-account setup', 'Pro Plus features', 'location management']
  },
  {
    id: 'connection-troubleshooting',
    question: 'What if my Google Business Profile won\'t connect?',
    answer: 'Connection issues usually stem from insufficient permissions or unverified profiles. Ensure you have owner or manager access (not just editor), your profile is verified by Google, and you\'re using the correct Google account. Clear browser cache, disable ad blockers temporarily, and try connecting in an incognito/private window. If issues persist, contact support with your business name and location for assistance.',
    category: 'troubleshooting',
    seoKeywords: ['connection problems', 'troubleshooting integration', 'permission issues', 'technical support']
  },

  // AI & Response Quality
  {
    id: 'ai-response-accuracy',
    question: 'How accurate and appropriate are the AI-generated responses?',
    answer: 'RepliFast\'s AI achieves high accuracy by analyzing review sentiment, specific details mentioned, and your configured brand voice. The AI generates unique, contextually relevant responses rather than using templates. However, we always recommend reviewing responses before posting, especially for negative reviews or complex situations. You can edit any response to ensure it perfectly matches your preferred messaging and business policies.',
    category: 'ai-features',
    seoKeywords: ['AI accuracy', 'response quality', 'contextual responses', 'review before posting']
  },
  {
    id: 'response-customization',
    question: 'Can I customize how the AI generates responses?',
    answer: 'Yes, extensive customization is available through brand voice settings and custom instructions. Adjust formality (1-5), warmth (1-5), and brevity (1-5) levels to match your communication style. Add custom instructions with specific business information, policies, staff names, or preferred phrases. Choose from Friendly, Professional, or Playful presets, or create your own unique combination.',
    category: 'ai-features',
    seoKeywords: ['AI customization', 'brand voice settings', 'custom instructions', 'response personalization']
  },
  {
    id: 'negative-review-handling',
    question: 'How does RepliFast handle negative reviews?',
    answer: 'RepliFast AI is specifically trained to handle negative reviews professionally and empathetically. It acknowledges customer concerns, expresses appropriate empathy, offers resolution paths, and maintains professional tone even for harsh criticism. However, negative reviews are typically excluded from auto-approval rules, allowing you to personally review and edit responses before posting to ensure they meet your customer service standards.',
    category: 'ai-features',
    seoKeywords: ['negative review responses', 'professional handling', 'empathetic AI', 'crisis management']
  },
  {
    id: 'response-templates',
    question: 'Does RepliFast use templates or generate unique responses?',
    answer: 'RepliFast generates completely unique responses for each review rather than using static templates. The AI analyzes specific review content, sentiment, and context to create personalized responses that address the individual customer\'s experience. This approach ensures responses sound natural and authentic rather than robotic or repetitive, helping maintain genuine customer relationships.',
    category: 'ai-features',
    seoKeywords: ['unique responses', 'no templates', 'personalized replies', 'authentic communication']
  },

  // Automation & Workflow
  {
    id: 'automation-setup',
    question: 'How do I set up Autopilot review management?',
    answer: 'Autopilot review management involves three steps: 1) Enable auto-sync to automatically detect new reviews once daily at your chosen time slot (12:00 PM UTC or 12:00 AM UTC), 2) Configure auto-approval rules for positive reviews (typically 4-5 star reviews), and 3) Set up email notifications for reviews requiring manual attention. The Pro plan is required for Autopilot mode. Start gradually - enable auto-sync first, then add auto-approval for 5-star reviews, and expand to 4-star reviews as you gain confidence in AI quality.',
    category: 'automation',
    seoKeywords: ['autopilot management', 'hands-off management', 'auto-sync setup', 'auto-approval rules', 'pro plan']
  },
  {
    id: 'auto-approval-safety',
    question: 'Is it safe to automatically approve and post AI responses?',
    answer: 'Auto-approval is safe for positive reviews (4-5 stars) when properly configured. RepliFast\'s AI is trained to generate professional, appropriate responses, and you can customize brand voice and instructions to ensure consistency. Start with 5-star reviews only, monitor results for 1-2 weeks, then expand to 4-star reviews if satisfied with quality. Negative reviews should always be manually reviewed before posting.',
    category: 'automation',
    seoKeywords: ['auto-approval safety', 'positive review automation', 'AI reliability', 'quality control']
  },
  {
    id: 'bulk-actions',
    question: 'How do bulk actions work for processing multiple reviews?',
    answer: 'Bulk actions allow you to select multiple reviews using checkboxes and process them simultaneously. You can generate AI replies for all selected reviews at once, then review and approve them in batch. This feature is perfect for catching up on review backlogs or processing positive reviews efficiently. Filter reviews first (by rating, date, or status) to group similar reviews for more efficient bulk processing.',
    category: 'workflow',
    seoKeywords: ['bulk review processing', 'multiple review management', 'batch approval', 'efficient workflow']
  },
  {
    id: 'review-sync-frequency',
    question: 'How often does RepliFast check for new reviews?',
    answer: 'RepliFast offers manual sync triggered with a button click or daily automated sync with two time slot options. The Pro plan includes automated sync that checks for new reviews once daily at either Slot 1 (12:00 PM UTC) or Slot 2 (12:00 AM UTC) - you choose which works best for your business hours. You can also manually sync anytime using the sync button for immediate review checking.',
    category: 'automation',
    seoKeywords: ['sync frequency', 'review checking', 'daily sync', 'manual sync', 'pro plan']
  },

  // Business Impact & ROI
  {
    id: 'time-savings',
    question: 'How much time does RepliFast actually save?',
    answer: 'Most businesses save 12-15 hours monthly on review management. Manual response crafting typically takes 2-5 minutes per review, while RepliFast reduces this to 15-30 seconds for review and approval. For businesses receiving 20+ reviews monthly, this translates to significant time savings. With full automation enabled, time investment drops to just 5-10 minutes weekly for monitoring and handling exceptions.',
    category: 'benefits',
    seoKeywords: ['time savings', 'efficiency gains', 'productivity improvement', 'automated management']
  },
  {
    id: 'seo-benefits',
    question: 'How does responding to reviews help my Google ranking?',
    answer: 'Google\'s algorithm favors businesses that actively engage with customers through review responses. Regular engagement signals to Google that your business is active and cares about customer feedback, potentially improving local search rankings. Additionally, responding to reviews can encourage more customers to leave reviews, and higher review volume with responses typically correlates with better local SEO performance.',
    category: 'benefits',
    seoKeywords: ['local SEO', 'Google ranking', 'review engagement', 'search visibility']
  },
  {
    id: 'customer-trust',
    question: 'Do customers notice or care about review responses?',
    answer: 'Yes, 89% of consumers are more likely to use businesses that respond to all reviews (BrightLocal, 2023). Responses show potential customers that you value feedback and provide good customer service. Even automated responses, when properly configured, appear professional and caring. The key is ensuring responses are personalized to each review\'s content rather than generic templates.',
    category: 'benefits',
    seoKeywords: ['customer trust', 'consumer behavior', 'review responses', 'professional appearance']
  },
  {
    id: 'competitor-advantage',
    question: 'How does RepliFast help me stand out from competitors?',
    answer: 'Most small businesses either don\'t respond to reviews or respond inconsistently. RepliFast ensures you respond to every review professionally and promptly, creating a significant competitive advantage. Consistent, thoughtful responses make your business appear more professional and customer-focused than competitors who ignore reviews or respond sporadically.',
    category: 'benefits',
    seoKeywords: ['competitive advantage', 'professional appearance', 'consistent responses', 'business differentiation']
  },

  // Technical & Security
  {
    id: 'data-security',
    question: 'How secure is my business data with RepliFast?',
    answer: 'RepliFast employs enterprise-grade security measures including encryption in transit and at rest, secure OAuth authentication with Google, SOC 2 compliant infrastructure, and regular security audits. Your review data and business information are protected with bank-level security standards. RepliFast only accesses necessary data (business profile and reviews) and never stores your Google passwords or accesses other Google services.',
    category: 'security',
    seoKeywords: ['data security', 'encryption', 'SOC 2 compliance', 'enterprise security']
  },
  {
    id: 'data-backup',
    question: 'What happens to my data if I cancel my subscription?',
    answer: 'Your RepliFast account remains active until the end of your current billing period. We don\'t currently have an export function, but when you want to delete your account, you can contact our support and we will remove everything from the database, including the Google connection and all reviews. However, the reviews and replies you\'ve posted remain on Google permanently.',
    category: 'billing',
    seoKeywords: ['cancellation process', 'data retention', 'account closure', 'contact support']
  },

  // Pricing & Billing
  {
    id: 'plan-differences',
    question: 'What\'s the difference between Starter and Pro plans?',
    answer: 'Starter ($19/month) includes manual sync, 200 replies monthly, and manual approval workflow - perfect for smaller businesses wanting control over each response. Pro ($39/month) adds auto-sync, unlimited replies, auto-approval rules, and advanced automation - ideal for businesses wanting hands-off management or processing 200+ replies monthly. Both include AI generation, brand voice customization, and analytics.',
    category: 'pricing',
    seoKeywords: ['plan comparison', 'Starter vs Pro', 'feature differences', 'subscription options']
  },
  {
    id: 'plan-upgrades',
    question: 'Can I upgrade or downgrade my plan anytime?',
    answer: 'Yes, you can change plans anytime from your account settings. Upgrades take effect immediately with prorated billing for the remainder of your current period. Downgrades take effect at your next billing cycle to ensure you don\'t lose access to features you\'ve already paid for. All your data, settings, and integrations remain intact during plan changes.',
    category: 'billing',
    seoKeywords: ['plan changes', 'upgrade subscription', 'downgrade options', 'billing flexibility']
  },
  {
    id: 'money-back-guarantee',
    question: 'Do you offer a money-back guarantee?',
    answer: 'Yes, RepliFast offers a 14-day money-back guarantee on all paid subscriptions. If you\'re not satisfied with the service within 14 days of your first payment, contact support for a full refund. This gives you plenty of time to evaluate the platform and ensure it meets your business needs.',
    category: 'billing',
    seoKeywords: ['money-back guarantee', 'refund policy', '30-day guarantee', 'satisfaction guarantee']
  },
  {
    id: 'multi-location-pricing',
    question: 'How does pricing work for multiple business locations?',
    answer: 'Pro Plus multi-location pricing starts with the Pro plan ($39/month) for your primary location, then adds additional locations for $19/month each. You can connect unlimited locations that you have access to with your Google Business Profile account. This allows you to manage multiple locations from one dashboard with centralized billing while maintaining location-specific brand voice settings and automation rules for each business.',
    category: 'pricing',
    seoKeywords: ['multi-location pricing', 'reduced price', 'location management', 'pro features']
  },

  // Advanced Features & Customization
  {
    id: 'custom-instructions',
    question: 'What kind of custom instructions can I add to improve AI responses?',
    answer: 'Custom instructions can include business-specific information like hours, contact details, return policies, staff names, services offered, common customer questions, promotional offers, or location-specific details. You can also specify preferred phrases, terminology to use or avoid, and response style preferences. The more specific information you provide, the more personalized and accurate the AI responses become.',
    category: 'customization',
    seoKeywords: ['custom instructions', 'AI personalization', 'business-specific responses', 'response customization']
  },
  {
    id: 'response-editing',
    question: 'Can I edit AI responses before they\'re posted?',
    answer: 'Absolutely. Every AI-generated response can be reviewed and edited before posting. You can modify any part of the response, add specific details, adjust tone, or completely rewrite if needed. Edited responses still post directly to Google through RepliFast. Use the "Regenerate Reply" feature to get different AI variations based on your current brand voice settings.',
    category: 'workflow',
    seoKeywords: ['response editing', 'manual review', 'AI learning', 'quality control']
  },
  {
    id: 'edit-delete-posted-replies',
    question: 'Can I edit or delete posted replies?',
    answer: 'Yes, we have the available function that you can edit replies that have been already posted. So you can update a review reply and also delete them if you do not like them anymore or if they\'re not suitable. This gives you full control over your review responses even after they\'ve been published on Google.',
    category: 'workflow',
    seoKeywords: ['edit posted replies', 'delete replies', 'update responses', 'post-publication control']
  },
  {
    id: 'approve-button-workflow',
    question: 'What exactly happens when I click "Approve" on a review?',
    answer: 'When you click "Approve," the review status changes from "pending" to "approved" in your dashboard. This means you\'ve confirmed the AI-generated response is ready to be sent to Google. However, clicking "Approve" does NOT automatically post the reply. What happens next depends on your settings: In Manual Mode (default): You must click "Post Reply" to actually send the response to Google Business Profile. In Auto-Post Mode (Pro plan): Approved reviews will automatically be posted during the next automation cycle (12:00 PM UTC or 12:00 AM UTC). The complete workflow is: Review comes in → AI generates reply → You click "Approve" → Either you manually click "Post" OR the system auto-posts during automation (if enabled).',
    category: 'workflow',
    seoKeywords: ['approve button', 'approval workflow', 'manual vs auto posting', 'review status', 'automation posting']
  },
  {
    id: 'analytics-insights',
    question: 'What kind of analytics and insights does RepliFast provide?',
    answer: 'RepliFast provides comprehensive analytics including response rate tracking, customer sentiment analysis, review volume trends, star rating distribution, and performance summaries that can be generated yearly, quarterly, monthly, or weekly for a selected period. You can track improvements in customer satisfaction, identify common complaint themes, and measure the impact of consistent review responses on your online reputation.',
    category: 'analytics',
    seoKeywords: ['review analytics', 'sentiment analysis', 'performance metrics', 'reputation tracking']
  },
  {
    id: 'team-collaboration',
    question: 'Can multiple team members access and manage reviews?',
    answer: 'Currently, RepliFast accounts are designed for single-user access with the account holder managing all review responses. For team collaboration, you can share login credentials with trusted team members or contact support to discuss enterprise options for larger organizations requiring multi-user access with role-based permissions.',
    category: 'collaboration',
    seoKeywords: ['team access', 'multi-user accounts', 'collaboration features', 'enterprise options']
  },

  // Industry-Specific Questions

  // Troubleshooting & Support
  {
    id: 'common-issues',
    question: 'What are the most common issues and how do I resolve them?',
    answer: 'Common issues include: 1) Google connection failures (usually permission-related - ensure owner/manager access), 2) Responses not posting (check Google Business Profile status and internet connection), 3) AI responses seeming off-brand (adjust brand voice settings and add custom instructions), 4) Sync not working (verify Google connection and check sync settings). Most issues resolve with basic troubleshooting or reconnecting Google.',
    category: 'troubleshooting',
    seoKeywords: ['common problems', 'troubleshooting guide', 'issue resolution', 'technical support']
  },
  {
    id: 'support-options',
    question: 'What support options are available if I need help?',
    answer: 'RepliFast provides email support for all customers, comprehensive knowledge base with step-by-step guides, video tutorials for common tasks, and this FAQ section. Support typically responds within 24 hours during business days. Pro customers receive priority support with faster response times. We also offer setup assistance for complex integrations or multi-location businesses.',
    category: 'support',
    seoKeywords: ['customer support', 'help options', 'email support', 'knowledge base']
  },
  {
    id: 'feature-requests',
    question: 'Can I request new features or suggest improvements?',
    answer: 'Yes! RepliFast actively incorporates customer feedback into product development. Submit feature requests through email support at hello@replifast.com or the feedback form in your dashboard. We are really happy for suggestions and ways to improve the platform and make it more user-focused. Popular requests often become new features in quarterly updates.',
    category: 'support',
    seoKeywords: ['feature requests', 'product feedback', 'improvement suggestions', 'customer input']
  },

  // Competitive Comparisons
  {
    id: 'vs-podium-birdeye',
    question: 'How does RepliFast compare to Podium or Birdeye?',
    answer: 'Unlike expensive all-in-one platforms like Podium or Birdeye (which cost $300-500+ monthly), RepliFast focuses exclusively on review management at a fraction of the cost ($19-39/month). You get the same review response quality without paying for unused features like SMS marketing, chat widgets, or complex CRM systems. RepliFast is purpose-built for small businesses wanting effective review management without enterprise-level complexity and pricing.',
    category: 'comparison',
    seoKeywords: ['Podium alternative', 'Birdeye alternative', 'affordable review management', 'small business solution']
  },
  {
    id: 'vs-manual-management',
    question: 'Why use RepliFast instead of managing reviews manually?',
    answer: 'Manual review management becomes overwhelming as businesses grow. RepliFast provides consistency (professional responses every time), efficiency (90% time savings), completeness (never miss a review), and SEO benefits (Google rewards active engagement). Manual management often leads to inconsistent response quality, missed reviews during busy periods, and significant time investment that could be spent growing your business.',
    category: 'comparison',
    seoKeywords: ['manual vs automated', 'review management efficiency', 'consistency benefits', 'time savings']
  },
  {
    id: 'google-maps-posting-delay',
    question: 'I posted a reply, but it doesn\'t appear in Google Maps.',
    answer: 'It can sometimes take time for Google to update their database, and depending on the amount of reviews that were processed, it can take up to 24 hours for them to be published on Google Maps. However, when you log in to the Google Business Profile manager, you will be able to see them already. It just takes time for Google to refresh them throughout their servers.',
    category: 'troubleshooting',
    seoKeywords: ['Google Maps delay', 'reply posting time', 'Google database update', 'server refresh']
  },

  // Future-Proofing & Scalability
];

export const helpCategories = {
  'getting-started': 'Getting Started',
  'features': 'Core Features',
  'setup': 'Setup & Integration',
  'troubleshooting': 'Troubleshooting',
  'advanced': 'Advanced Features',
  'billing': 'Billing & Plans',
  'security': 'Security & Privacy'
};

export function getHelpTopic(slug: string): HelpTopic | undefined {
  return helpTopics.find(topic => topic.slug === slug);
}

export function getHelpTopicsByCategory(category: string): HelpTopic[] {
  return helpTopics.filter(topic => topic.category === category);
}

export function getFAQByCategory(category: string): FAQItem[] {
  return faqItems.filter(faq => faq.category === category);
}

export function getAllHelpSlugs(): string[] {
  return helpTopics.map(topic => topic.slug);
}

// Additional utility functions for comprehensive help system
export function searchHelpContent(query: string): (HelpTopic | FAQItem)[] {
  const searchTerms = query.toLowerCase().split(' ');
  const results: (HelpTopic | FAQItem)[] = [];

  // Search help topics
  helpTopics.forEach(topic => {
    const searchText = `${topic.title} ${topic.description} ${topic.content.overview} ${topic.seoKeywords.join(' ')}`.toLowerCase();
    if (searchTerms.some(term => searchText.includes(term))) {
      results.push(topic);
    }
  });

  // Search FAQ items
  faqItems.forEach(faq => {
    const searchText = `${faq.question} ${faq.answer} ${faq.seoKeywords.join(' ')}`.toLowerCase();
    if (searchTerms.some(term => searchText.includes(term))) {
      results.push(faq);
    }
  });

  return results;
}

export function getRelatedContent(currentTopicId: string): HelpTopic[] {
  const currentTopic = helpTopics.find(t => t.id === currentTopicId);
  if (!currentTopic?.content.relatedTopics) return [];

  return helpTopics.filter(topic =>
    currentTopic.content.relatedTopics?.includes(topic.id)
  );
}

export function getMostPopularFAQs(): FAQItem[] {
  // Return most commonly asked questions based on categories
  const popularIds = [
    'money-back-guarantee',
    'ai-response-accuracy',
    'google-connection-process',
    'plan-differences',
    'automation-setup',
    'time-savings',
    'data-security',
    'vs-podium-birdeye'
  ];

  return faqItems.filter(faq => popularIds.includes(faq.id));
}
