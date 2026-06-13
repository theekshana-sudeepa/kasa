'use client';

import { useChatStore } from '../lib/store/chat-store';
import type { Language } from '../lib/mcp/types';
import { useTheme } from './ThemeProvider';
import { Sun, Moon, Plus } from 'lucide-react';

interface HeaderProps {
  onNewChat?: () => void;
}

export default function Header({ onNewChat }: HeaderProps) {
  const { language, setLanguage, isLoading, messages } = useChatStore();
  const { theme, toggleTheme } = useTheme();
  
  const languages: { key: Language; label: string }[] = [
    { key: 'en', label: 'EN' },
    { key: 'si', label: 'සි' },
    { key: 'tanglish', label: 'Mix' },
  ];

  const hasMessages = messages.length > 0;

  return (
    <header className="header" style={{ position: 'relative' }}>
      <div className="header-brand">
        <div className="header-logo">🪞</div>
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
      
      {/* AI Progress Bar */}
      <div className={`ai-progress-bar ${isLoading ? 'active' : ''}`} />
    </header>
  );
}
