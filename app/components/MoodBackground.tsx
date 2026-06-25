'use client';

import { useEffect, useRef } from 'react';
import type { Mood } from '../lib/mcp/types';

interface MoodBackgroundProps {
  mood: Mood;
}

/**
 * Animated gradient background that shifts based on conversation mood.
 * Uses CSS custom properties for zero-rerender transitions.
 * Respects prefers-reduced-motion.
 */
export default function MoodBackground({ mood }: MoodBackgroundProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    ref.current.setAttribute('data-mood', mood);
  }, [mood]);

  return (
    <div ref={ref} className="kasa-mood-bg" data-mood={mood}>
      <div className="kasa-mood-bg-layer kasa-mood-bg-1" />
      <div className="kasa-mood-bg-layer kasa-mood-bg-2" />
      <div className="kasa-mood-bg-noise" />
    </div>
  );
}
