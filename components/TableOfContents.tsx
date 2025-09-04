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
    let timeouts: NodeJS.Timeout[] = [];

    // Wait for the DOM to be fully rendered
    const setupTimer = setTimeout(() => {
      const articleElement = document.querySelector('article');
      if (!articleElement) {
        // Try again after a longer delay if article not found
        const retryTimer = setTimeout(() => {
          const retryArticle = document.querySelector('article');
          if (retryArticle) setupTOC(retryArticle);
        }, 500);
        timeouts.push(retryTimer);
        return;
      }

      setupTOC(articleElement);
    }, 200);
    timeouts.push(setupTimer);

    function setupTOC(articleElement: Element) {
      const domHeadings = articleElement.querySelectorAll('h2');

      const extractedHeadings: Heading[] = Array.from(domHeadings).map((heading, index) => {
        const text = heading.textContent || '';
        const level = parseInt(heading.tagName.charAt(1));

        // Create a slug from the heading text
        let id = text
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .trim();

        if (!id) {
          id = `heading-${index}`;
        }

        // Ensure unique IDs
        let finalId = id;
        let counter = 1;
        while (document.getElementById(finalId)) {
          finalId = `${id}-${counter}`;
          counter++;
        }

        // Add the ID to the actual heading element
        heading.id = finalId;

        return { id: finalId, text, level };
      });

      setHeadings(extractedHeadings);

      // Set up intersection observer for scroll tracking
      if (extractedHeadings.length > 0) {
        observer = new IntersectionObserver(
          (entries) => {
            // Find all intersecting entries
            const intersectingEntries = entries.filter(entry => entry.isIntersecting);

            if (intersectingEntries.length > 0) {
              // Find the one closest to the top of the viewport
              let closestEntry = intersectingEntries[0];
              let closestDistance = Math.abs(intersectingEntries[0].boundingClientRect.top);

              intersectingEntries.forEach((entry) => {
                const distance = Math.abs(entry.boundingClientRect.top);
                if (distance < closestDistance) {
                  closestDistance = distance;
                  closestEntry = entry;
                }
              });

              setActiveId(closestEntry.target.id);
            }
          },
          {
            rootMargin: '-20% 0px -60% 0px',
            threshold: [0, 0.1, 0.25, 0.5, 0.75, 1],
          }
        );

        // Observe all headings
        extractedHeadings.forEach(({ id }) => {
          const element = document.getElementById(id);
          if (element) {
            observer!.observe(element);
          }
        });

        // Set initial active heading based on current scroll position
        const initialActiveTimer = setTimeout(() => {
          const scrollPosition = window.scrollY + window.innerHeight * 0.3;
          let activeHeading = extractedHeadings[0];

          for (const heading of extractedHeadings) {
            const element = document.getElementById(heading.id);
            if (element && element.offsetTop <= scrollPosition) {
              activeHeading = heading;
            } else {
              break;
            }
          }

          setActiveId(activeHeading.id);
        }, 100);
        timeouts.push(initialActiveTimer);
      }
    }

    return () => {
      timeouts.forEach(timeout => clearTimeout(timeout));
      if (observer) {
        observer.disconnect();
      }
    };
  }, [content]);

  const handleClick = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      // Get the element's position relative to the document
      const elementRect = element.getBoundingClientRect();
      const bodyRect = document.body.getBoundingClientRect();
      const elementTop = elementRect.top - bodyRect.top;

      // Calculate offset to account for header and some padding
      const offsetTop = elementTop - 120;

      window.scrollTo({
        top: Math.max(0, offsetTop),
        behavior: 'smooth',
      });

      // Update active state immediately
      setActiveId(id);

      // Optional: Update URL hash without triggering scroll
      if (window.history && window.history.replaceState) {
        window.history.replaceState(null, '', `#${id}`);
      }
    }
  };

  if (headings.length === 0) {
    return null; // Don't render anything if no headings found
  }

  return (
    <Card>
      <CardHeader>
        <h3 className="font-semibold text-foreground/80">Table of Contents</h3>
      </CardHeader>
      <CardContent className="space-y-1">
        {headings.map(({ id, text, level }) => (
          <button
            key={id}
            onClick={() => handleClick(id)}
            className={`
              block w-full text-left text-sm transition-all duration-200 py-2 px-3 rounded-md relative
              ${
                activeId === id
                  ? 'text-foreground/90 bg-muted font-medium border-l-2 border-primary shadow-sm'
                  : 'text-muted-foreground hover:text-foreground/90 hover:bg-muted hover:border-l-2 hover:border-primary'
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
