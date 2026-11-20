'use client';

import { useChatStore } from '../lib/store/chat-store';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Minus, Plus, Trash2, ShoppingBag, Package } from 'lucide-react';
import { t } from '../lib/i18n/translations';
import EmptyState from './EmptyState';
import { useToast } from './Toast';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onCheckout: () => void;
}

export default function CartDrawer({ isOpen, onClose, onCheckout }: CartDrawerProps) {
  const { cart, removeFromCart, updateCartQuantity, language } = useChatStore();
  const toast = useToast();
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.4)',
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)',
              zIndex: 200,
            }}
            onClick={onClose}
          />
        )}
      </AnimatePresence>
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '360px',
          maxWidth: '90vw',
          background: 'var(--kasa-bg)',
          borderLeft: '1px solid var(--kasa-border)',
          zIndex: 201,
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: isOpen ? 'var(--kasa-shadow-xl)' : 'none',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--kasa-border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <h2 style={{
            fontSize: '18px',
            fontWeight: 700,
            color: 'var(--kasa-text)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <ShoppingBag size={20} /> {t('cart.title', language)}
          </h2>
          <button
            onClick={onClose}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'var(--kasa-surface-2)',
              border: '1px solid var(--kasa-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--kasa-text-2)',
              cursor: 'pointer',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Cart Items */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
          {cart.length === 0 ? (
            <EmptyState
              variant="cart"
              title={t('cart.empty', language)}
              description={t('cart.startShopping', language)}
              action={{ label: 'Start Shopping', onClick: onClose }}
            />
          ) : (
            cart.map((item, idx) => (
              <div key={item.product_id} style={{
                display: 'flex',
                gap: '12px',
                padding: '14px 0',
                borderBottom: idx < cart.length - 1 ? '1px solid var(--kasa-border)' : 'none',
                alignItems: 'center',
              }}>
                {item.image_url && !item.image_url.includes('placehold') ? (
                  // eslint-disable-next-line @next/next/no-img-element -- Dynamic external Kapruka MCP product image URL
                  <img
                    src={item.image_url}
                    alt={item.name}
                    style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '10px',
                      objectFit: 'cover',
                      background: 'var(--kasa-surface-2)',
                      border: '1px solid var(--kasa-border)',
                    }}
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                ) : (
                  <div style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '10px',
                    background: 'var(--kasa-surface-2)',
                    border: '1px solid var(--kasa-border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <Package size={20} style={{ color: 'var(--kasa-text-3)' }} />
                  </div>
                )}
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    lineHeight: 1.3,
                    marginBottom: '4px',
                    color: 'var(--kasa-text)',
                  }}>
                    {item.name}
                  </div>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: 700,
                    color: 'var(--kasa-primary-500)',
                    marginBottom: '8px',
                  }}>
                    Rs. {(item.price * item.quantity).toLocaleString()}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button
                      onClick={() => item.quantity > 1
                        ? updateCartQuantity(item.product_id, item.quantity - 1)
                        : removeFromCart(item.product_id)
                      }
                      style={{
                        width: '26px', height: '26px',
                        borderRadius: '8px',
                        border: '1px solid var(--kasa-border)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'var(--kasa-surface)',
                        color: 'var(--kasa-text-2)',
                        cursor: 'pointer',
                      }}
                    >
                      <Minus size={12} />
                    </button>
                    <span style={{ fontSize: '14px', fontWeight: 700, minWidth: '20px', textAlign: 'center' }}>
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateCartQuantity(item.product_id, item.quantity + 1)}
                      style={{
                        width: '26px', height: '26px',
                        borderRadius: '8px',
                        border: '1px solid var(--kasa-border)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'var(--kasa-surface)',
                        color: 'var(--kasa-text-2)',
                        cursor: 'pointer',
                      }}
                    >
                      <Plus size={12} />
                    </button>
                    <button
                      onClick={() => {
                        removeFromCart(item.product_id);
                        toast.info(`Removed ${item.name} from cart`);
                      }}
                      aria-label={`Remove ${item.name}`}
                      style={{
                        marginLeft: 'auto',
                        display: 'flex', alignItems: 'center', gap: '4px',
                        fontSize: '12px',
                        color: 'var(--kasa-error)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '4px',
                      }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div style={{
            padding: '16px 20px',
            borderTop: '1px solid var(--kasa-border)',
            background: 'var(--kasa-surface)',
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '18px',
              fontWeight: 700,
              marginBottom: '14px',
              color: 'var(--kasa-text)',
            }}>
              <span>{t('cart.total', language)}</span>
              <span>Rs. {total.toLocaleString()}</span>
            </div>
            <button className="cart-summary-checkout-btn" onClick={onCheckout}>
              ✨ {t('cart.checkout', language)}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
