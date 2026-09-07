import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLibrary } from '../context/LibraryContext';
import { 
    QrCode, BookCheck, ShieldAlert, CheckCircle2, Users, BarChart3, AlertCircle, Loader2, BookOpen,
    Plus, Edit2, Trash2, Search, X, Layers, Table, CreditCard, ChevronLeft, ChevronRight, Menu, Activity, Shield,
    DollarSign, RefreshCw, XCircle, ChevronDown, Sparkles, Globe, DownloadCloud, UploadCloud, FileText, Image as ImageIcon,
    Eye, ExternalLink, Check, BookmarkCheck, UserCheck, UserX, Clock
} from 'lucide-react';
import { api } from '../services/api';

function generateIsbn13() {
    const prefix = '978';
    const country = '0';
    const random8 = Array.from({ length: 8 }, () => Math.floor(Math.random() * 10)).join('');
    const first12 = `${prefix}${country}${random8}`;
    let sum = 0;
    for (let i = 0; i < 12; i++) {
        sum += parseInt(first12[i], 10) * (i % 2 === 0 ? 1 : 3);
    }
    const check = (10 - (sum % 10)) % 10;
    const full = `${first12}${check}`;
    return `${full.slice(0, 3)}-${full.slice(3, 4)}-${full.slice(4, 8)}-${full.slice(8, 12)}-${full.slice(12)}`;
}

export default function LibrarianDashboard() {
    const { user, setUser } = useAuth();
    const { pushToast } = useLibrary();

    // First-Time Password Change State
    const [pwdForm, setPwdForm] = useState({ new_password: '', new_password_confirmation: '' });
    const [pwdSubmitting, setPwdSubmitting] = useState(false);
    const [pwdError, setPwdError] = useState(null);
    const mustChangePassword = Boolean(user?.must_change_password);

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
    const [refundRequests, setRefundRequests] = useState([]);
    const [reimbLoading, setReimbLoading] = useState(false);
    const [loading, setLoading] = useState(true);

    // Open Library Integration State
    const [olQuery, setOlQuery] = useState('');
    const [olSubject, setOlSubject] = useState('technology');
    const [olResults, setOlResults] = useState([]);
    const [olLoading, setOlLoading] = useState(false);
    const [olImportingKeys, setOlImportingKeys] = useState([]);
    const [olImportAllLoading, setOlImportAllLoading] = useState(false);

    // Member Directory Search & Filters State
    const [directorySearch, setDirectorySearch] = useState('');
    const [tierFilter, setTierFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [sortBy, setSortBy] = useState('name');

    const filteredMembers = members.filter((m) => {
        if (directorySearch) {
            const q = directorySearch.toLowerCase();
            const nameMatch = String(m.name || '').toLowerCase().includes(q);
            const emailMatch = String(m.email || '').toLowerCase().includes(q);
            const numMatch = String(m.member_number || '').toLowerCase().includes(q);
            if (!nameMatch && !emailMatch && !numMatch) return false;
        }
        if (tierFilter !== 'all') {
            if ((m.membership_tier || '').toLowerCase() !== tierFilter.toLowerCase()) return false;
        }
        if (statusFilter === 'banned' && !m.is_banned) return false;
        if (statusFilter === 'active' && m.is_banned) return false;
        if (statusFilter === 'subscribed' && !m.is_subscribed) return false;
        return true;
    }).sort((a, b) => {
        if (sortBy === 'name') return String(a.name || '').localeCompare(String(b.name || ''));
        if (sortBy === 'newest') return (b.id || 0) - (a.id || 0);
        if (sortBy === 'loans') return (b.active_loans_count || 0) - (a.active_loans_count || 0);
        if (sortBy === 'limit') return (b.borrow_limit || 0) - (a.borrow_limit || 0);
        return 0;
    });

    const fetchRefundRequests = async () => {
        try {
            const res = await api.getLibrarianRefundRequests();
            setRefundRequests(res.data || res || []);
        } catch (err) {
            setRefundRequests([]);
        }
    };

    const handleApproveRefund = async (id) => {
        if (!window.confirm(`Approve refund request #${id}? This will cancel the member's active subscription pass.`)) return;
        setSuccessMsg(null);
        setErrorMsg(null);
        try {
            await api.approveLibrarianRefund(id);
            setSuccessMsg(`Refund request #${id} approved successfully and subscription pass deactivated.`);
            fetchRefundRequests();
        } catch (err) {
            setErrorMsg(err.message || 'Failed to approve refund request.');
        }
    };

    const handleRejectRefund = async (id) => {
        if (!window.confirm(`Reject / Revoke refund request #${id}?`)) return;
        setSuccessMsg(null);
        setErrorMsg(null);
        try {
            await api.rejectLibrarianRefund(id);
            setSuccessMsg(`Refund request #${id} rejected.`);
            fetchRefundRequests();
        } catch (err) {
            setErrorMsg(err.message || 'Failed to reject refund request.');
        }
    };

    const handleFirstTimePasswordChange = async (e) => {
        e.preventDefault();
        setPwdSubmitting(true);
        setPwdError(null);

        if (pwdForm.new_password !== pwdForm.new_password_confirmation) {
            setPwdError('Passwords do not match. Please verify your entries.');
            setPwdSubmitting(false);
            return;
        }

        try {
            const res = await api.changeFirstLoginPassword({
                new_password: pwdForm.new_password,
                new_password_confirmation: pwdForm.new_password_confirmation,
            });
            const updatedUser = res.user || res.data?.user;
            if (updatedUser) {
                setUser(updatedUser);
                localStorage.setItem('smartlib_user', JSON.stringify(updatedUser));
            } else {
                setUser({ ...user, must_change_password: false });
            }
            setSuccessMsg('Your staff password has been set! Full access granted.');
        } catch (err) {
            setPwdError(err.message || 'Failed to update password.');
        } finally {
            setPwdSubmitting(false);
        }
    };

    // Global Message/Error State
    const [successMsg, setSuccessMsg] = useState(null);
    const [errorMsg, setErrorMsg] = useState(null);

    // Quick Checkout State
    const [checkoutForm, setCheckoutForm] = useState({ barcode: '', member_id: '', days: 14 });
    const [checkoutSubmitting, setCheckoutSubmitting] = useState(false);

    // Quick Return State
    const [returnForm, setReturnForm] = useState({ loan_id: '' });
    const [returnSubmitting, setReturnSubmitting] = useState(false);

    // Add Book Form State (Minipage)
    const [bookForm, setBookForm] = useState({
        isbn: generateIsbn13(), title: '', author: '', publisher: '', genre: 'Software',
        description: '', cover_image_path: '', file_path: '', publication_year: 2026,
        digital_purchase_price: 50.00, foreign_price: '', foreign_currency: 'USD', initial_copies: 1
    });
    const [bookSubmitting, setBookSubmitting] = useState(false);
    const [editingBook, setEditingBook] = useState(null);
    const [fileMeta, setFileMeta] = useState(null);
    const [catalogSearch, setCatalogSearch] = useState('');

    // Add/Edit Book Copy Form State
    const [copyForm, setCopyForm] = useState({
        book_id: '', barcode: '', condition: 'good', status: 'available', location_rack: 'Rack-1'
    });
    const [copySubmitting, setCopySubmitting] = useState(false);
    const [editingCopy, setEditingCopy] = useState(null);
    const [selectedBookForCopies, setSelectedBookForCopies] = useState(null);
    const [copiesSearch, setCopiesSearch] = useState('');

    // Subscription Form & Modal State
    const [subForm, setSubForm] = useState({
        member_id: '', plan_type: 'pro_perks_monthly', amount_paid: 500.00, payment_status: 'paid', expires_at: ''
    });
    const [subSubmitting, setSubSubmitting] = useState(false);
    const [editingSub, setEditingSub] = useState(null);
    const [subSearchQuery, setSubSearchQuery] = useState('');
    const [memberSearchInput, setMemberSearchInput] = useState('');
    const [isMemberDropdownOpen, setIsMemberDropdownOpen] = useState(false);
    const [subTabFilter, setSubTabFilter] = useState('active'); // 'active' | 'all'

    const applySubPreset = (days, planType, price) => {
        const expiry = new Date();
        expiry.setDate(expiry.getDate() + days);
        const yyyy = expiry.getFullYear();
        const mm = String(expiry.getMonth() + 1).padStart(2, '0');
        const dd = String(expiry.getDate()).padStart(2, '0');
        setSubForm(prev => ({
            ...prev,
            plan_type: planType,
            amount_paid: price,
            expires_at: `${yyyy}-${mm}-${dd}`
        }));
    };

    const getDurationInfo = (sub) => {
        if (!sub.expires_at) {
            return { text: 'Unlimited Pass', badgeClass: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800', isExpired: false, days: Infinity };
        }
        const now = new Date();
        const expiry = new Date(sub.expires_at);
        const diffMs = expiry - now;
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays <= 0) {
            return { text: `Expired (${Math.abs(diffDays)}d ago)`, badgeClass: 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800', isExpired: true, days: diffDays };
        }
        if (diffDays <= 7) {
            return { text: `${diffDays} days left`, badgeClass: 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800', isExpired: false, days: diffDays };
        }
        return { text: `${diffDays} days remaining`, badgeClass: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800', isExpired: false, days: diffDays };
    };

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

            // Fetch reimbursements and refund requests separately (soft-fail)
            try {
                const reimbRes = await api.getLibrarianReimbursements();
                setReimbursements(reimbRes.data || []);
            } catch (_) {}
            fetchRefundRequests();
        } catch (err) {
            setErrorMsg(err.message || 'Failed to load librarian data.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllData();
    }, []);

    // Open Library Handlers
    const handleSearchOpenLibrary = async (subjectOverride = null) => {
        setOlLoading(true);
        setErrorMsg(null);
        try {
            const sub = subjectOverride !== null ? subjectOverride : olSubject;
            const res = await api.searchOpenLibrary({
                query: olQuery,
                subject: sub,
                limit: 12,
            });
            setOlResults(res.data || res || []);
        } catch (err) {
            setErrorMsg(err.message || 'Failed to search Open Library.');
        } finally {
            setOlLoading(false);
        }
    };

    const handleImportSingleOpenLibrary = async (bookItem) => {
        const itemKey = bookItem.openlibrary_key || bookItem.isbn || bookItem.title;
        setOlImportingKeys((prev) => [...prev, itemKey]);
        setErrorMsg(null);
        try {
            await api.importOpenLibraryBooks([bookItem]);
            setSuccessMsg(`Successfully imported "${bookItem.title}" into library catalog!`);
            fetchAllData();
        } catch (err) {
            setErrorMsg(err.message || 'Failed to import book.');
        } finally {
            setOlImportingKeys((prev) => prev.filter((k) => k !== itemKey));
        }
    };

    const handleImportAllOpenLibrary = async () => {
        if (olResults.length === 0) return;
        setOlImportAllLoading(true);
        setErrorMsg(null);
        try {
            const res = await api.importOpenLibraryBooks(olResults);
            setSuccessMsg(`Successfully imported ${res.data?.length || olResults.length} books into catalog!`);
            fetchAllData();
        } catch (err) {
            setErrorMsg(err.message || 'Failed to batch import books.');
        } finally {
            setOlImportAllLoading(false);
        }
    };

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

            pushToast({ title: 'Book Issued', detail: `Barcode ${checkoutForm.barcode} checked out to member #${checkoutForm.member_id}.`, tone: 'success' });
            setCheckoutForm({ barcode: '', member_id: '', days: 14 });
            fetchAllData();
        } catch (err) {
            pushToast({ title: 'Checkout Failed', detail: err.message || 'Checkout failed.', tone: 'error' });
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
            pushToast({ title: 'Book Returned', detail: `Loan #${loanId} returned and marked available in catalog.`, tone: 'success' });
            setReturnForm({ loan_id: '' });
            fetchAllData();
        } catch (err) {
            pushToast({ title: 'Return Failed', detail: err.message || 'Return processing failed.', tone: 'error' });
            setErrorMsg(err.message || 'Return processing failed.');
        } finally {
            setReturnSubmitting(false);
        }
    };

    // Local Upload Handlers (Base64)
    const handleLocalFileUpload = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 25 * 1024 * 1024) {
            pushToast({ title: 'File Too Large', detail: 'Book file exceeds 25MB limit.', tone: 'error' });
            return;
        }
        setFileMeta({
            name: file.name,
            size: (file.size / 1024).toFixed(1) + ' KB',
            type: file.name.split('.').pop()?.toUpperCase() || 'FILE'
        });
        const reader = new FileReader();
        reader.onload = () => {
            setBookForm(prev => ({ ...prev, file_path: reader.result }));
            pushToast({ title: 'Book File Attached', detail: `${file.name} encoded as Base64 for digital reader.`, tone: 'success' });
        };
        reader.readAsDataURL(file);
    };

    const handleLocalCoverUpload = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            pushToast({ title: 'Image Too Large', detail: 'Cover image exceeds 5MB limit.', tone: 'error' });
            return;
        }
        const reader = new FileReader();
        reader.onload = () => {
            setBookForm(prev => ({ ...prev, cover_image_path: reader.result }));
            pushToast({ title: 'Cover Uploaded', detail: 'Book cover image preview updated.', tone: 'success' });
        };
        reader.readAsDataURL(file);
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
                pushToast({ title: 'Catalog Updated', detail: `Book "${bookForm.title}" updated successfully.`, tone: 'success' });
                setEditingBook(null);
            } else {
                await api.createBook(bookForm);
                pushToast({ title: 'Book Ingested', detail: `Book "${bookForm.title}" added to inventory with ISBN ${bookForm.isbn}.`, tone: 'success' });
            }
            setBookForm({
                isbn: generateIsbn13(), title: '', author: '', publisher: '', genre: 'Software',
                description: '', cover_image_path: '', file_path: '', publication_year: 2026,
                digital_purchase_price: 50.00, foreign_price: '', foreign_currency: 'USD', initial_copies: 1
            });
            setFileMeta(null);
            fetchAllData();
        } catch (err) {
            pushToast({ title: 'Ingestion Failed', detail: err.message || 'Failed to save book.', tone: 'error' });
            setErrorMsg(err.message || 'Failed to save book.');
        } finally {
            setBookSubmitting(false);
        }
    };

    const handleDeleteBook = async (id) => {
        if (!window.confirm('Are you sure you want to remove this book from catalog?')) return;
        try {
            await api.deleteBook(id);
            pushToast({ title: 'Book Removed', detail: 'Book removed from catalog inventory.', tone: 'info' });
            fetchAllData();
        } catch (err) {
            pushToast({ title: 'Delete Failed', detail: err.message || 'Failed to delete book.', tone: 'error' });
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
                pushToast({ title: 'Copy Updated', detail: `Barcode ${copyForm.barcode} set to ${copyForm.status} (${copyForm.condition}).`, tone: 'success' });
                setEditingCopy(null);
            } else {
                const targetBookId = selectedBookForCopies?.id || parseInt(copyForm.book_id, 10);
                await api.createLibrarianCopy({
                    book_id: targetBookId,
                    barcode: copyForm.barcode,
                    condition: copyForm.condition,
                    status: copyForm.status,
                    location_rack: copyForm.location_rack
                });
                pushToast({ title: 'Copy Registered', detail: `Barcode ${copyForm.barcode} added to inventory.`, tone: 'success' });
            }
            setCopyForm({ book_id: selectedBookForCopies?.id || '', barcode: '', condition: 'good', status: 'available', location_rack: 'Rack-1' });
            fetchAllData();
        } catch (err) {
            pushToast({ title: 'Copy Error', detail: err.message || 'Failed to save copy record.', tone: 'error' });
            setErrorMsg(err.message || 'Failed to save book copy.');
        } finally {
            setCopySubmitting(false);
        }
    };

    const handleDeleteCopy = async (id, barcode = '') => {
        if (!window.confirm(`Delete physical copy ${barcode || `#${id}`} from inventory?`)) return;
        try {
            await api.deleteLibrarianCopy(id);
            pushToast({ title: 'Copy Deleted', detail: `Physical copy ${barcode || `#${id}`} removed from inventory.`, tone: 'info' });
            fetchAllData();
        } catch (err) {
            pushToast({ title: 'Delete Failed', detail: err.message || 'Failed to delete copy.', tone: 'error' });
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
                pushToast({ title: 'Subscription Updated', detail: `Plan "${subForm.plan_type}" updated successfully.`, tone: 'success' });
                setEditingSub(null);
            } else {
                await api.createLibrarianSubscription({
                    member_id: parseInt(subForm.member_id, 10),
                    plan_type: subForm.plan_type,
                    amount_paid: parseFloat(subForm.amount_paid),
                    payment_status: subForm.payment_status,
                    expires_at: subForm.expires_at || null
                });
                pushToast({ title: 'Subscription Granted', detail: `Member perk pass "${subForm.plan_type}" activated.`, tone: 'success' });
            }
            setSubForm({ member_id: '', plan_type: 'pro_perks_monthly', amount_paid: 500.00, payment_status: 'paid', expires_at: '' });
            setMemberSearchInput('');
            setIsMemberDropdownOpen(false);
            fetchAllData();
        } catch (err) {
            pushToast({ title: 'Subscription Error', detail: err.message || 'Failed to save subscription.', tone: 'error' });
            setErrorMsg(err.message || 'Failed to save subscription.');
        } finally {
            setSubSubmitting(false);
        }
    };

    const handleDeleteSub = async (id) => {
        if (!window.confirm('Cancel and delete this subscription record?')) return;
        try {
            await api.deleteLibrarianSubscription(id);
            pushToast({ title: 'Subscription Cancelled', detail: 'Subscription pass cancelled and removed.', tone: 'info' });
            fetchAllData();
        } catch (err) {
            pushToast({ title: 'Action Failed', detail: err.message || 'Failed to cancel subscription.', tone: 'error' });
            setErrorMsg(err.message || 'Failed to cancel subscription.');
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
            
            {/* First-Time Password Reset Mandatory Modal */}
            {mustChangePassword && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-bark-900/80 backdrop-blur-md p-4">
                    <div className="w-full max-w-md rounded-3xl border border-tan-dark/40 bg-paper p-6 sm:p-8 space-y-6 shadow-lift animate-in fade-in zoom-in-95 duration-200">
                        <div className="text-center space-y-2">
                            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-tan/20 text-tan-dark shadow-sm">
                                <ShieldAlert className="w-7 h-7 text-tan-dark" />
                            </div>
                            <h2 className="text-xl font-extrabold text-bark-900">First-Time Staff Login</h2>
                            <p className="text-xs text-bark-500">
                                Please set a secure password to continue.
                            </p>
                        </div>

                        {pwdError && (
                            <div className="p-3 rounded-xl bg-rose-100 border border-rose-300 text-rose-900 text-xs font-semibold flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-rose-700 flex-shrink-0" />
                                <span>{pwdError}</span>
                            </div>
                        )}

                        <form onSubmit={handleFirstTimePasswordChange} className="space-y-4 text-left">
                            <div>
                                <label className="block text-xs font-bold text-bark-800 uppercase tracking-wider mb-1">New Personal Password</label>
                                <input
                                    type="password"
                                    required
                                    minLength={6}
                                    placeholder="At least 6 characters"
                                    value={pwdForm.new_password}
                                    onChange={(e) => setPwdForm({ ...pwdForm, new_password: e.target.value })}
                                    className="w-full rounded-xl border border-bark-100 bg-cream-light/40 px-4 py-2.5 text-xs font-semibold text-bark-900 focus:ring-2 focus:ring-tan-dark"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-bark-800 uppercase tracking-wider mb-1">Confirm New Password</label>
                                <input
                                    type="password"
                                    required
                                    minLength={6}
                                    placeholder="Re-enter new password"
                                    value={pwdForm.new_password_confirmation}
                                    onChange={(e) => setPwdForm({ ...pwdForm, new_password_confirmation: e.target.value })}
                                    className="w-full rounded-xl border border-bark-100 bg-cream-light/40 px-4 py-2.5 text-xs font-semibold text-bark-900 focus:ring-2 focus:ring-tan-dark"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={pwdSubmitting}
                                className="w-full py-3 px-4 rounded-xl bg-bark-700 hover:bg-bark-800 text-cream-light font-bold text-xs transition-all shadow-card flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {pwdSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                <span>Update Password & Enter Portal</span>
                            </button>
                        </form>
                    </div>
                </div>
            )}
            
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
                            Circulation Desk
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

            {/* Top Horizontal Navigation Navbar */}
            <div className="bg-cream-light/40 border border-bark-100 rounded-2xl p-3 shadow-sm flex items-center gap-2 overflow-x-auto">
                <button
                    onClick={() => setActiveTab('overview')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                        activeTab === 'overview'
                            ? 'bg-bark-700 text-cream-light shadow-card'
                            : 'text-bark-700 hover:bg-cream-light/60 hover:text-bark-900'
                    }`}
                >
                    <Activity className="w-4 h-4" />
                    <span>Overview & Directory</span>
                </button>

                <button
                    onClick={() => setActiveTab('add_books')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                        activeTab === 'add_books'
                            ? 'bg-bark-700 text-cream-light shadow-card'
                            : 'text-bark-700 hover:bg-cream-light/60 hover:text-bark-900'
                    }`}
                >
                    <BookOpen className="w-4 h-4" />
                    <span>Add Books / Inventory</span>
                </button>

                <button
                    onClick={() => {
                        setActiveTab('openlibrary');
                        if (olResults.length === 0) handleSearchOpenLibrary('technology');
                    }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                        activeTab === 'openlibrary'
                            ? 'bg-bark-700 text-cream-light shadow-card'
                            : 'text-bark-700 hover:bg-cream-light/60 hover:text-bark-900'
                    }`}
                >
                    <Sparkles className="w-4 h-4 text-tan" />
                    <span>Import Open Library</span>
                </button>

                <button
                    onClick={() => setActiveTab('book_copies')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                        activeTab === 'book_copies'
                            ? 'bg-bark-700 text-cream-light shadow-card'
                            : 'text-bark-700 hover:bg-cream-light/60 hover:text-bark-900'
                    }`}
                >
                    <Layers className="w-4 h-4" />
                    <span>Book Copies ({copies.length})</span>
                </button>

                <button
                    onClick={() => setActiveTab('returns')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                        activeTab === 'returns'
                            ? 'bg-bark-700 text-cream-light shadow-card'
                            : 'text-bark-700 hover:bg-cream-light/60 hover:text-bark-900'
                    }`}
                >
                    <BookCheck className="w-4 h-4" />
                    <span>Process Returns ({activeLoans.length})</span>
                </button>

                <button
                    onClick={() => setActiveTab('subscriptions')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                        activeTab === 'subscriptions'
                            ? 'bg-bark-700 text-cream-light shadow-card'
                            : 'text-bark-700 hover:bg-cream-light/60 hover:text-bark-900'
                    }`}
                >
                    <CreditCard className="w-4 h-4" />
                    <span>Subscriptions (CRUD)</span>
                </button>

                <button
                    onClick={() => setActiveTab('reimbursements')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                        activeTab === 'reimbursements'
                            ? 'bg-bark-700 text-cream-light shadow-card'
                            : 'text-bark-700 hover:bg-cream-light/60 hover:text-bark-900'
                    }`}
                >
                    <DollarSign className="w-4 h-4" />
                    <span>Reimbursements</span>
                </button>

                <button
                    onClick={() => setActiveTab('refunds')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                        activeTab === 'refunds'
                            ? 'bg-bark-700 text-cream-light shadow-card'
                            : 'text-bark-700 hover:bg-cream-light/60 hover:text-bark-900'
                    }`}
                >
                    <RefreshCw className="w-4 h-4" />
                    <span>Refund Applications ({refundRequests.length})</span>
                </button>
            </div>

            {/* Main Content Area */}
            <div className="space-y-6">
                
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
                        <div className="bg-cream-light/40 border border-bark-100 rounded-2xl p-6 space-y-6 shadow-sm">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-bark-100 pb-4">
                                <div>
                                    <h3 className="text-base font-bold text-bark-900 flex items-center gap-2">
                                        <Users className="w-4 h-4 text-bark-500" /> Member Activity Directory
                                    </h3>
                                    <p className="text-xs text-bark-500 mt-0.5">Registered members and loan status.</p>
                                </div>

                                <span className="font-mono text-xs text-bark-500 bg-paper px-3 py-1.5 rounded-xl border border-bark-100 w-fit">
                                    Showing <strong className="text-bark-900">{filteredMembers.length}</strong> of {members.length} member(s)
                                </span>
                            </div>

                            {/* Filter Controls Bar */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-paper p-3.5 rounded-xl border border-bark-100 text-xs">
                                {/* Search */}
                                <div className="relative">
                                    <Search className="w-4 h-4 absolute left-3 top-3 text-bark-500" />
                                    <input
                                        type="text"
                                        placeholder="Search name, email, ID..."
                                        value={directorySearch}
                                        onChange={(e) => setDirectorySearch(e.target.value)}
                                        className="w-full pl-9 pr-3 py-2 rounded-lg border border-bark-100 bg-cream-light/40 text-bark-900 text-xs focus:ring-1 focus:ring-tan-dark"
                                    />
                                </div>

                                {/* Tier Filter */}
                                <div>
                                    <select
                                        value={tierFilter}
                                        onChange={(e) => setTierFilter(e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg border border-bark-100 bg-cream-light/40 text-bark-900 text-xs capitalize font-semibold focus:ring-1 focus:ring-tan-dark"
                                    >
                                        <option value="all">All Membership Tiers</option>
                                        <option value="student">Student Tier</option>
                                        <option value="standard">Standard Tier</option>
                                        <option value="scholar">Scholar Tier</option>
                                        <option value="faculty">Faculty Tier</option>
                                        <option value="general">General Tier</option>
                                    </select>
                                </div>

                                {/* Status Filter */}
                                <div>
                                    <select
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg border border-bark-100 bg-cream-light/40 text-bark-900 text-xs font-semibold focus:ring-1 focus:ring-tan-dark"
                                    >
                                        <option value="all">All Account Statuses</option>
                                        <option value="active">Active Members Only</option>
                                        <option value="banned">Suspended / Banned Only</option>
                                        <option value="subscribed">Paid Subscribers Only</option>
                                    </select>
                                </div>

                                {/* Sort By */}
                                <div>
                                    <select
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg border border-bark-100 bg-cream-light/40 text-bark-900 text-xs font-semibold focus:ring-1 focus:ring-tan-dark"
                                    >
                                        <option value="name">Sort by Name (A–Z)</option>
                                        <option value="newest">Sort by Newest Registered</option>
                                        <option value="loans">Sort by Active Loans</option>
                                        <option value="limit">Sort by Borrow Limit</option>
                                    </select>
                                </div>
                            </div>

                            {loading ? (
                                <div className="flex items-center justify-center py-12 text-bark-500 font-mono text-xs">
                                    <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading member directory...
                                </div>
                            ) : filteredMembers.length === 0 ? (
                                <div className="text-center py-12 bg-paper/40 rounded-xl border border-bark-100 space-y-1">
                                    <Users className="w-8 h-8 text-bark-400 mx-auto" />
                                    <h4 className="text-sm font-bold text-bark-900">No Members Found</h4>
                                    <p className="text-xs text-bark-500">No member accounts match the selected search filter criteria.</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs text-bark-700 border-collapse">
                                        <thead className="bg-paper text-bark-500 uppercase text-[10px] tracking-wider font-mono">
                                            <tr>
                                                <th className="p-3 border-b border-bark-100">Member #</th>
                                                <th className="p-3 border-b border-bark-100">User Profile</th>
                                                <th className="p-3 border-b border-bark-100">Tier / Limit</th>
                                                <th className="p-3 border-b border-bark-100 text-center">Pass Status</th>
                                                <th className="p-3 border-b border-bark-100 text-center">Active Loans</th>
                                                <th className="p-3 border-b border-bark-100 text-center">Account Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-bark-100/60">
                                            {filteredMembers.map((m) => (
                                                <tr key={m.id} className="hover:bg-paper/60 transition-colors">
                                                    <td className="p-3 font-mono font-bold text-bark-900">{m.member_number}</td>
                                                    <td className="p-3">
                                                        <div className="flex items-center gap-3">
                                                            {m.user?.avatar_base64 ? (
                                                                <img
                                                                    src={m.user.avatar_base64}
                                                                    alt={m.name}
                                                                    className="h-8 w-8 rounded-xl object-cover border border-tan-dark shadow-sm flex-shrink-0"
                                                                />
                                                            ) : (
                                                                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-bark-700 text-cream-light font-extrabold text-xs shadow-sm flex-shrink-0">
                                                                    {m.name ? m.name.charAt(0).toUpperCase() : 'M'}
                                                                </div>
                                                            )}
                                                            <div>
                                                                <div className="font-bold text-bark-900">{m.name}</div>
                                                                <div className="text-[11px] text-bark-500 font-mono">{m.email}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-3">
                                                        <span className="capitalize text-bark-900 font-bold bg-tan/10 px-2 py-0.5 rounded border border-tan/20 text-[11px] inline-block mb-0.5">
                                                            {m.membership_tier || 'Standard'}
                                                        </span>
                                                        <div className="text-[10px] text-bark-500 font-mono">Max Limit: {m.borrow_limit || 7} books</div>
                                                    </td>
                                                    <td className="p-3 text-center font-mono">
                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                                            m.is_subscribed
                                                                ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                                                : 'bg-cream text-bark-600 border border-bark-100'
                                                        }`}>
                                                            {m.is_subscribed ? 'Active Subscriber' : 'No Pass'}
                                                        </span>
                                                    </td>
                                                    <td className="p-3 text-center">
                                                        <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-paper text-bark-900 border border-bark-100 shadow-sm">
                                                            {m.active_loans_count || 0} active
                                                        </span>
                                                    </td>
                                                    <td className="p-3 text-center">
                                                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase font-mono ${
                                                            m.is_banned
                                                                ? 'bg-rose-100 text-rose-900 border border-rose-300'
                                                                : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                                        }`}>
                                                            {m.is_banned ? 'Suspended' : 'Active'}
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
                    )}                    {/* TAB 2: Add Books to Inventory & Catalog Management (Revamped Minipage) */}
                    {activeTab === 'add_books' && (
                        <div className="space-y-6 animate-in fade-in duration-200">
                            {/* Minipage Header Banner */}
                            <div className="bg-cream-light/40 border border-bark-100 rounded-2xl p-6 sm:p-8 shadow-sm">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-bark-100 pb-5">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-bark-700 text-cream-light uppercase tracking-wider">
                                                INVENTORY MINIPAGE
                                            </span>
                                            {editingBook && (
                                                <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-olive-dark text-white uppercase tracking-wider">
                                                    EDITING BOOK #{editingBook.id}
                                                </span>
                                            )}
                                        </div>
                                        <h2 className="text-xl sm:text-2xl font-extrabold text-bark-900 tracking-tight">
                                            {editingBook ? 'Edit Catalog Record' : 'Manual Book Inventory Ingestion'}
                                        </h2>
                                        <p className="text-xs sm:text-sm text-bark-500">
                                            Auto-generate standard ISBN-13 numbers, attach local digital reader files via Base64, and register physical inventory copies.
                                        </p>
                                    </div>
                                    {editingBook && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setEditingBook(null);
                                                setBookForm({
                                                    isbn: generateIsbn13(), title: '', author: '', publisher: '', genre: 'Software',
                                                    description: '', cover_image_path: '', file_path: '', publication_year: 2026,
                                                    digital_purchase_price: 50.00, foreign_price: '', foreign_currency: 'USD', initial_copies: 1
                                                });
                                                setFileMeta(null);
                                            }}
                                            className="px-4 py-2 rounded-xl bg-cream border border-bark-100 text-bark-700 text-xs font-bold hover:bg-cream-light transition-all shadow-sm"
                                        >
                                            Cancel Editing
                                        </button>
                                    )}
                                </div>

                                <div className="mt-4 p-3.5 rounded-xl bg-cream border border-bark-100/80 text-xs text-bark-600 flex items-start gap-3">
                                    <Sparkles className="w-4 h-4 text-tan shrink-0 mt-0.5" />
                                    <div className="space-y-0.5">
                                        <p className="font-semibold text-bark-800">Automatic ISBN-13 & Local File Base64 Encoding</p>
                                        <p className="text-[11px] leading-relaxed text-bark-500">
                                            Manual entries generate valid 13-digit ISBNs with checksum verification. (Open Library imports preserve their authentic international ISBNs). Attached book files (.pdf, .epub, .txt) and cover images are encoded directly to Base64 data URLs for seamless streaming in the digital reader.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Ingestion Form */}
                            <form onSubmit={handleBookSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                                {/* Left Column: Metadata & Classification (7 cols) */}
                                <div className="lg:col-span-7 bg-cream-light/40 border border-bark-100 rounded-2xl p-6 space-y-5 shadow-sm">
                                    <div className="border-b border-bark-100 pb-3">
                                        <h3 className="text-sm font-bold text-bark-900 font-mono flex items-center gap-2">
                                            <BookOpen className="w-4 h-4 text-bark-700" /> Bibliographic & Circulation Details
                                        </h3>
                                    </div>

                                    {/* Auto-Generated ISBN */}
                                    <div>
                                        <div className="flex items-center justify-between mb-1">
                                            <label className="text-xs font-semibold text-bark-700 flex items-center gap-1.5">
                                                ISBN-13 Barcode <span className="text-bark-400 font-normal">(Auto-Generated)</span>
                                            </label>
                                            {!editingBook && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const newIsbn = generateIsbn13();
                                                        setBookForm(prev => ({ ...prev, isbn: newIsbn }));
                                                        pushToast({ title: 'New ISBN Generated', detail: newIsbn, tone: 'info' });
                                                    }}
                                                    className="text-[11px] font-mono font-semibold text-olive-dark hover:underline flex items-center gap-1"
                                                >
                                                    <RefreshCw className="w-3 h-3" /> Regenerate ISBN
                                                </button>
                                            )}
                                        </div>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={bookForm.isbn}
                                                onChange={(e) => setBookForm({ ...bookForm, isbn: e.target.value })}
                                                placeholder="978-0-XXXX-XXXXX-X"
                                                required
                                                disabled={!!editingBook}
                                                className="w-full px-3.5 py-2.5 rounded-xl bg-paper border border-bark-100 text-xs text-bark-900 focus:outline-none focus:border-bark-400 font-mono tracking-wider"
                                            />
                                        </div>
                                        <p className="mt-1 text-[10px] text-bark-400 font-mono">Standard 13-digit EAN/ISBN checksum. You may manually edit if cataloging a physical barcode.</p>
                                    </div>

                                    {/* Title & Author */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-bark-700 mb-1">Book Title *</label>
                                            <input
                                                type="text"
                                                value={bookForm.title}
                                                onChange={(e) => setBookForm({ ...bookForm, title: e.target.value })}
                                                placeholder="e.g. Designing Data-Intensive Applications"
                                                required
                                                className="w-full px-3.5 py-2 rounded-xl bg-paper border border-bark-100 text-xs text-bark-900 focus:outline-none focus:border-bark-400"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-bark-700 mb-1">Author Name *</label>
                                            <input
                                                type="text"
                                                value={bookForm.author}
                                                onChange={(e) => setBookForm({ ...bookForm, author: e.target.value })}
                                                placeholder="e.g. Martin Kleppmann"
                                                required
                                                className="w-full px-3.5 py-2 rounded-xl bg-paper border border-bark-100 text-xs text-bark-900 focus:outline-none focus:border-bark-400"
                                            />
                                        </div>
                                    </div>

                                    {/* Publisher & Year */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-bark-700 mb-1">Publisher</label>
                                            <input
                                                type="text"
                                                value={bookForm.publisher}
                                                onChange={(e) => setBookForm({ ...bookForm, publisher: e.target.value })}
                                                placeholder="e.g. O'Reilly Media"
                                                className="w-full px-3.5 py-2 rounded-xl bg-paper border border-bark-100 text-xs text-bark-900 focus:outline-none focus:border-bark-400"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-bark-700 mb-1">Publication Year</label>
                                            <input
                                                type="number"
                                                value={bookForm.publication_year}
                                                onChange={(e) => setBookForm({ ...bookForm, publication_year: parseInt(e.target.value, 10) || 2026 })}
                                                min="1800"
                                                max="2035"
                                                className="w-full px-3.5 py-2 rounded-xl bg-paper border border-bark-100 text-xs text-bark-900 focus:outline-none focus:border-bark-400 font-mono"
                                            />
                                        </div>
                                    </div>

                                    {/* Genre Category */}
                                    <div>
                                        <label className="block text-xs font-semibold text-bark-700 mb-1">Genre / Subject Category *</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={bookForm.genre}
                                                onChange={(e) => setBookForm({ ...bookForm, genre: e.target.value })}
                                                placeholder="e.g. Computer Science, Technology, Fiction"
                                                required
                                                className="flex-1 px-3.5 py-2 rounded-xl bg-paper border border-bark-100 text-xs text-bark-900 focus:outline-none focus:border-bark-400"
                                            />
                                            <select
                                                onChange={(e) => e.target.value && setBookForm({ ...bookForm, genre: e.target.value })}
                                                className="px-3 py-2 rounded-xl bg-paper border border-bark-100 text-xs text-bark-700 focus:outline-none"
                                                defaultValue=""
                                            >
                                                <option value="" disabled>Presets...</option>
                                                <option value="Computer Science">Computer Science</option>
                                                <option value="Technology">Technology</option>
                                                <option value="Software">Software</option>
                                                <option value="Fiction">Fiction</option>
                                                <option value="Philosophy">Philosophy</option>
                                                <option value="Science">Science</option>
                                                <option value="Business">Business</option>
                                                <option value="Mathematics">Mathematics</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Pricing & Physical Copies */}
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-bark-100">
                                        <div>
                                            <label className="block text-xs font-semibold text-bark-700 mb-1">Digital Price (KES)</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={bookForm.digital_purchase_price}
                                                onChange={(e) => setBookForm({ ...bookForm, digital_purchase_price: e.target.value })}
                                                className="w-full px-3.5 py-2 rounded-xl bg-paper border border-bark-100 text-xs text-bark-900 focus:outline-none focus:border-bark-400 font-mono"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-bark-700 mb-1">Foreign Price <span className="text-bark-400 font-normal">(opt)</span></label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={bookForm.foreign_price}
                                                onChange={(e) => setBookForm({ ...bookForm, foreign_price: e.target.value })}
                                                placeholder="e.g. 29.99"
                                                className="w-full px-3.5 py-2 rounded-xl bg-paper border border-bark-100 text-xs text-bark-900 focus:outline-none focus:border-bark-400 font-mono"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-bark-700 mb-1">
                                                {editingBook ? 'Total Copies' : 'Initial Physical Copies'}
                                            </label>
                                            <input
                                                type="number"
                                                min="1"
                                                max="50"
                                                value={bookForm.initial_copies}
                                                onChange={(e) => setBookForm({ ...bookForm, initial_copies: parseInt(e.target.value, 10) || 1 })}
                                                disabled={!!editingBook}
                                                className="w-full px-3.5 py-2 rounded-xl bg-paper border border-bark-100 text-xs text-bark-900 focus:outline-none focus:border-bark-400 font-mono"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column: Digital Files, Base64 & Cover Art (5 cols) */}
                                <div className="lg:col-span-5 space-y-6">
                                    {/* Local File Upload (Base64) Card */}
                                    <div className="bg-cream-light/40 border border-bark-100 rounded-2xl p-6 space-y-4 shadow-sm">
                                        <div className="border-b border-bark-100 pb-3">
                                            <h3 className="text-sm font-bold text-bark-900 font-mono flex items-center gap-2">
                                                <FileText className="w-4 h-4 text-bark-700" /> Digital Book File (.pdf, .epub, .txt)
                                            </h3>
                                        </div>

                                        <div className="space-y-3">
                                            <div className="relative border-2 border-dashed border-bark-200 hover:border-olive-dark/60 rounded-xl p-4 text-center transition-colors bg-paper/50">
                                                <input
                                                    type="file"
                                                    accept=".pdf,.epub,.txt,.json"
                                                    onChange={handleLocalFileUpload}
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                />
                                                <div className="flex flex-col items-center justify-center gap-1.5 pointer-events-none">
                                                    <UploadCloud className="w-6 h-6 text-olive-dark" />
                                                    <p className="text-xs font-bold text-bark-800">
                                                        Click or drop local book file
                                                    </p>
                                                    <p className="text-[10px] text-bark-400 font-mono">
                                                        Auto-converted to Base64 in PostgreSQL (max 25MB)
                                                    </p>
                                                </div>
                                            </div>

                                            {fileMeta && (
                                                <div className="p-3 rounded-xl bg-paper border border-bark-100 flex items-center justify-between text-xs">
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        <Check className="w-4 h-4 text-olive-dark shrink-0" />
                                                        <div className="min-w-0">
                                                            <p className="font-semibold text-bark-900 truncate">{fileMeta.name}</p>
                                                            <p className="text-[10px] font-mono text-bark-400">{fileMeta.size} • {fileMeta.type}</p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setFileMeta(null);
                                                            setBookForm(prev => ({ ...prev, file_path: '' }));
                                                        }}
                                                        className="text-bark-400 hover:text-red-500 p-1"
                                                        title="Remove attached file"
                                                    >
                                                        <X className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            )}

                                            {/* Manual fallback input for remote URLs */}
                                            <div>
                                                <label className="block text-[11px] font-semibold text-bark-500 mb-1">Or File URL / Base64 String</label>
                                                <input
                                                    type="text"
                                                    value={bookForm.file_path}
                                                    onChange={(e) => setBookForm({ ...bookForm, file_path: e.target.value })}
                                                    placeholder="data:application/pdf;base64,... or https://..."
                                                    className="w-full px-3 py-1.5 rounded-lg bg-paper border border-bark-100 text-[11px] text-bark-800 font-mono focus:outline-none"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Cover Art Upload & Preview Card */}
                                    <div className="bg-cream-light/40 border border-bark-100 rounded-2xl p-6 space-y-4 shadow-sm">
                                        <div className="border-b border-bark-100 pb-3">
                                            <h3 className="text-sm font-bold text-bark-900 font-mono flex items-center gap-2">
                                                <ImageIcon className="w-4 h-4 text-bark-700" /> Book Cover Artwork
                                            </h3>
                                        </div>

                                        <div className="flex gap-4 items-start">
                                            <div className="w-24 h-32 rounded-xl bg-paper border border-bark-100 shrink-0 overflow-hidden flex items-center justify-center shadow-sm">
                                                {bookForm.cover_image_path ? (
                                                    <img
                                                        src={bookForm.cover_image_path}
                                                        alt="Cover preview"
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => {
                                                            e.target.onerror = null;
                                                            e.target.src = 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=300';
                                                        }}
                                                    />
                                                ) : (
                                                    <div className="text-center p-2">
                                                        <BookOpen className="w-6 h-6 text-bark-300 mx-auto" />
                                                        <span className="text-[9px] text-bark-400 font-mono block mt-1">No Cover</span>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex-1 space-y-2">
                                                <div className="relative border border-dashed border-bark-200 hover:border-olive-dark/60 rounded-xl p-3 text-center transition-colors bg-paper/50">
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={handleLocalCoverUpload}
                                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                    />
                                                    <p className="text-xs font-semibold text-bark-800">Upload Local Cover Image</p>
                                                    <p className="text-[10px] text-bark-400 font-mono">PNG, JPG, WEBP (Base64)</p>
                                                </div>

                                                <div>
                                                    <label className="block text-[11px] font-semibold text-bark-500 mb-1">Or Remote Image URL</label>
                                                    <input
                                                        type="text"
                                                        value={bookForm.cover_image_path}
                                                        onChange={(e) => setBookForm({ ...bookForm, cover_image_path: e.target.value })}
                                                        placeholder="https://..."
                                                        className="w-full px-3 py-1.5 rounded-lg bg-paper border border-bark-100 text-[11px] text-bark-800 font-mono focus:outline-none"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Description Textarea */}
                                    <div className="bg-cream-light/40 border border-bark-100 rounded-2xl p-6 space-y-2 shadow-sm">
                                        <label className="block text-xs font-semibold text-bark-700">Description & Synopsis</label>
                                        <textarea
                                            value={bookForm.description}
                                            onChange={(e) => setBookForm({ ...bookForm, description: e.target.value })}
                                            rows="3"
                                            placeholder="Overview of topics covered, edition details, and library summary..."
                                            className="w-full px-3.5 py-2.5 rounded-xl bg-paper border border-bark-100 text-xs text-bark-900 focus:outline-none focus:border-bark-400 leading-relaxed"
                                        />
                                    </div>

                                    {/* Submit Button */}
                                    <button
                                        type="submit"
                                        disabled={bookSubmitting}
                                        className="w-full py-3 px-6 rounded-xl bg-bark-800 hover:bg-bark-900 text-cream-light font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-card"
                                    >
                                        {bookSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                        <span>{editingBook ? 'Save Catalog Updates' : 'Add Book to Inventory Catalog'}</span>
                                    </button>
                                </div>
                            </form>

                            {/* Books Catalog Directory Table */}
                            <div className="bg-cream-light/40 border border-bark-100 rounded-2xl p-6 space-y-4 shadow-sm">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-bark-100 pb-4">
                                    <div>
                                        <h3 className="text-base font-bold text-bark-900 font-mono">Catalog Books Inventory ({books.length})</h3>
                                        <p className="text-xs text-bark-500">Live records registered in circulation database</p>
                                    </div>
                                    <div className="relative w-full sm:w-72">
                                        <Search className="w-4 h-4 text-bark-400 absolute left-3 top-2.5" />
                                        <input
                                            type="text"
                                            value={catalogSearch}
                                            onChange={(e) => setCatalogSearch(e.target.value)}
                                            placeholder="Search by title, author, or ISBN..."
                                            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-paper border border-bark-100 text-xs text-bark-900 focus:outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs text-bark-700 border-collapse">
                                        <thead className="bg-paper text-bark-500 uppercase text-[10px] tracking-wider font-mono">
                                            <tr>
                                                <th className="p-3 border-b border-bark-100">Cover & Book</th>
                                                <th className="p-3 border-b border-bark-100">ISBN</th>
                                                <th className="p-3 border-b border-bark-100">Genre</th>
                                                <th className="p-3 border-b border-bark-100">Digital / File</th>
                                                <th className="p-3 border-b border-bark-100">Physical Copies</th>
                                                <th className="p-3 border-b border-bark-100 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-bark-100">
                                            {books
                                                .filter(b => {
                                                    if (!catalogSearch) return true;
                                                    const q = catalogSearch.toLowerCase();
                                                    return (b.title || '').toLowerCase().includes(q) ||
                                                           (b.author || '').toLowerCase().includes(q) ||
                                                           (b.isbn || '').toLowerCase().includes(q);
                                                })
                                                .slice(0, 20)
                                                .map((b) => (
                                                <tr key={b.id} className="hover:bg-cream/40 transition-colors">
                                                    <td className="p-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-9 h-12 rounded bg-paper border border-bark-100 overflow-hidden shrink-0">
                                                                <img
                                                                    src={b.cover_image_path || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=100'}
                                                                    alt=""
                                                                    className="w-full h-full object-cover"
                                                                    onError={(e) => {
                                                                        e.target.onerror = null;
                                                                        e.target.src = 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=100';
                                                                    }}
                                                                />
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-bark-900">{b.title}</p>
                                                                <p className="text-[11px] text-bark-500">{b.author}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-3 font-mono text-[11px] text-bark-600">{b.isbn}</td>
                                                    <td className="p-3">
                                                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cream text-bark-700 border border-bark-100">
                                                            {b.genre}
                                                        </span>
                                                    </td>
                                                    <td className="p-3">
                                                        {b.file_path ? (
                                                            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-olive-dark/10 text-olive-dark font-bold">
                                                                Base64 Attached
                                                            </span>
                                                        ) : (
                                                            <span className="text-bark-400 text-[11px] font-mono">No File</span>
                                                        )}
                                                    </td>
                                                    <td className="p-3">
                                                        <span className="font-mono text-bark-800">
                                                            {b.available_copies ?? b.total_copies ?? 1} avail / {b.total_copies ?? 1} total
                                                        </span>
                                                    </td>
                                                    <td className="p-3 text-right">
                                                        <div className="flex items-center justify-end gap-1.5">
                                                            <button
                                                                type="button"
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
                                                                        foreign_price: b.foreign_price || '',
                                                                        foreign_currency: b.foreign_currency || 'USD',
                                                                        initial_copies: b.total_copies || 1
                                                                    });
                                                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                                                }}
                                                                className="p-1.5 rounded-lg bg-cream border border-bark-100 text-bark-700 hover:bg-cream-light"
                                                                title="Edit book"
                                                            >
                                                                <Edit2 className="w-3.5 h-3.5" />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleDeleteBook(b.id)}
                                                                className="p-1.5 rounded-lg bg-cream border border-bark-100 text-bark-400 hover:text-red-500 hover:bg-cream-light"
                                                                title="Delete book"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB: Import from Open Library */}
                    {activeTab === 'openlibrary' && (
                        <div className="space-y-6">
                            <div className="bg-cream-light/40 border border-bark-100 rounded-2xl p-6 space-y-6 shadow-sm">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-bark-100 pb-4">
                                    <div>
                                        <h2 className="text-base font-bold text-bark-900 flex items-center gap-2 font-mono">
                                            <Sparkles className="w-4 h-4 text-tan" /> Import from Open Library
                                        </h2>
                                        <p className="text-xs text-bark-500 mt-0.5">
                                            Discover and catalog books directly from <a href="https://openlibrary.org" target="_blank" rel="noreferrer" className="underline font-medium hover:text-bark-900">openlibrary.org</a> with covers and digital reader links.
                                        </p>
                                    </div>

                                    {olResults.length > 0 && (
                                        <button
                                            type="button"
                                            onClick={handleImportAllOpenLibrary}
                                            disabled={olImportAllLoading}
                                            className="px-4 py-2 rounded-xl bg-bark-700 hover:bg-bark-900 text-cream-light text-xs font-bold flex items-center gap-2 shadow-sm transition disabled:opacity-50"
                                        >
                                            {olImportAllLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <DownloadCloud className="w-3.5 h-3.5" />}
                                            <span>Import All Visible ({olResults.length})</span>
                                        </button>
                                    )}
                                </div>

                                {/* Subject Presets */}
                                <div className="space-y-2">
                                    <label className="block text-[11px] font-mono uppercase tracking-wider text-bark-500">
                                        Popular Subjects (One-Click Browse)
                                    </label>
                                    <div className="flex flex-wrap gap-1.5">
                                        {[
                                            'technology', 'fiction', 'science', 'history', 'philosophy',
                                            'psychology', 'business', 'classic_literature', 'fantasy', 'mystery'
                                        ].map((sub) => (
                                            <button
                                                key={sub}
                                                type="button"
                                                onClick={() => {
                                                    setOlSubject(sub);
                                                    handleSearchOpenLibrary(sub);
                                                }}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition ${
                                                    olSubject === sub
                                                        ? 'bg-bark-700 text-cream-light shadow-sm'
                                                        : 'bg-paper border border-bark-100 text-bark-700 hover:bg-cream-light/60'
                                                }`}
                                            >
                                                {sub.replace('_', ' ')}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Search Bar */}
                                <form
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        handleSearchOpenLibrary();
                                    }}
                                    className="flex flex-col sm:flex-row gap-3 pt-2"
                                >
                                    <div className="relative flex-1">
                                        <Search className="w-4 h-4 absolute left-3 top-3 text-bark-500" />
                                        <input
                                            type="text"
                                            value={olQuery}
                                            onChange={(e) => setOlQuery(e.target.value)}
                                            placeholder="Search Open Library by keyword, title, or author (e.g., Dune, Python, Robotics)..."
                                            className="w-full pl-9 pr-3 py-2 rounded-xl border border-bark-100 bg-paper text-bark-900 text-xs focus:ring-1 focus:ring-tan-dark"
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={olLoading}
                                        className="px-5 py-2 rounded-xl bg-bark-700 hover:bg-bark-900 text-cream-light text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition disabled:opacity-50"
                                    >
                                        {olLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                                        <span>Search Open Library</span>
                                    </button>
                                </form>

                                {/* Results Grid */}
                                {olLoading ? (
                                    <div className="py-16 text-center text-xs text-bark-500 flex flex-col items-center justify-center gap-2 font-mono">
                                        <Loader2 className="w-6 h-6 animate-spin text-bark-700" />
                                        <span>Querying Open Library APIs (identified 3 req/sec rate limit)...</span>
                                    </div>
                                ) : olResults.length === 0 ? (
                                    <div className="py-12 text-center text-xs text-bark-500 bg-paper rounded-xl border border-bark-100 space-y-2">
                                        <Globe className="w-8 h-8 text-bark-400 mx-auto opacity-60" />
                                        <p className="font-semibold text-bark-700">No Open Library books to display.</p>
                                        <p>Click any subject chip above or enter a search term to find books to import.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {olResults.map((item, idx) => {
                                            const itemKey = item.openlibrary_key || item.isbn || `${item.title}-${idx}`;
                                            const isImporting = olImportingKeys.includes(itemKey);
                                            const isAlreadyImported = books.some((b) => b.isbn === item.isbn || b.title.toLowerCase() === item.title.toLowerCase());

                                            return (
                                                <div
                                                    key={itemKey}
                                                    className="bg-paper border border-bark-100 rounded-xl p-4 flex flex-col justify-between shadow-card hover:border-bark-300 transition"
                                                >
                                                    <div className="flex gap-3 items-start">
                                                        <div className="w-16 h-22 rounded-md overflow-hidden bg-cream-light/60 flex-shrink-0 border border-bark-100 shadow-sm">
                                                            {item.cover_image_path ? (
                                                                <img
                                                                    src={item.cover_image_path}
                                                                    alt={item.title}
                                                                    className="w-full h-full object-cover"
                                                                    loading="lazy"
                                                                />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center text-[10px] font-mono text-bark-400 p-1 text-center bg-cream-light/30">
                                                                    No Cover
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div className="min-w-0 flex-1 space-y-1">
                                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                                <span className="font-mono text-[9px] uppercase tracking-wider text-bark-500 bg-cream-light px-1.5 py-0.5 rounded">
                                                                    {item.genre || 'General'}
                                                                </span>
                                                                {item.has_embed_reader && (
                                                                    <span className="font-mono text-[9px] uppercase tracking-wider text-olive-dark bg-olive/20 px-1.5 py-0.5 rounded font-semibold">
                                                                        IA E-Reader
                                                                    </span>
                                                                )}
                                                            </div>

                                                            <h4 className="font-bold text-sm text-bark-900 line-clamp-1" title={item.title}>
                                                                {item.title}
                                                            </h4>
                                                            <p className="text-xs text-bark-500 truncate">By {item.author}</p>
                                                            <p className="text-[10px] font-mono text-bark-400">
                                                                Published: {item.publication_year || 'N/A'} {item.isbn ? `· ISBN: ${item.isbn}` : ''}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="pt-4 border-t border-bark-100 mt-3 flex items-center justify-between gap-2">
                                                        <span className="font-mono text-xs font-bold text-bark-900">
                                                            KES {Number(item.digital_purchase_price || 50).toFixed(2)}
                                                        </span>

                                                        <button
                                                            type="button"
                                                            disabled={isImporting || isAlreadyImported}
                                                            onClick={() => handleImportSingleOpenLibrary(item)}
                                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow-sm ${
                                                                isAlreadyImported
                                                                    ? 'bg-olive/20 text-olive-dark border border-olive-dark/30 cursor-default'
                                                                    : 'bg-bark-700 hover:bg-bark-900 text-cream-light'
                                                            }`}
                                                        >
                                                            {isImporting ? (
                                                                <>
                                                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                                    <span>Importing...</span>
                                                                </>
                                                            ) : isAlreadyImported ? (
                                                                <>
                                                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                                                    <span>In Catalog</span>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Plus className="w-3.5 h-3.5" />
                                                                    <span>Import to Library</span>
                                                                </>
                                                            )}
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* TAB 4: Physical Book Copies (Visual Catalog Grid & Interactive Modal) */}
                    {activeTab === 'book_copies' && (
                        <div className="space-y-6">
                            {/* Header & Search */}
                            <div className="bg-cream-light/40 border border-bark-100 rounded-2xl p-6 shadow-sm space-y-4">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div>
                                        <h2 className="text-base font-bold text-bark-900 flex items-center gap-2 font-mono">
                                            <Layers className="w-4 h-4 text-bark-700" /> Physical Copies Management
                                        </h2>
                                        <p className="text-xs text-bark-500 mt-0.5">
                                            Select any book from the catalog below to manage physical barcodes, shelf rack locations, and availability statuses.
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 font-mono text-xs">
                                        <span className="px-3 py-1 rounded-lg bg-paper border border-bark-100 text-bark-700 font-semibold">
                                            {books.length} Books
                                        </span>
                                        <span className="px-3 py-1 rounded-lg bg-paper border border-bark-100 text-olive-dark font-semibold">
                                            {copies.length} Total Copies
                                        </span>
                                        <span className="px-3 py-1 rounded-lg bg-paper border border-bark-100 text-emerald-700 font-semibold">
                                            {copies.filter(c => c.status === 'available').length} Available
                                        </span>
                                    </div>
                                </div>

                                <div className="relative">
                                    <Search className="w-4 h-4 absolute left-3 top-3 text-bark-500" />
                                    <input
                                        type="text"
                                        value={copiesSearch}
                                        onChange={(e) => setCopiesSearch(e.target.value)}
                                        placeholder="Filter books by title, author, genre, or ISBN to manage physical copies..."
                                        className="w-full pl-9 pr-4 py-2 rounded-xl border border-bark-100 bg-paper text-bark-900 text-xs focus:ring-1 focus:ring-tan-dark"
                                    />
                                </div>
                            </div>

                            {/* Books Catalog Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {books
                                    .filter((b) => {
                                        if (!copiesSearch) return true;
                                        const q = copiesSearch.toLowerCase();
                                        return (
                                            (b.title || '').toLowerCase().includes(q) ||
                                            (b.author || '').toLowerCase().includes(q) ||
                                            (b.genre || '').toLowerCase().includes(q) ||
                                            (b.isbn || '').toLowerCase().includes(q)
                                        );
                                    })
                                    .map((b) => {
                                        const bookCopies = copies.filter((c) => c.book_id === b.id);
                                        const availableCopies = bookCopies.filter((c) => c.status === 'available');
                                        const loanedCopies = bookCopies.filter((c) => c.status === 'loaned');

                                        return (
                                            <div
                                                key={b.id}
                                                className="bg-paper border border-bark-100 rounded-2xl overflow-hidden shadow-card hover:border-bark-300 hover:shadow-md transition-all flex flex-col justify-between group"
                                            >
                                                {/* Cover & Header */}
                                                <div className="p-4 space-y-3">
                                                    <div className="relative aspect-[3/4] w-full rounded-xl overflow-hidden bg-cream-light/60 border border-bark-100 flex items-center justify-center shadow-inner">
                                                        {b.cover_image_path ? (
                                                            <img
                                                                src={b.cover_image_path}
                                                                alt={b.title}
                                                                className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                                                                loading="lazy"
                                                            />
                                                        ) : (
                                                            <div className="flex flex-col items-center justify-center p-3 text-center">
                                                                <BookOpen className="w-8 h-8 text-bark-400 mb-1 opacity-60" />
                                                                <span className="text-[11px] font-bold text-bark-700 line-clamp-2">{b.title}</span>
                                                            </div>
                                                        )}

                                                        <div className="absolute top-2 right-2">
                                                            <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider bg-bark-900/80 text-cream-light backdrop-blur-sm">
                                                                {b.genre || 'General'}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <h3 className="font-bold text-sm text-bark-900 line-clamp-1 group-hover:text-tan-dark transition" title={b.title}>
                                                            {b.title}
                                                        </h3>
                                                        <p className="text-xs text-bark-500 truncate">By {b.author}</p>
                                                        <p className="text-[10px] font-mono text-bark-400 mt-0.5">
                                                            ISBN: {b.isbn || 'N/A'}
                                                        </p>
                                                    </div>

                                                    {/* Copy count indicators */}
                                                    <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-bark-100 text-center font-mono">
                                                        <div className="bg-cream-light/50 rounded-lg p-1">
                                                            <div className="text-[9px] uppercase text-bark-400">Total</div>
                                                            <div className="text-xs font-bold text-bark-800">{bookCopies.length}</div>
                                                        </div>
                                                        <div className="bg-emerald-50 dark:bg-emerald-950/40 rounded-lg p-1">
                                                            <div className="text-[9px] uppercase text-emerald-600 dark:text-emerald-400">Ready</div>
                                                            <div className="text-xs font-bold text-emerald-700 dark:text-emerald-300">{availableCopies.length}</div>
                                                        </div>
                                                        <div className="bg-amber-50 dark:bg-amber-950/40 rounded-lg p-1">
                                                            <div className="text-[9px] uppercase text-amber-600 dark:text-amber-400">Loaned</div>
                                                            <div className="text-xs font-bold text-amber-700 dark:text-amber-300">{loanedCopies.length}</div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Action Button */}
                                                <div className="p-4 pt-0">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setSelectedBookForCopies(b);
                                                            setEditingCopy(null);
                                                            const cleanIsbn = (b.isbn || `${b.id}`).replace(/[^a-zA-Z0-9]/g, '').slice(-6);
                                                            const nextSeq = bookCopies.length + 1;
                                                            setCopyForm({
                                                                book_id: b.id,
                                                                barcode: `BC-${cleanIsbn}-${String(nextSeq).padStart(3, '0')}`,
                                                                condition: 'good',
                                                                status: 'available',
                                                                location_rack: 'Rack-1'
                                                            });
                                                        }}
                                                        className="w-full py-2 px-3 rounded-xl bg-bark-700 hover:bg-bark-900 text-cream-light text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-sm"
                                                    >
                                                        <Layers className="w-3.5 h-3.5" />
                                                        <span>Manage Copies ({bookCopies.length})</span>
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                            </div>

                            {/* Interactive Book Copies Modal */}
                            {selectedBookForCopies && (
                                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
                                    <div className="bg-paper border border-bark-100 rounded-3xl max-w-4xl w-full p-6 space-y-6 shadow-2xl relative my-8">
                                        {/* Modal Header */}
                                        <div className="flex items-start justify-between gap-4 border-b border-bark-100 pb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-16 rounded-lg overflow-hidden bg-cream-light border border-bark-100 flex-shrink-0 shadow-sm">
                                                    {selectedBookForCopies.cover_image_path ? (
                                                        <img
                                                            src={selectedBookForCopies.cover_image_path}
                                                            alt={selectedBookForCopies.title}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-[10px] text-bark-400 p-1 text-center">
                                                            No Cover
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <span className="font-mono text-[9px] uppercase tracking-wider text-bark-500 bg-cream-light px-2 py-0.5 rounded">
                                                        {selectedBookForCopies.genre || 'General'}
                                                    </span>
                                                    <h3 className="text-base font-bold text-bark-900 mt-1">
                                                        {selectedBookForCopies.title}
                                                    </h3>
                                                    <p className="text-xs text-bark-500">
                                                        By {selectedBookForCopies.author} · ISBN: <span className="font-mono">{selectedBookForCopies.isbn || 'N/A'}</span>
                                                    </p>
                                                </div>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setSelectedBookForCopies(null);
                                                    setEditingCopy(null);
                                                }}
                                                className="p-2 rounded-xl text-bark-400 hover:text-bark-700 hover:bg-cream-light/60 transition"
                                            >
                                                <X className="w-5 h-5" />
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                                            {/* Column 1: Add/Edit Copy Form */}
                                            <div className="lg:col-span-5 bg-cream-light/40 border border-bark-100 rounded-2xl p-5 space-y-4">
                                                <h4 className="font-bold text-xs text-bark-900 flex items-center gap-2 font-mono">
                                                    {editingCopy ? <Edit2 className="w-3.5 h-3.5 text-tan-dark" /> : <Plus className="w-3.5 h-3.5 text-tan-dark" />}
                                                    <span>{editingCopy ? 'Edit Physical Copy' : 'Register New Physical Copy'}</span>
                                                </h4>

                                                <form onSubmit={handleCopySubmit} className="space-y-3">
                                                    <div>
                                                        <div className="flex items-center justify-between mb-1">
                                                            <label className="text-[11px] font-semibold text-bark-700">Barcode Identifier</label>
                                                            {!editingCopy && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        const cleanIsbn = (selectedBookForCopies.isbn || `${selectedBookForCopies.id}`).replace(/[^a-zA-Z0-9]/g, '').slice(-6);
                                                                        const rand = Math.floor(100 + Math.random() * 900);
                                                                        setCopyForm(prev => ({ ...prev, barcode: `BC-${cleanIsbn}-${rand}` }));
                                                                    }}
                                                                    className="text-[10px] text-tan-dark hover:underline font-mono"
                                                                >
                                                                    Generate Barcode
                                                                </button>
                                                            )}
                                                        </div>
                                                        <input
                                                            type="text"
                                                            value={copyForm.barcode}
                                                            onChange={(e) => setCopyForm({ ...copyForm, barcode: e.target.value })}
                                                            placeholder="e.g. BC-97801-001"
                                                            required
                                                            disabled={!!editingCopy}
                                                            className="w-full px-3 py-2 rounded-xl bg-paper border border-bark-100 text-xs text-bark-900 font-mono focus:ring-1 focus:ring-tan-dark disabled:opacity-60"
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="block text-[11px] font-semibold text-bark-700 mb-1">Shelf / Rack Location</label>
                                                        <input
                                                            type="text"
                                                            value={copyForm.location_rack}
                                                            onChange={(e) => setCopyForm({ ...copyForm, location_rack: e.target.value })}
                                                            placeholder="e.g. Rack-1, Shelf-B3"
                                                            required
                                                            className="w-full px-3 py-2 rounded-xl bg-paper border border-bark-100 text-xs text-bark-900 focus:ring-1 focus:ring-tan-dark"
                                                        />
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-2">
                                                        <div>
                                                            <label className="block text-[11px] font-semibold text-bark-700 mb-1">Condition</label>
                                                            <select
                                                                value={copyForm.condition}
                                                                onChange={(e) => setCopyForm({ ...copyForm, condition: e.target.value })}
                                                                className="w-full px-3 py-2 rounded-xl bg-paper border border-bark-100 text-xs text-bark-900 focus:ring-1 focus:ring-tan-dark capitalize"
                                                            >
                                                                <option value="new">New</option>
                                                                <option value="good">Good</option>
                                                                <option value="fair">Fair</option>
                                                                <option value="poor">Poor</option>
                                                            </select>
                                                        </div>

                                                        <div>
                                                            <label className="block text-[11px] font-semibold text-bark-700 mb-1">Status</label>
                                                            <select
                                                                value={copyForm.status}
                                                                onChange={(e) => setCopyForm({ ...copyForm, status: e.target.value })}
                                                                className="w-full px-3 py-2 rounded-xl bg-paper border border-bark-100 text-xs text-bark-900 focus:ring-1 focus:ring-tan-dark capitalize"
                                                            >
                                                                <option value="available">Available</option>
                                                                <option value="loaned">Loaned</option>
                                                                <option value="reserved">Reserved</option>
                                                                <option value="maintenance">Maintenance</option>
                                                                <option value="lost">Lost</option>
                                                            </select>
                                                        </div>
                                                    </div>

                                                    <div className="pt-2 flex items-center gap-2">
                                                        <button
                                                            type="submit"
                                                            disabled={copySubmitting}
                                                            className="flex-1 py-2 px-3 rounded-xl bg-bark-700 hover:bg-bark-900 text-cream-light text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-sm disabled:opacity-50"
                                                        >
                                                            {copySubmitting ? (
                                                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                            ) : editingCopy ? (
                                                                <Check className="w-3.5 h-3.5" />
                                                            ) : (
                                                                <Plus className="w-3.5 h-3.5" />
                                                            )}
                                                            <span>{editingCopy ? 'Save Changes' : 'Add Copy to Shelf'}</span>
                                                        </button>

                                                        {editingCopy && (
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setEditingCopy(null);
                                                                    const cleanIsbn = (selectedBookForCopies.isbn || `${selectedBookForCopies.id}`).replace(/[^a-zA-Z0-9]/g, '').slice(-6);
                                                                    const bookCopies = copies.filter((c) => c.book_id === selectedBookForCopies.id);
                                                                    setCopyForm({
                                                                        book_id: selectedBookForCopies.id,
                                                                        barcode: `BC-${cleanIsbn}-${String(bookCopies.length + 1).padStart(3, '0')}`,
                                                                        condition: 'good',
                                                                        status: 'available',
                                                                        location_rack: 'Rack-1'
                                                                    });
                                                                }}
                                                                className="px-3 py-2 rounded-xl border border-bark-100 text-xs font-semibold text-bark-600 hover:bg-cream-light transition"
                                                            >
                                                                Cancel
                                                            </button>
                                                        )}
                                                    </div>
                                                </form>
                                            </div>

                                            {/* Column 2: Existing Physical Copies */}
                                            <div className="lg:col-span-7 space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <h4 className="font-bold text-xs text-bark-900 font-mono flex items-center gap-2">
                                                        <Layers className="w-3.5 h-3.5 text-bark-700" />
                                                        <span>Existing Copies ({copies.filter(c => c.book_id === selectedBookForCopies.id).length})</span>
                                                    </h4>
                                                </div>

                                                {copies.filter(c => c.book_id === selectedBookForCopies.id).length === 0 ? (
                                                    <div className="py-12 text-center text-xs text-bark-500 bg-cream-light/30 border border-bark-100 rounded-2xl space-y-2">
                                                        <Layers className="w-8 h-8 text-bark-400 mx-auto opacity-50" />
                                                        <p className="font-semibold text-bark-800">No physical copies on shelf yet.</p>
                                                        <p>Use the form on the left to register barcodes and place copies on shelves.</p>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                                                        {copies
                                                            .filter(c => c.book_id === selectedBookForCopies.id)
                                                            .map((copy) => (
                                                                <div
                                                                    key={copy.id}
                                                                    className="bg-paper border border-bark-100 rounded-xl p-3.5 flex items-center justify-between gap-3 shadow-sm hover:border-bark-300 transition"
                                                                >
                                                                    <div className="space-y-1 min-w-0">
                                                                        <div className="flex items-center gap-2">
                                                                            <QrCode className="w-4 h-4 text-bark-600 flex-shrink-0" />
                                                                            <span className="font-mono text-xs font-bold text-bark-900 truncate">
                                                                                {copy.barcode}
                                                                            </span>
                                                                        </div>
                                                                        <div className="flex items-center gap-2 flex-wrap text-[11px] text-bark-500 font-mono">
                                                                            <span>Loc: <span className="text-bark-700 font-semibold">{copy.location_rack || 'Rack-1'}</span></span>
                                                                            <span>·</span>
                                                                            <span className="capitalize">Cond: {copy.condition}</span>
                                                                        </div>
                                                                    </div>

                                                                    <div className="flex items-center gap-2 flex-shrink-0">
                                                                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase ${
                                                                            copy.status === 'available'
                                                                                ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                                                                                : copy.status === 'loaned'
                                                                                ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-800'
                                                                                : copy.status === 'reserved'
                                                                                ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                                                                                : 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                                                                        }`}>
                                                                            {copy.status}
                                                                        </span>

                                                                        <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                setEditingCopy(copy);
                                                                                setCopyForm({
                                                                                    book_id: copy.book_id,
                                                                                    barcode: copy.barcode,
                                                                                    condition: copy.condition,
                                                                                    status: copy.status,
                                                                                    location_rack: copy.location_rack || 'Rack-1'
                                                                                });
                                                                            }}
                                                                            className="p-1.5 rounded-lg border border-bark-100 hover:bg-cream-light text-bark-700 transition"
                                                                            title="Edit copy details"
                                                                        >
                                                                            <Edit2 className="w-3.5 h-3.5" />
                                                                        </button>

                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleDeleteCopy(copy.id, copy.barcode)}
                                                                            className="p-1.5 rounded-lg border border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600 transition"
                                                                            title="Delete copy"
                                                                        >
                                                                            <Trash2 className="w-3.5 h-3.5" />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="pt-4 border-t border-bark-100 flex justify-end">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setSelectedBookForCopies(null);
                                                    setEditingCopy(null);
                                                }}
                                                className="px-5 py-2 rounded-xl bg-bark-700 hover:bg-bark-900 text-cream-light text-xs font-bold transition shadow-sm"
                                            >
                                                Done
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
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

                    {/* TAB 5: Valid Subscriptions (Active Directory & Hybrid Combobox Grant Desk) */}
                    {activeTab === 'subscriptions' && (
                        <div className="space-y-6">
                            {/* Grant / Edit Subscription Form */}
                            <div className="bg-cream-light/40 border border-bark-100 rounded-2xl p-6 space-y-5 shadow-sm">
                                <div className="border-b border-bark-100 pb-4">
                                    <h2 className="text-base font-bold text-bark-900 flex items-center gap-2 font-mono">
                                        <CreditCard className="w-4 h-4 text-bark-700" />
                                        <span>{editingSub ? 'Edit Member Subscription' : 'Grant Member Perk Subscription'}</span>
                                    </h2>
                                    <p className="text-xs text-bark-500 mt-0.5">
                                        Search for any member by name, email, or member number below to allocate an active reading perk subscription pass.
                                    </p>
                                </div>

                                <form onSubmit={handleSubSubmit} className="space-y-4">
                                    {/* Member Combobox Selector */}
                                    <div className="relative">
                                        <label className="block text-xs font-semibold text-bark-700 mb-1.5 font-mono">
                                            Select Member (Search by Name, Email, or Member #) <span className="text-red-500">*</span>
                                        </label>

                                        {subForm.member_id ? (
                                            // Selected Member Preview Card
                                            <div className="flex items-center justify-between p-3.5 rounded-xl bg-paper border border-bark-200 shadow-sm">
                                                {(() => {
                                                    const selected = members.find(m => m.id === parseInt(subForm.member_id, 10));
                                                    return (
                                                        <div className="flex items-center gap-3 min-w-0">
                                                            <div className="w-9 h-9 rounded-full bg-bark-700 text-cream-light flex items-center justify-center font-bold text-sm flex-shrink-0">
                                                                {selected?.name ? selected.name.charAt(0).toUpperCase() : 'M'}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-bold text-xs text-bark-900 truncate">
                                                                        {selected?.name || `Member #${subForm.member_id}`}
                                                                    </span>
                                                                    <span className="text-[10px] font-mono uppercase bg-cream-light px-2 py-0.5 rounded text-bark-600">
                                                                        {selected?.membership_tier || 'standard'}
                                                                    </span>
                                                                </div>
                                                                <p className="text-[11px] text-bark-500 font-mono truncate">
                                                                    {selected?.email} · Card: {selected?.member_number || 'N/A'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    );
                                                })()}

                                                {!editingSub && (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setSubForm(prev => ({ ...prev, member_id: '' }));
                                                            setMemberSearchInput('');
                                                            setIsMemberDropdownOpen(true);
                                                        }}
                                                        className="px-3 py-1 rounded-lg border border-bark-200 text-xs font-semibold text-bark-600 hover:bg-cream-light transition ml-2 flex-shrink-0"
                                                    >
                                                        Change
                                                    </button>
                                                )}
                                            </div>
                                        ) : (
                                            // Combobox Search Input
                                            <div className="relative">
                                                <div className="relative">
                                                    <Search className="w-4 h-4 absolute left-3 top-3 text-bark-500" />
                                                    <input
                                                        type="text"
                                                        value={memberSearchInput}
                                                        onChange={(e) => {
                                                            setMemberSearchInput(e.target.value);
                                                            setIsMemberDropdownOpen(true);
                                                        }}
                                                        onFocus={() => setIsMemberDropdownOpen(true)}
                                                        placeholder="Type member name, email, or member card number (e.g. John, john@example.com, LIB-001)..."
                                                        className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-bark-100 bg-paper text-bark-900 text-xs focus:ring-1 focus:ring-tan-dark"
                                                    />
                                                </div>

                                                {/* Dropdown Results */}
                                                {isMemberDropdownOpen && (
                                                    <div className="absolute z-20 top-full left-0 right-0 mt-1 max-h-56 overflow-y-auto rounded-2xl bg-paper border border-bark-200 shadow-xl divide-y divide-bark-100">
                                                        {(() => {
                                                            const filtered = members.filter(m => {
                                                                if (!memberSearchInput.trim()) return true;
                                                                const q = memberSearchInput.toLowerCase();
                                                                return (
                                                                    (m.name || '').toLowerCase().includes(q) ||
                                                                    (m.email || '').toLowerCase().includes(q) ||
                                                                    (m.member_number || '').toLowerCase().includes(q) ||
                                                                    String(m.id) === q
                                                                );
                                                            }).slice(0, 8);

                                                            if (filtered.length === 0) {
                                                                return (
                                                                    <div className="p-4 text-center text-xs text-bark-500">
                                                                        No library members found matching "{memberSearchInput}".
                                                                    </div>
                                                                );
                                                            }

                                                            return filtered.map((m) => (
                                                                <button
                                                                    key={m.id}
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setSubForm(prev => ({ ...prev, member_id: m.id }));
                                                                        setMemberSearchInput('');
                                                                        setIsMemberDropdownOpen(false);
                                                                    }}
                                                                    className="w-full p-3 text-left flex items-center justify-between hover:bg-cream-light/60 transition group"
                                                                >
                                                                    <div className="flex items-center gap-3 min-w-0">
                                                                        <div className="w-8 h-8 rounded-full bg-bark-100 text-bark-700 flex items-center justify-center font-bold text-xs flex-shrink-0 group-hover:bg-bark-700 group-hover:text-cream-light transition">
                                                                            {m.name ? m.name.charAt(0).toUpperCase() : 'M'}
                                                                        </div>
                                                                        <div className="min-w-0">
                                                                            <div className="font-bold text-xs text-bark-900 truncate">{m.name}</div>
                                                                            <div className="text-[11px] text-bark-500 font-mono truncate">{m.email} · Card: {m.member_number}</div>
                                                                        </div>
                                                                    </div>
                                                                    <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-cream-light text-bark-600 flex-shrink-0 ml-2">
                                                                        {m.membership_tier || 'standard'}
                                                                    </span>
                                                                </button>
                                                            ));
                                                        })()}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Quick Duration & Plan Presets */}
                                    <div className="space-y-1.5">
                                        <label className="block text-[11px] font-mono uppercase tracking-wider text-bark-500">
                                            Quick Duration & Plan Presets
                                        </label>
                                        <div className="flex flex-wrap gap-2">
                                            <button
                                                type="button"
                                                onClick={() => applySubPreset(30, 'pro_perks_monthly', 500.00)}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                                                    subForm.plan_type === 'pro_perks_monthly'
                                                        ? 'bg-bark-700 text-cream-light shadow-sm'
                                                        : 'bg-paper border border-bark-100 text-bark-700 hover:bg-cream-light'
                                                }`}
                                            >
                                                1 Month Pro (30 Days · KES 500)
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => applySubPreset(90, 'scholar_perks_quarterly', 1350.00)}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                                                    subForm.plan_type === 'scholar_perks_quarterly'
                                                        ? 'bg-bark-700 text-cream-light shadow-sm'
                                                        : 'bg-paper border border-bark-100 text-bark-700 hover:bg-cream-light'
                                                }`}
                                            >
                                                3 Months Scholar (90 Days · KES 1,350)
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => applySubPreset(365, 'vip_annual_pass', 4500.00)}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                                                    subForm.plan_type === 'vip_annual_pass'
                                                        ? 'bg-bark-700 text-cream-light shadow-sm'
                                                        : 'bg-paper border border-bark-100 text-bark-700 hover:bg-cream-light'
                                                }`}
                                            >
                                                1 Year VIP (365 Days · KES 4,500)
                                            </button>
                                        </div>
                                    </div>

                                    {/* Detailed Form Inputs */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-1">
                                        <div>
                                            <label className="block text-xs font-semibold text-bark-700 mb-1">Plan Identifier</label>
                                            <input
                                                type="text"
                                                value={subForm.plan_type}
                                                onChange={(e) => setSubForm({ ...subForm, plan_type: e.target.value })}
                                                placeholder="e.g. pro_perks_monthly"
                                                required
                                                className="w-full px-3 py-2 rounded-xl bg-paper border border-bark-100 text-xs text-bark-900 font-mono focus:ring-1 focus:ring-tan-dark"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-bark-700 mb-1">Amount (KES)</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={subForm.amount_paid}
                                                onChange={(e) => setSubForm({ ...subForm, amount_paid: e.target.value })}
                                                required
                                                disabled={!!editingSub}
                                                className="w-full px-3 py-2 rounded-xl bg-paper border border-bark-100 text-xs text-bark-900 font-mono focus:ring-1 focus:ring-tan-dark disabled:opacity-60"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-bark-700 mb-1">Payment Status</label>
                                            <select
                                                value={subForm.payment_status}
                                                onChange={(e) => setSubForm({ ...subForm, payment_status: e.target.value })}
                                                className="w-full px-3 py-2 rounded-xl bg-paper border border-bark-100 text-xs text-bark-900 font-mono focus:ring-1 focus:ring-tan-dark"
                                            >
                                                <option value="paid">paid (active)</option>
                                                <option value="pending">pending</option>
                                                <option value="failed">failed</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-bark-700 mb-1">Pass Expiration Date</label>
                                            <input
                                                type="date"
                                                value={subForm.expires_at}
                                                onChange={(e) => setSubForm({ ...subForm, expires_at: e.target.value })}
                                                className="w-full px-3 py-2 rounded-xl bg-paper border border-bark-100 text-xs text-bark-900 font-mono focus:ring-1 focus:ring-tan-dark"
                                            />
                                        </div>
                                    </div>

                                    {/* Form Submit Actions */}
                                    <div className="pt-2 flex items-center gap-2">
                                        <button
                                            type="submit"
                                            disabled={subSubmitting || !subForm.member_id}
                                            className="px-6 py-2.5 rounded-xl bg-bark-700 hover:bg-bark-900 text-cream-light font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm disabled:opacity-50"
                                        >
                                            {subSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                            <span>{editingSub ? 'Update Subscription' : 'Grant Subscription Pass'}</span>
                                        </button>

                                        {editingSub && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setEditingSub(null);
                                                    setSubForm({ member_id: '', plan_type: 'pro_perks_monthly', amount_paid: 500.00, payment_status: 'paid', expires_at: '' });
                                                    setMemberSearchInput('');
                                                }}
                                                className="px-4 py-2.5 rounded-xl border border-bark-100 text-xs font-semibold text-bark-600 hover:bg-cream-light transition"
                                            >
                                                Cancel Edit
                                            </button>
                                        )}
                                    </div>
                                </form>
                            </div>

                            {/* Active Subscribers Directory */}
                            <div className="bg-cream-light/40 border border-bark-100 rounded-2xl p-6 space-y-4 shadow-sm">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-bark-100 pb-4">
                                    <div>
                                        <h3 className="text-base font-bold text-bark-900 flex items-center gap-2 font-mono">
                                            <Users className="w-4 h-4 text-bark-700" />
                                            <span>Active Subscribers Directory</span>
                                        </h3>
                                        <p className="text-xs text-bark-500 mt-0.5">
                                            Current passholders with application timestamps and remaining duration countdowns.
                                        </p>
                                    </div>

                                    {/* Filter Toggle */}
                                    <div className="flex items-center gap-1.5 p-1 rounded-xl bg-paper border border-bark-100 font-mono text-xs">
                                        <button
                                            type="button"
                                            onClick={() => setSubTabFilter('active')}
                                            className={`px-3 py-1 rounded-lg font-semibold transition ${
                                                subTabFilter === 'active'
                                                    ? 'bg-bark-700 text-cream-light shadow-sm'
                                                    : 'text-bark-600 hover:text-bark-900'
                                            }`}
                                        >
                                            Active Passes ({subscriptions.filter(s => s.payment_status === 'paid' && (!s.expires_at || new Date(s.expires_at) >= new Date())).length})
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setSubTabFilter('all')}
                                            className={`px-3 py-1 rounded-lg font-semibold transition ${
                                                subTabFilter === 'all'
                                                    ? 'bg-bark-700 text-cream-light shadow-sm'
                                                    : 'text-bark-600 hover:text-bark-900'
                                            }`}
                                        >
                                            All History ({subscriptions.length})
                                        </button>
                                    </div>
                                </div>

                                {/* Search Bar */}
                                <div className="relative">
                                    <Search className="w-4 h-4 absolute left-3 top-3 text-bark-500" />
                                    <input
                                        type="text"
                                        value={subSearchQuery}
                                        onChange={(e) => setSubSearchQuery(e.target.value)}
                                        placeholder="Search active subscribers by name, email, member number, or plan type..."
                                        className="w-full pl-9 pr-4 py-2 rounded-xl border border-bark-100 bg-paper text-bark-900 text-xs focus:ring-1 focus:ring-tan-dark"
                                    />
                                </div>

                                {/* Table */}
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs text-bark-700 border-collapse">
                                        <thead className="bg-paper text-bark-500 uppercase text-[10px] tracking-wider font-mono">
                                            <tr>
                                                <th className="p-3 border-b border-bark-100">Subscriber</th>
                                                <th className="p-3 border-b border-bark-100">Plan & Reference</th>
                                                <th className="p-3 border-b border-bark-100 font-mono">Date Applied</th>
                                                <th className="p-3 border-b border-bark-100 text-center font-mono">Remaining Duration</th>
                                                <th className="p-3 border-b border-bark-100 text-center">Amount Paid</th>
                                                <th className="p-3 border-b border-bark-100 text-center">Status</th>
                                                <th className="p-3 border-b border-bark-100 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-bark-100 font-mono">
                                            {(() => {
                                                const list = subscriptions.filter((s) => {
                                                    const durationInfo = getDurationInfo(s);
                                                    if (subTabFilter === 'active' && (durationInfo.isExpired || s.payment_status !== 'paid')) {
                                                        return false;
                                                    }
                                                    if (!subSearchQuery.trim()) return true;
                                                    const q = subSearchQuery.toLowerCase();
                                                    const name = (s.member?.user?.name || s.user?.name || '').toLowerCase();
                                                    const email = (s.member?.user?.email || s.user?.email || '').toLowerCase();
                                                    const num = (s.member?.member_number || '').toLowerCase();
                                                    const plan = (s.plan_type || '').toLowerCase();
                                                    return name.includes(q) || email.includes(q) || num.includes(q) || plan.includes(q);
                                                });

                                                if (list.length === 0) {
                                                    return (
                                                        <tr>
                                                            <td colSpan={7} className="py-12 text-center text-xs text-bark-500">
                                                                <CreditCard className="w-8 h-8 text-bark-400 mx-auto opacity-50 mb-2" />
                                                                <p className="font-semibold text-bark-800">No subscribers found.</p>
                                                                <p>Grant a subscription pass above to see active members here.</p>
                                                            </td>
                                                        </tr>
                                                    );
                                                }

                                                return list.map((s) => {
                                                    const durationInfo = getDurationInfo(s);
                                                    const dateApplied = (s.starts_at || s.created_at || '').slice(0, 10) || 'Recent';

                                                    return (
                                                        <tr key={s.id} className="hover:bg-paper/50">
                                                            <td className="p-3 font-sans">
                                                                <div className="font-semibold text-bark-900">
                                                                    {s.member?.user?.name || s.user?.name || `Member #${s.member_id}`}
                                                                </div>
                                                                <div className="text-[11px] font-mono text-bark-500">
                                                                    {s.member?.user?.email || s.user?.email || s.member?.member_number}
                                                                </div>
                                                            </td>
                                                            <td className="p-3 font-sans">
                                                                <div className="font-semibold text-bark-800 capitalize">
                                                                    {s.plan_type.replace(/_/g, ' ')}
                                                                </div>
                                                                <div className="text-[10px] text-bark-400 font-mono">
                                                                    {s.transaction_reference || `SUB-${s.id}`}
                                                                </div>
                                                            </td>
                                                            <td className="p-3 text-bark-700 text-xs font-mono">
                                                                {dateApplied}
                                                            </td>
                                                            <td className="p-3 text-center">
                                                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold font-mono uppercase inline-flex items-center gap-1 ${durationInfo.badgeClass}`}>
                                                                    <Clock className="w-3 h-3" />
                                                                    <span>{durationInfo.text}</span>
                                                                </span>
                                                            </td>
                                                            <td className="p-3 text-center font-bold text-bark-900">
                                                                KES {Number(s.amount_paid || 0).toFixed(2)}
                                                            </td>
                                                            <td className="p-3 text-center">
                                                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                                                                    s.payment_status === 'paid'
                                                                        ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                                                                        : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                                                                }`}>
                                                                    {s.payment_status}
                                                                </span>
                                                            </td>
                                                            <td className="p-3 text-right space-x-1.5 font-sans">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setEditingSub(s);
                                                                        setSubForm({
                                                                            member_id: s.member_id,
                                                                            plan_type: s.plan_type,
                                                                            amount_paid: s.amount_paid,
                                                                            payment_status: s.payment_status,
                                                                            expires_at: s.expires_at ? s.expires_at.slice(0, 10) : ''
                                                                        });
                                                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                                                    }}
                                                                    className="p-1.5 rounded-lg border border-bark-100 text-bark-700 hover:bg-cream-light transition"
                                                                    title="Edit subscription"
                                                                >
                                                                    <Edit2 className="w-3.5 h-3.5" />
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleDeleteSub(s.id)}
                                                                    className="p-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition"
                                                                    title="Cancel subscription"
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    );
                                                });
                                            })()}
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

                    {/* Member Refund Applications View */}
                    {activeTab === 'refunds' && (
                        <div className="bg-cream-light/40 border border-bark-100 rounded-2xl p-6 space-y-6 shadow-sm">
                            <div className="flex items-center justify-between border-b border-bark-100 pb-4">
                                <div>
                                    <h2 className="text-base font-bold text-bark-900 flex items-center gap-2">
                                        <RefreshCw className="w-4 h-4 text-tan-dark" /> Member Refund Applications
                                    </h2>
                                    <p className="text-xs text-bark-500 mt-0.5">Review, accept, or revoke member membership subscription refund applications.</p>
                                </div>
                                <button
                                    onClick={fetchRefundRequests}
                                    className="px-3 py-1.5 rounded-xl border border-bark-100 bg-paper text-xs font-bold text-bark-700 hover:bg-cream-light flex items-center gap-1.5 shadow-sm"
                                >
                                    <RefreshCw className="w-3.5 h-3.5" /> Refresh List
                                </button>
                            </div>

                            {refundRequests.length === 0 ? (
                                <div className="text-center py-12 bg-paper/40 rounded-xl border border-bark-100 space-y-2">
                                    <DollarSign className="w-8 h-8 text-bark-400 mx-auto" />
                                    <h3 className="text-sm font-bold text-bark-900">No Pending Refund Requests</h3>
                                    <p className="text-xs text-bark-500">Member refund applications submitted from the subscription portal will appear here.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {refundRequests.map((rf) => (
                                        <div key={rf.id} className="rounded-xl border border-bark-100 bg-paper p-5 space-y-3 shadow-card">
                                            <div className="flex items-center justify-between border-b border-bark-100 pb-3">
                                                <div>
                                                    <span className="font-mono text-[10px] uppercase font-bold text-bark-500">Refund Request #{rf.id}</span>
                                                    <h3 className="text-sm font-bold text-bark-900">{rf.user?.name || 'Member'}</h3>
                                                </div>
                                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase ${
                                                    rf.status === 'approved'
                                                        ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                                        : rf.status === 'rejected'
                                                        ? 'bg-rose-100 text-rose-900 border border-rose-300'
                                                        : 'bg-amber-100 text-amber-900 border border-amber-300'
                                                }`}>
                                                    {rf.status}
                                                </span>
                                            </div>

                                            <div className="space-y-1.5 text-xs text-bark-700 font-mono">
                                                <div className="flex justify-between">
                                                    <span className="text-bark-500">Email:</span>
                                                    <span className="font-semibold text-bark-900">{rf.user?.email || 'N/A'}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-bark-500">Refund Amount:</span>
                                                    <span className="font-extrabold text-bark-900">KES {Number(rf.amount || 0).toFixed(2)}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-bark-500">Payment Reference:</span>
                                                    <span className="font-bold text-bark-900">{rf.payment_reference || 'N/A'}</span>
                                                </div>
                                                <div className="border-t border-bark-100/40 pt-1.5 text-[11px]">
                                                    <span className="text-bark-500 block text-[10px] uppercase font-bold">Reason:</span>
                                                    <p className="text-bark-800 font-sans italic">{rf.reason}</p>
                                                </div>
                                            </div>

                                            {rf.status === 'pending' && (
                                                <div className="flex items-center gap-2 border-t border-bark-100 pt-3">
                                                    <button
                                                        onClick={() => handleApproveRefund(rf.id)}
                                                        className="flex-1 py-1.5 px-3 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs transition-colors shadow-sm flex items-center justify-center gap-1"
                                                    >
                                                        <CheckCircle2 className="w-3.5 h-3.5" /> Accept & Refund
                                                    </button>
                                                    <button
                                                        onClick={() => handleRejectRefund(rf.id)}
                                                        className="flex-1 py-1.5 px-3 rounded-lg bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs transition-colors shadow-sm flex items-center justify-center gap-1"
                                                    >
                                                        <XCircle className="w-3.5 h-3.5" /> Revoke / Reject
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

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
