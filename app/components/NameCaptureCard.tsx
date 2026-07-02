'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, ArrowRight, Sparkles } from 'lucide-react';

interface NameCaptureCardProps {
  onSubmit: (name: string) => void;
  onSkip: () => void;
}

const SUGGESTED_NAMES = ['Alex', 'Sam', 'Jordan', 'Riley'];

export default function NameCaptureCard({ onSubmit, onSkip }: NameCaptureCardProps) {
  const [name, setName] = useState('');
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Small delay so animation completes first
    const t = setTimeout(() => inputRef.current?.focus(), 400);
    return () => clearTimeout(t);
  }, []);

  const handleSubmit = () => {
    const trimmed = name.trim();
    if (trimmed.length >= 1) {
      onSubmit(trimmed);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit();
    if (e.key === 'Escape') onSkip();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
      className="name-capture-card"
    >
      {/* Icon */}
      <motion.div
        className="name-capture-icon"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.15, type: 'spring', stiffness: 500 }}
      >
        <Sparkles size={20} />
      </motion.div>

      {/* Message */}
      <motion.p
        className="name-capture-text"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        Before we dive in — what should I call you?
      </motion.p>

      {/* Input */}
      <motion.div
        className={`name-capture-input-wrap ${focused ? 'focused' : ''}`}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <User size={15} className="name-capture-input-icon" />
        <input
          ref={inputRef}
          type="text"
          className="name-capture-input"
          placeholder="Your first name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={handleKey}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          maxLength={30}
          autoComplete="given-name"
        />
        <AnimatePresence>
          {name.trim().length > 0 && (
            <motion.button
              key="submit"
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.7 }}
              transition={{ type: 'spring', stiffness: 500 }}
              className="name-capture-submit"
              onClick={handleSubmit}
              aria-label="Submit name"
            >
              <ArrowRight size={15} />
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Quick name suggestions */}
      <motion.div
        className="name-capture-suggestions"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.45 }}
      >
        {SUGGESTED_NAMES.map((n, i) => (
          <motion.button
            key={n}
            className="name-capture-chip"
            onClick={() => onSubmit(n)}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.45 + i * 0.05 }}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
          >
            {n}
          </motion.button>
        ))}
        <motion.button
          className="name-capture-skip"
          onClick={onSkip}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          whileHover={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          Skip
        </motion.button>
      </motion.div>

      <style>{`
        .name-capture-card {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 14px;
          background: var(--kasa-surface);
          border: 1px solid var(--kasa-border);
          border-radius: 20px;
          padding: 20px 22px;
          max-width: 340px;
          box-shadow: 0 4px 24px rgba(124, 58, 237, 0.08);
        }

        .dark .name-capture-card {
          background: rgba(255,255,255,0.04);
          border-color: rgba(124,58,237,0.2);
          box-shadow: 0 4px 24px rgba(0,0,0,0.3);
        }

        .name-capture-icon {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          background: linear-gradient(135deg, var(--kasa-primary-500), var(--kasa-primary-400));
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          box-shadow: 0 4px 12px rgba(124, 58, 237, 0.3);
        }

        .name-capture-text {
          font-size: 15px;
          font-weight: 600;
          color: var(--kasa-text);
          margin: 0;
          line-height: 1.4;
        }

        .name-capture-input-wrap {
          display: flex;
          align-items: center;
          gap: 8px;
          width: 100%;
          background: var(--kasa-surface-2);
          border: 1.5px solid var(--kasa-border);
          border-radius: 12px;
          padding: 10px 14px;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .name-capture-input-wrap.focused {
          border-color: var(--kasa-primary-400);
          box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1);
        }

        .dark .name-capture-input-wrap {
          background: rgba(255,255,255,0.05);
          border-color: rgba(255,255,255,0.1);
        }

        .dark .name-capture-input-wrap.focused {
          border-color: var(--kasa-primary-400);
        }

        .name-capture-input-icon {
          color: var(--kasa-text-3);
          flex-shrink: 0;
        }

        .name-capture-input {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          font-size: 14px;
          font-weight: 500;
          color: var(--kasa-text);
          font-family: var(--font-inter), sans-serif;
          min-width: 0;
        }

        .name-capture-input::placeholder {
          color: var(--kasa-text-3);
          font-weight: 400;
        }

        .name-capture-submit {
          width: 28px;
          height: 28px;
          border-radius: 8px;
          background: var(--kasa-primary-500);
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          cursor: pointer;
          transition: background 0.2s, transform 0.15s;
          flex-shrink: 0;
        }

        .name-capture-submit:hover {
          background: var(--kasa-primary-400);
          transform: scale(1.05);
        }

        .name-capture-suggestions {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .name-capture-chip {
          padding: 5px 12px;
          border-radius: 20px;
          background: var(--kasa-primary-50);
          border: 1px solid var(--kasa-primary-200);
          color: var(--kasa-primary-600);
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;
          font-family: inherit;
        }

        .dark .name-capture-chip {
          background: rgba(124,58,237,0.12);
          border-color: rgba(124,58,237,0.25);
          color: var(--kasa-primary-300);
        }

        .name-capture-chip:hover {
          background: var(--kasa-primary-100);
          transform: scale(1.04);
        }

        .name-capture-skip {
          background: none;
          border: none;
          font-size: 12px;
          color: var(--kasa-text-3);
          cursor: pointer;
          padding: 4px 6px;
          font-family: inherit;
          transition: color 0.15s;
        }

        .name-capture-skip:hover {
          color: var(--kasa-text-2);
        }
      `}</style>
    </motion.div>
  );
}
