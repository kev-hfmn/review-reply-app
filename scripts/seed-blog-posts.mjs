import { createClient } from '@supabase/supabase-js';

// Supabase configuration - replace with your actual credentials
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tanxlkgdefjsdynwqend.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhbnhsa2dkZWZqc2R5bndxZW5kIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDk5MTY4NCwiZXhwIjoyMDcwNTY3Njg0fQ.tpJEojkIUHSM6rRyB6SCnrzkhdLGx-jkXDL-BxF_0Fs';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const samplePosts = [
  {
    title: 'The Art of Responding to Negative Reviews',
    slug: 'art-of-responding-to-negative-reviews',
    excerpt: 'Turn a negative review into a positive opportunity. Learn the best strategies for responding to unhappy customers and winning them back.',
    content: '<p>Responding to negative reviews is a delicate art. A well-crafted response can not only mitigate the damage but also demonstrate your commitment to customer satisfaction. Here are some key strategies...</p>',
    author_name: 'Jane Doe',
    author_role: 'Customer Success Manager',
    published_at: new Date().toISOString(),
    read_time: 5,
    is_featured: true,
    published: true,
    category: 'Reputation Management',
    tags: ['Customer Service', 'Negative Reviews', 'Brand Reputation'],
  },
  {
    title: 'How to Encourage More Positive Google Reviews',
    slug: 'how-to-get-more-positive-google-reviews',
    excerpt: 'Boost your online presence by learning effective, ethical strategies to encourage your happy customers to leave positive reviews on Google.',
    content: '<p>Positive reviews are social proof that can significantly impact your business. This post explores several methods to increase the quantity and quality of your reviews...</p>',
    author_name: 'John Smith',
    author_role: 'Marketing Specialist',
    published_at: new Date().toISOString(),
    read_time: 7,
    is_featured: false,
    published: true,
    category: 'Marketing',
    tags: ['Google Reviews', 'Local SEO', 'Customer Feedback'],
  },
  {
    title: 'AI in Review Management: The Future is Now',
    slug: 'ai-in-review-management',
    excerpt: 'Discover how artificial intelligence is revolutionizing the way businesses manage and respond to customer reviews, saving time and improving quality.',
    content: '<p>AI is no longer a futuristic concept; it\'s a practical tool for modern businesses. From generating draft replies to analyzing sentiment, AI can be your most powerful ally in review management...</p>',
    author_name: 'Alex Ray',
    author_role: 'AI Ethicist',
    published_at: new Date().toISOString(),
    read_time: 6,
    is_featured: false,
    published: true,
    category: 'Technology',
    tags: ['AI', 'Automation', 'Customer Service'],
  }
];

async function seedBlogPosts() {
  console.log('🌱 Seeding blog posts...');

  // To avoid duplicates, we'll first remove all existing posts.
  // In a real-world scenario, you might want a more nuanced approach.
  console.log('🗑️ Deleting existing blog posts...');
  const { error: deleteError } = await supabase.from('blog_posts').delete().not('id', 'is', null);
  if (deleteError) {
    console.error('Error deleting existing posts:', deleteError.message);
    return;
  }
  console.log('✅ Existing posts deleted.');

  const { data, error } = await supabase.from('blog_posts').insert(samplePosts).select();

  if (error) {
    console.error('Error seeding blog posts:', error.message);
  } else {
    console.log(`✅ Successfully seeded ${data.length} blog posts.`);
  }
}

seedBlogPosts().catch(console.error);
