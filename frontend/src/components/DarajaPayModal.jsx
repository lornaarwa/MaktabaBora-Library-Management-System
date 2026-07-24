import React, { useState } from 'react';
import { X, Smartphone, ShieldCheck, AlertCircle, Loader2, Sparkles } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function DarajaPayModal({ isOpen, onClose, type = 'fine', item = null }) {
    const { user } = useAuth();
    const [phoneNumber, setPhoneNumber] = useState('254712345678');
    const [loading, setLoading] = useState(false);
    const [successMsg, setSuccessMsg] = useState(null);
    const [errorMsg, setErrorMsg] = useState(null);

    if (!isOpen) return null;

    const isSubscribed = user?.member?.is_subscribed;
    const isDigital = type === 'digital';
    const isFine = type === 'fine';

    let title = 'M-Pesa Express Checkout';
    let amount = 0;
    let description = '';

    if (isFine && item) {
        title = `Pay Fine #${item.id}`;
        amount = item.balance || item.amount;
        description = `Settling overdue fine for loan copy #${item.loan_id}`;
    } else if (isDigital && item) {
        title = `Buy Digital Book: ${item.title}`;
        const stdPrice = item.digital_purchase_price || 50.0;
        amount = isSubscribed ? Math.round(stdPrice * 0.8 * 100) / 100 : stdPrice;
        description = isSubscribed ? '20% Pro Subscriber Discount Applied!' : 'Standard One-Time Digital Purchase';
    } else {
        title = 'Library Payment';
        amount = item?.amount || 500.0;
        description = 'Library transaction';
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg(null);
        setSuccessMsg(null);

        try {
            if (isFine) {
                await api.payFineDaraja(item.id, { phone_number: phoneNumber });
                setSuccessMsg(`STK Push sent to ${phoneNumber}. Enter your M-Pesa PIN to settle KES ${amount.toFixed(2)}.`);
            } else if (isDigital) {
                const res = await api.purchaseDigitalBook(item.id, { phone_number: phoneNumber });
                setSuccessMsg(`M-Pesa STK Push sent! Lifetime access for "${item.title}" unlocked.`);
            }

            setTimeout(() => {
                onClose();
                setSuccessMsg(null);
            }, 3000);
        } catch (err) {
            setErrorMsg(err.message || 'Payment initiation failed.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
                
                {/* Header */}
                <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <Smartphone className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-white leading-tight">{title}</h2>
                            <p className="text-xs text-emerald-400 font-semibold mt-0.5">KES {amount.toFixed(2)}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-5">
                    <p className="text-xs text-slate-400">{description}</p>

                    {isDigital && isSubscribed && (
                        <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs flex items-center gap-2">
                            <Sparkles className="w-4 h-4 flex-shrink-0" />
                            <span>Pro Member: You saved 20% on this purchase!</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                                Safaricom M-Pesa Phone Number
                            </label>
                            <input
                                type="text"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                placeholder="254712345678"
                                required
                                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
                            />
                        </div>

                        {errorMsg && (
                            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                <span>{errorMsg}</span>
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
                            className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" /> Triggering M-Pesa STK Push...
                                </>
                            ) : (
                                <>
                                    <Smartphone className="w-4 h-4" /> Pay KES {amount.toFixed(2)} via M-Pesa
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
