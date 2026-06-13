'use client';

import { useState, useEffect } from 'react';

const typingPhrases = [
  'Browsing the catalog…',
  'Finding the best picks…',
  'Checking what\'s trending…',
  'Almost there…',
  'Comparing options for you…',
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
      <div className="message-avatar">🪞</div>
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
