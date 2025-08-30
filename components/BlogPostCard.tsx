import Link from 'next/link';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { ClockIcon } from 'lucide-react';
import { BlogPost } from '@/types/blog';

interface BlogPostCardProps {
  post: BlogPost;
  showAuthor?: boolean;
  showFooter?: boolean;
}

export function BlogPostCard({ post, showAuthor = true, showFooter = true }: BlogPostCardProps) {
  return (
    <Link href={`/blog/${post.slug}`}>
      <Card className="h-full overflow-hidden hover:shadow-xl transition-shadow duration-300 cursor-pointer group">
        <CardHeader className="p-0">
          <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
            {post.featured_image ? (
              <Image
                src={post.featured_image}
                alt={post.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                <div className="text-6xl font-bold text-blue-200">
                  {post.title.charAt(0)}
                </div>
              </div>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-3">
            <Badge variant="outline" className="text-xs">
              {post.category}
            </Badge>
            <span className="text-xs text-gray-500">
              {new Date(post.published_at).toLocaleDateString()}
            </span>
          </div>
          
          <h3 className="text-xl font-semibold mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors">
            {post.title}
          </h3>
          
          <p className="text-gray-600 text-sm line-clamp-3 mb-4">
            {post.excerpt}
          </p>
          
          <div className="flex flex-wrap gap-1 mb-4">
            {post.tags.slice(0, 3).map((tag: string) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        </CardContent>
        
        {showFooter && (
          <CardFooter className="px-6 pb-6 pt-0">
            <div className="flex items-center justify-between w-full">
              {showAuthor && (
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                    {post.author.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{post.author.name}</p>
                    {post.author.role && (
                      <p className="text-xs text-gray-500">{post.author.role}</p>
                    )}
                  </div>
                </div>
              )}
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <ClockIcon className="h-3 w-3" />
                <span>{post.read_time} min</span>
              </div>
            </div>
          </CardFooter>
        )}
      </Card>
    </Link>
  );
}
