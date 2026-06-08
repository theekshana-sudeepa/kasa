'use client';

interface WelcomeScreenProps {
  onChipClick: (text: string) => void;
}

const chips = [
  { emoji: '🎁', label: 'Gift Ideas' },
  { emoji: '🎂', label: 'Cakes' },
  { emoji: '💐', label: 'Flowers' },
  { emoji: '🛒', label: 'Groceries' },
  { emoji: '📱', label: 'Electronics' },
  { emoji: '🎉', label: 'Festival Picks' },
];

export default function WelcomeScreen({ onChipClick }: WelcomeScreenProps) {
  return (
    <div className="welcome-screen">
      <div className="welcome-logo">🪞</div>
      <h1 className="welcome-title">KASA</h1>
      <p className="welcome-tagline">
        Your personal shopping mind for Sri Lanka <span className="welcome-flag">🇱🇰</span>
      </p>
      <p className="welcome-prompt">What are you looking for today?</p>
      <div className="welcome-chips">
        {chips.map((chip) => (
          <button
            key={chip.label}
            className="welcome-chip"
            onClick={() => onChipClick(`Show me ${chip.label.toLowerCase()}`)}
          >
            {chip.emoji} {chip.label}
          </button>
        ))}
      </div>
    </div>
  );
}
