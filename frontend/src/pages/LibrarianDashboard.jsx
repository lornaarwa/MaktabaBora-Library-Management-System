import React, { useState, useEffect } from 'react';
import { QrCode, BookCheck, ShieldAlert, CheckCircle2, Users, BarChart3, AlertCircle, Loader2, BookOpen } from 'lucide-react';
import { api } from '../services/api';

export default function LibrarianDashboard() {
    const [metrics, setMetrics] = useState({ total_books: 0, active_loans: 0, overdue_loans: 0, total_unpaid_fines: 0 });
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);

    // Form Checkout State
    const [checkoutForm, setCheckoutForm] = useState({ barcode: '', member_id: '', days: 14 });
    const [checkoutMsg, setCheckoutMsg] = useState(null);
    const [checkoutError, setCheckoutError] = useState(null);

    // Form Return State
    const [returnForm, setReturnForm] = useState({ loan_id: '' });
    const [returnMsg, setReturnMsg] = useState(null);
    const [returnError, setReturnError] = useState(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [metricsRes, membersRes] = await Promise.all([
                api.getMetrics().catch(() => ({ total_books: 0, active_loans: 0, overdue_loans: 0, total_unpaid_fines: 0 })),
                api.getLibrarianMembers().catch(() => ({ data: [] })),
            ]);
            setMetrics(metricsRes.data || metricsRes || {});
            setMembers(membersRes.data || membersRes || []);
        } catch (err) {
            console.error('Failed to load librarian dashboard data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
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
            fetchData();
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
            fetchData();
        } catch (err) {
            setReturnError(err.message || 'Return processing failed.');
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
            
            {/* Header (TailAdmin Header Layout) */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
                <div>
                    <span className="px-2.5 py-0.5 rounded text-[9px] font-mono font-bold bg-zinc-800 text-zinc-300 border border-zinc-700 uppercase tracking-wider">
                        LIBRARIAN DESK
                    </span>
                    <h1 className="text-xl sm:text-2xl font-extrabold text-zinc-100 mt-1.5">Circulation & Inventory Desk</h1>
                    <p className="text-xs text-zinc-400">Barcode physical checkouts, return processing, and member loan metrics</p>
                </div>
            </div>

            {/* Metrics Overview Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-2">
                    <div className="flex justify-between items-center text-zinc-400">
                        <span className="text-xs font-semibold text-zinc-400 uppercase font-mono">Catalog Titles</span>
                        <div className="p-2 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-300">
                            <BarChart3 className="w-4 h-4" />
                        </div>
                    </div>
                    <span className="text-2xl font-extrabold text-zinc-100 block">{loading ? '...' : metrics.total_books}</span>
                </div>

                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-2">
                    <div className="flex justify-between items-center text-zinc-400">
                        <span className="text-xs font-semibold text-zinc-400 uppercase font-mono">Active Loans</span>
                        <div className="p-2 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-300">
                            <BookCheck className="w-4 h-4" />
                        </div>
                    </div>
                    <span className="text-2xl font-extrabold text-zinc-100 block">{loading ? '...' : metrics.active_loans}</span>
                </div>

                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-2">
                    <div className="flex justify-between items-center text-zinc-400">
                        <span className="text-xs font-semibold text-zinc-400 uppercase font-mono">Overdue Returns</span>
                        <div className="p-2 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-300">
                            <ShieldAlert className="w-4 h-4" />
                        </div>
                    </div>
                    <span className="text-2xl font-extrabold text-zinc-100 block">{loading ? '...' : metrics.overdue_loans}</span>
                </div>

                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-2">
                    <div className="flex justify-between items-center text-zinc-400">
                        <span className="text-xs font-semibold text-zinc-400 uppercase font-mono">Unpaid Fines</span>
                        <div className="p-2 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-300">
                            <QrCode className="w-4 h-4" />
                        </div>
                    </div>
                    <span className="text-2xl font-extrabold text-zinc-100 block">KES {loading ? '...' : metrics.total_unpaid_fines}</span>
                </div>
            </div>

            {/* Member Circulation Summary Table */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4 shadow-sm">
                <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                    <Users className="w-4 h-4 text-zinc-400" /> Member Activity Directory
                </h3>

                {loading ? (
                    <div className="flex items-center justify-center py-8 text-zinc-400">
                        <Loader2 className="w-5 h-5 animate-spin text-zinc-400 mr-2" /> Loading member directory...
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-zinc-300 border-collapse">
                            <thead className="bg-zinc-950 text-zinc-400 uppercase text-[10px] tracking-wider font-mono">
                                <tr>
                                    <th className="p-3 border-b border-zinc-800">Member #</th>
                                    <th className="p-3 border-b border-zinc-800">Full Name & Email</th>
                                    <th className="p-3 border-b border-zinc-800">Tier / Limit</th>
                                    <th className="p-3 border-b border-zinc-800 text-center">Active Loans</th>
                                    <th className="p-3 border-b border-zinc-800 text-center">Holds</th>
                                    <th className="p-3 border-b border-zinc-800 text-center">Digital E-Books</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800/60">
                                {members.length > 0 ? (
                                    members.map((m) => (
                                        <tr key={m.id} className="hover:bg-zinc-950/50">
                                            <td className="p-3 font-mono font-bold text-zinc-200">{m.member_number}</td>
                                            <td className="p-3">
                                                <div className="font-semibold text-zinc-100">{m.name}</div>
                                                <div className="text-[11px] text-zinc-400">{m.email}</div>
                                            </td>
                                            <td className="p-3">
                                                <span className="capitalize text-zinc-300 font-medium">{m.membership_tier}</span>
                                                <div className="text-[10px] text-zinc-500 font-mono">Limit: {m.borrow_limit}</div>
                                            </td>
                                            <td className="p-3 text-center">
                                                <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-zinc-800 text-zinc-200 border border-zinc-700">
                                                    {m.active_loans_count} active / {m.total_loans_count} total
                                                </span>
                                            </td>
                                            <td className="p-3 text-center">
                                                <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-zinc-800 text-zinc-200 border border-zinc-700">
                                                    {m.reserved_books_count} holds
                                                </span>
                                            </td>
                                            <td className="p-3 text-center">
                                                <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-zinc-800 text-zinc-200 border border-zinc-700">
                                                    {m.digital_purchases_count} e-books
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="p-4 text-center text-zinc-500">
                                            No members registered yet.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Checkouts & Returns Operations Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Barcode Checkout Form */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4 shadow-sm">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-300">
                            <QrCode className="w-4 h-4" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-zinc-100">Issue Physical Book Copy</h3>
                            <p className="text-xs text-zinc-400">Scan barcode to check out physical copy to member</p>
                        </div>
                    </div>

                    <form onSubmit={handleCheckout} className="space-y-3">
                        <div>
                            <label className="block text-xs font-semibold text-zinc-300 mb-1">Book Barcode</label>
                            <input
                                type="text"
                                value={checkoutForm.barcode}
                                onChange={(e) => setCheckoutForm({ ...checkoutForm, barcode: e.target.value })}
                                placeholder="e.g. BC-9780132350884-001"
                                required
                                className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-zinc-700 font-mono"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-semibold text-zinc-300 mb-1">Member ID</label>
                                <input
                                    type="number"
                                    value={checkoutForm.member_id}
                                    onChange={(e) => setCheckoutForm({ ...checkoutForm, member_id: e.target.value })}
                                    placeholder="e.g. 1"
                                    required
                                    className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-zinc-700 font-mono"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-zinc-300 mb-1">Period (Days)</label>
                                <input
                                    type="number"
                                    value={checkoutForm.days}
                                    onChange={(e) => setCheckoutForm({ ...checkoutForm, days: e.target.value })}
                                    className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-zinc-700 font-mono"
                                />
                            </div>
                        </div>

                        {checkoutError && (
                            <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-300 text-xs flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 flex-shrink-0 text-zinc-400" /> {checkoutError}
                            </div>
                        )}

                        {checkoutMsg && (
                            <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-300 text-xs flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-zinc-400" /> {checkoutMsg}
                            </div>
                        )}

                        <button
                            type="submit"
                            className="w-full py-2.5 px-4 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm"
                        >
                            <BookCheck className="w-4 h-4" /> Issue Book Copy
                        </button>
                    </form>
                </div>

                {/* Return Book Form */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4 shadow-sm">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-300">
                            <BookCheck className="w-4 h-4" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-zinc-100">Process Book Return</h3>
                            <p className="text-xs text-zinc-400">Mark loan returned and increment copy availability</p>
                        </div>
                    </div>

                    <form onSubmit={handleReturn} className="space-y-3">
                        <div>
                            <label className="block text-xs font-semibold text-zinc-300 mb-1">Loan Record ID</label>
                            <input
                                type="number"
                                value={returnForm.loan_id}
                                onChange={(e) => setReturnForm({ loan_id: e.target.value })}
                                placeholder="e.g. 1"
                                required
                                className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-zinc-700 font-mono"
                            />
                        </div>

                        {returnError && (
                            <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-300 text-xs flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 flex-shrink-0 text-zinc-400" /> {returnError}
                            </div>
                        )}

                        {returnMsg && (
                            <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-300 text-xs flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-zinc-400" /> {returnMsg}
                            </div>
                        )}

                        <button
                            type="submit"
                            className="w-full py-2.5 px-4 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm"
                        >
                            <CheckCircle2 className="w-4 h-4" /> Process Return
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
