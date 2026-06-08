'use client';

import { useChatStore } from '../lib/store/chat-store';
import type { Language } from '../lib/mcp/types';

export default function Header() {
  const { language, setLanguage } = useChatStore();
  
  const languages: { key: Language; label: string }[] = [
    { key: 'en', label: 'EN' },
    { key: 'si', label: 'සි' },
    { key: 'tanglish', label: 'Mix' },
  ];

  return (
    <header className="header">
      <div className="header-brand">
        <div className="header-logo">🪞</div>
        <div>
          <div className="header-title">KASA</div>
          <div className="header-subtitle">AI Shopping Assistant</div>
        </div>
      </div>
      <div className="header-actions">
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
    </header>
  );
}
