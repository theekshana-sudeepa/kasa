'use client';

import { useEffect, useState } from 'react';
import type { Product } from '../lib/mcp/types';
import { useChatStore } from '../lib/store/chat-store';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingCart, Check, Package } from 'lucide-react';

interface ProductModalProps {
  product: Product;
  onClose: () => void;
}

export default function ProductModal({ product, onClose }: ProductModalProps) {
  const [mounted, setMounted] = useState(false);
  const [added, setAdded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const addToCart = useChatStore((state) => state.addToCart);

  useEffect(() => {
    setMounted(true);
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const handleAdd = () => {
    setAdded(true);
    addToCart({
      product_id: product.product_id,
      name: product.name,
      price: product.price,
      quantity: 1,
      image_url: product.image_url || '',
    });
    setTimeout(() => {
      onClose();
    }, 800);
  };

  if (!mounted) return null;

  const hasImage = product.image_url && !imgError && 
    !product.image_url.includes('placehold.co');

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          style={{
            background: 'var(--kasa-surface)',
            borderRadius: '24px',
            maxWidth: '400px',
            width: '100%',
            overflow: 'hidden',
            boxShadow: 'var(--kasa-shadow-xl)',
            position: 'relative',
            border: '1px solid var(--kasa-border)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              background: 'rgba(0,0,0,0.4)',
              backdropFilter: 'blur(8px)',
              border: 'none',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 10,
              color: 'white',
            }}
          >
            <X size={18} />
          </button>

          {/* Image */}
          {hasImage ? (
            <img
              src={product.image_url}
              alt={product.name}
              style={{ width: '100%', height: '280px', objectFit: 'cover' }}
              onError={() => setImgError(true)}
            />
          ) : (
            <div style={{
              width: '100%',
              height: '200px',
              background: 'linear-gradient(135deg, var(--kasa-primary-50), var(--kasa-surface-3))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Package size={56} strokeWidth={1} style={{ color: 'var(--kasa-text-3)' }} />
            </div>
          )}

          {/* Content */}
          <div style={{ padding: '24px' }}>
            <h2 style={{
              fontSize: '18px',
              fontWeight: '700',
              marginBottom: '8px',
              color: 'var(--kasa-text)',
              lineHeight: 1.3,
            }}>
              {product.name}
            </h2>

            <div style={{
              fontSize: '22px',
              fontWeight: '800',
              background: 'linear-gradient(135deg, var(--kasa-primary-600), var(--kasa-primary-400))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              marginBottom: '16px',
            }}>
              Rs. {product.price.toLocaleString()}
            </div>

            <div style={{
              fontSize: '14px',
              color: 'var(--kasa-text-2)',
              marginBottom: '20px',
              lineHeight: '1.6',
            }}>
              {product.description || 'A premium quality item from Kapruka. Perfect for any occasion — ready for delivery across Sri Lanka.'}
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
            }}>
              <span style={{
                fontSize: '13px',
                fontWeight: '600',
                color: product.in_stock ? 'var(--kasa-success)' : 'var(--kasa-error)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}>
                {product.in_stock ? <><Check size={14} /> In Stock</> : '❌ Out of Stock'}
              </span>
              {product.rating && (
                <span style={{ fontSize: '13px', color: 'var(--kasa-accent-500)', fontWeight: 600 }}>
                  ⭐ {product.rating} / 5
                </span>
              )}
            </div>

            {/* Add to Cart */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleAdd}
              disabled={!product.in_stock}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '12px',
                background: added
                  ? 'var(--kasa-success)'
                  : 'linear-gradient(135deg, var(--kasa-primary-500), var(--kasa-primary-400))',
                color: 'white',
                border: 'none',
                fontWeight: '700',
                fontSize: '15px',
                cursor: product.in_stock ? 'pointer' : 'not-allowed',
                opacity: product.in_stock ? 1 : 0.5,
                boxShadow: added
                  ? '0 4px 16px rgba(16, 185, 129, 0.3)'
                  : '0 4px 16px rgba(124, 58, 237, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.3s ease',
              }}
            >
              {added ? (
                <><Check size={18} /> Added to Cart!</>
              ) : (
                <><ShoppingCart size={18} /> Add to Cart</>
              )}
            </motion.button>

            {/* Kapruka link */}
            {product.url && (
              <a
                href={product.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'block',
                  textAlign: 'center',
                  marginTop: '12px',
                  fontSize: '13px',
                  color: 'var(--kasa-text-3)',
                }}
              >
                View on Kapruka.com →
              </a>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
