'use client';

import type { TrackingInfo } from '../lib/mcp/types';

interface TrackingCardProps {
  tracking: TrackingInfo;
}

export default function TrackingCard({ tracking }: TrackingCardProps) {
  return (
    <div className="tracking-card">
      <div className="delivery-card-header">
        <span>📦</span>
        <span className="delivery-card-title">Order #{tracking.order_number}</span>
        <span className={`delivery-card-status available`}>{tracking.status}</span>
      </div>
      <div className="tracking-timeline">
        {tracking.timeline.map((step, index) => {
          const isCurrent = step.completed && (index === tracking.timeline.length - 1 || !tracking.timeline[index + 1]?.completed);
          return (
            <div
              key={index}
              className={`tracking-step ${step.completed ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}
            >
              <div className="tracking-dot" />
              <div className="tracking-step-content">
                <div className="tracking-step-title">{step.description || step.status}</div>
                <div className="tracking-step-time">{step.timestamp}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
