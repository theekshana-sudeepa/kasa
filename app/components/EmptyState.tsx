'use client';

import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { ShoppingBag, Search, AlertCircle, Package } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  variant?: 'cart' | 'search' | 'error' | 'default';
}

const VARIANT_ICONS: Record<string, LucideIcon> = {
  cart: ShoppingBag,
  search: Search,
  error: AlertCircle,
  default: Package,
};

export default function EmptyState({
  icon,
  title,
  description,
  action,
  variant = 'default',
}: EmptyStateProps) {
  const Icon = icon || VARIANT_ICONS[variant] || Package;

  return (
    <motion.div
      className="kasa-empty-state"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
    >
      <motion.div
        className="kasa-empty-state-icon"
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      >
        <Icon size={48} strokeWidth={1.2} />
      </motion.div>

      <h3 className="kasa-empty-state-title">{title}</h3>
      <p className="kasa-empty-state-desc">{description}</p>

      {action && (
        <motion.button
          className="kasa-empty-state-btn"
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          onClick={action.onClick}
        >
          {action.label}
        </motion.button>
      )}
    </motion.div>
  );
}
