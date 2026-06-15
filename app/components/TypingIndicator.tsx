'use client';

import { useState, useEffect } from 'react';
import KasaAvatar from './KasaAvatar';

const typingPhrases = [
  'Browsing the catalog\u2026',
  'Finding the best picks\u2026',
  'Checking what\'s trending\u2026',
  'Almost there\u2026',
  'Comparing options for you\u2026',
];

export default function TypingIndicator() {
  const [phraseIndex, setPhraseIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPhraseIndex(prev => (prev + 1) % typingPhrases.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="typing-indicator">
      <KasaAvatar />
      <div className="typing-indicator-inner">
        <div className="typing-dots">
          <div className="typing-dot" />
          <div className="typing-dot" />
          <div className="typing-dot" />
        </div>
        <span className="typing-text">{typingPhrases[phraseIndex]}</span>
      </div>
    </div>
  );
}
