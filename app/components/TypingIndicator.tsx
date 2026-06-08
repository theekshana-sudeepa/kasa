'use client';

export default function TypingIndicator() {
  return (
    <div className="typing-indicator">
      <div className="message-avatar">🪞</div>
      <div>
        <div className="typing-dots">
          <div className="typing-dot" />
          <div className="typing-dot" />
          <div className="typing-dot" />
        </div>
        <div className="typing-text">KASA is shopping for you...</div>
      </div>
    </div>
  );
}
