import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Bookmark, CheckCircle2, XCircle, ShieldAlert, ShoppingBag, ShoppingCart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLibrary } from '../context/LibraryContext';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { BookCover } from './ui/BookCover';

export default function BookCard({ book, onReserve, onBuyDigital, index = 0, memberActions = true }) {
    const { user } = useAuth();
    const { addToCart } = useLibrary();
    const isAvailable = (book.available_copies > 0 || (book.copies && book.copies.some(c => c.status === 'available'))) && !book.is_blocked;
    const isSubscribed = user?.member?.is_subscribed;

    const stdPrice = Number(book.digital_purchase_price || book.digitalPurchasePrice || 50.0);
    const finalPrice = isSubscribed ? Math.round((stdPrice * 0.8) * 100) / 100 : stdPrice;

    return (
        <motion.article
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.32, delay: Math.min(index * 0.04, 0.3), ease: 'easeOut' }}
            whileHover={{ y: -4 }}
            className="group relative flex flex-col justify-between rounded-xl border border-bark-100 bg-paper p-4 shadow-card transition-shadow hover:shadow-lift"
        >

            {/* Exclusive Subscriber Badge */}
            {book.is_exclusive && (
                <div className="absolute top-3 left-3 z-10">
                    <Badge tone="exclusive">PRO EXCLUSIVE</Badge>
                </div>
            )}

            <div>
                {/* Cover Banner (links to book details) */}
                <Link
                    to={`/books/${book.id}`}
                    state={{ book }}
                    aria-label={`View details for ${book.title}`}
                    className="relative mb-3 block aspect-[3/4] w-full overflow-hidden rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-tan-dark/60"
                >
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
                </Link>

                {/* Info */}
                <div className="space-y-1">
                    <div className="flex items-center justify-between font-mono text-[10px] uppercase text-bark-500">
                        <span className="text-bark-700 font-semibold">{book.genre}</span>
                        <span>ISBN: {book.isbn}</span>
                    </div>

                    <Link
                        to={`/books/${book.id}`}
                        state={{ book }}
                        className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-tan-dark/60 rounded"
                    >
                        <h3 className="text-sm font-bold leading-snug text-bark-900 line-clamp-1 transition-colors group-hover:text-bark-600">
                            {book.title}
                        </h3>
                    </Link>
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

            {/* Actions — strictly Add to Cart, Buy E-Book, and Reserve for Physical Collection */}
            <div className="mt-3 flex flex-col gap-1.5 border-t border-bark-100 pt-2.5">
                {memberActions ? (
                    <>
                        <div className="grid grid-cols-2 gap-1.5">
                            <Button
                                variant="secondary"
                                onClick={() => addToCart(book)}
                                className="py-1.5 text-xs justify-center gap-1.5"
                                title="Add item to shopping cart"
                            >
                                <ShoppingCart size={13} />
                                <span>Add to Cart</span>
                            </Button>

                            <Button
                                variant="primary"
                                onClick={() => onBuyDigital(book)}
                                className="py-1.5 text-xs justify-center gap-1.5"
                                title="Buy digital e-book with M-Pesa"
                            >
                                <ShoppingBag size={13} />
                                <span>Buy E-Book</span>
                            </Button>
                        </div>

                        <Button
                            variant="ghost"
                            onClick={() => onReserve(book)}
                            disabled={book.is_blocked}
                            className="w-full py-1.5 text-xs border border-bark-200 justify-center gap-1.5 hover:bg-cream-light/60 font-medium transition-colors"
                            title="Reserve physical copy for library collection desk pickup"
                        >
                            <Bookmark size={13} className={isAvailable ? 'text-olive-dark' : 'text-bark-500'} />
                            <span className="truncate">{isAvailable ? 'Reserve for Physical Collection' : 'Queue for Physical Collection'}</span>
                        </Button>
                    </>
                ) : (
                    <p className="py-1 text-[10px] font-mono uppercase tracking-wider text-bark-400">
                        Reservations, cart &amp; e-books are member actions.
                    </p>
                )}
            </div>
        </motion.article>
    );
}