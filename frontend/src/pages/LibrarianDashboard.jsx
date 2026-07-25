import React, { useState, useEffect } from 'react';
import { QrCode, BookCheck, ShieldAlert, CheckCircle2, UserCheck, BarChart3, AlertCircle, Loader2 } from 'lucide-react';
import { api } from '../services/api';

export default function LibrarianDashboard() {
    const [metrics, setMetrics] = useState({ total_books: 0, active_loans: 0, overdue_loans: 0, total_unpaid_fines: 0 });
    const [loading, setLoading] = useState(true);

    // Form Checkout State
    const [checkoutForm, setCheckoutForm] = useState({ barcode: '', member_id: '', days: 14 });
    const [checkoutMsg, setCheckoutMsg] = useState(null);
    const [checkoutError, setCheckoutError] = useState(null);

    // Form Return State
    const [returnForm, setReturnForm] = useState({ loan_id: '' });
    const [returnMsg, setReturnMsg] = useState(null);
    const [returnError, setReturnError] = useState(null);

    const fetchMetrics = async () => {
        setLoading(true);
        try {
            const res = await api.getMetrics();
            setMetrics(res.data || res);
        } catch (err) {
            console.error('Failed to load metrics:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMetrics();
    }, []);

    const handleCheckout = async (e) => {
        e.preventDefault();
        setCheckoutMsg(null);
        setCheckoutError(null);
        try {
            const res = await api.checkoutLoan({
                barcode: checkoutForm.barcode,
                member_id: parseInt(checkoutForm.member_id, 10),
                days: parseInt(checkoutForm.days, 10),
            });

            setCheckoutMsg(res.message || 'Book copy checked out successfully!');
            setCheckoutForm({ barcode: '', member_id: '', days: 14 });
            fetchMetrics();
        } catch (err) {
            setCheckoutError(err.message || 'Checkout failed.');
        }
    };

    const handleReturn = async (e) => {
        e.preventDefault();
        setReturnMsg(null);
        setReturnError(null);
        try {
            const res = await api.returnLoan(parseInt(returnForm.loan_id, 10));
            setReturnMsg(res.message || 'Book returned successfully!');
            setReturnForm({ loan_id: '' });
            fetchMetrics();
        } catch (err) {
            setReturnError(err.message || 'Return processing failed.');
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
            {/* Header */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-xl">
                <div>
                    <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        LIBRARIAN PORTAL
                    </span>
                    <h1 className="text-2xl sm:text-3xl font-black text-white mt-2">Circulation & Inventory Desk</h1>
                    <p className="text-xs sm:text-sm text-slate-400">Barcode physical checkouts, returns, and inventory stats</p>
                </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        <BarChart3 className="w-6 h-6" />
                    </div>
                    <div>
                        <span className="text-xs text-slate-400 block font-medium">Total Titles</span>
                        <span className="text-2xl font-black text-white">{loading ? '...' : metrics.total_books}</span>
                    </div>
                </div>

                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <BookCheck className="w-6 h-6" />
                    </div>
                    <div>
                        <span className="text-xs text-slate-400 block font-medium">Active Loans</span>
                        <span className="text-2xl font-black text-emerald-400">{loading ? '...' : metrics.active_loans}</span>
                    </div>
                </div>

                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        <ShieldAlert className="w-6 h-6" />
                    </div>
                    <div>
                        <span className="text-xs text-slate-400 block font-medium">Overdue Returns</span>
                        <span className="text-2xl font-black text-amber-400">{loading ? '...' : metrics.overdue_loans}</span>
                    </div>
                </div>

                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                        <QrCode className="w-6 h-6" />
                    </div>
                    <div>
                        <span className="text-xs text-slate-400 block font-medium">Unpaid Fines</span>
                        <span className="text-2xl font-black text-purple-400">KES {loading ? '...' : metrics.total_unpaid_fines}</span>
                    </div>
                </div>
            </div>

            {/* Operations Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Barcode Checkout Form */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-xl">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                            <QrCode className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-white">Issue Physical Book</h3>
                            <p className="text-xs text-slate-400">Scan barcode to check out book copy to member</p>
                        </div>
                    </div>

                    <form onSubmit={handleCheckout} className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-300 mb-1">Book Barcode</label>
                            <input
                                type="text"
                                value={checkoutForm.barcode}
                                onChange={(e) => setCheckoutForm({ ...checkoutForm, barcode: e.target.value })}
                                placeholder="e.g. BC-9780132350884-001"
                                required
                                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1">Member ID</label>
                                <input
                                    type="number"
                                    value={checkoutForm.member_id}
                                    onChange={(e) => setCheckoutForm({ ...checkoutForm, member_id: e.target.value })}
                                    placeholder="e.g. 1"
                                    required
                                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1">Loan Period (Days)</label>
                                <input
                                    type="number"
                                    value={checkoutForm.days}
                                    onChange={(e) => setCheckoutForm({ ...checkoutForm, days: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                                />
                            </div>
                        </div>

                        {checkoutError && (
                            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 flex-shrink-0" /> {checkoutError}
                            </div>
                        )}

                        {checkoutMsg && (
                            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> {checkoutMsg}
                            </div>
                        )}

                        <button
                            type="submit"
                            className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-600/20"
                        >
                            <BookCheck className="w-4 h-4" /> Issue Book Copy
                        </button>
                    </form>
                </div>

                {/* Return Book Form */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-xl">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <BookCheck className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-white">Process Book Return</h3>
                            <p className="text-xs text-slate-400">Mark loan returned and increment copy availability</p>
                        </div>
                    </div>

                    <form onSubmit={handleReturn} className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-300 mb-1">Loan Record ID</label>
                            <input
                                type="number"
                                value={returnForm.loan_id}
                                onChange={(e) => setReturnForm({ loan_id: e.target.value })}
                                placeholder="e.g. 1"
                                required
                                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                            />
                        </div>

                        {returnError && (
                            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 flex-shrink-0" /> {returnError}
                            </div>
                        )}

                        {returnMsg && (
                            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> {returnMsg}
                            </div>
                        )}

                        <button
                            type="submit"
                            className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-600/20"
                        >
                            <CheckCircle2 className="w-4 h-4" /> Process Return
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
