'use client';

import { useEffect, useState } from 'react';
import type { Product } from '../lib/mcp/types';
import { useChatStore } from '../lib/store/chat-store';

interface ProductModalProps {
  product: Product;
  onClose: () => void;
}

export default function ProductModal({ product, onClose }: ProductModalProps) {
  const [mounted, setMounted] = useState(false);
  const addToCart = useChatStore((state) => state.addToCart);

  useEffect(() => {
    setMounted(true);
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const handleAdd = () => {
    addToCart({
      product_id: product.product_id,
      name: product.name,
      price: product.price,
      quantity: 1,
      image_url: product.image_url || '',
    });
    onClose();
  };

  if (!mounted) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.4)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '20px'
    }} onClick={onClose}>
      <div 
        style={{
          background: 'var(--kasa-surface)',
          borderRadius: '24px',
          maxWidth: '400px',
          width: '100%',
          overflow: 'hidden',
          boxShadow: 'var(--kasa-shadow-xl)',
          position: 'relative',
          animation: 'modalEnter 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'var(--kasa-surface-2)',
            border: 'none',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 10
          }}
        >
          ✕
        </button>

        <img 
          src={product.image_url} 
          alt={product.name} 
          style={{ width: '100%', height: '280px', objectFit: 'cover' }} 
        />
        
        <div style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px', color: 'var(--kasa-text)' }}>
            {product.name}
          </h2>
          <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--kasa-primary-500)', marginBottom: '16px' }}>
            Rs. {product.price.toLocaleString()}
          </div>
          
          <div style={{ 
            fontSize: '14px', 
            color: 'var(--kasa-text-2)', 
            marginBottom: '24px',
            lineHeight: '1.6' 
          }}>
            {product.description || 'A premium quality item from Kapruka. Perfect for any occasion and ready to be delivered to your loved ones.'}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <span style={{ fontSize: '13px', fontWeight: '600', color: product.in_stock ? 'var(--kasa-success)' : 'var(--kasa-error)' }}>
              {product.in_stock ? '✅ In Stock' : '❌ Out of Stock'}
            </span>
            {product.rating && (
              <span style={{ fontSize: '13px', color: 'var(--kasa-accent-600)' }}>
                ⭐ {product.rating} / 5
              </span>
            )}
          </div>

          <button
            onClick={handleAdd}
            disabled={!product.in_stock}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: '12px',
              background: 'var(--kasa-primary-500)',
              color: 'white',
              border: 'none',
              fontWeight: '600',
              fontSize: '15px',
              cursor: product.in_stock ? 'pointer' : 'not-allowed',
              opacity: product.in_stock ? 1 : 0.6,
              boxShadow: 'var(--kasa-shadow-sm)'
            }}
          >
            Add to Cart
          </button>
        </div>
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes modalEnter {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}} />
    </div>
  );
}
