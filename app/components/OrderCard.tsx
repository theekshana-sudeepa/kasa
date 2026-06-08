'use client';

import { useState, useEffect } from 'react';
import type { OrderResult } from '../lib/mcp/types';
import Confetti from './Confetti';

interface OrderCardProps {
  order: OrderResult;
}

export default function OrderCard({ order }: OrderCardProps) {
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {showConfetti && <Confetti />}
      <div className="order-card">
        <div className="order-card-celebration">🎉</div>
        <div className="order-card-title">Order Created Successfully!</div>
        <div className="order-card-number">Order #{order.order_number}</div>
        
        <div className="order-card-total">
          <span>Total</span>
          <span>Rs. {order.total.toLocaleString()}</span>
        </div>

        <a
          href={order.payment_url}
          target="_blank"
          rel="noopener noreferrer"
          className="order-card-pay-btn"
        >
          💳 PAY NOW — Rs. {order.total.toLocaleString()}
        </a>

        <div className="order-card-timer">
          ⏰ Price locked for 60 minutes
        </div>
      </div>
    </>
  );
}
