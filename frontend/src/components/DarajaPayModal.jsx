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
        description = isSubscribed ? '20% Pro Subscriber Discount Applied' : 'Standard One-Time Digital Purchase';
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
                setSuccessMsg(`STK Push dispatched to ${phoneNumber}. Enter M-Pesa PIN to settle KES ${amount.toFixed(2)}.`);
            } else if (isDigital) {
                await api.purchaseDigitalBook(item.id, { phone_number: phoneNumber });
                setSuccessMsg(`M-Pesa STK Push dispatched. Lifetime access for "${item.title}" unlocked.`);
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-md animate-in fade-in duration-200">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
                
                {/* Header */}
                <div className="p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/40">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-300">
                            <Smartphone className="w-4 h-4" />
                        </div>
                        <div>
                            <h2 className="text-sm font-bold text-zinc-100 leading-tight">{title}</h2>
                            <p className="text-xs text-zinc-400 font-mono font-bold mt-0.5">KES {amount.toFixed(2)}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-5 space-y-4">
                    <p className="text-xs text-zinc-400">{description}</p>

                    {isDigital && isSubscribed && (
                        <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-300 text-xs flex items-center gap-2 font-mono">
                            <Sparkles className="w-3.5 h-3.5 flex-shrink-0 text-zinc-400" />
                            <span>Pro Member: Saved 20% on this title</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-3">
                        <div>
                            <label className="block text-xs font-semibold text-zinc-300 mb-1">
                                Safaricom M-Pesa Phone Number
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
                            <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-300 text-xs flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 flex-shrink-0 text-zinc-400" />
                                <span>{errorMsg}</span>
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
                                    <Loader2 className="w-4 h-4 animate-spin text-zinc-950" /> Triggering M-Pesa STK Push...
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
