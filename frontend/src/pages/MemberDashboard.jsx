import React, { useState, useEffect } from 'react';
import { BookOpen, Clock, ShieldCheck, Sparkles, CreditCard, ShoppingBag, Book, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import DarajaPayModal from '../components/DarajaPayModal';
import SubscriptionPassModal from '../components/SubscriptionPassModal';
import DigitalReaderModal from '../components/DigitalReaderModal';

export default function MemberDashboard() {
    const { user } = useAuth();
    const [loans, setLoans] = useState([]);
    const [digitalLibrary, setDigitalLibrary] = useState([]);
    const [subscription, setSubscription] = useState(null);
    const [loading, setLoading] = useState(true);

    // Modals
    const [darajaModal, setDarajaModal] = useState({ isOpen: false, type: 'fine', item: null });
    const [subModalOpen, setSubModalOpen] = useState(false);
    const [readerModal, setReaderModal] = useState({ isOpen: false, data: null });

    useEffect(() => {
        const fetchDashboardData = async () => {
            setLoading(true);
            try {
                const [loansRes, subRes, digitalRes] = await Promise.all([
                    api.getLoans().catch(() => ({ data: [] })),
                    api.getSubscriptionStatus().catch(() => ({ data: null })),
                    api.getMyDigitalLibrary().catch(() => ({ data: [] })),
                ]);

                setLoans(loansRes.data || loansRes || []);
                setSubscription(subRes.data || null);
                setDigitalLibrary(digitalRes.data || digitalRes || []);
            } catch (err) {
                console.error('Failed to load dashboard data:', err);
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchDashboardData();
        } else {
            setLoading(false);
        }
    }, [user]);

    const isSubscribed = user?.member?.is_subscribed || subscription?.is_subscribed;

    const handleReadDigital = async (book) => {
        try {
            const res = await api.readDigitalBook(book.id);
            setReaderModal({ isOpen: true, data: res.data || res });
        } catch (err) {
            alert(err.message || 'Failed to stream digital book.');
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
            {/* User Greeting & Member Banner */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-xl">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl sm:text-3xl font-black text-white">{user?.name || 'Member Portal'}</h1>
                        {isSubscribed ? (
                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-amber-500 to-purple-600 text-white shadow-md flex items-center gap-1">
                                <Sparkles className="w-3.5 h-3.5" /> PRO MEMBER (20% OFF)
                            </span>
                        ) : (
                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                                MEMBER ACCOUNT
                            </span>
                        )}
                    </div>
                    <p className="text-xs sm:text-sm text-slate-400">
                        Card #: <span className="font-mono text-indigo-400 font-semibold">{user?.member?.member_number || 'MEM-2026'}</span> • Borrow Limit: {user?.member?.borrow_limit || 5} Books
                    </p>
                </div>

                {!isSubscribed && (
                    <button
                        onClick={() => setSubModalOpen(true)}
                        className="py-3 px-5 rounded-2xl bg-gradient-to-r from-amber-500 to-purple-600 hover:from-amber-400 hover:to-purple-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all hover:scale-105"
                    >
                        <Sparkles className="w-4 h-4" /> Unlock Pro Member Pass (KES 500/mo)
                    </button>
                )}
            </div>

            {/* Metrics Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        <BookOpen className="w-6 h-6" />
                    </div>
                    <div>
                        <span className="text-xs text-slate-400 block font-medium">Active Physical Loans</span>
                        <span className="text-2xl font-black text-white">{loans.filter(l => l.status === 'active').length}</span>
                    </div>
                </div>

                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                        <ShoppingBag className="w-6 h-6" />
                    </div>
                    <div>
                        <span className="text-xs text-slate-400 block font-medium">Purchased E-Books</span>
                        <span className="text-2xl font-black text-purple-400">{digitalLibrary.length}</span>
                    </div>
                </div>

                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        <Clock className="w-6 h-6" />
                    </div>
                    <div>
                        <span className="text-xs text-slate-400 block font-medium">Overdue Returns</span>
                        <span className="text-2xl font-black text-amber-400">{loans.filter(l => l.status === 'overdue').length}</span>
                    </div>
                </div>
            </div>

            {/* Purchased E-Books Grid */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
                <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5 text-purple-400" /> Digital Library (Lifetime Access)
                </h3>

                {loading ? (
                    <div className="flex items-center justify-center py-8 text-slate-400">
                        <Loader2 className="w-6 h-6 animate-spin text-indigo-500 mr-2" /> Loading digital library...
                    </div>
                ) : digitalLibrary.length === 0 ? (
                    <p className="text-xs text-slate-500 py-6 text-center">You have not purchased any digital e-books yet. Browse the catalog to buy books for lifetime access.</p>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {digitalLibrary.map((item) => (
                            <div key={item.id} className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between space-y-3">
                                <div>
                                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wide flex items-center gap-1">
                                        <ShieldCheck className="w-3 h-3" /> Lifetime Unlocked
                                    </span>
                                    <h4 className="font-bold text-white text-sm mt-1">{item.book?.title || `Book #${item.book_id}`}</h4>
                                    <p className="text-xs text-slate-400">{item.book?.author}</p>
                                </div>
                                <button
                                    onClick={() => handleReadDigital(item.book || { id: item.book_id })}
                                    className="w-full py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                                >
                                    <BookOpen className="w-3.5 h-3.5" /> Read E-Book
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Active Physical Book Loans Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
                <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-indigo-400" /> Physical Circulation Loans
                </h3>

                {loading ? (
                    <div className="flex items-center justify-center py-10 text-slate-400">
                        <Loader2 className="w-6 h-6 animate-spin text-indigo-500 mr-2" /> Loading loans...
                    </div>
                ) : loans.length === 0 ? (
                    <p className="text-xs text-slate-500 py-6 text-center">No active physical loans found.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-slate-300">
                            <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px] tracking-wider">
                                <tr>
                                    <th className="p-3 rounded-l-xl">Book Title</th>
                                    <th className="p-3">Loan Date</th>
                                    <th className="p-3">Due Date</th>
                                    <th className="p-3">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60">
                                {loans.map((loan) => (
                                    <tr key={loan.id} className="hover:bg-slate-850/50">
                                        <td className="p-3 font-semibold text-white">{loan.book_copy?.book?.title || `Book Copy #${loan.book_copy_id}`}</td>
                                        <td className="p-3 text-slate-400">{loan.loan_date}</td>
                                        <td className="p-3 text-slate-400">{loan.due_date}</td>
                                        <td className="p-3">
                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                                loan.status === 'active' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                                            }`}>
                                                {loan.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modals */}
            <DarajaPayModal
                isOpen={darajaModal.isOpen}
                onClose={() => setDarajaModal({ isOpen: false, type: 'fine', item: null })}
                type={darajaModal.type}
                item={darajaModal.item}
            />

            <SubscriptionPassModal
                isOpen={subModalOpen}
                onClose={() => setSubModalOpen(false)}
            />

            <DigitalReaderModal
                isOpen={readerModal.isOpen}
                onClose={() => setReaderModal({ isOpen: false, data: null })}
                bookData={readerModal.data}
            />
        </div>
    );
}
