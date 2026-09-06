import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Clock, ShieldCheck, ShieldAlert, Sparkles, ShoppingBag, Loader2, User, UserPlus, Bookmark, XCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLibrary } from '../context/LibraryContext';
import { api } from '../services/api';
import DarajaPayModal from '../components/DarajaPayModal';
import SubscriptionPassModal from '../components/SubscriptionPassModal';
import DigitalReaderModal from '../components/DigitalReaderModal';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { StatCard } from '../components/ui/StatCard';
import { StatCardSkeleton, Skeleton } from '../components/ui/Skeleton';
import BookMiniCard from '../components/BookMiniCard';

export default function MemberDashboard() {
    const { user } = useAuth();
    const { pushToast } = useLibrary();
    const [loans, setLoans] = useState([]);
    const [reservations, setReservations] = useState([]);
    const [digitalLibrary, setDigitalLibrary] = useState([]);
    const [subscription, setSubscription] = useState(null);
    const [recommended, setRecommended] = useState([]);
    const [recommendedLoading, setRecommendedLoading] = useState(true);
    const [loading, setLoading] = useState(true);

    // Modals
    const [darajaModal, setDarajaModal] = useState({ isOpen: false, type: 'fine', item: null });
    const [subModalOpen, setSubModalOpen] = useState(false);
    const [readerModal, setReaderModal] = useState({ isOpen: false, data: null });

    useEffect(() => {
        const fetchDashboardData = async () => {
            setLoading(true);
            try {
                const [loansRes, subRes, digitalRes, recsRes, resRes] = await Promise.all([
                    api.getLoans().catch(() => ({ data: [] })),
                    api.getSubscriptionStatus().catch(() => ({ data: null })),
                    api.getMyDigitalLibrary().catch(() => ({ data: [] })),
                    api.getRecommendations().catch(() => ({ data: [] })),
                    api.getMyReservations().catch(() => ({ data: [] })),
                ]);

                setLoans(loansRes.data || loansRes || []);
                setSubscription(subRes.data || null);
                setDigitalLibrary(digitalRes.data || digitalRes || []);
                setRecommended(recsRes.data || recsRes || []);
                const resList = Array.isArray(resRes) ? resRes : resRes?.data || [];
                setReservations(resList);
                setRecommendedLoading(false);
            } catch (err) {
                // Handled silently
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

    const handleCancelReservation = async (reservationId, bookTitle) => {
        if (!window.confirm(`Are you sure you want to cancel your physical hold reservation for "${bookTitle}"?`)) {
            return;
        }
        try {
            await api.cancelReservation(reservationId);
            setReservations(prev => prev.filter(r => r.id !== reservationId));
            pushToast({ title: 'Reservation Cancelled', detail: `Cancelled reservation for "${bookTitle}".`, tone: 'info' });
        } catch (err) {
            pushToast({ title: 'Cancellation Failed', detail: err.message || 'Failed to cancel reservation.', tone: 'error' });
        }
    };

    const isSubscribed = user?.member?.is_subscribed || subscription?.is_subscribed;

    const handleReadDigital = async (book) => {
        try {
            const res = await api.readDigitalBook(book.id);
            setReaderModal({ isOpen: true, data: res.data || res });
        } catch (err) {
            pushToast({ title: 'Reader Error', detail: err.message || 'Failed to stream digital book.', tone: 'error' });
        }
    };

    const daysUntil = (dueDateStr) => {
        if (!dueDateStr) return 0;
        const due = new Date(dueDateStr);
        const today = new Date();
        return Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

            {/* Inactive Membership Restriction Banner */}
            {!isSubscribed && (
                <div className="rounded-2xl border border-amber-300 bg-amber-50/90 p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-card">
                    <div className="flex items-start gap-3.5">
                        <div className="p-2.5 rounded-xl bg-amber-100 text-amber-800 border border-amber-300 flex-shrink-0">
                            <ShieldAlert className="w-5 h-5" />
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <h2 className="text-sm font-extrabold text-amber-950">Active Membership Required</h2>
                                <span className="rounded-md bg-amber-200 px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-amber-900">
                                    Restricted Status
                                </span>
                            </div>
                            <p className="text-xs text-amber-900 leading-relaxed max-w-2xl">
                                Active membership required to borrow books and access member services.
                            </p>
                        </div>
                    </div>
                    <Link
                        to="/membership"
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-bark-700 px-5 py-2.5 text-xs font-bold text-cream-light shadow-card transition hover:bg-bark-900 flex-shrink-0"
                    >
                        <UserPlus className="w-4 h-4" /> Register Membership
                    </Link>
                </div>
            )}
            
            {/* User Greeting & Member Banner */}
            <div className="rounded-2xl border border-bark-100 bg-cream-light/60 p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-card">
                <div className="space-y-1.5">
                    <div className="flex items-center gap-2.5">
                        <h1 className="text-xl sm:text-2xl font-extrabold text-bark-900">{user?.name || 'Member Library'}</h1>
                        {isSubscribed ? (
                            <Badge tone="exclusive">PRO MEMBER (20% OFF)</Badge>
                        ) : (
                            <Badge tone="neutral">STANDARD MEMBER</Badge>
                        )}
                    </div>
                    <p className="text-xs font-mono text-bark-500">
                        Card #: <span className="text-bark-900 font-bold">{user?.member?.member_number || 'N/A'}</span> | Borrow Limit: {user?.member?.borrow_limit || 5} Items
                    </p>
                </div>

                {!isSubscribed && (
                    <Button variant="primary" onClick={() => setSubModalOpen(true)}>
                        <Sparkles className="w-4 h-4 text-olive" /> Unlock Pro Member Pass
                    </Button>
                )}
            </div>

            {/* Stat Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {loading ? (
                    <>
                        <StatCardSkeleton />
                        <StatCardSkeleton />
                        <StatCardSkeleton />
                        <StatCardSkeleton />
                    </>
                ) : (
                    <>
                        <StatCard
                            label="Active Loans"
                            value={loans.filter(l => l.status === 'active').length}
                            icon={BookOpen}
                            hint="Physical books currently on loan"
                            delay={0}
                        />
                        <StatCard
                            label="Hold Reservations"
                            value={reservations.filter(r => r.status === 'pending' || r.status === 'ready_for_pickup').length}
                            icon={Bookmark}
                            hint="Physical books queued for pickup"
                            delay={0.05}
                        />
                        <StatCard
                            label="Digital Entitlements"
                            value={digitalLibrary.length}
                            icon={ShoppingBag}
                            hint="Purchased lifetime e-books"
                            delay={0.10}
                        />
                        <StatCard
                            label="Overdue Items"
                            value={loans.filter(l => l.status === 'overdue').length}
                            icon={Clock}
                            hint="Loans past return due date"
                            delay={0.15}
                        />
                    </>
                )}
            </div>

            {/* Recommended For You (content-based) */}
            {(recommendedLoading || recommended.length > 0) && (
                <div className="rounded-2xl border border-bark-100 bg-paper p-6 space-y-4 shadow-card">
                    <div className="flex items-center justify-between">
                        <h3 className="text-base font-bold text-bark-900 flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-tan-dark" /> Recommended For You
                        </h3>
                        <Link
                            to="/catalog"
                            className="text-xs font-semibold text-bark-500 transition hover:text-bark-900"
                        >
                            Browse catalog →
                        </Link>
                    </div>

                    {recommendedLoading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {Array.from({ length: 3 }).map((_, i) => (
                                <Skeleton key={i} className="h-16 w-full rounded-xl" />
                            ))}
                        </div>
                    ) : recommended.length === 0 ? (
                        <p className="text-xs text-bark-500 py-4 text-center">
                            No recommendations yet — borrow a book or explore the catalog to get started.
                        </p>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {recommended.map((book) => (
                                <BookMiniCard key={book.id} book={book} />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Physical Hold Reservations & Pickups */}
            <div className="rounded-2xl border border-bark-100 bg-paper p-6 space-y-4 shadow-card">
                <div className="flex items-center justify-between border-b border-bark-100 pb-3">
                    <h3 className="text-base font-bold text-bark-900 flex items-center gap-2">
                        <Bookmark className="w-4 h-4 text-bark-700" /> Physical Hold Reservations &amp; Collection Desk
                    </h3>
                    <span className="font-mono text-xs text-bark-500">
                        {reservations.filter(r => r.status === 'pending' || r.status === 'ready_for_pickup').length} Active Hold(s)
                    </span>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-8 text-bark-500 font-mono text-xs">
                        <Loader2 className="w-4 h-4 animate-spin mr-2" /> Fetching reservations...
                    </div>
                ) : reservations.filter(r => r.status !== 'cancelled' && r.status !== 'expired').length === 0 ? (
                    <div className="text-center py-6 text-xs text-bark-500 bg-cream-light/20 rounded-xl border border-dashed border-bark-200 space-y-2">
                        <p>You have no active physical hold reservations.</p>
                        <Link to="/catalog">
                            <Button variant="secondary" className="text-xs py-1.5 px-3">
                                Browse Catalog to Reserve Physical Books
                            </Button>
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {reservations.filter(r => r.status !== 'cancelled' && r.status !== 'expired').map((res) => {
                            const isReady = res.status === 'ready_for_pickup';
                            const dateStr = res.reserved_at || res.created_at ? new Date(res.reserved_at || res.created_at).toLocaleDateString() : 'Recent';
                            const expiryStr = res.expires_at ? new Date(res.expires_at).toLocaleDateString() : null;

                            return (
                                <div key={res.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl border border-bark-100 bg-cream-light/30 gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-14 rounded overflow-hidden bg-cream-light border border-bark-100 flex-shrink-0 flex items-center justify-center">
                                            {res.book?.cover_image_path ? (
                                                <img src={res.book.cover_image_path} alt={res.book.title} className="w-full h-full object-cover" />
                                            ) : (
                                                <Bookmark className="w-4 h-4 text-bark-400" />
                                            )}
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="font-bold text-sm text-bark-900">{res.book?.title || 'Library Book'}</span>
                                                <Badge tone={isReady ? 'available' : 'exclusive'}>
                                                    {isReady ? 'READY FOR PICKUP AT DESK' : `QUEUE POSITION #${res.queue_position || 1}`}
                                                </Badge>
                                            </div>
                                            <p className="text-xs text-bark-500">
                                                By {res.book?.author || 'Unknown Author'} · Reserved: {dateStr} {expiryStr ? `· Hold Expiry: ${expiryStr}` : ''}
                                            </p>
                                        </div>
                                    </div>

                                    <Button
                                        variant="ghost"
                                        onClick={() => handleCancelReservation(res.id, res.book?.title || 'Book')}
                                        className="text-xs border border-bark-200 text-rose-700 hover:bg-rose-50 hover:border-rose-300"
                                    >
                                        <XCircle className="w-3.5 h-3.5 mr-1 text-rose-600" /> Cancel Hold
                                    </Button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Borrowed Physical Items Table / Cards */}
            <div className="rounded-2xl border border-bark-100 bg-paper p-6 space-y-4 shadow-card">
                <h3 className="text-base font-bold text-bark-900 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-bark-700" /> Currently Borrowed Books &amp; Countdowns
                </h3>

                {loading ? (
                    <div className="flex items-center justify-center py-8 text-bark-500 font-mono text-xs">
                        <Loader2 className="w-4 h-4 animate-spin mr-2" /> Fetching active loans...
                    </div>
                ) : loans.length === 0 ? (
                    <p className="text-xs text-bark-500 py-6 text-center">You have no active physical book loans.</p>
                ) : (
                    <div className="space-y-3">
                        {loans.map((loan) => {
                            const daysLeft = daysUntil(loan.due_date);
                            const isOverdue = daysLeft < 0 || loan.status === 'overdue';
                            const title = loan.book_title || loan.book_copy?.book?.title || loan.book?.title || 'Library Book';
                            const barcode = loan.barcode || loan.book_copy?.barcode || 'N/A';
                            const author = loan.book_copy?.book?.author || loan.book?.author;

                            return (
                                <div key={loan.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl border border-bark-100 bg-cream-light/30 gap-4">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-sm text-bark-900">{title}</span>
                                            <Badge tone={isOverdue ? 'overdue' : 'available'}>
                                                {isOverdue ? `OVERDUE BY ${Math.abs(daysLeft)} DAYS` : `DUE IN ${daysLeft} DAYS`}
                                            </Badge>
                                        </div>
                                        <p className="text-xs font-mono text-bark-500">
                                            {author ? `By ${author} | ` : ''}Barcode: {barcode} | Loaned: {loan.loan_date} | Due: {loan.due_date}
                                        </p>
                                    </div>

                                    {loan.fine_amount > 0 && (
                                        <Button
                                            variant="secondary"
                                            onClick={() => setDarajaModal({ isOpen: true, type: 'fine', item: { id: loan.fine_id, amount: loan.fine_amount } })}
                                            className="text-xs border-[#a8452f]/30 text-[#8c3620]"
                                        >
                                            Pay Fine (KES {loan.fine_amount})
                                        </Button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Purchased E-Books */}
            <div className="rounded-2xl border border-bark-100 bg-paper p-6 space-y-4 shadow-card">
                <h3 className="text-base font-bold text-bark-900 flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-bark-700" /> Digital E-Book Library
                </h3>

                {digitalLibrary.length === 0 ? (
                    <p className="text-xs text-bark-500 py-6 text-center">No digital e-books purchased yet.</p>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {digitalLibrary.map((item) => {
                            const book = item.book || item;
                            return (
                                <div key={item.id} className="rounded-xl border border-bark-100 bg-cream-light/30 p-4 space-y-3 flex flex-col justify-between hover:border-bark-300 transition-colors">
                                    <div className="flex gap-3 items-start">
                                        <div className="w-12 h-16 rounded-md overflow-hidden bg-cream-light flex-shrink-0 border border-bark-100 shadow-sm">
                                            {book.cover_image_path ? (
                                                <img src={book.cover_image_path} alt={book.title} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center font-bold text-[10px] text-bark-400 bg-cream-light/60">
                                                    E-Book
                                                </div>
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h4 className="font-bold text-sm text-bark-900 line-clamp-1">{book.title || 'Untitled Book'}</h4>
                                            <p className="text-xs text-bark-500 truncate">By {book.author || 'Unknown Author'}</p>
                                            <span className="inline-block mt-1 font-mono text-[9px] uppercase tracking-wider text-olive-dark bg-olive/20 px-1.5 py-0.5 rounded font-semibold">
                                                Lifetime Access
                                            </span>
                                        </div>
                                    </div>
                                    <Button variant="secondary" onClick={() => handleReadDigital(book)} className="w-full text-xs">
                                        Read E-Book Stream
                                    </Button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Modals */}
            <DigitalReaderModal
                isOpen={readerModal.isOpen}
                onClose={() => setReaderModal({ isOpen: false, data: null })}
                bookData={readerModal.data}
            />

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
        </div>
    );
}
