export default function Loading() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'var(--kasa-bg)',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px',
        }}
      >
        {/* Animated logo */}
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '18px',
            background: 'linear-gradient(135deg, var(--kasa-primary-500), var(--kasa-primary-400))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'kasaLoadingPulse 1.5s ease-in-out infinite',
          }}
        >
          <span style={{ color: 'white', fontWeight: 900, fontSize: '24px' }}>K</span>
        </div>
        <span
          style={{
            fontSize: '13px',
            color: 'var(--kasa-text-3)',
            fontWeight: 500,
            letterSpacing: '0.5px',
          }}
        >
          Loading KASA…
        </span>
      </div>

      <style>{`
        @keyframes kasaLoadingPulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.08); opacity: 0.8; }
        }
      `}</style>
    </div>
  );
}
