import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';

interface AnimatedNumberProps {
  value: number;
  initialValue?: number;
  className?: string;
}

export function AnimatedNumber({ value, initialValue, className }: AnimatedNumberProps) {
  const shouldReduceMotion = useReducedMotion();
  const [displayed, setDisplayed] = useState(initialValue ?? value);
  const [isHighlighted, setIsHighlighted] = useState(false);
  const previousRef = useRef(initialValue ?? value);

  useEffect(() => {
    const from = previousRef.current;
    previousRef.current = value;
    if (from === value) return;
    if (shouldReduceMotion) {
      setDisplayed(value);
      return;
    }
    setIsHighlighted(value > from);
    const duration = 700;
    const start = performance.now();
    let frame = 0;
    let highlightTimer = 0;
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayed(Math.round(from + (value - from) * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
      else highlightTimer = window.setTimeout(() => setIsHighlighted(false), 600);
    };
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(highlightTimer);
    };
  }, [value, shouldReduceMotion]);

  return (
    <span className={`${className ?? ''} transition-colors ${isHighlighted ? 'text-emerald-300' : ''}`}>
      {displayed}
    </span>
  );
}
