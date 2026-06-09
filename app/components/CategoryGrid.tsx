'use client';

import type { Category } from '../lib/mcp/types';

interface CategoryGridProps {
  categories: Category[];
  onSelect: (categoryName: string) => void;
}

const EMOJI_MAP: Record<string, string> = {
  cakes: '🎂', flowers: '💐', chocolates: '🍫', clothing: '👗',
  electronics: '📱', grocery: '🛒', jewellery: '💎', perfumes: '🧴',
  toys: '🧸', books: '📚', liquor: '🍷', fruits: '🍎',
  baby: '👶', pet: '🐾', sports: '⚽', cosmetics: '💄',
  birthday: '🎉', wedding: '💒', anniversary: '💕', christmas: '🎄',
  valentine: '❤️', graduation: '🎓', corporate: '💼', household: '🏠',
  fashion: '👠', giftset: '🎁', pharmacy: '💊', automobile: '🚗',
  bicycle: '🚲', party: '🎊', food: '🍱', vegetables: '🥕',
  softtoy: '🧸', ornaments: '✨', promotions: '🏷️', bestsellers: '⭐',
  mother: '👩', lover: '💑', diwali: '🪔', halloween: '🎃',
  services: '🔧', combogifts: '📦', ayurvedic: '🌿', curd: '🥛',
  pirikara: '🙏', childrens: '👧', schoolpride: '🏫', newadditions: '🆕',
  fathersday: '👨', childrensday: '👦', womenday: '👩‍💼', sympathies: '🕊️',
  uniquegifts: '🎀', bridetobe: '👰', momtobe: '🤰', youandme: '💏',
  greetingcards: '💌', giftvouchers: '🎟️', samedaydelivery: '🚀',
  personalized_gifts: '✍️', intimate_essentials: '🔒', thaipongle: '🎆',
  teachersday: '👩‍🏫', newyear_january: '🎆',
};

function getEmoji(slug?: string): string {
  if (!slug) return '🛍️';
  return EMOJI_MAP[slug] || EMOJI_MAP[slug.toLowerCase()] || '🛍️';
}

function formatName(name: string): string {
  return name
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

export default function CategoryGrid({ categories, onSelect }: CategoryGridProps) {
  if (!categories || categories.length === 0) return null;

  return (
    <div className="category-grid">
      {categories.map((cat, i) => (
        <button
          key={`${cat.slug}-${i}`}
          className="category-card"
          onClick={() => onSelect(cat.name)}
        >
          <span className="category-card-emoji">{cat.emoji || getEmoji(cat.slug)}</span>
          <span className="category-card-name">{formatName(cat.name)}</span>
        </button>
      ))}
    </div>
  );
}
