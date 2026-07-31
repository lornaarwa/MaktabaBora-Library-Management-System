import React, { useState } from 'react';
import { XIcon, SmartphoneIcon, CheckCircle2Icon, LoaderIcon, TriangleAlertIcon, SparklesIcon } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Modal } from './ui/Modal';

export default function DarajaPayModal({ isOpen, open, onClose, type = 'fine', item = null, onSuccess = null }) {
    const { user } = useAuth();
    const [phoneNumber, setPhoneNumber] = useState('0712 345 678');
    const [loading, setLoading] = useState(false);
    const [stage, setStage] = useState('form'); // 'form' | 'pushing' | 'success' | 'failed'
    const [errorMsg, setErrorMsg] = useState(null);

    const isOpenState = open !== undefined ? open : isOpen;
    if (!isOpenState) return null;

    const isSubscribed = user?.member?.is_subscribed;
    const isDigital = type === 'digital';
    const isCart = type === 'cart';
    const isFine = type === 'fine';

    let title = 'Pay with M-Pesa';
    let subtitle = 'Safaricom Daraja · STK Push';
    let amount = 0;
    let description = '';

    if (isCart && item) {
        title = 'Cart Multi-Book Checkout';
        amount = item.amount || 0;
        const itemCount = item.items ? item.items.reduce((s, i) => s + i.quantity, 0) : 0;
        description = `${itemCount} Digital E-Book${itemCount > 1 ? 's' : ''} in Shopping Cart`;
    } else if (isFine && item) {
        title = `Fine Settlement #${item.id}`;
        amount = item.balance || item.amount;
        description = `Settling overdue fine for loan copy #${item.loan_id}`;
    } else if (isDigital && item) {
        title = `E-Book Purchase: ${item.title}`;
        const stdPrice = item.digital_purchase_price || 50.0;
        amount = isSubscribed ? Math.round(stdPrice * 0.8 * 100) / 100 : stdPrice;
        description = isSubscribed ? '20% Pro Subscriber Discount Applied' : 'Standard Digital Purchase';
    } else {
        amount = item?.amount || 500.0;
        description = 'Library Account Settlement';
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setStage('pushing');
        setErrorMsg(null);

        try {
            if (isCart && item?.items) {
                await api.checkoutCart({
                    phone_number: phoneNumber,
                    items: item.items.map((i) => ({ book_id: i.book.id, quantity: i.quantity })),
                });
            } else if (isFine) {
                await api.payFineDaraja(item.id, { phone_number: phoneNumber });
            } else if (isDigital) {
                await api.purchaseDigitalBook(item.id, { phone_number: phoneNumber });
            }
            
            setTimeout(() => {
                setStage('success');
                setTimeout(() => {
                    onClose();
                    setStage('form');
                    if (onSuccess) onSuccess();
                }, 2800);
            }, 1200);
        } catch (err) {
            setStage('failed');
            setErrorMsg(err.message || 'Payment initiation failed.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            open={isOpenState}
            onClose={stage === 'pushing' ? () => undefined : onClose}
            title={title}
            subtitle={subtitle}
            size="sm"
        >
            <div className="rounded-xl border border-bark-100 bg-cream-light/50 p-4">
                <div className="flex items-baseline justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wide text-bark-500">Amount due</span>
                    <span className="font-mono text-2xl font-bold text-bark-900">KES {amount.toFixed(2)}</span>
                </div>
                <dl className="mt-3 space-y-1.5 border-t border-bark-100 pt-3 text-xs">
                    <div className="flex justify-between gap-3">
                        <dt className="text-bark-500">Purpose</dt>
                        <dd className="font-medium text-bark-900">{description}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                        <dt className="text-bark-500">Paybill</dt>
                        <dd className="font-mono text-bark-900">174379</dd>
                    </div>
                </dl>
            </div>

            {isDigital && isSubscribed && (
                <div className="mt-3 flex items-center gap-2 rounded-lg border border-tan-dark/30 bg-cream/40 p-2.5 text-xs text-bark-700">
                    <SparklesIcon className="h-4 w-4 shrink-0 text-tan-dark" />
                    <span>20% Pro Discount Applied automatically</span>
                </div>
            )}

            {stage === 'form' && (
                <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                    <div>
                        <label htmlFor="mpesa-phone" className="mb-1.5 block text-sm font-semibold text-bark-900">
                            M-Pesa phone number
                        </label>
                        <div className="flex items-center gap-2 rounded-lg border border-bark-100 bg-paper px-3 focus-within:border-bark-500">
                            <SmartphoneIcon className="h-4 w-4 text-bark-300" />
                            <span className="font-mono text-sm text-bark-500">+254</span>
                            <input
                                id="mpesa-phone"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                inputMode="tel"
                                className="w-full bg-transparent py-2.5 font-mono text-sm text-bark-900 outline-none placeholder:text-bark-300"
                                placeholder="0712 345 678"
                                required
                            />
                        </div>
                        <p className="mt-1.5 text-xs text-bark-500">An STK prompt will be sent to your phone.</p>
                    </div>
                    <button
                        type="submit"
                        disabled={loading || !phoneNumber.trim()}
                        className="w-full rounded-lg bg-bark-700 px-4 py-2.5 text-sm font-bold text-cream-light transition hover:bg-bark-900 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        Send STK push
                    </button>
                </form>
            )}

            {stage === 'pushing' && (
                <div className="mt-5 rounded-xl border border-bark-100 bg-paper p-5 text-center">
                    <LoaderIcon className="mx-auto h-6 w-6 animate-spin text-bark-500" />
                    <p className="mt-3 text-sm font-semibold text-bark-900">Sending STK Push to phone...</p>
                    <p className="mt-1 font-mono text-xs text-bark-500">Enter M-Pesa PIN on your phone</p>
                </div>
            )}

            {stage === 'success' && (
                <div className="mt-5 rounded-xl border border-olive-dark/40 bg-olive/25 p-5 text-center">
                    <CheckCircle2Icon className="mx-auto h-7 w-7 text-olive-dark" />
                    <p className="mt-2 text-sm font-bold text-bark-900">Payment confirmed</p>
                    <p className="mt-1 text-xs text-bark-700">
                        KES {amount.toFixed(2)} received · Transaction confirmed
                    </p>
                </div>
            )}

            {stage === 'failed' && (
                <div className="mt-5 rounded-xl border border-[#a8452f]/30 bg-[#a8452f]/10 p-5 text-center">
                    <TriangleAlertIcon className="mx-auto h-6 w-6 text-[#8c3620]" />
                    <p className="mt-2 text-sm font-bold text-bark-900">Transaction Failed</p>
                    {errorMsg && <p className="mt-1 text-xs text-bark-700">{errorMsg}</p>}
                    <button
                        type="button"
                        onClick={() => setStage('form')}
                        className="mt-4 w-full rounded-lg border border-bark-100 px-4 py-2.5 text-sm font-bold text-bark-900 transition hover:bg-cream"
                    >
                        Try again
                    </button>
                </div>
            )}
        </Modal>
    );
}
