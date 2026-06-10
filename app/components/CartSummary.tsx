'use client';

import { useChatStore } from '../lib/store/chat-store';

export default function CartSummary() {
  const cart = useChatStore((state) => state.cart);

  if (!cart || cart.length === 0) {
    return (
      <div style={{
        background: 'var(--kasa-surface)',
        border: '1px solid var(--kasa-border)',
        borderRadius: '12px',
        padding: '16px',
        marginTop: '8px',
        color: 'var(--kasa-text-2)',
        fontSize: '14px',
        textAlign: 'center'
      }}>
        Your cart is empty. 🛒
      </div>
    );
  }

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <div style={{
      background: 'var(--kasa-surface)',
      border: '1px solid var(--kasa-border)',
      borderRadius: '16px',
      padding: '16px',
      marginTop: '8px',
      boxShadow: 'var(--kasa-shadow-sm)'
    }}>
      <div style={{ fontWeight: '600', marginBottom: '12px', color: 'var(--kasa-text)' }}>
        🛒 Cart Summary
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
        {cart.map((item, idx) => (
          <div key={`${item.product_id}-${idx}`} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img 
              src={item.image_url} 
              alt={item.name} 
              style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover' }} 
            />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--kasa-text)' }}>
                {item.name}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--kasa-text-2)' }}>
                Qty: {item.quantity} × Rs. {item.price.toLocaleString()}
              </div>
            </div>
            <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--kasa-text)' }}>
              Rs. {(item.price * item.quantity).toLocaleString()}
            </div>
          </div>
        ))}
      </div>

      <div style={{ 
        borderTop: '1px solid var(--kasa-border)', 
        paddingTop: '12px', 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ fontWeight: '500', color: 'var(--kasa-text-2)' }}>Total</div>
        <div style={{ fontSize: '16px', fontWeight: '800', color: 'var(--kasa-primary-500)' }}>
          Rs. {total.toLocaleString()}
        </div>
      </div>
    </div>
  );
}
