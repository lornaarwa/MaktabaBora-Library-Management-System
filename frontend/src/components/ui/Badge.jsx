import React from 'react';

const tones = {
  available: 'bg-olive/40 text-bark-900 border-olive-dark/40',
  loaned: 'bg-cream/60 text-bark-700 border-tan-dark/30',
  lost: 'bg-bark-700 text-cream-light border-bark-900',
  maintenance: 'bg-sage/40 text-bark-900 border-sage-dark/40',
  exclusive: 'bg-bark-700 text-olive border-bark-900',
  digital: 'bg-sage/35 text-bark-900 border-sage-dark/35',
  neutral: 'bg-bark-50 text-bark-700 border-bark-100',
  overdue: 'bg-[#a8452f]/12 text-[#8c3620] border-[#a8452f]/30',
  paid: 'bg-olive/30 text-bark-900 border-olive-dark/30',
  primary: 'bg-bark-700 text-cream-light border-bark-900',
  success: 'bg-olive/40 text-bark-900 border-olive-dark/40',
  warning: 'bg-cream/60 text-bark-700 border-tan-dark/30',
  error: 'bg-[#a8452f]/12 text-[#8c3620] border-[#a8452f]/30',
};

export function Badge({ tone = 'neutral', variant, children, className = '', mono = false, ...props }) {
  const selectedTone = variant || tone;
  const toneClass = tones[selectedTone] || tones.neutral;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
        mono ? 'font-mono tracking-normal' : ''
      } ${toneClass} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
