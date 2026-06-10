'use client';
import { useEffect, useState } from 'react';
import './dashboard.css';

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1 className="dashboard-title">KASA Telemetry Dashboard</h1>
        <div className="live-badge">Live System Active</div>
      </div>

      <div className="metrics-grid">
        <div className="metric-card primary">
          <div className="metric-label">Avg. Messages to Checkout</div>
          <h2 className="metric-value">4.2</h2>
          <span className="metric-trend">↓ 18% vs v1.0</span>
        </div>
        <div className="metric-card">
          <div className="metric-label">10-Second Decisions Triggered</div>
          <h2 className="metric-value">1,402</h2>
          <span className="metric-trend">↑ High confidence mode</span>
        </div>
        <div className="metric-card">
          <div className="metric-label">Total Ghost Carts Active</div>
          <h2 className="metric-value">845</h2>
          <span className="metric-trend">Background predicting</span>
        </div>
      </div>

      <div className="funnel-container">
        <h3 style={{ marginTop: 0, color: '#fff', fontSize: '18px', marginBottom: '24px' }}>Conversion Funnel Efficiency</h3>
        
        <div className="funnel-step">
          <div className="funnel-label">Session Start</div>
          <div className="funnel-bar-bg">
            <div className="funnel-bar-fill" style={{ width: '100%' }}>100%</div>
          </div>
        </div>
        
        <div className="funnel-step">
          <div className="funnel-label">Intent Classified</div>
          <div className="funnel-bar-bg">
            <div className="funnel-bar-fill" style={{ width: '98%', background: 'linear-gradient(90deg, #6b21a8, #2563eb)' }}>98%</div>
          </div>
        </div>
        
        <div className="funnel-step">
          <div className="funnel-label">Added to Cart</div>
          <div className="funnel-bar-bg">
            <div className="funnel-bar-fill" style={{ width: '64%', background: 'linear-gradient(90deg, #581c87, #1d4ed8)' }}>64%</div>
          </div>
        </div>

        <div className="funnel-step">
          <div className="funnel-label">Checkout Complete</div>
          <div className="funnel-bar-bg">
            <div className="funnel-bar-fill" style={{ width: '42%', background: 'linear-gradient(90deg, #3b0764, #1e3a8a)' }}>42%</div>
          </div>
        </div>
      </div>
    </div>
  );
}
