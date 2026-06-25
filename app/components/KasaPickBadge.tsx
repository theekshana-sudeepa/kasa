'use client';

import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

interface KasaPickBadgeProps {
  reason?: string;
  compact?: boolean;
}

/**
 * "KASA's Pick" badge for top-ranked products.
 * Shows an animated sparkle with the match reason on hover.
 */
export default function KasaPickBadge({ reason, compact = false }: KasaPickBadgeProps) {
  return (
    <motion.div
      className={`kasa-pick-badge ${compact ? 'kasa-pick-badge-compact' : ''}`}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.2 }}
      title={reason || "KASA's top recommendation"}
    >
      <motion.span
        className="kasa-pick-sparkle"
        animate={{ rotate: [0, 15, -15, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <Sparkles size={compact ? 10 : 12} />
      </motion.span>
      <span className="kasa-pick-text">
        {compact ? 'Pick' : "KASA's Pick"}
      </span>
    </motion.div>
  );
}
