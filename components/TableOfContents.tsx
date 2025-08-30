'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

interface Heading {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  content: string;
}

export function TableOfContents({ content }: TableOfContentsProps) {
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [activeId, setActiveId] = useState<string>('');

  // Extract headings and set up everything after component mounts
  useEffect(() => {
    let observer: IntersectionObserver | null = null;

    // Wait for the DOM to be fully rendered
    const timer = setTimeout(() => {
      const articleElement = document.querySelector('article');
      if (!articleElement) return;

      const domHeadings = articleElement.querySelectorAll('h1, h2, h3, h4, h5, h6');
      
      const extractedHeadings: Heading[] = Array.from(domHeadings).map((heading, index) => {
        const text = heading.textContent || '';
        const level = parseInt(heading.tagName.charAt(1));
        
        // Create a slug from the heading text
        const id = text
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .trim()
          || `heading-${index}`;
        
        // Add the ID to the actual heading element
        heading.id = id;
        
        return { id, text, level };
      });
      
      setHeadings(extractedHeadings);

      // Set up intersection observer for scroll tracking
      if (extractedHeadings.length > 0) {
        observer = new IntersectionObserver(
          (entries) => {
            // Find the entry that's most visible
            let maxRatio = 0;
            let activeEntry: IntersectionObserverEntry | null = null;

            entries.forEach((entry) => {
              if (entry.isIntersecting && entry.intersectionRatio > maxRatio) {
                maxRatio = entry.intersectionRatio;
                activeEntry = entry;
              }
            });

            if (activeEntry) {
              setActiveId(activeEntry.target.id);
            }
          },
          {
            rootMargin: '-100px 0px -66% 0px',
            threshold: [0, 0.25, 0.5, 0.75, 1],
          }
        );

        // Observe all headings
        extractedHeadings.forEach(({ id }) => {
          const element = document.getElementById(id);
          if (element) {
            observer!.observe(element);
          }
        });

        // Set initial active heading
        if (extractedHeadings.length > 0) {
          setActiveId(extractedHeadings[0].id);
        }
      }
    }, 100); // Small delay to ensure DOM is ready

    return () => {
      clearTimeout(timer);
      if (observer) {
        observer.disconnect();
      }
    };
  }, [content]);

  const handleClick = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      // Calculate offset to account for sticky header
      const offsetTop = element.offsetTop - 120;
      
      window.scrollTo({
        top: offsetTop,
        behavior: 'smooth',
      });
      
      // Update active state immediately
      setActiveId(id);
    }
  };

  if (headings.length === 0) {
    return (
      <Card>
        <CardHeader>
          <h3 className="font-semibold text-gray-900">Table of Contents</h3>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">No headings found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <h3 className="font-semibold text-gray-900">Table of Contents</h3>
      </CardHeader>
      <CardContent className="space-y-1">
        {headings.map(({ id, text, level }) => (
          <button
            key={id}
            onClick={() => handleClick(id)}
            className={`
              block w-full text-left text-sm transition-colors duration-200 py-2 px-3 rounded-md
              ${level === 2 ? 'pl-3' : ''}
              ${level === 3 ? 'pl-6' : ''}
              ${level === 4 ? 'pl-9' : ''}
              ${level >= 5 ? 'pl-12' : ''}
              ${
                activeId === id
                  ? 'text-blue-600 bg-blue-50 font-medium border-l-2 border-blue-600'
                  : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
              }
            `}
          >
            {text}
          </button>
        ))}
      </CardContent>
    </Card>
  );
}