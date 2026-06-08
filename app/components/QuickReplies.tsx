'use client';

interface QuickRepliesProps {
  replies: string[];
  onSelect: (reply: string) => void;
}

export default function QuickReplies({ replies, onSelect }: QuickRepliesProps) {
  if (!replies || replies.length === 0) return null;

  return (
    <div className="quick-replies">
      {replies.map((reply, index) => (
        <button
          key={index}
          className="quick-reply-btn"
          onClick={() => onSelect(reply)}
          style={{ animationDelay: `${index * 50}ms` }}
        >
          {reply}
        </button>
      ))}
    </div>
  );
}
