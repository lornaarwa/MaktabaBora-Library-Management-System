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
            const res = await api.checkoutSubscription({
                plan_type: 'pro_perks_monthly',
                phone_number: phoneNumber,
                amount: 500.00,
            });

            setSuccessMsg('M-Pesa STK Push initiated! Complete payment on your phone to activate your 20% Pro Perk Pass.');

            // Update user state
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl">
                
                {/* Header */}
                <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-transparent">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-purple-600 text-white shadow-lg">
                            <Sparkles className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white leading-tight">Pro Member Perk Pass</h2>
                            <p className="text-xs text-amber-300 font-medium">KES 500.00 / Monthly Pass</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">
                    {/* Perks List */}
                    <div className="space-y-3 bg-slate-950/60 border border-slate-800 rounded-2xl p-4 text-xs">
                        <h4 className="font-bold text-slate-200 uppercase tracking-wide text-[10px]">Pass Benefits</h4>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-slate-300">
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                <span><strong>20% Off</strong> all digital book purchases automatically</span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-300">
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                <span>Access to <strong>Subscriber-Exclusive</strong> catalog titles</span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-300">
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                <span>Priority hold queue placement for physical books</span>
                            </div>
                        </div>
                    </div>

                    {/* M-Pesa Checkout Form */}
                    <form onSubmit={handleCheckout} className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1">
                                <Phone className="w-3.5 h-3.5 text-indigo-400" /> M-Pesa Phone Number
                            </label>
                            <input
                                type="text"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                placeholder="254712345678"
                                required
                                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                            />
                        </div>

                        {errorMsg && (
                            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
                                {errorMsg}
                            </div>
                        )}

                        {successMsg && (
                            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
                                <ShieldCheck className="w-4 h-4 flex-shrink-0" />
                                <span>{successMsg}</span>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-purple-600 hover:from-amber-400 hover:to-purple-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.01]"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" /> Processing M-Pesa STK Push...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-4 h-4" /> Pay KES 500.00 via M-Pesa
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
