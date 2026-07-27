import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { useNavigate } from 'react-router-dom';
import DarajaPayModal from '../components/DarajaPayModal';
import SubscriptionPassModal from '../components/SubscriptionPassModal';
import DigitalReaderModal from '../components/DigitalReaderModal';

// Decorative "book spine" motif — a row of varying-height bars that reads as
// a shelf silhouette. Used as the signature element across the hero and the
// tip card so the library identity shows up in the chrome, not just the copy.
function BookSpines({ className = '', tone = 'onPrimary' }) {
    const heights = [38, 62, 46, 70, 30, 54, 44, 66, 36, 58, 48, 26];
    const colorClass = tone === 'onPrimary'
        ? 'bg-on-primary'
        : 'bg-primary';
    return (
        <div className={`flex items-end gap-[3px] ${className}`} aria-hidden="true">
            {heights.map((h, i) => (
                <span
                    key={i}
                    className={`${colorClass} w-[5px] rounded-t-sm`}
                    style={{ height: `${h}%`, opacity: 0.12 + (i % 4) * 0.06 }}
                />
            ))}
        </div>
    );
}

function StatCardSkeleton() {
    return (
        <div className="bg-surface-container-lowest p-stack-md rounded-xl border border-outline-variant/10 flex flex-col gap-3 animate-pulse">
            <div className="w-9 h-9 rounded-lg bg-surface-container-highest" />
            <div className="space-y-2">
                <div className="h-2.5 w-16 rounded bg-surface-container-highest" />
                <div className="h-4 w-20 rounded bg-surface-container-highest" />
            </div>
        </div>
    );
}

function BookCardSkeleton() {
    return (
        <div className="w-48 shrink-0 flex flex-col gap-2 animate-pulse">
            <div className="h-72 rounded-xl bg-surface-container-highest" />
            <div className="h-3.5 w-3/4 rounded bg-surface-container-highest mt-2" />
            <div className="h-3 w-1/2 rounded bg-surface-container-highest" />
        </div>
    );
}

function EmptyState({ icon, title, subtitle }) {
    return (
        <div className="flex flex-col items-center justify-center text-center py-8 px-4 gap-2">
            <span className="material-symbols-outlined text-3xl text-outline-variant">{icon}</span>
            <p className="font-label-md text-label-md text-on-surface">{title}</p>
            {subtitle && <p className="text-xs text-on-surface-variant max-w-[220px]">{subtitle}</p>}
        </div>
    );
}

export default function MemberDashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loans, setLoans] = useState([]);
    const [digitalLibrary, setDigitalLibrary] = useState([]);
    const [subscription, setSubscription] = useState(null);
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modals
    const [darajaModal, setDarajaModal] = useState({ isOpen: false, type: 'fine', item: null });
    const [subModalOpen, setSubModalOpen] = useState(false);
    const [readerModal, setReaderModal] = useState({ isOpen: false, data: null });

    useEffect(() => {
        const fetchDashboardData = async () => {
            setLoading(true);
            try {
                const [loansRes, subRes, digitalRes, booksRes] = await Promise.all([
                    api.getLoans().catch(() => ({ data: [] })),
                    api.getSubscriptionStatus().catch(() => ({ data: null })),
                    api.getMyDigitalLibrary().catch(() => ({ data: [] })),
                    api.getBooks().catch(() => ({ data: [] }))
                ]);

                setLoans(loansRes.data || loansRes || []);
                setSubscription(subRes.data || null);
                setDigitalLibrary(digitalRes.data || digitalRes || []);
                setBooks(booksRes.data || booksRes || []);
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
    const activeLoans = loans.filter(l => l.status === 'active');
    const overdueLoans = loans.filter(l => l.status === 'overdue');
    const totalFines = user?.member?.fines_amount || 0;
    const borrowLimit = user?.member?.borrow_limit || 5;
    const borrowPct = Math.min(100, Math.round((activeLoans.length / borrowLimit) * 100));

    const handleReadDigital = async (book) => {
        try {
            const res = await api.readDigitalBook(book.id);
            setReaderModal({ isOpen: true, data: res.data || res });
        } catch (err) {
            alert(err.message || 'Failed to stream digital book.');
        }
    };

    // Calculate dynamic greeting
    const hour = new Date().getHours();
    let greetingPrefix = "Welcome back,";
    if (hour < 12) greetingPrefix = "Good morning,";
    else if (hour < 18) greetingPrefix = "Good afternoon,";
    else greetingPrefix = "Good evening,";

    const userName = user?.name ? user.name.split(' ')[0] : 'Member';

    const daysUntil = (dateStr) => {
        const diff = Math.ceil((new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24));
        return diff;
    };

    return (
        <div className="bg-background text-on-background min-h-screen pb-24 font-body-md">
            {/* TopAppBar */}
            <header className="bg-surface/70 dark:bg-surface-dim/70 backdrop-blur-xl border-b border-outline-variant/30 dark:border-outline/20 shadow-sm docked full-width top-0 sticky flex justify-between items-center px-margin-mobile md:px-margin-desktop w-full z-50 h-16">
                <div className="flex items-center gap-stack-sm lg:hidden">
                    <span className="font-headline-md text-headline-md font-bold tracking-tight text-primary dark:text-primary-fixed">MaktabaBora</span>
                </div>
                <div className="hidden lg:flex items-center gap-stack-sm ml-[240px]">
                    <h2 className="font-headline-md text-xl font-bold text-on-surface">Dashboard</h2>
                </div>
                <div className="flex items-center gap-4">
                    <button className="relative material-symbols-outlined text-primary dark:text-primary-fixed-dim hover:bg-surface-container-high transition-colors p-2 rounded-full active:scale-90" style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>
                        notifications
                        {overdueLoans.length > 0 && (
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-error ring-2 ring-surface" />
                        )}
                    </button>
                    <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container font-bold overflow-hidden shadow-sm">
                        {userName.charAt(0).toUpperCase()}
                    </div>
                </div>
            </header>

            {/* Desktop Navigation Drawer */}
            <aside className="hidden lg:flex flex-col gap-stack-md p-stack-md fixed left-0 top-0 h-full z-40 bg-surface-container-low dark:bg-surface-container-lowest border-r border-outline-variant/30 shadow-sm w-[240px]">
                <div className="mb-stack-lg flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container font-bold">MB</div>
                    <span className="font-headline-md text-xl text-primary font-bold tracking-tight">MaktabaBora</span>
                </div>
                <nav className="flex flex-col gap-2">
                    <button className="flex items-center gap-3 p-3 bg-primary-container dark:bg-primary text-on-primary-container dark:text-on-primary font-medium rounded-lg transition-all w-full text-left">
                        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>dashboard</span>
                        <span className="font-label-md text-label-md">Dashboard</span>
                    </button>
                    <button onClick={() => navigate('/')} className="flex items-center gap-3 p-3 text-on-surface-variant dark:text-surface-variant hover:bg-surface-container-highest rounded-lg transition-all hover:translate-x-1 w-full text-left">
                        <span className="material-symbols-outlined">library_books</span>
                        <span className="font-label-md text-label-md">Catalog</span>
                    </button>
                    <button className="flex items-center gap-3 p-3 text-on-surface-variant dark:text-surface-variant hover:bg-surface-container-highest rounded-lg transition-all hover:translate-x-1 w-full text-left">
                        <span className="material-symbols-outlined">book_5</span>
                        <span className="font-label-md text-label-md">My Books</span>
                    </button>
                </nav>
                <div className="mt-auto pt-stack-md border-t border-outline-variant/30">
                    <div className="flex items-center gap-stack-sm p-2">
                        <div className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center font-bold text-on-surface-variant">
                            {userName.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1">
                            <p className="font-label-md text-label-md text-on-surface">{user?.name || 'Member'}</p>
                            <p className="text-[10px] text-on-surface-variant uppercase tracking-tighter">{isSubscribed ? 'Pro Member' : 'Standard Member'}</p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="lg:ml-[240px] max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop mt-stack-md">

                {/* Welcome Hero */}
                <section className="relative overflow-hidden mb-stack-lg rounded-2xl bg-primary text-on-primary p-stack-lg shadow-md">
                    <BookSpines className="absolute inset-y-0 right-0 w-40 h-full opacity-80" />
                    <div className="relative z-10 max-w-[70%] md:max-w-[60%]">
                        <p className="font-label-md text-label-md uppercase tracking-wider opacity-75 mb-1">{greetingPrefix}</p>
                        <h1 className="font-headline-lg text-headline-lg font-bold mb-stack-xs">{userName}</h1>
                        <p className="font-body-md text-body-md opacity-90">
                            {overdueLoans.length > 0
                                ? `You have ${overdueLoans.length} overdue ${overdueLoans.length === 1 ? 'book' : 'books'} — settle up to keep borrowing.`
                                : activeLoans.length > 0
                                    ? `${activeLoans.length} ${activeLoans.length === 1 ? 'book is' : 'books are'} out on loan right now.`
                                    : 'Your library journey continues today.'}
                        </p>
                        {overdueLoans.length > 0 && (
                            <button
                                onClick={() => setDarajaModal({ isOpen: true, type: 'fine', item: null })}
                                className="mt-stack-sm inline-flex items-center gap-2 px-4 py-2 bg-on-primary text-primary rounded-full font-label-md text-label-md shadow-sm active:scale-95 transition-transform"
                            >
                                <span className="material-symbols-outlined text-base">payments</span> Pay now
                            </button>
                        )}
                    </div>
                </section>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">

                    {/* Left Column: Stats & Actions */}
                    <div className="lg:col-span-8 space-y-stack-lg">

                        {/* Quick Stat Cards (2x2 Grid) */}
                        {loading ? (
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4 gap-stack-md">
                                {[...Array(4)].map((_, i) => <StatCardSkeleton key={i} />)}
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4 gap-stack-md">
                                <div className="bg-surface-container-lowest p-stack-md rounded-xl border border-outline-variant/10 shadow-[0px_4px_12px_rgba(0,0,0,0.03)] flex flex-col gap-3 group hover:translate-y-[-2px] transition-transform">
                                    <span className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center material-symbols-outlined text-primary">auto_stories</span>
                                    <div>
                                        <p className="font-label-sm text-label-sm text-on-surface-variant">Borrowed</p>
                                        <h3 className="font-headline-md text-headline-md text-on-surface">{activeLoans.length} / {borrowLimit}</h3>
                                    </div>
                                    <div className="w-full h-1.5 rounded-full bg-surface-container-highest overflow-hidden">
                                        <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${borrowPct}%` }} />
                                    </div>
                                </div>

                                <div className="bg-surface-container-lowest p-stack-md rounded-xl border border-outline-variant/10 shadow-[0px_4px_12px_rgba(0,0,0,0.03)] flex flex-col gap-3 group hover:translate-y-[-2px] transition-transform">
                                    <span className="w-9 h-9 rounded-lg bg-tertiary/10 flex items-center justify-center material-symbols-outlined text-tertiary">shopping_bag</span>
                                    <div>
                                        <p className="font-label-sm text-label-sm text-on-surface-variant">Digital Books</p>
                                        <h3 className="font-headline-md text-headline-md text-on-surface">{digitalLibrary.length} Items</h3>
                                    </div>
                                </div>

                                <div className="bg-surface-container-lowest p-stack-md rounded-xl border border-error/10 shadow-[0px_4px_12px_rgba(0,0,0,0.03)] flex flex-col gap-3 group hover:translate-y-[-2px] transition-transform">
                                    <span className="w-9 h-9 rounded-lg bg-error/10 flex items-center justify-center material-symbols-outlined text-error">account_balance_wallet</span>
                                    <div>
                                        <p className="font-label-sm text-label-sm text-on-surface-variant">Fines</p>
                                        <h3 className="font-headline-md text-headline-md text-error">KES {totalFines.toFixed(2)}</h3>
                                    </div>
                                </div>

                                <div className="bg-surface-container-lowest p-stack-md rounded-xl border border-tertiary-fixed/30 shadow-[0px_4px_12px_rgba(0,0,0,0.03)] flex flex-col gap-3 group hover:translate-y-[-2px] transition-transform cursor-pointer" onClick={() => !isSubscribed && setSubModalOpen(true)}>
                                    <span className="w-9 h-9 rounded-lg bg-tertiary-container/60 flex items-center justify-center material-symbols-outlined text-tertiary-container" style={{ fontVariationSettings: "'FILL' 1" }}>stars</span>
                                    <div>
                                        <p className="font-label-sm text-label-sm text-on-surface-variant">Active Plan</p>
                                        <h3 className="font-headline-md text-headline-md text-tertiary-container">{isSubscribed ? 'Pro' : 'Standard'}</h3>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Quick Actions (Horizontal Scroll) */}
                        <section>
                            <h2 className="font-headline-md text-headline-md text-on-surface mb-stack-sm">Quick Actions</h2>
                            <div className="flex gap-stack-sm overflow-x-auto hide-scrollbar pb-2 -mx-1 px-1">
                                <button onClick={() => navigate('/')} className="flex items-center gap-2 px-6 py-3 bg-primary text-on-primary rounded-full font-label-md text-label-md shadow-md active:scale-95 transition-transform shrink-0">
                                    <span className="material-symbols-outlined">add</span> Borrow
                                </button>
                                <button onClick={() => navigate('/')} className="flex items-center gap-2 px-6 py-3 bg-surface-container-lowest border border-outline-variant text-on-surface rounded-full font-label-md text-label-md active:scale-95 transition-transform shrink-0">
                                    <span className="material-symbols-outlined">search</span> Browse
                                </button>
                                {totalFines > 0 && (
                                    <button onClick={() => setDarajaModal({ isOpen: true, type: 'fine', item: null })} className="flex items-center gap-2 px-6 py-3 bg-error text-on-error rounded-full font-label-md text-label-md shadow-md active:scale-95 transition-transform shrink-0">
                                        <span className="material-symbols-outlined">payments</span> Pay Fine
                                    </button>
                                )}
                                {!isSubscribed && (
                                    <button onClick={() => setSubModalOpen(true)} className="flex items-center gap-2 px-6 py-3 bg-surface-container-lowest border border-outline-variant text-on-surface rounded-full font-label-md text-label-md active:scale-95 transition-transform shrink-0">
                                        <span className="material-symbols-outlined">upgrade</span> Upgrade Plan
                                    </button>
                                )}
                            </div>
                        </section>

                        {/* Recommended Books (Bento Style/Carousel) */}
                        <section>
                            <div className="flex justify-between items-center mb-stack-sm">
                                <h2 className="font-headline-md text-headline-md text-on-surface">Recommended for You</h2>
                                <button onClick={() => navigate('/')} className="text-primary font-label-md text-label-md hover:underline">View All</button>
                            </div>
                            <div className="flex gap-gutter overflow-x-auto hide-scrollbar pb-4">
                                {loading ? (
                                    [...Array(4)].map((_, i) => <BookCardSkeleton key={i} />)
                                ) : books.length === 0 ? (
                                    <div className="w-full">
                                        <EmptyState icon="menu_book" title="No books in the catalog yet" subtitle="Check back soon, or browse to see what's available." />
                                    </div>
                                ) : (
                                    books.slice(0, 4).map((book) => (
                                        <div key={book.id} onClick={() => navigate('/')} className="w-48 shrink-0 flex flex-col gap-2 group cursor-pointer">
                                            <div className="relative h-72 rounded-xl overflow-hidden shadow-lg border border-outline-variant/10 group-hover:scale-[1.02] transition-transform bg-surface-variant flex items-center justify-center">
                                                {book.cover_image_url ? (
                                                    <img src={book.cover_image_url} alt={book.title} className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="material-symbols-outlined text-4xl text-on-surface-variant">menu_book</span>
                                                )}
                                                <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <span className="font-label-sm text-label-sm text-white flex items-center gap-1">
                                                        <span className="material-symbols-outlined text-sm">add_circle</span> Borrow
                                                    </span>
                                                </div>
                                            </div>
                                            <h4 className="font-label-md text-label-md text-on-surface mt-2 line-clamp-1">{book.title}</h4>
                                            <p className="font-label-sm text-label-sm text-on-surface-variant line-clamp-1">{book.genre} • {book.author}</p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </section>
                    </div>

                    {/* Right Column: Due Dates & Side Panels */}
                    <div className="lg:col-span-4 space-y-stack-lg">

                        {/* Upcoming Due Dates */}
                        <section className="bg-surface-container-low p-stack-md rounded-xl border border-outline-variant/20 shadow-sm">
                            <h2 className="font-headline-md text-headline-md text-on-surface mb-stack-md flex items-center gap-2">
                                <span className="material-symbols-outlined text-on-surface-variant">calendar_month</span> Due Dates
                            </h2>
                            <div className="space-y-4">
                                {activeLoans.length === 0 && overdueLoans.length === 0 ? (
                                    <EmptyState icon="event_available" title="Nothing due" subtitle="Loans you borrow will show up here with their due dates." />
                                ) : (
                                    [...overdueLoans, ...activeLoans].slice(0, 3).map((loan) => {
                                        const isOverdue = loan.status === 'overdue';
                                        const dueDate = new Date(loan.due_date);
                                        const month = dueDate.toLocaleString('default', { month: 'short' });
                                        const day = dueDate.getDate();
                                        const remaining = daysUntil(loan.due_date);

                                        return (
                                            <div key={loan.id} className={`flex items-start gap-4 p-3 bg-surface-container-lowest rounded-lg border-l-4 ${isOverdue ? 'border-error' : 'border-primary'}`}>
                                                <div className={`flex flex-col items-center justify-center min-w-[48px] h-12 rounded font-bold ${isOverdue ? 'bg-error-container text-on-error-container' : 'bg-primary-container text-on-primary-container'}`}>
                                                    <span className="text-[10px] uppercase">{month}</span>
                                                    <span className="text-lg leading-none">{day}</span>
                                                </div>
                                                <div className="flex-1">
                                                    <h4 className="font-label-md text-label-md text-on-surface line-clamp-1">{loan.book_copy?.book?.title || 'Unknown Book'}</h4>
                                                    <p className={`text-[10px] font-medium ${isOverdue ? 'text-error' : 'text-on-surface-variant'}`}>
                                                        {isOverdue ? `Overdue by ${Math.abs(remaining)} ${Math.abs(remaining) === 1 ? 'day' : 'days'}` : `Due in ${remaining} ${remaining === 1 ? 'day' : 'days'}`}
                                                    </p>
                                                </div>
                                            </div>
                                        )
                                    })
                                )}
                            </div>
                        </section>

                        {/* Digital Library Progress */}
                        {digitalLibrary.length > 0 && (
                            <section className="bg-surface-container-lowest p-stack-md rounded-xl border border-outline-variant/10 shadow-[0px_4px_12px_rgba(0,0,0,0.03)]">
                                <h2 className="font-label-md text-label-md text-on-surface-variant mb-4 uppercase tracking-wider">Digital Read</h2>
                                <div className="flex gap-4 mb-4">
                                    <div className="w-16 h-24 rounded shadow-md overflow-hidden bg-surface-variant flex items-center justify-center flex-shrink-0">
                                        <span className="material-symbols-outlined text-3xl text-on-surface-variant">menu_book</span>
                                    </div>
                                    <div className="flex-1 flex flex-col justify-center">
                                        <h4 className="font-label-md text-label-md text-on-surface line-clamp-2">{digitalLibrary[0].book?.title || 'Purchased E-Book'}</h4>
                                        <button
                                            onClick={() => handleReadDigital(digitalLibrary[0].book || { id: digitalLibrary[0].book_id })}
                                            className="mt-3 w-max px-4 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-full text-xs font-bold transition-colors"
                                        >
                                            Read Now
                                        </button>
                                    </div>
                                </div>
                            </section>
                        )}

                        {/* Library Tip */}
                        <div className="relative overflow-hidden p-stack-md rounded-xl bg-primary text-on-primary shadow-sm">
                            <BookSpines className="absolute inset-y-0 right-0 w-24 h-full" />
                            <div className="relative z-10">
                                <span className="material-symbols-outlined text-3xl mb-2" style={{ fontVariationSettings: "'FILL' 1" }}>lightbulb</span>
                                <h3 className="font-headline-md text-label-md mb-2 font-bold">Did you know?</h3>
                                <p className="font-body-sm text-xs opacity-90 leading-relaxed max-w-[85%]">
                                    You can borrow up to {borrowLimit} physical books at a time. Upgrade to Pro for lifetime access to premium e-books at 20% off.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* BottomNavBar (Mobile Primary) */}
            <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center h-20 pb-safe px-4 bg-surface dark:bg-surface-container-lowest border-t border-outline-variant/20 shadow-[0px_-4px_12px_rgba(0,0,0,0.03)] md:hidden">
                <button className="flex flex-col items-center justify-center text-primary active:scale-95 duration-200">
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>home</span>
                    <span className="font-label-sm text-[10px] mt-1">Home</span>
                </button>
                <button onClick={() => navigate('/')} className="flex flex-col items-center justify-center text-on-surface-variant hover:text-primary active:scale-95 duration-200">
                    <span className="material-symbols-outlined">search</span>
                    <span className="font-label-sm text-[10px] mt-1">Search</span>
                </button>
            </nav>

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
