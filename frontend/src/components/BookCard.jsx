import React from 'react';
import { Book, Bookmark, CheckCircle2, XCircle, ShieldAlert, ShoppingBag, BookOpen } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent } from './ui/Card';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';

export default function BookCard({ book, onReserve, onBuyDigital, onReadDigital }) {
    const { user } = useAuth();
    const isAvailable = book.available_copies > 0 && !book.is_blocked;
    const isSubscribed = user?.member?.is_subscribed;

    const stdPrice = book.digital_purchase_price || 50.0;
    const finalPrice = isSubscribed ? Math.round((stdPrice * 0.8) * 100) / 100 : stdPrice;

    return (
        <Card hover className="flex flex-col justify-between h-full relative" style={{ padding: '16px' }}>
            
            {/* Exclusive Subscriber Badge */}
            {book.is_exclusive && (
                <div className="absolute top-3 left-3 z-10">
                    <Badge variant="primary" className="shadow-sm">
                        PRO EXCLUSIVE
                    </Badge>
                </div>
            )}

            <div>
                {/* Cover Banner */}
                <div className="relative aspect-[3/4] w-full rounded-lg bg-zinc-100 overflow-hidden flex flex-col items-center justify-center border mb-3 transition-colors" style={{ borderColor: 'var(--lightest-gray)' }}>
                    {book.cover_image_path ? (
                        <img src={book.cover_image_path} alt={book.title} className="w-full h-full object-cover rounded-md" />
                    ) : (
                        <div className="text-center p-3">
                            <Book size={40} style={{ color: 'var(--medium-gray)', margin: '0 auto 8px auto' }} />
                            <span className="body-small font-semibold block line-clamp-2" style={{ color: 'var(--black)' }}>{book.title}</span>
                            <span className="caption block mt-1">{book.author}</span>
                        </div>
                    )}

                    {/* Stock Status Badge */}
                    <div className="absolute top-2 right-2">
                        {book.is_blocked ? (
                            <Badge variant="error" className="flex items-center gap-1 shadow-sm">
                                <ShieldAlert size={12} /> RESTRICTED
                            </Badge>
                        ) : isAvailable ? (
                            <Badge variant="success" className="flex items-center gap-1 shadow-sm">
                                <CheckCircle2 size={12} /> COPIES ({book.available_copies})
                            </Badge>
                        ) : (
                            <Badge variant="warning" className="flex items-center gap-1 shadow-sm">
                                <XCircle size={12} /> ON LOAN
                            </Badge>
                        )}
                    </div>
                </div>

                {/* Info */}
                <CardContent className="space-y-1 p-0">
                    <div className="flex items-center justify-between caption">
                        <span style={{ color: 'var(--primary)' }}>{book.genre}</span>
                        <span>ISBN: {book.isbn}</span>
                    </div>

                    <h3 className="heading-3 line-clamp-1" style={{ fontSize: '16px', lineHeight: '24px', margin: '4px 0' }}>
                        {book.title}
                    </h3>
                    <p className="body-small">By {book.author}</p>
                    
                    {/* Digital Purchase Pricing */}
                    <div className="mt-3 p-2 rounded-lg flex items-center justify-between" style={{ backgroundColor: 'var(--lightest-gray)', border: '1px solid var(--lighter-gray)' }}>
                        <div>
                            <span className="overline block">Digital E-Book</span>
                            <div className="flex items-baseline gap-1">
                                <span className="body-small font-bold" style={{ color: 'var(--black)' }}>KES {finalPrice.toFixed(2)}</span>
                                {isSubscribed && (
                                    <span className="caption line-through" style={{ textTransform: 'none' }}>KES {stdPrice.toFixed(2)}</span>
                                )}
                            </div>
                        </div>
                        {isSubscribed ? (
                            <Badge variant="primary" style={{ padding: '2px 6px', fontSize: '10px' }}>
                                20% PRO OFF
                            </Badge>
                        ) : (
                            <span className="caption" style={{ textTransform: 'none' }}>20% off with Pro</span>
                        )}
                    </div>
                </CardContent>
            </div>

            {/* Actions */}
            <div className="mt-4 pt-3 flex flex-col gap-2" style={{ borderTop: '1px solid var(--lightest-gray)' }}>
                <div className="flex items-center gap-2">
                    <Button
                        variant="primary"
                        onClick={() => onBuyDigital(book)}
                        className="flex-1"
                        style={{ padding: '8px', fontSize: '14px' }}
                    >
                        <ShoppingBag size={16} />
                        <span>Buy</span>
                    </Button>

                    <Button
                        variant="secondary"
                        onClick={() => onReadDigital(book)}
                        title="Read E-Book Stream"
                        style={{ padding: '8px', fontSize: '14px' }}
                    >
                        <BookOpen size={16} />
                        <span>Read</span>
                    </Button>
                </div>

                <Button
                    variant="ghost"
                    onClick={() => onReserve(book)}
                    disabled={book.is_blocked}
                    className="w-full"
                    style={{ padding: '8px', fontSize: '14px', border: '1px solid var(--lighter-gray)' }}
                >
                    <Bookmark size={16} style={{ color: book.is_blocked ? 'var(--light-gray)' : 'var(--dark-gray)' }} />
                    <span>{isAvailable ? 'Reserve Physical' : 'Join Hold Queue'}</span>
                </Button>
            </div>
        </Card>
    );
}
