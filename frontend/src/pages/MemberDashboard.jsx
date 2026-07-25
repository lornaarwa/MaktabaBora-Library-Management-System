import React, { useState, useEffect } from 'react';
import { BookOpen, Clock, ShieldCheck, Sparkles, ShoppingBag, Loader2, User } from 'lucide-react';
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
                console.error('Failed to load member dashboard data:', err);
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
            
            {/* User Greeting & Member Banner (TailAdmin Header Layout) */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-sm">
                <div className="space-y-1.5">
                    <div className="flex items-center gap-2.5">
                        <h1 className="text-xl sm:text-2xl font-extrabold text-zinc-100">{user?.name || 'Member Dashboard'}</h1>
                        {isSubscribed ? (
                            <span className="px-2.5 py-0.5 rounded text-[9px] font-mono font-bold bg-zinc-100 text-zinc-950 flex items-center gap-1">
                                <Sparkles className="w-3 h-3 text-zinc-950" /> PRO MEMBER (20% OFF)
                            </span>
                        ) : (
                            <span className="px-2.5 py-0.5 rounded text-[9px] font-mono font-bold bg-zinc-800 text-zinc-400 border border-zinc-700">
                                MEMBER ACCOUNT
                            </span>
                        )}
                    </div>
                    <p className="text-xs text-zinc-400 font-mono">
                        Card #: <span className="text-zinc-200 font-bold">{user?.member?.member_number || 'MEM-2026'}</span> | Max Limit: {user?.member?.borrow_limit || 5} Books
                    </p>
                </div>

                {!isSubscribed && (
                    <button
                        onClick={() => setSubModalOpen(true)}
                        className="py-2.5 px-4 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
                    >
                        <Sparkles className="w-3.5 h-3.5" /> Unlock Pro Member Pass (KES 500/mo)
                    </button>
                )}
            </div>

            {/* TailAdmin Stat Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-2">
                    <div className="flex justify-between items-center text-zinc-400">
                        <span className="text-xs font-semibold text-zinc-400 uppercase font-mono">Active Loans</span>
                        <div className="p-2 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-300">
                            <BookOpen className="w-4 h-4" />
                        </div>
                    </div>
                    <span className="text-2xl font-extrabold text-zinc-100 block">
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : loans.filter(l => l.status === 'active').length}
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono">Physical copies checked out</span>
                </div>

                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-2">
                    <div className="flex justify-between items-center text-zinc-400">
                        <span className="text-xs font-semibold text-zinc-400 uppercase font-mono">Digital Library</span>
                        <div className="p-2 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-300">
                            <ShoppingBag className="w-4 h-4" />
                        </div>
                    </div>
                    <span className="text-2xl font-extrabold text-zinc-100 block">
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : digitalLibrary.length}
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono">Purchased lifetime e-books</span>
                </div>

                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-2">
                    <div className="flex justify-between items-center text-zinc-400">
                        <span className="text-xs font-semibold text-zinc-400 uppercase font-mono">Overdue Returns</span>
                        <div className="p-2 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-300">
                            <Clock className="w-4 h-4" />
                        </div>
                    </div>
                    <span className="text-2xl font-extrabold text-zinc-100 block">
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : loans.filter(l => l.status === 'overdue').length}
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono">Overdue physical items</span>
                </div>
            </div>

            {/* Purchased Digital E-Books Grid */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4 shadow-sm">
                <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-zinc-400" /> Purchased Digital E-Books
                </h3>

                {loading ? (
                    <div className="flex items-center justify-center py-8 text-zinc-400">
                        <Loader2 className="w-5 h-5 animate-spin text-zinc-400 mr-2" /> Loading e-books...
                    </div>
                ) : digitalLibrary.length === 0 ? (
                    <p className="text-xs text-zinc-500 py-6 text-center">You have not purchased any digital e-books yet. Browse the catalog to purchase e-books.</p>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {digitalLibrary.map((item) => (
                            <div key={item.id} className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 flex flex-col justify-between space-y-3">
                                <div>
                                    <span className="text-[9px] font-mono font-bold text-zinc-300 uppercase flex items-center gap-1">
                                        <ShieldCheck className="w-3 h-3 text-zinc-400" /> Lifetime Unlocked
                                    </span>
                                    <h4 className="font-bold text-zinc-100 text-sm mt-1">{item.book?.title || `Book #${item.book_id}`}</h4>
                                    <p className="text-xs text-zinc-400">{item.book?.author}</p>
                                </div>
                                <button
                                    onClick={() => handleReadDigital(item.book || { id: item.book_id })}
                                    className="w-full py-2 px-3 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm"
                                >
                                    <BookOpen className="w-3.5 h-3.5" /> Read E-Book Stream
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Active Physical Loans Table */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4 shadow-sm">
                <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-zinc-400" /> Physical Circulation Loans
                </h3>

                {loading ? (
                    <div className="flex items-center justify-center py-8 text-zinc-400">
                        <Loader2 className="w-5 h-5 animate-spin text-zinc-400 mr-2" /> Loading loans...
                    </div>
                ) : loans.length === 0 ? (
                    <p className="text-xs text-zinc-500 py-6 text-center">No active physical loans found.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-zinc-300 border-collapse">
                            <thead className="bg-zinc-950 text-zinc-400 uppercase text-[10px] tracking-wider font-mono">
                                <tr>
                                    <th className="p-3 border-b border-zinc-800">Book Title</th>
                                    <th className="p-3 border-b border-zinc-800">Loan Date</th>
                                    <th className="p-3 border-b border-zinc-800">Due Date</th>
                                    <th className="p-3 border-b border-zinc-800 text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800/60">
                                {loans.map((loan) => (
                                    <tr key={loan.id} className="hover:bg-zinc-950/50">
                                        <td className="p-3 font-semibold text-zinc-100">{loan.book_copy?.book?.title || `Book Copy #${loan.book_copy_id}`}</td>
                                        <td className="p-3 text-zinc-400 font-mono">{loan.loan_date}</td>
                                        <td className="p-3 text-zinc-400 font-mono">{loan.due_date}</td>
                                        <td className="p-3 text-right">
                                            <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold border ${
                                                loan.status === 'active' ? 'bg-zinc-100 text-zinc-950 border-zinc-100' : 'bg-zinc-800 text-zinc-300 border-zinc-700'
                                            }`}>
                                                {loan.status.toUpperCase()}
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
