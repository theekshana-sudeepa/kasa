'use client';

interface SkeletonProps {
  width?: string;
  height?: string;
  borderRadius?: string;
  className?: string;
}

function SkeletonBase({ width = '100%', height = '16px', borderRadius = '8px', className = '' }: SkeletonProps) {
  return (
    <div
      className={`kasa-skeleton ${className}`}
      style={{ width, height, borderRadius }}
    />
  );
}

export function SkeletonText({ lines = 3, lastLineWidth = '60%' }: { lines?: number; lastLineWidth?: string }) {
  return (
    <div className="kasa-skeleton-text">
      {Array.from({ length: lines }, (_, i) => (
        <SkeletonBase
          key={i}
          height="14px"
          width={i === lines - 1 ? lastLineWidth : '100%'}
          className={i > 0 ? 'kasa-skeleton-mt' : ''}
        />
      ))}
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="kasa-skeleton-card">
      <SkeletonBase height="160px" borderRadius="12px" />
      <div style={{ padding: '12px' }}>
        <SkeletonBase height="16px" width="80%" />
        <SkeletonBase height="20px" width="40%" className="kasa-skeleton-mt" />
        <SkeletonBase height="36px" borderRadius="8px" className="kasa-skeleton-mt-lg" />
      </div>
    </div>
  );
}

export function SkeletonChat() {
  return (
    <div className="kasa-skeleton-chat">
      <SkeletonBase width="32px" height="32px" borderRadius="50%" />
      <div style={{ flex: 1 }}>
        <SkeletonBase height="14px" width="45%" />
        <SkeletonBase height="60px" borderRadius="12px" className="kasa-skeleton-mt" />
      </div>
    </div>
  );
}

export function SkeletonAvatar({ size = 40 }: { size?: number }) {
  return <SkeletonBase width={`${size}px`} height={`${size}px`} borderRadius="50%" />;
}

export function SkeletonProductGrid({ count = 3 }: { count?: number }) {
  return (
    <div className="kasa-skeleton-product-grid">
      {Array.from({ length: count }, (_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
