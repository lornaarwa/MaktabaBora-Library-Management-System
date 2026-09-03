import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, BookOpen, ShieldAlert } from 'lucide-react';
import { BookCover } from './ui/BookCover';

/** Compact book card with cover, title, author and availability — used by
 *  "Recommended for you", "More like this" and the AI librarian chat results. */
export default function BookMiniCard({ book }) {
    const isBlocked = Boolean(book.is_blocked);
    const isAvailable = !isBlocked && Number(book.available_copies || 0) > 0;

    return (
        <Link
            to={`/books/${book.id}`}
            state={{ book }}
            className="group flex items-center gap-2.5 rounded-xl border border-bark-100 bg-paper p-2 shadow-sm transition hover:border-bark-300 hover:shadow-card focus:outline-none focus-visible:ring-2 focus-visible:ring-tan-dark/60"
        >
            <span className="h-14 w-10 shrink-0 overflow-hidden rounded-md border border-bark-100">
                <BookCover book={book} className="h-full w-full" />
            </span>
            <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-bold text-bark-900 group-hover:text-bark-600">
                    {book.title}
                </span>
                <span className="block truncate text-[10px] text-bark-500">By {book.author}</span>
                {book.genre && (
                    <span className="mt-0.5 inline-block rounded border border-bark-100 bg-cream-light/50 px-1.5 py-px font-mono text-[8px] uppercase tracking-wider text-bark-500">
                        {book.genre}
                    </span>
                )}
            </span>
            <span
                className={`flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ${
                    isBlocked
                        ? 'border-[#a8452f]/30 bg-[#a8452f]/10 text-[#8c3620]'
                        : isAvailable
                            ? 'border-olive-dark/30 bg-olive/30 text-bark-900'
                            : 'border-tan-dark/30 bg-cream/60 text-bark-700'
                }`}
            >
                {isBlocked ? <ShieldAlert size={9} /> : isAvailable ? <CheckCircle2 size={9} /> : <BookOpen size={9} />}
                {isBlocked ? 'Restricted' : isAvailable ? `${book.available_copies} avail.` : 'On loan'}
            </span>
        </Link>
    );
}