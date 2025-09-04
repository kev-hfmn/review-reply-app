import Link from 'next/link';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { ClockIcon } from 'lucide-react';
import { BlogPost } from '@/types/blog';
import { format } from 'date-fns';

interface BlogPostCardProps {
  post: BlogPost;
  showAuthor?: boolean;
  showFooter?: boolean;
}

export function BlogPostCard({ post, showAuthor = true, showFooter = true }: BlogPostCardProps) {
  return (
    <Link href={`/blog/${post.slug}`}>
      <Card className="h-full overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group hover:scale-[1.02]">
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
            <Badge variant="outline" className="text-xs text-foreground/80">
              {post.category}
            </Badge>
            <span className="text-xs text-gray-500">
              {format(new Date(post.created_at), 'MMM dd, yyyy')}
            </span>
          </div>

          <h3 className="text-xl text-foreground/95 font-semibold mb-3 line-clamp-2 transition-colors">
            {post.title}
          </h3>

          <p className="text-muted-foreground text-sm line-clamp-3 mb-4">
            {post.excerpt}
          </p>

          <div className="flex flex-wrap gap-1 mb-4">
            {post.tags.slice(0, 3).map((tag: string) => (
              <Badge key={tag} variant="default" className="text-xs">
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
                  <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent/80 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                    {post.author.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-light text-foreground/80">{post.author.name}</p>
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
