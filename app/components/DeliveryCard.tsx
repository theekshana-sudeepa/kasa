'use client';

import type { DeliveryInfo } from '../lib/mcp/types';

interface DeliveryCardProps {
  delivery: DeliveryInfo;
}

export default function DeliveryCard({ delivery }: DeliveryCardProps) {
  return (
    <div className="delivery-card">
      <div className="delivery-card-header">
        <span>🚚</span>
        <span className="delivery-card-title">Delivery Info</span>
        <span className={`delivery-card-status ${delivery.available ? 'available' : 'unavailable'}`}>
          {delivery.available ? '✅ Available' : '❌ Unavailable'}
        </span>
      </div>
      <div className="delivery-card-info">
        <div className="delivery-card-info-item">
          <span className="delivery-card-info-label">📍 City:</span>
          <span className="delivery-card-info-value">{delivery.city}</span>
        </div>
        <div className="delivery-card-info-item">
          <span className="delivery-card-info-label">📅 Date:</span>
          <span className="delivery-card-info-value">{delivery.date}</span>
        </div>
        {delivery.available && (
          <div className="delivery-card-info-item">
            <span className="delivery-card-info-label">💰 Fee:</span>
            <span className="delivery-card-info-value">Rs. {delivery.fee.toLocaleString()}</span>
          </div>
        )}
        {delivery.perishable_warning && (
          <div className="delivery-card-info-item" style={{ gridColumn: '1 / -1', color: 'var(--kasa-warning)' }}>
            ⚠️ Perishable item — same-day delivery recommended
          </div>
        )}
      </div>
    </div>
  );
}
