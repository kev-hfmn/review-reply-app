'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * A hook to detect if an element is centered in the viewport.
 * @param threshold The intersection ratio required to be considered "in view".
 * @returns A ref to attach to the element and a boolean indicating if it's in the center.
 */
function useCenteredInView(threshold = 0.6) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [inCenter, setInCenter] = useState(false);

  useEffect(() => {
    if (!ref.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        // Check if the element is intersecting and meets the threshold
        setInCenter(entry.isIntersecting && entry.intersectionRatio >= threshold);
      },
      {
        root: null, // viewport
        threshold: [0, 0.25, 0.5, 0.6, 0.75, 1], // trigger at different visibility percentages
      }
    );

    observer.observe(ref.current);

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [threshold]);

  return { ref, inCenter };
}

/**
 * A video component that plays only when it is centered in the viewport.
 */
export function ControlledVideo({
  src,
  poster,
  className,
  isActive
}: {
  src: string;
  poster?: string;
  className?: string;
  isActive?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const { ref, inCenter } = useCenteredInView(0.6);

  // Use isActive prop if provided, otherwise fall back to inCenter
  const shouldPlay = isActive !== undefined ? isActive : inCenter;

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    if (shouldPlay) {
      // Set the src only when the video should play to lazy-load it
      if (videoElement.src !== src) {
        videoElement.src = src;
      }
      videoElement.play().catch(error => {
        console.warn("Video autoplay was prevented. Ensure the video is muted.", error);
      });
    } else {
      videoElement.pause();
      videoElement.currentTime = 0; // Optional: restart video when it comes back into view
    }
  }, [shouldPlay, src]);

  return (
    <div ref={ref} className="object-cover">
      <video
        ref={videoRef}
        poster={poster}
        muted
        loop
        playsInline
        preload="lazy" // Set to none to prevent preloading
        className={className}
      />
    </div>
  );
}
