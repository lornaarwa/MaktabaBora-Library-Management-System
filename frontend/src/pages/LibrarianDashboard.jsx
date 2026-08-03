import React, { useState, useEffect } from 'react';
import { 
    QrCode, BookCheck, ShieldAlert, CheckCircle2, Users, BarChart3, AlertCircle, Loader2, BookOpen,
    Plus, Edit2, Trash2, Search, X, Layers, Table, CreditCard, ChevronLeft, ChevronRight, Menu, Activity, Shield,
    DollarSign, RefreshCw, XCircle, ChevronDown
} from 'lucide-react';
import { api } from '../services/api';

export default function LibrarianDashboard() {
    // Sidebar Tab State: 'overview' | 'add_books' | 'book_copies' | 'returns' | 'subscriptions'
    const [activeTab, setActiveTab] = useState('overview');
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    // Common Metrics & Data State
    const [metrics, setMetrics] = useState({ total_books: 0, active_loans: 0, overdue_loans: 0, total_unpaid_fines: 0 });
    const [members, setMembers] = useState([]);
    const [books, setBooks] = useState([]);
    const [copies, setCopies] = useState([]);
    const [activeLoans, setActiveLoans] = useState([]);
    const [subscriptions, setSubscriptions] = useState([]);
    const [reimbursements, setReimbursements] = useState([]);
    const [reimbLoading, setReimbLoading] = useState(false);
    const [loading, setLoading] = useState(true);

    // Global Message/Error State
    const [successMsg, setSuccessMsg] = useState(null);
    const [errorMsg, setErrorMsg] = useState(null);

    // Quick Checkout State
    const [checkoutForm, setCheckoutForm] = useState({ barcode: '', member_id: '', days: 14 });
    const [checkoutSubmitting, setCheckoutSubmitting] = useState(false);

    // Quick Return State
    const [returnForm, setReturnForm] = useState({ loan_id: '' });
    const [returnSubmitting, setReturnSubmitting] = useState(false);

    // Add Book Form State
    const [bookForm, setBookForm] = useState({
        isbn: '', title: '', author: '', publisher: '', genre: 'Software',
        description: '', cover_image_path: '', file_path: '', publication_year: 2026,
        digital_purchase_price: 50.00, initial_copies: 1
    });
    const [bookSubmitting, setBookSubmitting] = useState(false);
    const [editingBook, setEditingBook] = useState(null);

    // Add/Edit Book Copy Form State
    const [copyForm, setCopyForm] = useState({
        book_id: '', barcode: '', condition: 'good', status: 'available', location_rack: 'Rack-1'
    });
    const [copySubmitting, setCopySubmitting] = useState(false);
    const [editingCopy, setEditingCopy] = useState(null);

    // Subscription Form & Modal State
    const [subForm, setSubForm] = useState({
        member_id: '', plan_type: 'pro_perks_monthly', amount_paid: 500.00, payment_status: 'paid', expires_at: ''
    });
    const [subSubmitting, setSubSubmitting] = useState(false);
    const [editingSub, setEditingSub] = useState(null);

    // Search Query State
    const [searchQuery, setSearchQuery] = useState('');

    const fetchAllData = async () => {
        setLoading(true);
        try {
            const [metricsRes, membersRes, booksRes, copiesRes, loansRes, subsRes] = await Promise.all([
                api.getMetrics().catch(() => ({ total_books: 0, active_loans: 0, overdue_loans: 0, total_unpaid_fines: 0 })),
                api.getLibrarianMembers().catch(() => ({ data: [] })),
                api.getBooks().catch(() => ({ data: [] })),
                api.getLibrarianCopies().catch(() => ({ data: [] })),
                api.getActiveLoans().catch(() => ({ data: [] })),
                api.getLibrarianSubscriptions().catch(() => ({ data: [] })),
            ]);

            setMetrics(metricsRes.data || metricsRes || {});
            setMembers(membersRes.data || membersRes || []);
            setBooks(booksRes.data || booksRes.data?.data || booksRes || []);
            setCopies(copiesRes.data || copiesRes || []);
            setActiveLoans(loansRes.data || loansRes || []);
            setSubscriptions(subsRes.data || subsRes || []);

            // Fetch reimbursements separately (soft-fail)
            try {
                const reimbRes = await api.getLibrarianReimbursements();
                setReimbursements(reimbRes.data || []);
            } catch (_) {}
        } catch (err) {
            console.error('Failed to load librarian data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllData();
    }, []);

    // 1. Checkout Handler
    const handleCheckout = async (e) => {
        e.preventDefault();
        setSuccessMsg(null);
        setErrorMsg(null);
        setCheckoutSubmitting(true);
        try {
            const res = await api.checkoutLoan({
                barcode: checkoutForm.barcode,
                member_id: parseInt(checkoutForm.member_id, 10),
                days: parseInt(checkoutForm.days, 10),
            });

            setSuccessMsg(res.message || 'Book copy checked out successfully!');
            setCheckoutForm({ barcode: '', member_id: '', days: 14 });
            fetchAllData();
        } catch (err) {
            setErrorMsg(err.message || 'Checkout failed.');
        } finally {
            setCheckoutSubmitting(false);
        }
    };

    // 2. Return Handler
    const handleReturn = async (loanId) => {
        setSuccessMsg(null);
        setErrorMsg(null);
        setReturnSubmitting(true);
        try {
            const res = await api.returnLoan(parseInt(loanId, 10));
            setSuccessMsg(res.message || 'Book returned successfully!');
            setReturnForm({ loan_id: '' });
            fetchAllData();
        } catch (err) {
            setErrorMsg(err.message || 'Return processing failed.');
        } finally {
            setReturnSubmitting(false);
        }
    };

    // 3. Add / Edit Book
    const handleBookSubmit = async (e) => {
        e.preventDefault();
        setSuccessMsg(null);
        setErrorMsg(null);
        setBookSubmitting(true);
        try {
            if (editingBook) {
                await api.updateBook(editingBook.id, bookForm);
                setSuccessMsg(`Book "${bookForm.title}" updated successfully.`);
                setEditingBook(null);
            } else {
                await api.createBook(bookForm);
                setSuccessMsg(`Book "${bookForm.title}" added to inventory catalog.`);
            }
            setBookForm({
                isbn: '', title: '', author: '', publisher: '', genre: 'Software',
                description: '', cover_image_path: '', file_path: '', publication_year: 2026,
                digital_purchase_price: 50.00, initial_copies: 1
            });
            fetchAllData();
        } catch (err) {
            setErrorMsg(err.message || 'Failed to save book.');
        } finally {
            setBookSubmitting(false);
        }
    };

    const handleDeleteBook = async (id) => {
        if (!window.confirm('Are you sure you want to remove this book from catalog?')) return;
        try {
            await api.deleteBook(id);
            setSuccessMsg('Book deleted successfully.');
            fetchAllData();
        } catch (err) {
            setErrorMsg(err.message || 'Failed to delete book.');
        }
    };

    const handleToggleRestriction = async (id) => {
        try {
            const res = await api.toggleBookRestriction(id);
            setSuccessMsg(res.message || 'Book restriction toggled.');
            fetchAllData();
        } catch (err) {
            setErrorMsg(err.message || 'Failed to toggle restriction.');
        }
    };

    // 4. Add / Edit Book Copy
    const handleCopySubmit = async (e) => {
        e.preventDefault();
        setSuccessMsg(null);
        setErrorMsg(null);
        setCopySubmitting(true);
        try {
            if (editingCopy) {
                await api.updateLibrarianCopy(editingCopy.id, {
                    condition: copyForm.condition,
                    status: copyForm.status,
                    location_rack: copyForm.location_rack
                });
                setSuccessMsg(`Book copy barcode "${copyForm.barcode}" updated.`);
                setEditingCopy(null);
            } else {
                await api.createLibrarianCopy({
                    book_id: parseInt(copyForm.book_id, 10),
                    barcode: copyForm.barcode,
                    condition: copyForm.condition,
                    status: copyForm.status,
                    location_rack: copyForm.location_rack
                });
                setSuccessMsg(`Book copy with barcode "${copyForm.barcode}" registered.`);
            }
            setCopyForm({ book_id: '', barcode: '', condition: 'good', status: 'available', location_rack: 'Rack-1' });
            fetchAllData();
        } catch (err) {
            setErrorMsg(err.message || 'Failed to save book copy.');
        } finally {
            setCopySubmitting(false);
        }
    };

    const handleDeleteCopy = async (id) => {
        if (!window.confirm('Delete this book copy record?')) return;
        try {
            await api.deleteLibrarianCopy(id);
            setSuccessMsg('Book copy removed.');
            fetchAllData();
        } catch (err) {
            setErrorMsg(err.message || 'Failed to delete copy.');
        }
    };

    // 5. Subscription CRUD
    const handleSubSubmit = async (e) => {
        e.preventDefault();
        setSuccessMsg(null);
        setErrorMsg(null);
        setSubSubmitting(true);
        try {
            if (editingSub) {
                await api.updateLibrarianSubscription(editingSub.id, {
                    plan_type: subForm.plan_type,
                    payment_status: subForm.payment_status,
                    expires_at: subForm.expires_at || null
                });
                setSuccessMsg('Subscription record updated.');
                setEditingSub(null);
            } else {
                await api.createLibrarianSubscription({
                    member_id: parseInt(subForm.member_id, 10),
                    plan_type: subForm.plan_type,
                    amount_paid: parseFloat(subForm.amount_paid),
                    payment_status: subForm.payment_status,
                    expires_at: subForm.expires_at || null
                });
                setSuccessMsg('Member perk subscription activated successfully.');
            }
            setSubForm({ member_id: '', plan_type: 'pro_perks_monthly', amount_paid: 500.00, payment_status: 'paid', expires_at: '' });
            fetchAllData();
        } catch (err) {
            setErrorMsg(err.message || 'Failed to save subscription.');
        } finally {
            setSubSubmitting(false);
        }
    };

    const handleDeleteSub = async (id) => {
        if (!window.confirm('Cancel and delete this subscription record?')) return;
        try {
            await api.deleteLibrarianSubscription(id);
            setSuccessMsg('Subscription record cancelled and removed.');
            fetchAllData();
        } catch (err) {
            setErrorMsg(err.message || 'Failed to cancel subscription.');
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
            
            {/* Header */}
            <div className="bg-cream-light/40 border border-bark-100 rounded-2xl p-6 sm:p-8 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                        className="p-2 rounded-lg bg-paper border border-bark-100 text-bark-500 hover:text-bark-900 transition-colors"
                        title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                    >
                        {isSidebarCollapsed ? <Menu className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
                    </button>
                    <div>
                        <span className="px-2.5 py-0.5 rounded text-[9px] font-mono font-bold bg-cream text-bark-700 border border-bark-100 uppercase tracking-wider">
                            LIBRARIAN PORTAL
                        </span>
                        <h1 className="text-xl sm:text-2xl font-extrabold text-bark-900 mt-1">
                            Circulation Desk & Inventory Operations
                        </h1>
                    </div>
                </div>
            </div>

            {/* Notifications */}
            {successMsg && (
                <div className="p-3.5 rounded-xl bg-cream-light/40 border border-bark-100 text-zinc-200 text-xs flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-bark-500" /> {successMsg}
                    </div>
                    <button onClick={() => setSuccessMsg(null)}><X className="w-4 h-4 text-bark-500" /></button>
                </div>
            )}

            {errorMsg && (
                <div className="p-3.5 rounded-xl bg-cream-light/40 border border-bark-100 text-zinc-200 text-xs flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-bark-500" /> {errorMsg}
                    </div>
                    <button onClick={() => setErrorMsg(null)}><X className="w-4 h-4 text-bark-500" /></button>
                </div>
            )}

            {/* Main Layout: Collapsible Sidebar + Content */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Task 3: Librarian Sidebar Navigation */}
                <div className={`${isSidebarCollapsed ? 'lg:col-span-1' : 'lg:col-span-3'} bg-cream-light/40 border border-bark-100 rounded-2xl p-3.5 space-y-2 h-fit shadow-sm transition-all`}>
                    <div className="flex items-center justify-between px-2 py-1">
                        {!isSidebarCollapsed && (
                            <h3 className="text-[10px] font-mono font-extrabold text-bark-500 uppercase tracking-wider flex items-center gap-2">
                                <Table className="w-3.5 h-3.5 text-bark-500" /> Desk Navigation
                            </h3>
                        )}
                        <button
                            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                            className="p-1 rounded text-bark-500 hover:text-zinc-200"
                        >
                            {isSidebarCollapsed ? <ChevronRight className="w-4 h-4 mx-auto" /> : <ChevronLeft className="w-4 h-4" />}
                        </button>
                    </div>

                    <div className="space-y-1">
                        <button
                            onClick={() => setActiveTab('overview')}
                            className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between'} px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                                activeTab === 'overview'
                                    ? 'bg-zinc-100 text-zinc-950 font-bold shadow-sm'
                                    : 'text-bark-500 hover:text-zinc-200 hover:bg-cream/60'
                            }`}
                            title="Circulation Overview"
                        >
                            <div className="flex items-center gap-2.5">
                                <Activity className="w-4 h-4 text-bark-500" />
                                {!isSidebarCollapsed && <span>Overview & Directory</span>}
                            </div>
                        </button>

                        <button
                            onClick={() => setActiveTab('add_books')}
                            className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between'} px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                                activeTab === 'add_books'
                                    ? 'bg-zinc-100 text-zinc-950 font-bold shadow-sm'
                                    : 'text-bark-500 hover:text-zinc-200 hover:bg-cream/60'
                            }`}
                            title="Add Books to Inventory"
                        >
                            <div className="flex items-center gap-2.5">
                                <BookOpen className="w-4 h-4 text-bark-500" />
                                {!isSidebarCollapsed && <span>Add Books / Inventory</span>}
                            </div>
                        </button>

                        <button
                            onClick={() => setActiveTab('book_copies')}
                            className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between'} px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                                activeTab === 'book_copies'
                                    ? 'bg-zinc-100 text-zinc-950 font-bold shadow-sm'
                                    : 'text-bark-500 hover:text-zinc-200 hover:bg-cream/60'
                            }`}
                            title="Book Copies"
                        >
                            <div className="flex items-center gap-2.5">
                                <Layers className="w-4 h-4 text-bark-500" />
                                {!isSidebarCollapsed && <span>Book Copies ({copies.length})</span>}
                            </div>
                        </button>

                        <button
                            onClick={() => setActiveTab('returns')}
                            className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between'} px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                                activeTab === 'returns'
                                    ? 'bg-zinc-100 text-zinc-950 font-bold shadow-sm'
                                    : 'text-bark-500 hover:text-zinc-200 hover:bg-cream/60'
                            }`}
                            title="Process Book Returns"
                        >
                            <div className="flex items-center gap-2.5">
                                <BookCheck className="w-4 h-4 text-bark-500" />
                                {!isSidebarCollapsed && <span>Process Returns ({activeLoans.length})</span>}
                            </div>
                        </button>

                        <button
                            onClick={() => setActiveTab('subscriptions')}
                            className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between'} px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                                activeTab === 'subscriptions'
                                    ? 'bg-zinc-100 text-zinc-950 font-bold shadow-sm'
                                    : 'text-bark-500 hover:text-zinc-200 hover:bg-cream/60'
                            }`}
                            title="Valid Subscriptions (CRUD)"
                        >
                            <div className="flex items-center gap-2.5">
                                <CreditCard className="w-4 h-4 text-bark-500" />
                                {!isSidebarCollapsed && <span>Subscriptions (CRUD)</span>}
                            </div>
                        </button>

                        <button
                            onClick={() => setActiveTab('reimbursements')}
                            className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between'} px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                                activeTab === 'reimbursements'
                                    ? 'bg-zinc-100 text-zinc-950 font-bold shadow-sm'
                                    : 'text-bark-500 hover:text-zinc-200 hover:bg-cream/60'
                            }`}
                            title="Reimbursement Requests"
                        >
                            <div className="flex items-center gap-2.5">
                                <DollarSign className="w-4 h-4 text-bark-500" />
                                {!isSidebarCollapsed && (
                                    <span className="flex items-center gap-1.5">
                                        Reimbursements
                                        {reimbursements.filter(r => r.status === 'pending').length > 0 && (
                                            <span className="ml-1 inline-flex items-center justify-center h-4 w-4 rounded-full bg-amber-500 text-[9px] font-bold text-white">
                                                {reimbursements.filter(r => r.status === 'pending').length}
                                            </span>
                                        )}
                                    </span>
                                )}
                            </div>
                        </button>
                    </div>
                </div>

                {/* Content Panel */}
                <div className={`${isSidebarCollapsed ? 'lg:col-span-11' : 'lg:col-span-9'} space-y-6 transition-all`}>
                    
                    {/* TAB 1: Overview & Circulation Desk */}
                    {activeTab === 'overview' && (
                        <div className="space-y-6">
                            {/* Metrics Overview Cards */}
                            <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
                                <div className="bg-cream-light/40 border border-bark-100 rounded-xl p-5 space-y-2">
                                    <div className="flex justify-between items-center text-bark-500">
                                        <span className="text-xs font-semibold text-bark-500 uppercase font-mono">Catalog Titles</span>
                                        <div className="p-2 rounded-lg bg-paper border border-bark-100 text-bark-700">
                                            <BarChart3 className="w-4 h-4" />
                                        </div>
                                    </div>
                                    <span className="text-2xl font-extrabold text-bark-900 block">{loading ? '...' : metrics.total_books}</span>
                                </div>

                                <div className="bg-cream-light/40 border border-bark-100 rounded-xl p-5 space-y-2">
                                    <div className="flex justify-between items-center text-bark-500">
                                        <span className="text-xs font-semibold text-bark-500 uppercase font-mono">Active Loans</span>
                                        <div className="p-2 rounded-lg bg-paper border border-bark-100 text-bark-700">
                                            <BookCheck className="w-4 h-4" />
                                        </div>
                                    </div>
                                    <span className="text-2xl font-extrabold text-bark-900 block">{loading ? '...' : metrics.active_loans}</span>
                                </div>

                                <div className="bg-cream-light/40 border border-bark-100 rounded-xl p-5 space-y-2">
                                    <div className="flex justify-between items-center text-bark-500">
                                        <span className="text-xs font-semibold text-bark-500 uppercase font-mono">Overdue Returns</span>
                                        <div className="p-2 rounded-lg bg-paper border border-bark-100 text-bark-700">
                                            <ShieldAlert className="w-4 h-4" />
                                        </div>
                                    </div>
                                    <span className="text-2xl font-extrabold text-bark-900 block">{loading ? '...' : metrics.overdue_loans}</span>
                                </div>

                                <div className="bg-cream-light/40 border border-bark-100 rounded-xl p-5 space-y-2">
                                    <div className="flex justify-between items-center text-bark-500">
                                        <span className="text-xs font-semibold text-bark-500 uppercase font-mono">Unpaid Fines</span>
                                        <div className="p-2 rounded-lg bg-paper border border-bark-100 text-bark-700">
                                            <QrCode className="w-4 h-4" />
                                        </div>
                                    </div>
                                    <span className="text-2xl font-extrabold text-bark-900 block">KES {loading ? '...' : metrics.total_unpaid_fines}</span>
                                </div>
                            </div>

                            {/* Member Activity Directory */}
                            <div className="bg-cream-light/40 border border-bark-100 rounded-2xl p-6 space-y-4 shadow-sm">
                                <h3 className="text-base font-bold text-bark-900 flex items-center gap-2">
                                    <Users className="w-4 h-4 text-bark-500" /> Member Activity Directory
                                </h3>

                                {loading ? (
                                    <div className="flex items-center justify-center py-8 text-bark-500 font-mono text-xs">
                                        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading member directory...
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-xs text-bark-700 border-collapse">
                                            <thead className="bg-paper text-bark-500 uppercase text-[10px] tracking-wider font-mono">
                                                <tr>
                                                    <th className="p-3 border-b border-bark-100">Member #</th>
                                                    <th className="p-3 border-b border-bark-100">Full Name & Email</th>
                                                    <th className="p-3 border-b border-bark-100">Tier / Limit</th>
                                                    <th className="p-3 border-b border-bark-100 text-center">Active Loans</th>
                                                    <th className="p-3 border-b border-bark-100 text-center">Holds</th>
                                                    <th className="p-3 border-b border-bark-100 text-center">Digital E-Books</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-zinc-800/60">
                                                {members.map((m) => (
                                                    <tr key={m.id} className="hover:bg-paper/50">
                                                        <td className="p-3 font-mono font-bold text-zinc-200">{m.member_number}</td>
                                                        <td className="p-3">
                                                            <div className="font-semibold text-bark-900">{m.name}</div>
                                                            <div className="text-[11px] text-bark-500">{m.email}</div>
                                                        </td>
                                                        <td className="p-3">
                                                            <span className="capitalize text-bark-700 font-medium">{m.membership_tier}</span>
                                                            <div className="text-[10px] text-bark-500 font-mono">Limit: {m.borrow_limit}</div>
                                                        </td>
                                                        <td className="p-3 text-center">
                                                            <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-cream text-zinc-200 border border-bark-100">
                                                                {m.active_loans_count} active
                                                            </span>
                                                        </td>
                                                        <td className="p-3 text-center">
                                                            <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-cream text-zinc-200 border border-bark-100">
                                                                {m.reserved_books_count} holds
                                                            </span>
                                                        </td>
                                                        <td className="p-3 text-center">
                                                            <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-cream text-zinc-200 border border-bark-100">
                                                                {m.digital_purchases_count} e-books
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>

                            {/* Barcode Checkout Form */}
                            <div className="bg-cream-light/40 border border-bark-100 rounded-2xl p-6 space-y-4 shadow-sm">
                                <div className="flex items-center gap-2.5">
                                    <div className="p-2 rounded-lg bg-paper border border-bark-100 text-bark-700">
                                        <QrCode className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-bark-900">Issue Physical Book Copy</h3>
                                        <p className="text-xs text-bark-500">Scan barcode to check out physical copy to member</p>
                                    </div>
                                </div>

                                <form onSubmit={handleCheckout} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div>
                                        <label className="block text-xs font-semibold text-bark-700 mb-1">Book Barcode</label>
                                        <input
                                            type="text"
                                            value={checkoutForm.barcode}
                                            onChange={(e) => setCheckoutForm({ ...checkoutForm, barcode: e.target.value })}
                                            placeholder="e.g. BC-9780132350884-001"
                                            required
                                            className="w-full px-3 py-2 rounded-lg bg-paper border border-bark-100 text-xs text-zinc-200 focus:outline-none focus:border-bark-100 font-mono"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-bark-700 mb-1">Member ID</label>
                                        <input
                                            type="number"
                                            value={checkoutForm.member_id}
                                            onChange={(e) => setCheckoutForm({ ...checkoutForm, member_id: e.target.value })}
                                            placeholder="e.g. 1"
                                            required
                                            className="w-full px-3 py-2 rounded-lg bg-paper border border-bark-100 text-xs text-zinc-200 focus:outline-none focus:border-bark-100 font-mono"
                                        />
                                    </div>

                                    <div className="flex items-end">
                                        <button
                                            type="submit"
                                            disabled={checkoutSubmitting}
                                            className="w-full py-2 px-4 rounded-lg bg-zinc-100 hover:bg-paper text-zinc-950 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm h-9"
                                        >
                                            {checkoutSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <BookCheck className="w-4 h-4" />}
                                            <span>Issue Book Copy</span>
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* TAB 2: Add Books to Inventory & Catalog Management */}
                    {activeTab === 'add_books' && (
                        <div className="space-y-6">
                            <div className="bg-cream-light/40 border border-bark-100 rounded-2xl p-6 space-y-4 shadow-sm">
                                <div className="flex items-center justify-between border-b border-bark-100 pb-4">
                                    <div>
                                        <h2 className="text-base font-bold text-bark-900 flex items-center gap-2 font-mono">
                                            <BookOpen className="w-4 h-4 text-bark-700" /> {editingBook ? 'Edit Book Record' : 'Add New Book to Inventory'}
                                        </h2>
                                        <p className="text-xs text-bark-500 mt-0.5">Register new physical & digital title catalog entry</p>
                                    </div>
                                    {editingBook && (
                                        <button
                                            onClick={() => setEditingBook(null)}
                                            className="px-3 py-1 rounded bg-cream text-bark-700 text-xs hover:bg-zinc-700 font-mono"
                                        >
                                            Cancel Editing
                                        </button>
                                    )}
                                </div>

                                <form onSubmit={handleBookSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-bark-700 mb-1">ISBN Number</label>
                                        <input
                                            type="text"
                                            value={bookForm.isbn}
                                            onChange={(e) => setBookForm({ ...bookForm, isbn: e.target.value })}
                                            placeholder="e.g. 978-0132350884"
                                            required
                                            disabled={!!editingBook}
                                            className="w-full px-3 py-2 rounded-lg bg-paper border border-bark-100 text-xs text-zinc-200 focus:outline-none focus:border-bark-100 font-mono"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-bark-700 mb-1">Book Title</label>
                                        <input
                                            type="text"
                                            value={bookForm.title}
                                            onChange={(e) => setBookForm({ ...bookForm, title: e.target.value })}
                                            placeholder="e.g. Clean Code"
                                            required
                                            className="w-full px-3 py-2 rounded-lg bg-paper border border-bark-100 text-xs text-zinc-200 focus:outline-none focus:border-bark-100"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-bark-700 mb-1">Author Name</label>
                                        <input
                                            type="text"
                                            value={bookForm.author}
                                            onChange={(e) => setBookForm({ ...bookForm, author: e.target.value })}
                                            placeholder="e.g. Robert C. Martin"
                                            required
                                            className="w-full px-3 py-2 rounded-lg bg-paper border border-bark-100 text-xs text-zinc-200 focus:outline-none focus:border-bark-100"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-bark-700 mb-1">Publisher</label>
                                        <input
                                            type="text"
                                            value={bookForm.publisher}
                                            onChange={(e) => setBookForm({ ...bookForm, publisher: e.target.value })}
                                            placeholder="e.g. Prentice Hall"
                                            className="w-full px-3 py-2 rounded-lg bg-paper border border-bark-100 text-xs text-zinc-200 focus:outline-none focus:border-bark-100"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-bark-700 mb-1">Genre Category</label>
                                        <input
                                            type="text"
                                            value={bookForm.genre}
                                            onChange={(e) => setBookForm({ ...bookForm, genre: e.target.value })}
                                            placeholder="e.g. Software, Tech, Fiction"
                                            required
                                            className="w-full px-3 py-2 rounded-lg bg-paper border border-bark-100 text-xs text-zinc-200 focus:outline-none focus:border-bark-100"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-bark-700 mb-1">Digital Purchase Price (KES)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={bookForm.digital_purchase_price}
                                            onChange={(e) => setBookForm({ ...bookForm, digital_purchase_price: e.target.value })}
                                            className="w-full px-3 py-2 rounded-lg bg-paper border border-bark-100 text-xs text-zinc-200 focus:outline-none focus:border-bark-100 font-mono"
                                        />
                                    </div>

                                    <div className="sm:col-span-2">
                                        <label className="block text-xs font-semibold text-bark-700 mb-1">Cover Image URL</label>
                                        <input
                                            type="text"
                                            value={bookForm.cover_image_path}
                                            onChange={(e) => setBookForm({ ...bookForm, cover_image_path: e.target.value })}
                                            placeholder="https://images.unsplash.com/photo-..."
                                            className="w-full px-3 py-2 rounded-lg bg-paper border border-bark-100 text-xs text-zinc-200 focus:outline-none focus:border-bark-100 font-mono"
                                        />
                                    </div>

                                    <div className="sm:col-span-2">
                                        <label className="block text-xs font-semibold text-bark-700 mb-1">Base64 PDF / File Path</label>
                                        <input
                                            type="text"
                                            value={bookForm.file_path}
                                            onChange={(e) => setBookForm({ ...bookForm, file_path: e.target.value })}
                                            placeholder="data:application/pdf;base64,JVBERi0x..."
                                            className="w-full px-3 py-2 rounded-lg bg-paper border border-bark-100 text-xs text-zinc-200 focus:outline-none focus:border-bark-100 font-mono"
                                        />
                                    </div>

                                    <div className="sm:col-span-2">
                                        <label className="block text-xs font-semibold text-bark-700 mb-1">Description</label>
                                        <textarea
                                            value={bookForm.description}
                                            onChange={(e) => setBookForm({ ...bookForm, description: e.target.value })}
                                            rows="2"
                                            placeholder="Brief overview of book content..."
                                            className="w-full px-3 py-2 rounded-lg bg-paper border border-bark-100 text-xs text-zinc-200 focus:outline-none focus:border-bark-100"
                                        />
                                    </div>

                                    <div className="sm:col-span-2 flex justify-end">
                                        <button
                                            type="submit"
                                            disabled={bookSubmitting}
                                            className="py-2.5 px-6 rounded-lg bg-zinc-100 hover:bg-paper text-zinc-950 font-bold text-xs flex items-center gap-2 transition-all shadow-sm"
                                        >
                                            {bookSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                            <span>{editingBook ? 'Save Book Changes' : 'Add Book to Inventory'}</span>
                                        </button>
                                    </div>
                                </form>
                            </div>

                            {/* Books Catalog Table */}
                            <div className="bg-cream-light/40 border border-bark-100 rounded-2xl p-6 space-y-4 shadow-sm">
                                <h3 className="text-base font-bold text-bark-900 font-mono">Catalog Books Inventory ({books.length})</h3>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs text-bark-700 border-collapse">
                                        <thead className="bg-paper text-bark-500 uppercase text-[10px] tracking-wider font-mono">
                                            <tr>
                                                <th className="p-3 border-b border-bark-100">ISBN</th>
                                                <th className="p-3 border-b border-bark-100">Title & Author</th>
                                                <th className="p-3 border-b border-bark-100">Genre</th>
                                                <th className="p-3 border-b border-bark-100 text-center">Copies (Total/Avail)</th>
                                                <th className="p-3 border-b border-bark-100 text-center">Price</th>
                                                <th className="p-3 border-b border-bark-100 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-zinc-800/60">
                                            {books.map((b) => (
                                                <tr key={b.id} className="hover:bg-paper/50">
                                                    <td className="p-3 font-mono font-bold text-bark-700">{b.isbn}</td>
                                                    <td className="p-3">
                                                        <div className="font-bold text-bark-900">{b.title}</div>
                                                        <div className="text-[11px] text-bark-500">By {b.author}</div>
                                                    </td>
                                                    <td className="p-3 text-bark-500 font-mono">{b.genre}</td>
                                                    <td className="p-3 text-center font-mono">
                                                        <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-cream text-zinc-200 border border-bark-100">
                                                            {b.available_copies} / {b.total_copies}
                                                        </span>
                                                    </td>
                                                    <td className="p-3 text-center font-mono font-bold text-zinc-200">
                                                        KES {b.digital_purchase_price || 50.00}
                                                    </td>
                                                    <td className="p-3 text-right space-x-1.5 font-mono">
                                                        <button
                                                            onClick={() => handleToggleRestriction(b.id)}
                                                            className={`px-2 py-1 rounded text-[10px] font-bold border transition-colors ${
                                                                b.is_blocked
                                                                    ? 'bg-red-950 text-red-300 border-red-800'
                                                                    : 'bg-cream text-bark-700 border-bark-100 hover:bg-zinc-700'
                                                            }`}
                                                            title="Toggle restriction"
                                                        >
                                                            {b.is_blocked ? 'Restricted' : 'Active'}
                                                        </button>

                                                        <button
                                                            onClick={() => {
                                                                setEditingBook(b);
                                                                setBookForm({
                                                                    isbn: b.isbn, title: b.title, author: b.author,
                                                                    publisher: b.publisher || '', genre: b.genre,
                                                                    description: b.description || '',
                                                                    cover_image_path: b.cover_image_path || '',
                                                                    file_path: b.file_path || '',
                                                                    publication_year: b.publication_year || 2026,
                                                                    digital_purchase_price: b.digital_purchase_price || 50.00,
                                                                    initial_copies: b.total_copies || 1
                                                                });
                                                            }}
                                                            className="p-1.5 rounded bg-cream text-bark-700 hover:bg-zinc-700"
                                                            title="Edit book"
                                                        >
                                                            <Edit2 className="w-3.5 h-3.5" />
                                                        </button>

                                                        <button
                                                            onClick={() => handleDeleteBook(b.id)}
                                                            className="p-1.5 rounded bg-cream text-bark-500 hover:text-red-400 hover:bg-zinc-700"
                                                            title="Delete book"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 3: Book Copies Management */}
                    {activeTab === 'book_copies' && (
                        <div className="space-y-6">
                            <div className="bg-cream-light/40 border border-bark-100 rounded-2xl p-6 space-y-4 shadow-sm">
                                <h2 className="text-base font-bold text-bark-900 flex items-center gap-2 font-mono">
                                    <Layers className="w-4 h-4 text-bark-700" /> {editingCopy ? 'Edit Copy Record' : 'Register New Physical Book Copy'}
                                </h2>

                                <form onSubmit={handleCopySubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div>
                                        <label className="block text-xs font-semibold text-bark-700 mb-1">Select Book Title</label>
                                        <select
                                            value={copyForm.book_id}
                                            onChange={(e) => setCopyForm({ ...copyForm, book_id: e.target.value })}
                                            required
                                            disabled={!!editingCopy}
                                            className="w-full px-3 py-2 rounded-lg bg-paper border border-bark-100 text-xs text-zinc-200 focus:outline-none focus:border-bark-100"
                                        >
                                            <option value="">-- Choose Book --</option>
                                            {books.map((b) => (
                                                <option key={b.id} value={b.id}>{b.title} ({b.isbn})</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-bark-700 mb-1">Barcode</label>
                                        <input
                                            type="text"
                                            value={copyForm.barcode}
                                            onChange={(e) => setCopyForm({ ...copyForm, barcode: e.target.value })}
                                            placeholder="e.g. BC-9780132350884-005"
                                            required
                                            disabled={!!editingCopy}
                                            className="w-full px-3 py-2 rounded-lg bg-paper border border-bark-100 text-xs text-zinc-200 focus:outline-none focus:border-bark-100 font-mono"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-bark-700 mb-1">Location Rack</label>
                                        <input
                                            type="text"
                                            value={copyForm.location_rack}
                                            onChange={(e) => setCopyForm({ ...copyForm, location_rack: e.target.value })}
                                            placeholder="e.g. Rack-4"
                                            className="w-full px-3 py-2 rounded-lg bg-paper border border-bark-100 text-xs text-zinc-200 focus:outline-none focus:border-bark-100 font-mono"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-bark-700 mb-1">Condition</label>
                                        <select
                                            value={copyForm.condition}
                                            onChange={(e) => setCopyForm({ ...copyForm, condition: e.target.value })}
                                            className="w-full px-3 py-2 rounded-lg bg-paper border border-bark-100 text-xs text-zinc-200 focus:outline-none focus:border-bark-100"
                                        >
                                            <option value="good">Good</option>
                                            <option value="damaged">Damaged</option>
                                            <option value="lost">Lost</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-bark-700 mb-1">Availability Status</label>
                                        <select
                                            value={copyForm.status}
                                            onChange={(e) => setCopyForm({ ...copyForm, status: e.target.value })}
                                            className="w-full px-3 py-2 rounded-lg bg-paper border border-bark-100 text-xs text-zinc-200 focus:outline-none focus:border-bark-100 font-mono"
                                        >
                                            <option value="available">available</option>
                                            <option value="checked_out">checked_out</option>
                                            <option value="reserved">reserved</option>
                                            <option value="maintenance">maintenance</option>
                                        </select>
                                    </div>

                                    <div className="flex items-end gap-2">
                                        <button
                                            type="submit"
                                            disabled={copySubmitting}
                                            className="flex-1 py-2 px-4 rounded-lg bg-zinc-100 hover:bg-paper text-zinc-950 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm h-9"
                                        >
                                            {copySubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                            <span>{editingCopy ? 'Save Copy' : 'Add Copy'}</span>
                                        </button>
                                        {editingCopy && (
                                            <button
                                                type="button"
                                                onClick={() => { setEditingCopy(null); setCopyForm({ book_id: '', barcode: '', condition: 'good', status: 'available', location_rack: 'Rack-1' }); }}
                                                className="px-3 py-2 rounded-lg bg-cream text-bark-700 text-xs hover:bg-zinc-700 h-9"
                                            >
                                                Cancel
                                            </button>
                                        )}
                                    </div>
                                </form>
                            </div>

                            {/* Book Copies Table */}
                            <div className="bg-cream-light/40 border border-bark-100 rounded-2xl p-6 space-y-4 shadow-sm">
                                <h3 className="text-base font-bold text-bark-900 font-mono">Registered Physical Copies ({copies.length})</h3>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs text-bark-700 border-collapse">
                                        <thead className="bg-paper text-bark-500 uppercase text-[10px] tracking-wider font-mono">
                                            <tr>
                                                <th className="p-3 border-b border-bark-100">Barcode</th>
                                                <th className="p-3 border-b border-bark-100">Book Title</th>
                                                <th className="p-3 border-b border-bark-100">Rack Location</th>
                                                <th className="p-3 border-b border-bark-100 text-center">Condition</th>
                                                <th className="p-3 border-b border-bark-100 text-center">Status</th>
                                                <th className="p-3 border-b border-bark-100 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-zinc-800/60 font-mono">
                                            {copies.map((c) => (
                                                <tr key={c.id} className="hover:bg-paper/50">
                                                    <td className="p-3 font-bold text-bark-900">{c.barcode}</td>
                                                    <td className="p-3 font-sans font-semibold text-zinc-200">
                                                        {c.book ? c.book.title : `Book #${c.book_id}`}
                                                    </td>
                                                    <td className="p-3 text-bark-500">{c.location_rack || 'N/A'}</td>
                                                    <td className="p-3 text-center capitalize">{c.condition}</td>
                                                    <td className="p-3 text-center">
                                                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                                                            c.status === 'available' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-cream text-bark-700 border border-bark-100'
                                                        }`}>
                                                            {c.status}
                                                        </span>
                                                    </td>
                                                    <td className="p-3 text-right space-x-1.5">
                                                        <button
                                                            onClick={() => {
                                                                setEditingCopy(c);
                                                                setCopyForm({
                                                                    book_id: c.book_id,
                                                                    barcode: c.barcode,
                                                                    condition: c.condition,
                                                                    status: c.status,
                                                                    location_rack: c.location_rack || 'Rack-1'
                                                                });
                                                            }}
                                                            className="p-1.5 rounded bg-cream text-bark-700 hover:bg-zinc-700"
                                                        >
                                                            <Edit2 className="w-3.5 h-3.5" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteCopy(c.id)}
                                                            className="p-1.5 rounded bg-cream text-bark-500 hover:text-red-400 hover:bg-zinc-700"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 4: Process Book Returns */}
                    {activeTab === 'returns' && (
                        <div className="space-y-6">
                            <div className="bg-cream-light/40 border border-bark-100 rounded-2xl p-6 space-y-4 shadow-sm">
                                <h2 className="text-base font-bold text-bark-900 flex items-center gap-2 font-mono">
                                    <BookCheck className="w-4 h-4 text-bark-700" /> Active Loans Directory & Instant Return Desk
                                </h2>

                                {loading ? (
                                    <div className="flex items-center justify-center py-8 text-bark-500 font-mono text-xs">
                                        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading active loans...
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-xs text-bark-700 border-collapse">
                                            <thead className="bg-paper text-bark-500 uppercase text-[10px] tracking-wider font-mono">
                                                <tr>
                                                    <th className="p-3 border-b border-bark-100">Loan ID</th>
                                                    <th className="p-3 border-b border-bark-100">Member Info</th>
                                                    <th className="p-3 border-b border-bark-100">Book Copy & Barcode</th>
                                                    <th className="p-3 border-b border-bark-100 font-mono">Loan / Due Date</th>
                                                    <th className="p-3 border-b border-bark-100 text-center">Status</th>
                                                    <th className="p-3 border-b border-bark-100 text-right">Process Action</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-zinc-800/60 font-mono">
                                                {activeLoans.map((loan) => (
                                                    <tr key={loan.id} className="hover:bg-paper/50">
                                                        <td className="p-3 font-bold text-zinc-200">#LOAN-{loan.id}</td>
                                                        <td className="p-3 font-sans">
                                                            <div className="font-semibold text-bark-900">{loan.member?.user?.name || `Member #${loan.member_id}`}</div>
                                                            <div className="text-[11px] font-mono text-bark-500">{loan.member?.member_number}</div>
                                                        </td>
                                                        <td className="p-3 font-sans">
                                                            <div className="font-bold text-zinc-200">{loan.copy?.book?.title || 'Book Title'}</div>
                                                            <div className="text-[11px] font-mono text-bark-500">{loan.copy?.barcode}</div>
                                                        </td>
                                                        <td className="p-3 text-bark-700 text-[11px]">
                                                            <div>Loan: {loan.loan_date}</div>
                                                            <div className="text-bark-500">Due: {loan.due_date}</div>
                                                        </td>
                                                        <td className="p-3 text-center">
                                                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                                                                loan.status === 'returned' ? 'bg-cream text-bark-500 border border-bark-100' : loan.status === 'overdue' ? 'bg-red-950 text-red-300 border border-red-800' : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                                            }`}>
                                                                {loan.status}
                                                            </span>
                                                        </td>
                                                        <td className="p-3 text-right">
                                                            {loan.status !== 'returned' ? (
                                                                <button
                                                                    onClick={() => handleReturn(loan.id)}
                                                                    disabled={returnSubmitting}
                                                                    className="py-1.5 px-3 rounded-lg bg-zinc-100 hover:bg-paper text-zinc-950 font-bold text-xs transition-all shadow-sm font-sans"
                                                                >
                                                                    Process Return
                                                                </button>
                                                            ) : (
                                                                <span className="text-[11px] text-bark-500">Returned</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* TAB 5: Valid Subscriptions (CRUD Operations) */}
                    {activeTab === 'subscriptions' && (
                        <div className="space-y-6">
                            <div className="bg-cream-light/40 border border-bark-100 rounded-2xl p-6 space-y-4 shadow-sm">
                                <h2 className="text-base font-bold text-bark-900 flex items-center gap-2 font-mono">
                                    <CreditCard className="w-4 h-4 text-bark-700" /> {editingSub ? 'Edit Member Subscription' : 'Grant New Member Perk Subscription'}
                                </h2>

                                <form onSubmit={handleSubSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div>
                                        <label className="block text-xs font-semibold text-bark-700 mb-1">Select Member</label>
                                        <select
                                            value={subForm.member_id}
                                            onChange={(e) => setSubForm({ ...subForm, member_id: e.target.value })}
                                            required
                                            disabled={!!editingSub}
                                            className="w-full px-3 py-2 rounded-lg bg-paper border border-bark-100 text-xs text-zinc-200 focus:outline-none focus:border-bark-100"
                                        >
                                            <option value="">-- Choose Member --</option>
                                            {members.map((m) => (
                                                <option key={m.id} value={m.id}>{m.name} ({m.member_number})</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-bark-700 mb-1">Subscription Plan Type</label>
                                        <input
                                            type="text"
                                            value={subForm.plan_type}
                                            onChange={(e) => setSubForm({ ...subForm, plan_type: e.target.value })}
                                            placeholder="e.g. pro_perks_monthly, vip_annual"
                                            required
                                            className="w-full px-3 py-2 rounded-lg bg-paper border border-bark-100 text-xs text-zinc-200 focus:outline-none focus:border-bark-100 font-mono"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-bark-700 mb-1">Payment Amount (KES)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={subForm.amount_paid}
                                            onChange={(e) => setSubForm({ ...subForm, amount_paid: e.target.value })}
                                            required
                                            disabled={!!editingSub}
                                            className="w-full px-3 py-2 rounded-lg bg-paper border border-bark-100 text-xs text-zinc-200 focus:outline-none focus:border-bark-100 font-mono"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-bark-700 mb-1">Payment Status</label>
                                        <select
                                            value={subForm.payment_status}
                                            onChange={(e) => setSubForm({ ...subForm, payment_status: e.target.value })}
                                            className="w-full px-3 py-2 rounded-lg bg-paper border border-bark-100 text-xs text-zinc-200 focus:outline-none focus:border-bark-100 font-mono"
                                        >
                                            <option value="paid">paid</option>
                                            <option value="pending">pending</option>
                                            <option value="failed">failed</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-bark-700 mb-1">Expiration Date</label>
                                        <input
                                            type="date"
                                            value={subForm.expires_at}
                                            onChange={(e) => setSubForm({ ...subForm, expires_at: e.target.value })}
                                            className="w-full px-3 py-2 rounded-lg bg-paper border border-bark-100 text-xs text-zinc-200 focus:outline-none focus:border-bark-100 font-mono"
                                        />
                                    </div>

                                    <div className="flex items-end gap-2">
                                        <button
                                            type="submit"
                                            disabled={subSubmitting}
                                            className="flex-1 py-2 px-4 rounded-lg bg-zinc-100 hover:bg-paper text-zinc-950 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm h-9"
                                        >
                                            {subSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                            <span>{editingSub ? 'Save Subscription' : 'Grant Subscription'}</span>
                                        </button>
                                        {editingSub && (
                                            <button
                                                type="button"
                                                onClick={() => { setEditingSub(null); setSubForm({ member_id: '', plan_type: 'pro_perks_monthly', amount_paid: 500.00, payment_status: 'paid', expires_at: '' }); }}
                                                className="px-3 py-2 rounded-lg bg-cream text-bark-700 text-xs hover:bg-zinc-700 h-9"
                                            >
                                                Cancel
                                            </button>
                                        )}
                                    </div>
                                </form>
                            </div>

                            {/* Subscriptions Table */}
                            <div className="bg-cream-light/40 border border-bark-100 rounded-2xl p-6 space-y-4 shadow-sm">
                                <h3 className="text-base font-bold text-bark-900 font-mono">Valid Member Perk Subscriptions ({subscriptions.length})</h3>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs text-bark-700 border-collapse">
                                        <thead className="bg-paper text-bark-500 uppercase text-[10px] tracking-wider font-mono">
                                            <tr>
                                                <th className="p-3 border-b border-bark-100">Sub ID / Reference</th>
                                                <th className="p-3 border-b border-bark-100">Member</th>
                                                <th className="p-3 border-b border-bark-100">Plan Type</th>
                                                <th className="p-3 border-b border-bark-100 text-center">Discount</th>
                                                <th className="p-3 border-b border-bark-100 text-center">Amount Paid</th>
                                                <th className="p-3 border-b border-bark-100 text-center">Status</th>
                                                <th className="p-3 border-b border-bark-100 font-mono">Expires At</th>
                                                <th className="p-3 border-b border-bark-100 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-zinc-800/60 font-mono">
                                            {subscriptions.map((s) => (
                                                <tr key={s.id} className="hover:bg-paper/50">
                                                    <td className="p-3 font-bold text-zinc-200">
                                                        #{s.id}
                                                        <div className="text-[10px] text-bark-500 font-mono">{s.transaction_reference || 'REF-N/A'}</div>
                                                    </td>
                                                    <td className="p-3 font-sans">
                                                        <div className="font-semibold text-bark-900">{s.member?.user?.name || s.user?.name || `Member #${s.member_id}`}</div>
                                                        <div className="text-[11px] font-mono text-bark-500">{s.member?.member_number}</div>
                                                    </td>
                                                    <td className="p-3 text-bark-700">{s.plan_type}</td>
                                                    <td className="p-3 text-center text-bark-700">{s.discount_percentage}% OFF</td>
                                                    <td className="p-3 text-center font-bold text-bark-900">KES {s.amount_paid}</td>
                                                    <td className="p-3 text-center">
                                                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                                                            s.payment_status === 'paid' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-cream text-bark-500 border border-bark-100'
                                                        }`}>
                                                            {s.payment_status}
                                                        </span>
                                                    </td>
                                                    <td className="p-3 text-bark-500 text-[11px]">
                                                        {s.expires_at ? s.expires_at.slice(0, 10) : 'Permanent'}
                                                    </td>
                                                    <td className="p-3 text-right space-x-1.5 font-sans">
                                                        <button
                                                            onClick={() => {
                                                                setEditingSub(s);
                                                                setSubForm({
                                                                    member_id: s.member_id,
                                                                    plan_type: s.plan_type,
                                                                    amount_paid: s.amount_paid,
                                                                    payment_status: s.payment_status,
                                                                    expires_at: s.expires_at ? s.expires_at.slice(0, 10) : ''
                                                                });
                                                            }}
                                                            className="p-1.5 rounded bg-cream text-bark-700 hover:bg-zinc-700"
                                                        >
                                                            <Edit2 className="w-3.5 h-3.5" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteSub(s.id)}
                                                            className="p-1.5 rounded bg-cream text-bark-500 hover:text-red-400 hover:bg-zinc-700"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 6: Reimbursement Requests */}
                    {activeTab === 'reimbursements' && (
                        <div className="space-y-6">
                            <div className="bg-cream-light/40 border border-bark-100 rounded-2xl p-5">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h2 className="text-sm font-extrabold text-bark-900 flex items-center gap-2">
                                            <DollarSign className="w-4 h-4 text-bark-700" /> Reimbursement Requests
                                        </h2>
                                        <p className="text-[11px] text-bark-500 mt-0.5">Review, approve, or reject member refund applications.</p>
                                    </div>
                                    <button
                                        onClick={async () => {
                                            setReimbLoading(true);
                                            try {
                                                const res = await api.getLibrarianReimbursements();
                                                setReimbursements(res.data || []);
                                            } catch(e) {}
                                            setReimbLoading(false);
                                        }}
                                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-paper border border-bark-100 text-bark-500 hover:text-bark-900 text-xs transition"
                                    >
                                        <RefreshCw className={`w-3.5 h-3.5 ${reimbLoading ? 'animate-spin' : ''}`} />
                                        Refresh
                                    </button>
                                </div>

                                {reimbursements.length === 0 ? (
                                    <div className="text-center py-12 text-bark-500 text-xs">
                                        <DollarSign className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                        No reimbursement requests submitted yet.
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {reimbursements.map((req) => (
                                            <div key={req.id} className={`rounded-2xl border p-4 space-y-3 ${
                                                req.status === 'approved'
                                                    ? 'bg-emerald-950/30 border-emerald-800'
                                                    : req.status === 'rejected'
                                                    ? 'bg-rose-950/30 border-rose-800'
                                                    : 'bg-amber-950/20 border-amber-700'
                                            }`}>
                                                <div className="flex items-start justify-between gap-3 flex-wrap">
                                                    <div className="space-y-0.5">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <span className="text-xs font-bold text-bark-900">{req.user_name}</span>
                                                            <span className="text-[10px] text-bark-500">{req.user_email}</span>
                                                            <span className="font-mono text-[10px] text-bark-400">{req.id}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-[11px] text-bark-500">
                                                            <span>Tier: <strong className="capitalize text-bark-700">{req.membership_tier}</strong></span>
                                                            <span>·</span>
                                                            <span>Amount: <strong className="text-bark-700">KES {req.amount?.toLocaleString()}</strong></span>
                                                            <span>·</span>
                                                            <span>{req.created_at?.slice(0, 10)}</span>
                                                        </div>
                                                        <p className="text-[11px] text-bark-600 italic mt-1">Reason: {req.reason}</p>
                                                        {req.status === 'rejected' && req.rejection_reason && (
                                                            <p className="text-[11px] text-rose-400 mt-0.5">Rejection note: {req.rejection_reason}</p>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2 shrink-0">
                                                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase ${
                                                            req.status === 'approved'
                                                                ? 'bg-emerald-900 text-emerald-300 border border-emerald-700'
                                                                : req.status === 'rejected'
                                                                ? 'bg-rose-900 text-rose-300 border border-rose-700'
                                                                : 'bg-amber-900 text-amber-300 border border-amber-700'
                                                        }`}>
                                                            {req.status === 'approved' ? '✓ Approved' : req.status === 'rejected' ? '✗ Rejected' : '⏳ Pending'}
                                                        </span>
                                                    </div>
                                                </div>

                                                {req.status === 'pending' && (
                                                    <ReimbursementReviewActions
                                                        req={req}
                                                        onReviewed={(updated) => {
                                                            setReimbursements(prev =>
                                                                prev.map(r => r.id === updated.id ? updated : r)
                                                            );
                                                            setSuccessMsg(`Request ${updated.id} has been ${updated.status}.`);
                                                        }}
                                                        onError={(msg) => setErrorMsg(msg)}
                                                    />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}

// ─── Inline subcomponent for Approve / Reject actions ────────────────────────
function ReimbursementReviewActions({ req, onReviewed, onError }) {
    const [rejectionReason, setRejectionReason] = useState('');
    const [showRejectInput, setShowRejectInput] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const handleApprove = async () => {
        setSubmitting(true);
        try {
            const res = await api.reviewReimbursement(req.id, { action: 'approve' });
            onReviewed(res.data);
        } catch (e) {
            onError(e.message || 'Failed to approve reimbursement.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleReject = async () => {
        if (!rejectionReason.trim()) {
            onError('Please provide a rejection reason.');
            return;
        }
        setSubmitting(true);
        try {
            const res = await api.reviewReimbursement(req.id, {
                action: 'reject',
                rejection_reason: rejectionReason,
            });
            onReviewed(res.data);
        } catch (e) {
            onError(e.message || 'Failed to reject reimbursement.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="border-t border-bark-100/20 pt-3 space-y-2">
            {showRejectInput ? (
                <div className="space-y-2">
                    <textarea
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="Provide a reason for rejection..."
                        rows={2}
                        className="w-full bg-paper border border-bark-200 rounded-xl p-2.5 text-xs text-bark-900 focus:outline-none focus:border-bark-500"
                    />
                    <div className="flex gap-2">
                        <button
                            onClick={handleReject}
                            disabled={submitting}
                            className="flex-1 py-2 rounded-xl bg-rose-700 hover:bg-rose-900 text-white text-xs font-bold flex items-center justify-center gap-1.5"
                        >
                            {submitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />}
                            Confirm Rejection
                        </button>
                        <button
                            onClick={() => setShowRejectInput(false)}
                            className="px-3 py-2 rounded-xl border border-bark-200 text-bark-500 text-xs hover:bg-cream"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            ) : (
                <div className="flex gap-2">
                    <button
                        onClick={handleApprove}
                        disabled={submitting}
                        className="flex-1 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-900 text-white text-xs font-bold flex items-center justify-center gap-1.5"
                    >
                        {submitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                        Approve & Process Refund
                    </button>
                    <button
                        onClick={() => setShowRejectInput(true)}
                        disabled={submitting}
                        className="flex-1 py-2 rounded-xl bg-rose-900/60 hover:bg-rose-900 text-rose-300 text-xs font-bold flex items-center justify-center gap-1.5 border border-rose-800"
                    >
                        <XCircle className="w-3 h-3" />
                        Reject Request
                    </button>
                </div>
            )}
        </div>
    );
}
