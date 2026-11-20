'use client';
import { useState, useEffect, useCallback } from 'react';
import { useChatStore } from '../lib/store/chat-store';
import type { Product } from '../lib/mcp/types';

interface TenSecondDecisionProps {
  product: Product;
  onDecisionMade?: (accepted: boolean) => void;
}

export default function TenSecondDecision({ product, onDecisionMade }: TenSecondDecisionProps) {
  const [timeLeft, setTimeLeft] = useState(10);
  const [status, setStatus] = useState<'counting' | 'accepted' | 'stopped'>('counting');
  const addToCart = useChatStore((state) => state.addToCart);

  const handleAccept = useCallback(() => {
    setStatus('accepted');
    addToCart({ ...product, quantity: 1 });
    if (onDecisionMade) onDecisionMade(true);
  }, [addToCart, onDecisionMade, product]);

  useEffect(() => {
    if (status !== 'counting') return;

    if (timeLeft <= 0) {
      const acceptTimer = setTimeout(() => {
        handleAccept();
      }, 0);
      return () => clearTimeout(acceptTimer);
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, status, handleAccept]);

  const handleStop = () => {
    setStatus('stopped');
    if (onDecisionMade) onDecisionMade(false);
  };

  if (status === 'accepted') {
    return (
      <div className="tsd-container tsd-accepted">
        <p>✅ Added <strong>{product.name}</strong> to your cart!</p>
      </div>
    );
  }

  if (status === 'stopped') {
    return (
      <div className="tsd-container tsd-stopped">
        <p>⛔ You stopped KASA. What would you like instead?</p>
      </div>
    );
  }

  return (
    <div className="tsd-container">
      <div className="tsd-header">
        <h4>⚡ KASA Instinct</h4>
        <span className="tsd-timer">{timeLeft}s</span>
      </div>
      
      <div className="tsd-product">
        {/* eslint-disable-next-line @next/next/no-img-element -- Dynamic external Kapruka MCP product image URL */}
        {product.image_url && <img src={product.image_url} alt={product.name} />}
        <div className="tsd-info">
          <p className="tsd-name">{product.name}</p>
          <p className="tsd-price">Rs. {product.price.toLocaleString()}</p>
        </div>
      </div>

      <div className="tsd-actions">
        <button className="tsd-btn-stop" onClick={handleStop}>⛔ Stop! I&apos;ll decide</button>
        <button className="tsd-btn-accept" onClick={handleAccept}>✅ Let KASA pick!</button>
      </div>
    </div>
  );
}
