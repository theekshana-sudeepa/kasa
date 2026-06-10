'use client';
import { useEffect, useState } from 'react';
import { useChatStore } from '../lib/store/chat-store';
import { getFestivalContext } from '../lib/ai/system-prompt';

interface WelcomeScreenProps {
  onChipClick: (text: string) => void;
}

const chips = [
  { emoji: '🎁', label: 'Gift Ideas' },
  { emoji: '🎂', label: 'Cakes' },
  { emoji: '💐', label: 'Flowers' },
  { emoji: '🎲', label: 'Surprise Me' },
  { emoji: '🛍️', label: 'Trending' },
];

export default function WelcomeScreen({ onChipClick }: WelcomeScreenProps) {
  const [mounted, setMounted] = useState(false);
  const [tagline, setTagline] = useState('');
  const fullTagline = "The only AI that shops like a Sri Lankan thinks.";
  
  const userMemory = useChatStore((state) => state.userMemory);

  useEffect(() => {
    setMounted(true);
    let i = 0;
    const interval = setInterval(() => {
      setTagline(fullTagline.slice(0, i + 1));
      i++;
      if (i > fullTagline.length) clearInterval(interval);
    }, 30);
    return () => clearInterval(interval);
  }, []);

  // Generate Ghost Context Greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    let timeGreeting = 'Hello!';
    if (hour < 12) timeGreeting = 'Good morning! ☀️';
    else if (hour < 18) timeGreeting = 'Good afternoon! 🌅';
    else timeGreeting = 'Good evening! 🌙';

    const festival = getFestivalContext();
    if (festival) {
      return `${timeGreeting} ${festival.split('—')[0]} is near. Want me to find something festive?`;
    }

    if (userMemory.hasOrderedBefore && userMemory.lastDeliveryCity) {
      return `${timeGreeting} Welcome back! 👋 Last time you sent something to ${userMemory.lastDeliveryCity} — ready to shop again?`;
    }

    if (hour < 12) {
      return `${timeGreeting} Need to send something today? I've got same-day delivery options ready.`;
    } else if (new Date().getDay() === 5 && hour > 16) {
      return `${timeGreeting} Weekend plans? Great time to send something special.`;
    }

    return `${timeGreeting} What are you looking for today?`;
  };

  if (!mounted) return null;

  return (
    <div className="welcome-screen aurora-bg">
      <div className="welcome-logo enter-spring">🪞</div>
      <h1 className="welcome-title">KASA</h1>
      <p className="welcome-tagline">{tagline}<span className="cursor" /></p>
      
      <div className="welcome-greeting fade-up-delay">
        <p>{getGreeting()}</p>
      </div>

      <div className="welcome-chips">
        {chips.map((chip, index) => (
          <button
            key={chip.label}
            className="welcome-chip stagger-chip"
            style={{ animationDelay: `${500 + index * 50}ms` }}
            onClick={() => onChipClick(chip.label === 'Surprise Me' ? 'Surprise me! 🎲' : `Show me ${chip.label.toLowerCase()}`)}
          >
            {chip.emoji} {chip.label}
          </button>
        ))}
      </div>
    </div>
  );
}
