import React from 'react';

type BadgeType = 'NEW ARRIVAL' | 'SALE' | 'LIMITED STOCKS' | 'BEST-SELLER' | 'OUT OF STOCK' | 'DRAFT' | 'ACTIVE' | 'ARCHIVED';

const badgeColors: Record<BadgeType, string> = {
  'NEW ARRIVAL': 'bg-blue-500 text-white shadow-blue-500/50',
  'SALE': 'bg-red-500 text-white shadow-red-500/50',
  'LIMITED STOCKS': 'bg-orange-500 text-white shadow-orange-500/50',
  'BEST-SELLER': 'bg-purple-500 text-white shadow-purple-500/50',
  'OUT OF STOCK': 'bg-gray-500 text-white shadow-gray-500/50',
  'DRAFT': 'bg-gray-400 text-white shadow-gray-400/50',
  'ACTIVE': 'bg-green-500 text-white shadow-green-500/50',
  'ARCHIVED': 'bg-black text-white shadow-black/50',
};

export function GlossyBadge({ type, label }: { type: BadgeType, label?: string, key?: any }) {
  return (
    <span className={`
      inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px]  uppercase tracking-wider
      ${badgeColors[type] || 'bg-gray-100 text-gray-800'}
      shadow-lg border border-white/20 backdrop-blur-sm
      transition-all duration-300 hover:scale-105 active:scale-95
      ring-1 ring-white/10
    `}>
      <span className="relative z-10">{label || type}</span>
      <span className="absolute inset-0 rounded-full bg-gradient-to-tr from-white/20 to-transparent pointer-events-none" />
    </span>
  );
}
