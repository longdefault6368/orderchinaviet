'use client';

import React, { useEffect, useRef, useState } from 'react';

export type AnimationType = 'fade-up' | 'fade-down' | 'zoom-in' | 'slide-left' | 'slide-right';

interface ScrollRevealProps {
  children: React.ReactNode;
  animation?: AnimationType;
  delay?: number; // Delay in ms
  duration?: number; // Duration in ms
  className?: string;
  threshold?: number;
  once?: boolean;
}

export function ScrollReveal({
  children,
  animation = 'fade-up',
  delay = 0,
  duration = 700,
  className = '',
  threshold = 0.12,
  once = true,
}: ScrollRevealProps) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (once) {
            observer.unobserve(entry.target);
          }
        } else if (!once) {
          setIsVisible(false);
        }
      },
      {
        threshold,
        rootMargin: '0px 0px -40px 0px',
      }
    );

    observer.observe(node);

    return () => {
      if (node) observer.unobserve(node);
    };
  }, [threshold, once]);

  const animationClass = {
    'fade-up': 'reveal-fade-up',
    'fade-down': 'reveal-fade-down',
    'zoom-in': 'reveal-zoom-in',
    'slide-left': 'reveal-slide-left',
    'slide-right': 'reveal-slide-right',
  }[animation];

  return (
    <div
      ref={ref}
      className={`reveal-init ${animationClass} ${isVisible ? 'reveal-visible' : ''} ${className}`}
      style={{
        transitionDelay: `${delay}ms`,
        transitionDuration: `${duration}ms`,
      }}
    >
      {children}
    </div>
  );
}
