import React from 'react';
import { Book, Download, Bookmark, CheckCircle2, XCircle, ShieldAlert, Sparkles, ShoppingBag, BookOpen } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function BookCard({ book, onReserve, onBuyDigital, onReadDigital }) {
    const { user } = useAuth();
    const isAvailable = book.available_copies > 0 && !book.is_blocked;
    const isSubscribed = user?.member?.is_subscribed;

    const stdPrice = book.digital_purchase_price || 50.0;
    const finalPrice = isSubscribed ? round(stdPrice * 0.8) : stdPrice;

    function round(val) {
        return Math.round(val * 100) / 100;
    }

    return (
        <div className="group bg-slate-900/70 rounded-2xl border border-slate-800 hover:border-indigo-500/50 p-5 flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-1 relative">
            
            {/* Exclusive Subscriber Badge */}
            {book.is_exclusive && (
                <div className="absolute -top-3 left-4 z-10">
                    <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-gradient-to-r from-amber-500 to-purple-600 text-white shadow-lg flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> PRO EXCLUSIVE
                    </span>
                </div>
            )}

            <div>
                {/* Cover Banner */}
                <div className="relative aspect-[3/4] w-full rounded-xl bg-gradient-to-br from-slate-800 via-slate-900 to-indigo-950/60 overflow-hidden flex flex-col items-center justify-center p-4 border border-slate-800/80 mb-4 group-hover:scale-[1.02] transition-transform">
                    {book.cover_image_path ? (
                        <img src={book.cover_image_path} alt={book.title} className="w-full h-full object-cover rounded-lg" />
                    ) : (
                        <div className="text-center p-4">
                            <Book className="w-12 h-12 text-indigo-400/80 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                            <span className="text-xs font-semibold text-slate-400 block line-clamp-2">{book.title}</span>
                            <span className="text-[10px] text-slate-500 block mt-1">{book.author}</span>
                        </div>
                    )}

                    {/* Physical Stock Badge */}
                    <div className="absolute top-3 right-3">
                        {book.is_blocked ? (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1 backdrop-blur-md">
                                <ShieldAlert className="w-3 h-3" /> Restricted
                            </span>
                        ) : isAvailable ? (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 backdrop-blur-md">
                                <CheckCircle2 className="w-3 h-3" /> Available ({book.available_copies})
                            </span>
                        ) : (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1 backdrop-blur-md">
                                <XCircle className="w-3 h-3" /> On Loan
                            </span>
                        )}
                    </div>
                </div>

                {/* Info */}
                <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] text-indigo-400 font-semibold tracking-wide uppercase">
                        <span>{book.genre}</span>
                        <span className="text-slate-500">ISBN: {book.isbn}</span>
                    </div>

                    <h3 className="font-bold text-slate-100 text-base group-hover:text-indigo-300 transition-colors line-clamp-1">
                        {book.title}
                    </h3>
                    <p className="text-xs text-slate-400 font-medium">By {book.author}</p>
                    
                    {/* Digital Purchase Pricing */}
                    <div className="mt-3 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                        <div>
                            <span className="text-[10px] text-slate-400 block font-medium">Digital Purchase</span>
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-sm font-bold text-emerald-400">KES {finalPrice.toFixed(2)}</span>
                                {isSubscribed && (
                                    <span className="text-[10px] text-slate-500 line-through">KES {stdPrice.toFixed(2)}</span>
                                )}
                            </div>
                        </div>
                        {isSubscribed ? (
                            <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                20% PRO OFF
                            </span>
                        ) : (
                            <span className="text-[9px] text-slate-500">Perk pass eligible</span>
                        )}
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => onBuyDigital(book)}
                        className="flex-1 py-2 px-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all"
                    >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>Buy Digital</span>
                    </button>

                    <button
                        onClick={() => onReadDigital(book)}
                        className="py-2 px-3 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all"
                        title="Read E-Book Stream"
                    >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Read</span>
                    </button>
                </div>

                <button
                    onClick={() => onReserve(book)}
                    disabled={book.is_blocked}
                    className={`w-full py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                        book.is_blocked
                            ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                            : isAvailable
                            ? 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                            : 'bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30'
                    }`}
                >
                    <Bookmark className="w-3.5 h-3.5" />
                    <span>{isAvailable ? 'Reserve Physical' : 'Join Hold Queue'}</span>
                </button>
            </div>
        </div>
    );
}
