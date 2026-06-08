'use client';

import { useChatStore } from '../lib/store/chat-store';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onCheckout: () => void;
}

export default function CartDrawer({ isOpen, onClose, onCheckout }: CartDrawerProps) {
  const { cart, removeFromCart, updateCartQuantity } = useChatStore();
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <>
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.3)',
            zIndex: 200,
            animation: 'fadeIn 0.2s ease-out',
          }}
          onClick={onClose}
        />
      )}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '340px',
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
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--kasa-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--kasa-text)' }}>🛒 Your Cart</h2>
          <button onClick={onClose} style={{ fontSize: '20px', color: 'var(--kasa-text-3)', padding: '4px' }}>✕</button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--kasa-text-3)' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>🛒</div>
              <p>Your cart is empty</p>
              <p style={{ fontSize: '13px' }}>Start shopping to add items!</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.product_id} style={{
                display: 'flex', gap: '12px', padding: '12px 0',
                borderBottom: '1px solid var(--kasa-border)',
                alignItems: 'center',
              }}>
                <img
                  src={item.image_url}
                  alt={item.name}
                  style={{ width: '56px', height: '56px', borderRadius: '8px', objectFit: 'cover', background: 'var(--kasa-surface-2)' }}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, lineHeight: 1.3, marginBottom: '4px' }}>{item.name}</div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--kasa-primary-500)' }}>Rs. {item.price.toLocaleString()}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                    <button
                      onClick={() => item.quantity > 1 ? updateCartQuantity(item.product_id, item.quantity - 1) : removeFromCart(item.product_id)}
                      style={{ width: '24px', height: '24px', borderRadius: '6px', border: '1px solid var(--kasa-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', background: 'var(--kasa-surface)' }}
                    >−</button>
                    <span style={{ fontSize: '14px', fontWeight: 600 }}>{item.quantity}</span>
                    <button
                      onClick={() => updateCartQuantity(item.product_id, item.quantity + 1)}
                      style={{ width: '24px', height: '24px', borderRadius: '6px', border: '1px solid var(--kasa-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', background: 'var(--kasa-surface)' }}
                    >+</button>
                    <button
                      onClick={() => removeFromCart(item.product_id)}
                      style={{ marginLeft: 'auto', fontSize: '12px', color: 'var(--kasa-error)', background: 'none', border: 'none', cursor: 'pointer' }}
                    >Remove</button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {cart.length > 0 && (
          <div style={{ padding: '16px 20px', borderTop: '1px solid var(--kasa-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: 700, marginBottom: '12px' }}>
              <span>Total</span>
              <span>Rs. {total.toLocaleString()}</span>
            </div>
            <button className="cart-summary-checkout-btn" onClick={onCheckout}>
              ✨ Proceed to Checkout
            </button>
          </div>
        )}
      </div>
    </>
  );
}
