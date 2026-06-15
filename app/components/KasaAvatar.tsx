'use client';

/**
 * Pure CSS/SVG avatar for KASA — no emoji, zero corruption risk.
 * Renders a gradient circle with stylized "K" letter.
 */
export default function KasaAvatar({ size = 32 }: { size?: number }) {
  return (
    <div
      className="message-avatar"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.45) }}
      aria-label="KASA"
    >
      <span style={{ position: 'relative', zIndex: 1, fontWeight: 800, color: 'white', lineHeight: 1 }}>K</span>
    </div>
  );
}
