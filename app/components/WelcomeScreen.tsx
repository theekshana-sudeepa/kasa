'use client';
import { useEffect, useState, useRef } from 'react';
import { useChatStore } from '../lib/store/chat-store';
import { getFestivalContext } from '../lib/ai/system-prompt';
import { motion } from 'framer-motion';

interface WelcomeScreenProps {
  onChipClick: (text: string) => void;
}

const everydayChips = [
  { emoji: '📱', label: 'Electronics', query: 'Show me electronics' },
  { emoji: '🛒', label: 'Groceries', query: 'Show me grocery items' },
  { emoji: '👗', label: 'Fashion', query: 'Show me fashion items' },
  { emoji: '🏠', label: 'Home & Living', query: 'Show me home items' },
  { emoji: '👶', label: 'Baby & Kids', query: 'Show me baby items' },
];

const giftChips = [
  { emoji: '🎁', label: 'Gift Ideas', query: 'Show me gift ideas' },
  { emoji: '💐', label: 'Flowers', query: 'Show me flowers' },
  { emoji: '🎂', label: 'Cakes', query: 'Show me cakes' },
  { emoji: '🍫', label: 'Chocolates', query: 'Show me chocolates' },
  { emoji: '🎲', label: 'Surprise Me', query: 'Surprise me! 🎲' },
];

const tagline = "The only AI that shops like a Sri Lankan thinks.";

export default function WelcomeScreen({ onChipClick }: WelcomeScreenProps) {
  const [mounted, setMounted] = useState(false);
  const [typedText, setTypedText] = useState('');
  const [showCursor, setShowCursor] = useState(true);
  const userMemory = useChatStore((state) => state.userMemory);
  const language = useChatStore((state) => state.language);
  const typingRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setMounted(true);
    
    // Typewriter effect for tagline
    let i = 0;
    const type = () => {
      if (i <= tagline.length) {
        setTypedText(tagline.slice(0, i));
        i++;
        typingRef.current = setTimeout(type, 35 + Math.random() * 25);
      } else {
        // Stop cursor after typing
        setTimeout(() => setShowCursor(false), 1500);
      }
    };
    
    const startDelay = setTimeout(type, 600);
    
    return () => {
      clearTimeout(startDelay);
      if (typingRef.current) clearTimeout(typingRef.current);
    };
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    
    if (language === 'si') {
      if (hour < 12) return 'සුභ උදෑසනක්! ☀️ අද මොනවද හොයන්නේ?';
      if (hour < 18) return 'සුභ දහවලක්! 🌅 මොනවද ගන්න ඕනේ?';
      return 'සුභ සන්ධ්‍යාවක්! 🌙 රෑට shopping ද?';
    }
    
    if (language === 'tanglish') {
      if (hour < 12) return 'Good morning! ☀️ Enna thevai innaiku?';
      if (hour < 18) return 'Good afternoon! 🌅 Shopping pannalama?';
      return 'Good evening! 🌙 Late night shopping ah?';
    }

    const festival = getFestivalContext();
    if (festival) {
      const festivalName = festival.split('—')[0].split('!')[0].trim();
      return `${festivalName} is near! 🎉 Want something festive?`;
    }

    if (userMemory.hasOrderedBefore && userMemory.lastDeliveryCity) {
      return `Welcome back! 👋 Shopping for ${userMemory.lastDeliveryCity} again?`;
    }

    if (hour < 6) return "Can't sleep? Let's shop! 🌙";
    if (hour < 12) return "Good morning! ☀️ What are you looking for today?";
    if (hour < 14) return "Lunch break shopping? Smart move! 🍽️";
    if (hour < 18) return "Good afternoon! 🌅 Finding something nice?";
    if (hour >= 21) return "Late night browsing? I like your style 🌙";
    return "Good evening! 🌆 What can I find for you?";
  };

  if (!mounted) return null;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.12, delayChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 24, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring" as const, stiffness: 300, damping: 24 }
    }
  };

  const chipVariants = {
    hidden: { y: 16, opacity: 0, scale: 0.9 },
    visible: {
      y: 0,
      opacity: 1,
      scale: 1,
      transition: { type: "spring" as const, stiffness: 400, damping: 25 }
    }
  };

  return (
    <motion.div 
      className="welcome-screen"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Logo */}
      <motion.div 
        className="welcome-logo"
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring" as const, stiffness: 200, damping: 15, delay: 0.1 }}
      >
        🪞
      </motion.div>
      
      {/* Title */}
      <motion.h1 variants={itemVariants} className="welcome-title">
        KASA
      </motion.h1>
      
      {/* Typewriter tagline */}
      <motion.p variants={itemVariants} className="welcome-tagline">
        {typedText}
        {showCursor && <span className="cursor" />}
      </motion.p>
      
      {/* Dynamic greeting */}
      <motion.div variants={itemVariants} className="welcome-greeting">
        {getGreeting()}
      </motion.div>

      {/* Everyday Shopping */}
      <motion.div variants={itemVariants} className="welcome-section-label">
        🛍️ Shop for yourself
      </motion.div>
      
      <motion.div 
        variants={containerVariants}
        className="welcome-chips"
        style={{ marginBottom: '20px' }}
      >
        {everydayChips.map((chip, i) => (
          <motion.button
            key={chip.label}
            className="welcome-chip"
            variants={chipVariants}
            custom={i}
            whileHover={{ scale: 1.06, y: -3 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onChipClick(chip.query)}
          >
            {chip.emoji} {chip.label}
          </motion.button>
        ))}
      </motion.div>

      {/* Gifting */}
      <motion.div variants={itemVariants} className="welcome-section-label">
        🎁 Send a gift
      </motion.div>
      
      <motion.div 
        variants={containerVariants}
        className="welcome-chips"
      >
        {giftChips.map((chip, i) => (
          <motion.button
            key={chip.label}
            className={`welcome-chip ${chip.label === 'Surprise Me' ? 'highlight' : ''}`}
            variants={chipVariants}
            custom={i}
            whileHover={{ scale: 1.06, y: -3 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onChipClick(chip.query)}
          >
            {chip.emoji} {chip.label}
          </motion.button>
        ))}
      </motion.div>
      
      {/* Powered by Kapruka */}
      <motion.div 
        variants={itemVariants}
        style={{
          marginTop: '32px',
          fontSize: '11px',
          color: 'var(--kasa-text-3)',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontWeight: 500,
        }}
      >
        Powered by <strong style={{ color: 'var(--kasa-text-2)' }}>Kapruka.com</strong> 🇱🇰
      </motion.div>
    </motion.div>
  );
}
