'use client';
import { useEffect, useState, useRef } from 'react';
import { useChatStore } from '../lib/store/chat-store';
import { getFestivalContext } from '../lib/ai/system-prompt';
import { motion } from 'framer-motion';

interface WelcomeScreenProps {
  onChipClick: (text: string) => void;
}

const everydayChips = [
  { emoji: '\uD83D\uDCF1', label: 'Electronics', query: 'Show me electronics' },
  { emoji: '\uD83D\uDED2', label: 'Groceries', query: 'Show me grocery items' },
  { emoji: '\uD83D\uDC57', label: 'Fashion', query: 'Show me fashion items' },
  { emoji: '\uD83C\uDFE0', label: 'Home & Living', query: 'Show me home items' },
  { emoji: '\uD83D\uDC76', label: 'Baby & Kids', query: 'Show me baby items' },
];

const giftChips = [
  { emoji: '\uD83C\uDF81', label: 'Gift Ideas', query: 'Show me gift ideas' },
  { emoji: '\uD83D\uDC90', label: 'Flowers', query: 'Show me flowers' },
  { emoji: '\uD83C\uDF82', label: 'Cakes', query: 'Show me cakes' },
  { emoji: '\uD83C\uDF6B', label: 'Chocolates', query: 'Show me chocolates' },
  { emoji: '\uD83C\uDFB2', label: 'Surprise Me', query: 'Surprise me!' },
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
    
    let i = 0;
    const type = () => {
      if (i <= tagline.length) {
        setTypedText(tagline.slice(0, i));
        i++;
        typingRef.current = setTimeout(type, 35 + Math.random() * 25);
      } else {
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
      if (hour < 12) return '\u0DC3\u0DD4\u0DB7 \u0D8B\u0DAF\u0DD1\u0DC3\u0DB1\u0D9A\u0DCA! \u2600\uFE0F \u0D85\u0DAF \u0DB8\u0DDC\u0DB1\u0DC0\u0DAF \u0DC4\u0DDC\u0DBA\u0DB1\u0DCA\u0DB1\u0DD9?';
      if (hour < 18) return '\u0DC3\u0DD4\u0DB7 \u0DAF\u0DC4\u0DC0\u0DBD\u0D9A\u0DCA! \u0DB8\u0DDC\u0DB1\u0DC0\u0DAF \u0D9C\u0DB1\u0DCA\u0DB1 \u0D94\u0DB1\u0DD3?';
      return '\u0DC3\u0DD4\u0DB7 \u0DC3\u0DB1\u0DCA\u0DB0\u0DCA\u200D\u0DBA\u0DCF\u0DC0\u0D9A\u0DCA! \u0DBB\u0DD1\u0DA7 shopping \u0DAF?';
    }
    
    if (language === 'tanglish') {
      if (hour < 12) return 'Good morning! Enna thevai innaiku?';
      if (hour < 18) return 'Good afternoon! Shopping pannalama?';
      return 'Good evening! Late night shopping ah?';
    }

    const festival = getFestivalContext();
    if (festival) {
      // Extract just the festival name before any description
      const festivalName = festival.split(' is ')[0].split(' \u2014')[0].split('!')[0].trim();
      return `${festivalName} season! Want something festive?`;
    }

    if (userMemory.hasOrderedBefore && userMemory.lastDeliveryCity) {
      return `Welcome back! Shopping for ${userMemory.lastDeliveryCity} again?`;
    }

    if (hour < 6) return "Can't sleep? Let's shop!";
    if (hour < 12) return "Good morning! What are you looking for today?";
    if (hour < 14) return "Lunch break shopping? Smart move!";
    if (hour < 18) return "Good afternoon! Finding something nice?";
    if (hour >= 21) return "Late night browsing? I like your style";
    return "Good evening! What can I find for you?";
  };

  if (!mounted) return null;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring" as const, stiffness: 300, damping: 24 }
    }
  };

  const chipVariants = {
    hidden: { y: 12, opacity: 0, scale: 0.92 },
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
      {/* Decorative rings behind logo */}
      <div className="welcome-rings" aria-hidden="true">
        <div className="welcome-ring welcome-ring-1" />
        <div className="welcome-ring welcome-ring-2" />
        <div className="welcome-ring welcome-ring-3" />
      </div>

      {/* Logo */}
      <motion.div 
        className="welcome-logo"
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring" as const, stiffness: 200, damping: 15, delay: 0.1 }}
      >
        <span style={{ position: 'relative', zIndex: 1, fontWeight: 900, color: 'white', lineHeight: 1 }}>K</span>
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
        {'\uD83D\uDED2'} Shop for yourself
      </motion.div>
      
      <motion.div 
        variants={containerVariants}
        className="welcome-chips"
        style={{ marginBottom: '24px' }}
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
            <span className="chip-emoji">{chip.emoji}</span> {chip.label}
          </motion.button>
        ))}
      </motion.div>

      {/* Gifting */}
      <motion.div variants={itemVariants} className="welcome-section-label">
        {'\uD83C\uDF81'} Send a gift
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
            <span className="chip-emoji">{chip.emoji}</span> {chip.label}
          </motion.button>
        ))}
      </motion.div>
      
      {/* Powered by ThikkaBro */}
      <motion.div 
        variants={itemVariants}
        className="welcome-footer"
      >
        Powered by <strong>ThikkaBro</strong> {'\uD83C\uDDF1\uD83C\uDDF0'}
      </motion.div>
    </motion.div>
  );
}
