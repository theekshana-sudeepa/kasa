'use client';

import { useChatStore } from '../lib/store/chat-store';
import type { Language } from '../lib/mcp/types';
import { useTheme } from './ThemeProvider';
import { Sun, Moon, Plus, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface HeaderProps {
  onNewChat?: () => void;
}

export default function Header({ onNewChat }: HeaderProps) {
  const { language, setLanguage, isLoading, messages, mood } = useChatStore();
  const { theme, toggleTheme } = useTheme();
  
  const languages: { key: Language; label: string }[] = [
    { key: 'en', label: 'EN' },
    { key: 'si', label: '\u0DC3\u0DD2' },
    { key: 'tanglish', label: 'Mix' },
  ];

  const hasMessages = messages.length > 0;

  // Mood-based border gradient
  const moodGradients: Record<string, string> = {
    neutral: 'linear-gradient(90deg, var(--kasa-primary-500), var(--kasa-primary-300))',
    warm: 'linear-gradient(90deg, #f59e0b, #fbbf24)',
    excited: 'linear-gradient(90deg, #ec4899, #8b5cf6)',
    urgent: 'linear-gradient(90deg, #ef4444, #f97316)',
    romantic: 'linear-gradient(90deg, #f472b6, #fb7185)',
    calm: 'linear-gradient(90deg, #14b8a6, #3b82f6)',
  };

  return (
    <header className="header" style={{ position: 'relative' }}>
      <div className="header-brand">
        <motion.div 
          className="header-logo"
          whileHover={{ scale: 1.1, rotate: 5 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 400, damping: 15 }}
        >
          <span style={{ fontWeight: 900, color: 'white', fontSize: '16px', position: 'relative', zIndex: 1 }}>K</span>
        </motion.div>
        <div>
          <div className="header-title">KASA</div>
          <div className="header-subtitle">by Kapruka</div>
        </div>
      </div>
      <div className="header-actions">
        {hasMessages && onNewChat && (
          <button
            onClick={onNewChat}
            className="new-chat-btn"
            aria-label="New conversation"
            title="New conversation"
          >
            <Plus size={16} />
          </button>
        )}
        <Link
          href="/dashboard"
          className="new-chat-btn"
          aria-label="Dashboard"
          title="Telemetry Dashboard"
          style={{ textDecoration: 'none' }}
        >
          <BarChart3 size={16} />
        </Link>
        <button 
          onClick={toggleTheme} 
          className="theme-toggle-btn"
          aria-label="Toggle dark mode"
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
        <div className="lang-toggle">
          {languages.map((lang) => (
            <button
              key={lang.key}
              className={`lang-btn ${language === lang.key ? 'active' : ''}`}
              onClick={() => setLanguage(lang.key)}
            >
              {lang.label}
            </button>
          ))}
        </div>
      </div>
      
      {/* AI Progress Bar — mood-reactive gradient */}
      <div 
        className={`ai-progress-bar ${isLoading ? 'active' : ''}`} 
        style={{ background: isLoading ? moodGradients[mood] || moodGradients.neutral : undefined }}
      />
    </header>
  );
}
