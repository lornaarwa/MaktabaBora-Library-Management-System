import React, { useState } from 'react';
import { X, Sparkles, CheckCircle2, Phone, ShieldCheck, Loader2 } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function SubscriptionPassModal({ isOpen, onClose }) {
    const { user, setUser } = useAuth();
    const [phoneNumber, setPhoneNumber] = useState('254712345678');
    const [loading, setLoading] = useState(false);
    const [successMsg, setSuccessMsg] = useState(null);
    const [errorMsg, setErrorMsg] = useState(null);

    if (!isOpen) return null;

    const handleCheckout = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg(null);
        setSuccessMsg(null);

        try {
            await api.checkoutSubscription({
                plan_type: 'pro_perks_monthly',
                phone_number: phoneNumber,
                amount: 500.00,
            });

            setSuccessMsg('M-Pesa STK Push dispatched. Complete PIN prompt on phone to activate Pro Member Pass.');

            if (user) {
                setUser({
                    ...user,
                    member: {
                        ...user.member,
                        is_subscribed: true,
                    }
                });
            }

            setTimeout(() => {
                onClose();
                setSuccessMsg(null);
            }, 3000);
        } catch (err) {
            setErrorMsg(err.message || 'Checkout failed.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-md animate-in fade-in duration-200">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
                
                {/* Header */}
                <div className="p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/40">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-300">
                            <Sparkles className="w-4 h-4" />
                        </div>
                        <div>
                            <h2 className="text-sm font-bold text-zinc-100 leading-tight">Pro Member Perk Pass</h2>
                            <p className="text-xs text-zinc-400 font-mono font-bold mt-0.5">KES 500.00 / Monthly Pass</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-5 space-y-4">
                    {/* Benefits List */}
                    <div className="space-y-2 bg-zinc-950 border border-zinc-800 rounded-xl p-3.5 text-xs font-mono">
                        <h4 className="font-bold text-zinc-300 uppercase tracking-wide text-[10px]">Member Perks</h4>
                        <div className="space-y-1.5 text-zinc-400">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-3.5 h-3.5 text-zinc-200" />
                                <span>20% Off all digital e-book purchases</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-3.5 h-3.5 text-zinc-200" />
                                <span>Access to Pro Exclusive catalog titles</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-3.5 h-3.5 text-zinc-200" />
                                <span>Priority hold queue placement</span>
                            </div>
                        </div>
                    </div>

                    {/* M-Pesa Form */}
                    <form onSubmit={handleCheckout} className="space-y-3">
                        <div>
                            <label className="block text-xs font-semibold text-zinc-300 mb-1 flex items-center gap-1 font-mono">
                                <Phone className="w-3.5 h-3.5 text-zinc-400" /> M-Pesa Phone Number
                            </label>
                            <input
                                type="text"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                placeholder="254712345678"
                                required
                                className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 focus:outline-none focus:border-zinc-700 font-mono"
                            />
                        </div>

                        {errorMsg && (
                            <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-300 text-xs">
                                {errorMsg}
                            </div>
                        )}

                        {successMsg && (
                            <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-300 text-xs flex items-center gap-2">
                                <ShieldCheck className="w-4 h-4 flex-shrink-0 text-zinc-400" />
                                <span>{successMsg}</span>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-2.5 px-4 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin text-zinc-950" /> Processing M-Pesa STK Push...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-4 h-4" /> Activate Pass (KES 500.00 via M-Pesa)
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
