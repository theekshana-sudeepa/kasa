'use client';

import React, { Component, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary — Catches rendering crashes and shows a recovery UI
 * instead of a white screen. Wraps the main chat interface.
 */
export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[KASA ErrorBoundary]', error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '50vh',
            padding: '40px 20px',
            textAlign: 'center',
            gap: '16px',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(239, 68, 68, 0.05))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <AlertTriangle size={28} style={{ color: '#ef4444' }} />
          </div>

          <h2
            style={{
              fontSize: '18px',
              fontWeight: 700,
              color: 'var(--kasa-text)',
              margin: 0,
            }}
          >
            Something went wrong
          </h2>

          <p
            style={{
              fontSize: '14px',
              color: 'var(--kasa-text-3)',
              maxWidth: '400px',
              lineHeight: 1.5,
              margin: 0,
            }}
          >
            KASA encountered an unexpected error. Your cart and preferences are safe — just hit refresh to continue shopping.
          </p>

          {process.env.NODE_ENV === 'development' && this.state.error && (
            <pre
              style={{
                fontSize: '11px',
                color: '#ef4444',
                background: 'rgba(239, 68, 68, 0.05)',
                padding: '12px 16px',
                borderRadius: '8px',
                maxWidth: '500px',
                overflow: 'auto',
                textAlign: 'left',
                margin: 0,
              }}
            >
              {this.state.error.message}
            </pre>
          )}

          <button
            onClick={this.handleReset}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 24px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, var(--kasa-primary-500), var(--kasa-primary-400))',
              color: 'white',
              border: 'none',
              fontWeight: 600,
              fontSize: '14px',
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(124, 58, 237, 0.25)',
              transition: 'transform 0.2s ease',
            }}
          >
            <RefreshCw size={16} />
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
