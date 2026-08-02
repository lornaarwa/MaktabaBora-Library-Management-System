import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Trash2, Plus, Minus, ArrowLeft, CreditCard, Sparkles, BookOpen, Layers } from 'lucide-react';
import { useLibrary } from '../context/LibraryContext';
import { useAuth } from '../context/AuthContext';
import DarajaPayModal from '../components/DarajaPayModal';
import { BookCover } from '../components/ui/BookCover';
import { Button } from '../components/ui/Button';

export default function CartPage() {
    const { cart, updateQuantity, removeFromCart, clearCart, cartTotal, digitalPriceFor } = useLibrary();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [darajaModalOpen, setDarajaModalOpen] = useState(false);
    const isSubscribed = user?.member?.is_subscribed;

    const handleCheckoutSuccess = () => {
        clearCart();
        navigate('/member');
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
            
            {/* Header Banner */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-bark-100 pb-6">
                <div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[10px] font-mono font-bold bg-bark-700 text-cream-light uppercase tracking-wider mb-2">
                        <ShoppingCart className="w-3.5 h-3.5" /> Shopping Cart
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-bark-900 tracking-tight">Your Selection</h1>
                </div>

                <Link to="/catalog">
                    <Button variant="ghost" className="text-xs border border-bark-100">
                        <ArrowLeft className="w-4 h-4 mr-1" /> Continue Shopping
                    </Button>
                </Link>
            </div>

            {cart.length === 0 ? (
                /* Empty Cart View */
                <div className="text-center py-20 bg-cream-light/30 rounded-2xl border border-bark-100 space-y-4 max-w-md mx-auto">
                    <div className="w-16 h-16 rounded-2xl bg-paper border border-bark-100 flex items-center justify-center mx-auto text-bark-400 shadow-sm">
                        <ShoppingCart className="w-8 h-8" />
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-lg font-bold text-bark-900">Your cart is empty</h3>
                        <p className="text-xs text-bark-500">Explore our digital catalog and add books to your cart.</p>
                    </div>
                    <div className="pt-2">
                        <Link to="/catalog">
                            <Button variant="primary">
                                <BookOpen className="w-4 h-4 mr-1.5" /> Browse Catalog
                            </Button>
                        </Link>
                    </div>
                </div>
            ) : (
                /* Cart Items Grid + Summary */
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Cart Items List */}
                    <div className="lg:col-span-2 space-y-4">
                        <div className="flex items-center justify-between text-xs text-bark-500 font-mono uppercase tracking-wider pb-2 border-b border-bark-100">
                            <span>Book Item ({cart.length})</span>
                            <button
                                onClick={clearCart}
                                className="hover:text-[#8c3620] transition flex items-center gap-1"
                            >
                                <Trash2 className="w-3.5 h-3.5" /> Clear Cart
                            </button>
                        </div>

                        {cart.map(({ book, quantity }) => {
                            const unitPrice = digitalPriceFor(book);
                            const itemTotal = unitPrice * quantity;

                            return (
                                <div
                                    key={book.id}
                                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl border border-bark-100 bg-paper shadow-card gap-4"
                                >
                                    {/* Book Info */}
                                    <div className="flex items-center gap-4 min-w-0 flex-1">
                                        <div className="w-16 h-20 rounded-lg overflow-hidden border border-bark-100 bg-cream-light/60 flex-shrink-0 flex items-center justify-center">
                                            <BookCover book={book} className="w-full h-full" />
                                        </div>

                                        <div className="space-y-1 min-w-0 flex-1">
                                            <h4 className="font-bold text-sm text-bark-900 truncate">{book.title}</h4>
                                            <p className="text-xs text-bark-500 truncate">By {book.author}</p>
                                            <div className="flex items-center gap-2 pt-1">
                                                <span className="font-mono text-xs font-bold text-bark-900">
                                                    KES {unitPrice.toFixed(2)}
                                                </span>
                                                {isSubscribed && (
                                                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-tan-dark/20 text-bark-900 font-semibold">
                                                        20% Off Pro
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Quantity Controls & Total */}
                                    <div className="flex items-center justify-between w-full sm:w-auto sm:justify-end gap-6 pt-2 sm:pt-0 border-t sm:border-t-0 border-bark-100">
                                        {/* Quantity Buttons */}
                                        <div className="flex items-center gap-2 border border-bark-100 rounded-lg bg-cream-light/40 p-1">
                                            <button
                                                onClick={() => updateQuantity(book.id, quantity - 1)}
                                                className="p-1 rounded text-bark-700 hover:bg-paper transition"
                                            >
                                                <Minus className="w-3.5 h-3.5" />
                                            </button>
                                            <span className="font-mono text-xs font-bold text-bark-900 w-6 text-center">
                                                {quantity}
                                            </span>
                                            <button
                                                onClick={() => updateQuantity(book.id, quantity + 1)}
                                                className="p-1 rounded text-bark-700 hover:bg-paper transition"
                                            >
                                                <Plus className="w-3.5 h-3.5" />
                                            </button>
                                        </div>

                                        {/* Subtotal for Item */}
                                        <span className="font-mono text-sm font-bold text-bark-900 w-24 text-right">
                                            KES {itemTotal.toFixed(2)}
                                        </span>

                                        {/* Remove Button */}
                                        <button
                                            onClick={() => removeFromCart(book.id)}
                                            className="p-2 text-bark-400 hover:text-[#8c3620] transition"
                                            title="Remove item"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Order Summary Box */}
                    <div className="space-y-4">
                        <div className="rounded-2xl border border-bark-100 bg-cream-light/60 p-6 shadow-card space-y-4 sticky top-20">
                            <h3 className="text-base font-bold text-bark-900 pb-3 border-b border-bark-100 flex items-center gap-2">
                                <CreditCard className="w-4 h-4 text-bark-700" /> Order Summary
                            </h3>

                            <div className="space-y-2.5 text-xs text-bark-700">
                                <div className="flex justify-between">
                                    <span>Total Items</span>
                                    <span className="font-mono font-bold text-bark-900">{cart.reduce((s, i) => s + i.quantity, 0)}</span>
                                </div>

                                {isSubscribed && (
                                    <div className="flex justify-between text-tan-dark font-semibold pt-1 border-t border-bark-100">
                                        <span className="flex items-center gap-1">
                                            <Sparkles className="w-3.5 h-3.5" /> Pro Perks Discount
                                        </span>
                                        <span>-20% Applied</span>
                                    </div>
                                )}

                                <div className="flex justify-between items-baseline pt-3 border-t border-bark-100 text-sm">
                                    <span className="font-bold text-bark-900">Grand Total</span>
                                    <span className="font-mono text-xl font-extrabold text-bark-900">
                                        KES {cartTotal.toFixed(2)}
                                    </span>
                                </div>
                            </div>

                            <Button
                                variant="primary"
                                onClick={() => setDarajaModalOpen(true)}
                                className="w-full justify-center py-3 text-xs shadow-md"
                            >
                                <CreditCard className="w-4 h-4 mr-1.5" /> Checkout with M-Pesa STK Push
                            </Button>

                            <p className="text-[11px] text-bark-500 text-center">
                                Single M-Pesa STK Push payment will be initiated for all cart items.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Daraja M-Pesa Checkout Modal for Cart */}
            <DarajaPayModal
                isOpen={darajaModalOpen}
                onClose={() => setDarajaModalOpen(false)}
                type="cart"
                item={{ items: cart, amount: cartTotal }}
                onSuccess={handleCheckoutSuccess}
            />
        </div>
    );
}
