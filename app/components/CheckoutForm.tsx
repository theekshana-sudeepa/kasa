'use client';

import { useState } from 'react';

interface CheckoutFormProps {
  onSubmit: (details: { name: string; phone: string; address: string; senderName: string; senderEmail: string }) => void;
}

export default function CheckoutForm({ onSubmit }: CheckoutFormProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [senderName, setSenderName] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!name.trim()) newErrors.name = 'Name is required';
    
    // Sri Lanka phone validation: 07XXXXXXXX or 01XXXXXXXX (10 digits starting with 0)
    const phoneClean = phone.replace(/[\s-]/g, '');
    if (!phoneClean) {
      newErrors.phone = 'Phone is required';
    } else if (!/^0\d{9}$/.test(phoneClean)) {
      newErrors.phone = 'Enter a valid 10-digit number (e.g. 0771234567)';
    }

    if (!address.trim() || address.trim().length < 5) {
      newErrors.address = 'Please enter a complete address';
    }

    if (!senderName.trim()) newErrors.senderName = 'Sender name is required';
    
    if (!senderEmail.trim()) {
      newErrors.senderEmail = 'Email is required';
    } else if (!/^\S+@\S+\.\S+$/.test(senderEmail)) {
      newErrors.senderEmail = 'Enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      setIsSubmitting(true);
      onSubmit({ 
        name: name.trim(), 
        phone: phone.replace(/[\s-]/g, ''), 
        address: address.trim(),
        senderName: senderName.trim(),
        senderEmail: senderEmail.trim()
      });
    }
  };

  return (
    <div className="checkout-form-card" style={{
      background: 'var(--kasa-surface)',
      border: '1px solid var(--kasa-border)',
      boxShadow: 'var(--kasa-shadow-sm)',
      borderRadius: '16px',
      padding: '20px',
      marginTop: '10px',
      maxWidth: '400px'
    }}>
      <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600' }}>Delivery Details</h3>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        
        {/* Recipient Details */}
        <div style={{ fontSize: '12px', color: 'var(--kasa-text-3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Recipient</div>
        
        <div>
          <input
            type="text"
            placeholder="Recipient Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isSubmitting}
            style={inputStyle(errors.name)}
          />
          {errors.name && <div style={errorStyle}>{errors.name}</div>}
        </div>

        <div>
          <input
            type="tel"
            placeholder="Recipient Phone (e.g. 0771234567)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={isSubmitting}
            style={inputStyle(errors.phone)}
          />
          {errors.phone && <div style={errorStyle}>{errors.phone}</div>}
        </div>

        <div>
          <textarea
            placeholder="Complete Delivery Address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            disabled={isSubmitting}
            rows={2}
            style={{ ...inputStyle(errors.address), resize: 'none' }}
          />
          {errors.address && <div style={errorStyle}>{errors.address}</div>}
        </div>

        {/* Sender Details */}
        <div style={{ fontSize: '12px', color: 'var(--kasa-text-3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '8px' }}>Sender (You)</div>
        
        <div>
          <input
            type="text"
            placeholder="Your Name"
            value={senderName}
            onChange={(e) => setSenderName(e.target.value)}
            disabled={isSubmitting}
            style={inputStyle(errors.senderName)}
          />
          {errors.senderName && <div style={errorStyle}>{errors.senderName}</div>}
        </div>

        <div>
          <input
            type="email"
            placeholder="Your Email"
            value={senderEmail}
            onChange={(e) => setSenderEmail(e.target.value)}
            disabled={isSubmitting}
            style={inputStyle(errors.senderEmail)}
          />
          {errors.senderEmail && <div style={errorStyle}>{errors.senderEmail}</div>}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            background: 'var(--kasa-primary-500)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '12px',
            fontWeight: '600',
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            opacity: isSubmitting ? 0.7 : 1,
            marginTop: '8px',
            transition: 'opacity 0.2s',
            boxShadow: 'var(--kasa-shadow-sm)'
          }}
        >
          {isSubmitting ? 'Confirming...' : 'Confirm Details'}
        </button>
      </form>
    </div>
  );
}

const inputStyle = (hasError?: string) => ({
  width: '100%',
  padding: '10px 12px',
  borderRadius: '8px',
  border: hasError ? '1px solid var(--kasa-error)' : '1px solid var(--kasa-border)',
  background: 'var(--kasa-surface-2)',
  color: 'var(--kasa-text)',
  fontSize: '14px',
  outline: 'none',
  transition: 'border-color 0.2s',
  boxSizing: 'border-box' as const
});

const errorStyle = {
  color: '#ef4444',
  fontSize: '12px',
  marginTop: '4px'
};
