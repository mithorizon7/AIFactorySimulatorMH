import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface AnimatedNumberProps {
  value: string | number;
  className?: string;
}

export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({ value, className }) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const prevValueRef = useRef(value);

  useEffect(() => {
    if (prevValueRef.current !== value && prevValueRef.current !== undefined) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 500); // Animation duration
      return () => clearTimeout(timer);
    }
    prevValueRef.current = value;
  }, [value]);

  return (
    <span className={cn(className, isAnimating && 'animate-pop')}>
      {value}
    </span>
  );
};