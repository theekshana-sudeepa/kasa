'use client';

import { useState } from 'react';
import { User, Phone, MapPin, Mail, Send, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [step, setStep] = useState<1 | 2>(1);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!name.trim()) newErrors.name = 'Name is required';
    
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

  const canProceedToStep2 = name.trim() && phone.trim() && address.trim().length >= 5;

  return (
    <div className="checkout-form-card">
      {/* Step indicator */}
      <div className="checkout-steps">
        <div className={`checkout-step ${step >= 1 ? 'active' : ''}`}>
          <div className="checkout-step-dot">1</div>
          <span>Recipient</span>
        </div>
        <div className="checkout-step-line" />
        <div className={`checkout-step ${step >= 2 ? 'active' : ''}`}>
          <div className="checkout-step-dot">2</div>
          <span>Sender</span>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <AnimatePresence mode="wait">
        {step === 1 ? (
          <motion.div
            key="step1"
            className="checkout-section"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
          >
            <div className="checkout-section-title">
              <User size={14} /> Recipient Details
            </div>
            
            <div className="checkout-field">
              <div className="checkout-input-wrapper">
                <User size={14} className="checkout-input-icon" />
                <input
                  type="text"
                  placeholder="Recipient Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`checkout-input ${errors.name ? 'error' : ''}`}
                  disabled={isSubmitting}
                />
              </div>
              {errors.name && <div className="checkout-error"><AlertCircle size={12} /> {errors.name}</div>}
            </div>

            <div className="checkout-field">
              <div className="checkout-input-wrapper">
                <Phone size={14} className="checkout-input-icon" />
                <input
                  type="tel"
                  placeholder="Phone (e.g. 0771234567)"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={`checkout-input ${errors.phone ? 'error' : ''}`}
                  disabled={isSubmitting}
                />
              </div>
              {errors.phone && <div className="checkout-error"><AlertCircle size={12} /> {errors.phone}</div>}
            </div>

            <div className="checkout-field">
              <div className="checkout-input-wrapper" style={{ alignItems: 'flex-start', paddingTop: '4px' }}>
                <MapPin size={14} className="checkout-input-icon" />
                <textarea
                  placeholder="Complete Delivery Address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className={`checkout-input ${errors.address ? 'error' : ''}`}
                  disabled={isSubmitting}
                  rows={2}
                  style={{ resize: 'none' }}
                />
              </div>
              {errors.address && <div className="checkout-error"><AlertCircle size={12} /> {errors.address}</div>}
            </div>

            <button
              type="button"
              className="checkout-next-btn"
              onClick={() => {
                if (canProceedToStep2) setStep(2);
                else {
                  const newErrors: Record<string, string> = {};
                  if (!name.trim()) newErrors.name = 'Name is required';
                  if (!phone.trim()) newErrors.phone = 'Phone is required';
                  if (!address.trim() || address.trim().length < 5) newErrors.address = 'Enter a complete address';
                  setErrors(newErrors);
                }
              }}
              disabled={!canProceedToStep2}
            >
              Continue to Sender Details
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="step2"
            className="checkout-section"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
          >
            <div className="checkout-section-title">
              <Mail size={14} /> Sender Details (You)
            </div>

            <div className="checkout-field">
              <div className="checkout-input-wrapper">
                <User size={14} className="checkout-input-icon" />
                <input
                  type="text"
                  placeholder="Your Name"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  className={`checkout-input ${errors.senderName ? 'error' : ''}`}
                  disabled={isSubmitting}
                />
              </div>
              {errors.senderName && <div className="checkout-error"><AlertCircle size={12} /> {errors.senderName}</div>}
            </div>

            <div className="checkout-field">
              <div className="checkout-input-wrapper">
                <Mail size={14} className="checkout-input-icon" />
                <input
                  type="email"
                  placeholder="Your Email"
                  value={senderEmail}
                  onChange={(e) => setSenderEmail(e.target.value)}
                  className={`checkout-input ${errors.senderEmail ? 'error' : ''}`}
                  disabled={isSubmitting}
                />
              </div>
              {errors.senderEmail && <div className="checkout-error"><AlertCircle size={12} /> {errors.senderEmail}</div>}
            </div>

            <div className="checkout-btn-row">
              <button
                type="button"
                className="checkout-back-btn"
                onClick={() => setStep(1)}
              >
                Back
              </button>
              <button
                type="submit"
                className="checkout-submit-btn"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>Confirming<span className="checkout-spinner" /></>
                ) : (
                  <><Send size={14} /> Confirm Details</>
                )}
              </button>
            </div>
          </motion.div>
        )}
        </AnimatePresence>
      </form>
    </div>
  );
}
