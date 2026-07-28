import React from 'react';
import { Bookmark, CheckCircle2, XCircle, ShieldAlert, ShoppingBag, BookOpen } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { BookCover } from './ui/BookCover';

export default function BookCard({ book, onReserve, onBuyDigital, onReadDigital }) {
    const { user } = useAuth();
    const isAvailable = (book.available_copies > 0 || (book.copies && book.copies.some(c => c.status === 'available'))) && !book.is_blocked;
    const isSubscribed = user?.member?.is_subscribed;

    const stdPrice = book.digital_purchase_price || book.digitalPurchasePrice || 50.0;
    const finalPrice = isSubscribed ? Math.round((stdPrice * 0.8) * 100) / 100 : stdPrice;

    return (
        <div className="group relative flex flex-col justify-between rounded-xl border border-bark-100 bg-paper p-4 shadow-card transition hover:shadow-lift">
            
            {/* Exclusive Subscriber Badge */}
            {book.is_exclusive && (
                <div className="absolute top-3 left-3 z-10">
                    <Badge tone="exclusive">PRO EXCLUSIVE</Badge>
                </div>
            )}

            <div>
                {/* Cover Banner */}
                <div className="relative mb-3 aspect-[3/4] w-full overflow-hidden rounded-lg">
                    <BookCover book={book} className="h-full w-full" />

                    {/* Stock Status Badge */}
                    <div className="absolute top-2 right-2">
                        {book.is_blocked ? (
                            <Badge tone="overdue" className="flex items-center gap-1 shadow-sm">
                                <ShieldAlert size={12} /> RESTRICTED
                            </Badge>
                        ) : isAvailable ? (
                            <Badge tone="available" className="flex items-center gap-1 shadow-sm">
                                <CheckCircle2 size={12} /> COPIES ({book.available_copies || book.copies?.filter(c => c.status === 'available').length || 1})
                            </Badge>
                        ) : (
                            <Badge tone="loaned" className="flex items-center gap-1 shadow-sm">
                                <XCircle size={12} /> ON LOAN
                            </Badge>
                        )}
                    </div>
                </div>

                {/* Info */}
                <div className="space-y-1">
                    <div className="flex items-center justify-between font-mono text-[10px] uppercase text-bark-500">
                        <span className="text-bark-700 font-semibold">{book.genre}</span>
                        <span>ISBN: {book.isbn}</span>
                    </div>

                    <h3 className="text-sm font-bold leading-snug text-bark-900 line-clamp-1">
                        {book.title}
                    </h3>
                    <p className="text-xs text-bark-500">By {book.author}</p>
                    
                    {/* Digital Purchase Pricing */}
                    <div className="mt-2.5 flex items-center justify-between rounded-lg border border-bark-100 bg-cream-light/40 p-2 text-xs">
                        <div>
                            <span className="block font-mono text-[9px] uppercase tracking-wider text-bark-500">Digital E-Book</span>
                            <div className="flex items-baseline gap-1">
                                <span className="font-mono text-xs font-bold text-bark-900">KES {finalPrice.toFixed(2)}</span>
                                {isSubscribed && (
                                    <span className="font-mono text-[10px] text-bark-500 line-through">KES {stdPrice.toFixed(2)}</span>
                                )}
                            </div>
                        </div>
                        {isSubscribed ? (
                            <Badge tone="primary" className="text-[9px]">20% PRO OFF</Badge>
                        ) : (
                            <span className="font-mono text-[9px] text-bark-500">20% off with Pro</span>
                        )}
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="mt-3 flex flex-col gap-1.5 border-t border-bark-100 pt-2.5">
                <div className="flex items-center gap-1.5">
                    <Button
                        variant="primary"
                        onClick={() => onBuyDigital(book)}
                        className="flex-1 py-1.5 text-xs"
                    >
                        <ShoppingBag size={14} />
                        <span>Buy Digital</span>
                    </Button>

                    <Button
                        variant="secondary"
                        onClick={() => onReadDigital(book)}
                        title="Read E-Book Stream"
                        className="py-1.5 text-xs"
                    >
                        <BookOpen size={14} />
                        <span>Read</span>
                    </Button>
                </div>

                <Button
                    variant="ghost"
                    onClick={() => onReserve(book)}
                    disabled={book.is_blocked}
                    className="w-full py-1.5 text-xs border border-bark-100"
                >
                    <Bookmark size={14} className="text-bark-500" />
                    <span>{isAvailable ? 'Reserve Physical' : 'Join Hold Queue'}</span>
                </Button>
            </div>
        </div>
    );
}
