import React from 'react';
import { Book, Bookmark, CheckCircle2, XCircle, ShieldAlert, ShoppingBag, BookOpen } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function BookCard({ book, onReserve, onBuyDigital, onReadDigital }) {
    const { user } = useAuth();
    const isAvailable = book.available_copies > 0 && !book.is_blocked;
    const isSubscribed = user?.member?.is_subscribed;

    const stdPrice = book.digital_purchase_price || 50.0;
    const finalPrice = isSubscribed ? Math.round((stdPrice * 0.8) * 100) / 100 : stdPrice;

    return (
        <div className="group bg-zinc-900 rounded-xl border border-zinc-800 hover:border-zinc-700 p-4 flex flex-col justify-between transition-all duration-200 shadow-sm relative">
            
            {/* Exclusive Subscriber Badge */}
            {book.is_exclusive && (
                <div className="absolute top-3 left-3 z-10">
                    <span className="px-2.5 py-0.5 rounded-md text-[9px] font-mono font-bold bg-zinc-100 text-zinc-950 shadow-sm uppercase tracking-wider">
                        PRO EXCLUSIVE
                    </span>
                </div>
            )}

            <div>
                {/* Cover Banner */}
                <div className="relative aspect-[3/4] w-full rounded-lg bg-zinc-950 overflow-hidden flex flex-col items-center justify-center p-3 border border-zinc-800/80 mb-3 group-hover:border-zinc-700 transition-colors">
                    {book.cover_image_path ? (
                        <img src={book.cover_image_path} alt={book.title} className="w-full h-full object-cover rounded-md" />
                    ) : (
                        <div className="text-center p-3">
                            <Book className="w-10 h-10 text-zinc-600 mx-auto mb-2" />
                            <span className="text-xs font-semibold text-zinc-300 block line-clamp-2">{book.title}</span>
                            <span className="text-[10px] text-zinc-500 block mt-1">{book.author}</span>
                        </div>
                    )}

                    {/* Stock Status Badge */}
                    <div className="absolute top-2 right-2">
                        {book.is_blocked ? (
                            <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-zinc-800 text-zinc-400 border border-zinc-700 flex items-center gap-1">
                                <ShieldAlert className="w-3 h-3" /> RESTRICTED
                            </span>
                        ) : isAvailable ? (
                            <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-zinc-100 text-zinc-950 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-zinc-950" /> COPIES ({book.available_copies})
                            </span>
                        ) : (
                            <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-zinc-800 text-zinc-300 border border-zinc-700 flex items-center gap-1">
                                <XCircle className="w-3 h-3" /> ON LOAN
                            </span>
                        )}
                    </div>
                </div>

                {/* Info */}
                <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 uppercase">
                        <span>{book.genre}</span>
                        <span className="text-zinc-500">ISBN: {book.isbn}</span>
                    </div>

                    <h3 className="font-bold text-zinc-100 text-sm line-clamp-1">
                        {book.title}
                    </h3>
                    <p className="text-xs text-zinc-400">By {book.author}</p>
                    
                    {/* Digital Purchase Pricing */}
                    <div className="mt-2.5 p-2 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-between">
                        <div>
                            <span className="text-[9px] text-zinc-500 block font-mono uppercase">Digital E-Book</span>
                            <div className="flex items-baseline gap-1">
                                <span className="text-xs font-bold text-zinc-100">KES {finalPrice.toFixed(2)}</span>
                                {isSubscribed && (
                                    <span className="text-[9px] text-zinc-500 line-through">KES {stdPrice.toFixed(2)}</span>
                                )}
                            </div>
                        </div>
                        {isSubscribed ? (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-zinc-800 text-zinc-200 border border-zinc-700">
                                20% PRO OFF
                            </span>
                        ) : (
                            <span className="text-[9px] text-zinc-500 font-mono">20% off with Pro</span>
                        )}
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="mt-3 pt-2.5 border-t border-zinc-800/80 flex flex-col gap-1.5">
                <div className="flex items-center gap-1.5">
                    <button
                        onClick={() => onBuyDigital(book)}
                        className="flex-1 py-1.5 px-2.5 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 font-bold text-xs flex items-center justify-center gap-1 transition-all shadow-sm"
                    >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>Buy Digital</span>
                    </button>

                    <button
                        onClick={() => onReadDigital(book)}
                        className="py-1.5 px-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 font-semibold text-xs flex items-center justify-center gap-1 transition-all"
                        title="Read E-Book Stream"
                    >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Read</span>
                    </button>
                </div>

                <button
                    onClick={() => onReserve(book)}
                    disabled={book.is_blocked}
                    className={`w-full py-1.5 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all border ${
                        book.is_blocked
                            ? 'bg-zinc-950 text-zinc-600 border-zinc-800 cursor-not-allowed'
                            : isAvailable
                            ? 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-zinc-800'
                            : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border-zinc-700'
                    }`}
                >
                    <Bookmark className="w-3.5 h-3.5 text-zinc-400" />
                    <span>{isAvailable ? 'Reserve Physical' : 'Join Hold Queue'}</span>
                </button>
            </div>
        </div>
    );
}
