import React from 'react';

export const coverTheme = (id) => {
  const themes = [
    { bg: '#64493a', fg: '#efe2d3', rule: '#c9a57c' },
    { bg: '#c9a57c', fg: '#3a2b22', rule: '#64493a' },
    { bg: '#a9b79e', fg: '#2f3a29', rule: '#64493a' },
    { bg: '#c7cc80', fg: '#3f4420', rule: '#64493a' },
    { bg: '#dec8b0', fg: '#64493a', rule: '#ad8659' },
    { bg: '#8a6853', fg: '#efe2d3', rule: '#c7cc80' },
  ];
  const numId = typeof id === 'number' ? id : (id ? String(id).charCodeAt(0) : 0);
  return themes[numId % themes.length];
};

export function BookCover({ book, className = '' }) {
  if (!book) return null;
  const theme = coverTheme(book.id || 1);

  if (book.cover_image_path) {
    return (
      <div className={`relative overflow-hidden rounded-md ${className}`}>
        <img src={book.cover_image_path} alt={book.title} className="w-full h-full object-cover rounded-md" />
      </div>
    );
  }

  return (
    <div
      className={`relative flex flex-col justify-between overflow-hidden rounded-md p-3 select-none ${className}`}
      style={{ backgroundColor: theme.bg, color: theme.fg }}
      aria-hidden="true"
    >
      <span className="absolute inset-y-0 left-0 w-[6px]" style={{ backgroundColor: theme.rule, opacity: 0.85 }} />
      <span className="absolute inset-y-0 left-[6px] w-px bg-black/10" />
      <div className="pl-2">
        <p className="text-[10px] font-mono uppercase tracking-[0.18em] opacity-70">{book.genre || 'General'}</p>
        <p className="mt-2 text-[13px] font-bold leading-snug line-clamp-4">{book.title}</p>
      </div>
      <div className="pl-2">
        <span className="mb-1.5 block h-px w-8" style={{ backgroundColor: theme.rule }} />
        <p className="text-[10px] font-medium leading-tight opacity-80 line-clamp-2">{book.author}</p>
      </div>
    </div>
  );
}
