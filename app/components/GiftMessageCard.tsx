'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

interface GiftMessageCardProps {
  message: string;
  onEdit?: (newMessage: string) => void;
}

export default function GiftMessageCard({ message, onEdit }: GiftMessageCardProps) {
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(message);

  return (
    <motion.div
      className="gift-message-card"
      initial={{ opacity: 0, y: 16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
    >
      <div className="gift-message-card-title">💌 Gift Message</div>
      
      {editing ? (
        <>
          <textarea
            className="gift-message-card-edit"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            maxLength={200}
            autoFocus
          />
          <div style={{ fontSize: '11px', color: 'var(--kasa-text-3)', marginTop: '4px', textAlign: 'right' }}>
            {editText.length}/200
          </div>
          <div className="gift-message-card-actions">
            <button
              className="gift-message-card-btn gift-message-card-btn-primary"
              onClick={() => {
                setEditing(false);
                onEdit?.(editText);
              }}
            >
              ✓ Use this
            </button>
            <button
              className="gift-message-card-btn gift-message-card-btn-secondary"
              onClick={() => {
                setEditText(message);
                setEditing(false);
              }}
            >
              Cancel
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="gift-message-card-text">
            &ldquo;{message}&rdquo;
          </div>
          <div className="gift-message-card-actions">
            <button
              className="gift-message-card-btn gift-message-card-btn-primary"
              onClick={() => setEditing(true)}
            >
              ✏️ Edit
            </button>
            <button
              className="gift-message-card-btn gift-message-card-btn-secondary"
              onClick={() => onEdit?.(message)}
            >
              ✓ Perfect
            </button>
          </div>
        </>
      )}
    </motion.div>
  );
}
