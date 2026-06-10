'use client';
import { useState, useEffect } from 'react';
import './GroupGiftLink.css';

interface GroupGiftLinkProps {
  goal: number;
  productName: string;
}

export default function GroupGiftLink({ goal, productName }: GroupGiftLinkProps) {
  const [copied, setCopied] = useState(false);
  const [progress, setProgress] = useState(0);

  // Simulate friends chipping in
  useEffect(() => {
    const target = Math.floor(goal * 0.7); // Simulate 70% funded
    let current = 0;
    const interval = setInterval(() => {
      current += goal * 0.05;
      if (current >= target) {
        current = target;
        clearInterval(interval);
      }
      setProgress(current);
    }, 800);
    return () => clearInterval(interval);
  }, [goal]);

  const handleCopy = () => {
    navigator.clipboard.writeText(`https://kasa.kapruka.com/split/k-${Math.random().toString(36).substring(2, 8)}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const percentage = Math.min(100, Math.round((progress / goal) * 100));

  return (
    <div className="group-gift-container">
      <div className="gg-header">
        <span className="gg-emoji">👥</span>
        <div>
          <h4>Group Gift Coordinator</h4>
          <p>Split the cost for {productName}</p>
        </div>
      </div>

      <div className="gg-progress-block">
        <div className="gg-progress-labels">
          <span>Rs. {Math.round(progress).toLocaleString()} raised</span>
          <span>Goal: Rs. {goal.toLocaleString()}</span>
        </div>
        <div className="gg-progress-bar">
          <div className="gg-progress-fill" style={{ width: `${percentage}%` }}></div>
        </div>
        <p className="gg-status">{percentage}% funded — waiting for 2 more friends.</p>
      </div>

      <div className="gg-link-block">
        <input 
          type="text" 
          readOnly 
          value="https://kasa.kapruka.com/split/k-8f2a9x" 
        />
        <button onClick={handleCopy}>
          {copied ? 'Copied!' : 'Copy Link'}
        </button>
      </div>
    </div>
  );
}
