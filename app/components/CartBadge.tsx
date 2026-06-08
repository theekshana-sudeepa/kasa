'use client';

import { useChatStore } from '../lib/store/chat-store';

interface CartBadgeProps {
  onClick: () => void;
}

export default function CartBadge({ onClick }: CartBadgeProps) {
  const { cart } = useChatStore();
  
  if (cart.length === 0) return null;

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <button className="cart-badge" onClick={onClick}>
      🛒 {count} · Rs. {total.toLocaleString()}
    </button>
  );
}
