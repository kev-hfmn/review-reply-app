import { NextRequest } from 'next/server';
import { revalidatePath } from 'next/cache';

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');
    const slug = searchParams.get('slug');

    // Verify secret token for security
    if (secret !== process.env.REVALIDATE_SECRET_TOKEN) {
      return Response.json({ message: 'Invalid token' }, { status: 401 });
    }

    // Validate that the secret token exists
    if (!process.env.REVALIDATE_SECRET_TOKEN) {
      console.error('REVALIDATE_SECRET_TOKEN environment variable is not set');
      return Response.json({ message: 'Server configuration error' }, { status: 500 });
    }

    const revalidatedPaths = [];

    // Always revalidate the blog listing page when new content is added
    await revalidatePath('/blog');
    revalidatedPaths.push('/blog');

    // If a specific slug is provided, revalidate that individual blog post
    if (slug) {
      await revalidatePath(`/blog/${slug}`);
      revalidatedPaths.push(`/blog/${slug}`);
    }

    console.log('Successfully revalidated paths:', revalidatedPaths);

    return Response.json({ 
      revalidated: true, 
      paths: revalidatedPaths,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error during revalidation:', error);
    return Response.json({ 
      message: 'Error revalidating pages', 
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Optional: Support GET requests for testing purposes (with same security)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');

  if (secret !== process.env.REVALIDATE_SECRET_TOKEN) {
    return Response.json({ message: 'Invalid token' }, { status: 401 });
  }

  return Response.json({ 
    message: 'Revalidation endpoint is ready', 
    usage: {
      post: 'POST with secret parameter to trigger revalidation',
      parameters: {
        secret: 'Required - Your REVALIDATE_SECRET_TOKEN',
        slug: 'Optional - Specific blog post slug to revalidate'
      },
      examples: {
        revalidateAll: '/api/revalidate?secret=YOUR_TOKEN',
        revalidateSpecific: '/api/revalidate?secret=YOUR_TOKEN&slug=your-blog-post-slug'
      }
    }
  });
}