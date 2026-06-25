'use client';

import { motion } from 'framer-motion';
import type { SmartSuggestion } from '../lib/mcp/types';

interface SmartSuggestionsProps {
  suggestions: SmartSuggestion[];
  onSelect: (text: string) => void;
}

/**
 * Intelligent suggestion chips that replace static quick replies.
 * Animated stagger entry with type-based styling.
 */
export default function SmartSuggestions({ suggestions, onSelect }: SmartSuggestionsProps) {
  if (!suggestions || suggestions.length === 0) return null;

  return (
    <motion.div
      className="kasa-smart-suggestions"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3 }}
    >
      {suggestions.map((suggestion, idx) => (
        <motion.button
          key={`${suggestion.text}-${idx}`}
          className={`kasa-suggestion-chip kasa-suggestion-${suggestion.type}`}
          initial={{ opacity: 0, y: 10, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{
            type: 'spring',
            stiffness: 400,
            damping: 25,
            delay: 0.1 * idx,
          }}
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onSelect(suggestion.text)}
        >
          <span className="kasa-suggestion-emoji">{suggestion.emoji}</span>
          <span className="kasa-suggestion-text">{suggestion.text}</span>
        </motion.button>
      ))}
    </motion.div>
  );
}
