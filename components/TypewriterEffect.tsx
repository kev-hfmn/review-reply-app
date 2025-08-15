import { useState, useEffect } from 'react';

interface TypewriterEffectProps {
  text: string;
  delay?: number;
  onComplete?: () => void;
}

export const TypewriterEffect = ({ text, delay = 50, onComplete }: TypewriterEffectProps) => {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, delay);

      return () => clearTimeout(timeout);
    } else if (currentIndex === text.length && onComplete) {
      onComplete();
    }
  }, [currentIndex, delay, text, onComplete]);

  return <span>{displayText}</span>;
}; 