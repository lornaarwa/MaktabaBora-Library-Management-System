import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { useNavigate } from 'react-router-dom';
import DarajaPayModal from '../components/DarajaPayModal';
import SubscriptionPassModal from '../components/SubscriptionPassModal';
import DigitalReaderModal from '../components/DigitalReaderModal';

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
                    <button className="material-symbols-outlined text-primary dark:text-primary-fixed-dim hover:bg-surface-container-high transition-colors p-2 rounded-full active:scale-90" style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>notifications</button>
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
                
                {/* Welcome Header */}
                <section className="mb-stack-lg">
                    <h1 className="font-headline-lg text-headline-lg text-on-surface mb-stack-xs">{greetingPrefix} {userName}</h1>
                    <p className="font-body-md text-body-md text-on-surface-variant">Your library journey continues today.</p>
                </section>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
                    
                    {/* Left Column: Stats & Actions */}
                    <div className="lg:col-span-8 space-y-stack-lg">
                        
                        {/* Quick Stat Cards (2x2 Grid) */}
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4 gap-stack-md">
                            <div className="bg-surface-container-lowest p-stack-md rounded-xl border border-outline-variant/10 shadow-[0px_4px_12px_rgba(0,0,0,0.03)] flex flex-col gap-2 group hover:translate-y-[-2px] transition-transform">
                                <span className="material-symbols-outlined text-primary">auto_stories</span>
                                <div>
                                    <p className="font-label-sm text-label-sm text-on-surface-variant">Borrowed</p>
                                    <h3 className="font-headline-md text-headline-md text-on-surface">{activeLoans.length} Books</h3>
                                </div>
                            </div>
                            
                            <div className="bg-surface-container-lowest p-stack-md rounded-xl border border-outline-variant/10 shadow-[0px_4px_12px_rgba(0,0,0,0.03)] flex flex-col gap-2 group hover:translate-y-[-2px] transition-transform">
                                <span className="material-symbols-outlined text-tertiary">shopping_bag</span>
                                <div>
                                    <p className="font-label-sm text-label-sm text-on-surface-variant">Digital Books</p>
                                    <h3 className="font-headline-md text-headline-md text-on-surface">{digitalLibrary.length} Items</h3>
                                </div>
                            </div>

                            <div className="bg-surface-container-lowest p-stack-md rounded-xl border border-error/10 shadow-[0px_4px_12px_rgba(0,0,0,0.03)] flex flex-col gap-2 group hover:translate-y-[-2px] transition-transform">
                                <span className="material-symbols-outlined text-error">account_balance_wallet</span>
                                <div>
                                    <p className="font-label-sm text-label-sm text-on-surface-variant">Fines</p>
                                    <h3 className="font-headline-md text-headline-md text-error">KES {totalFines.toFixed(2)}</h3>
                                </div>
                            </div>
                            
                            <div className="bg-surface-container-lowest p-stack-md rounded-xl border border-tertiary-fixed/30 shadow-[0px_4px_12px_rgba(0,0,0,0.03)] flex flex-col gap-2 group hover:translate-y-[-2px] transition-transform cursor-pointer" onClick={() => !isSubscribed && setSubModalOpen(true)}>
                                <span className="material-symbols-outlined text-tertiary-container" style={{ fontVariationSettings: "'FILL' 1" }}>stars</span>
                                <div>
                                    <p className="font-label-sm text-label-sm text-on-surface-variant">Active Plan</p>
                                    <h3 className="font-headline-md text-headline-md text-tertiary-container">{isSubscribed ? 'Pro' : 'Standard'}</h3>
                                </div>
                            </div>
                        </div>

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
                                    <div className="text-sm text-on-surface-variant py-8">Loading recommendations...</div>
                                ) : books.length === 0 ? (
                                    <div className="text-sm text-on-surface-variant py-8">No books found in catalog.</div>
                                ) : (
                                    books.slice(0, 4).map((book) => (
                                        <div key={book.id} onClick={() => navigate('/')} className="w-48 shrink-0 flex flex-col gap-2 group cursor-pointer">
                                            <div className="h-72 rounded-xl overflow-hidden shadow-lg border border-outline-variant/10 group-hover:scale-[1.02] transition-transform bg-surface-variant flex items-center justify-center">
                                                {book.cover_image_url ? (
                                                    <img src={book.cover_image_url} alt={book.title} className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="material-symbols-outlined text-4xl text-on-surface-variant">menu_book</span>
                                                )}
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
                                    <p className="text-sm text-on-surface-variant py-4 text-center">No active or overdue loans.</p>
                                ) : (
                                    [...overdueLoans, ...activeLoans].slice(0, 3).map((loan) => {
                                        const isOverdue = loan.status === 'overdue';
                                        const dueDate = new Date(loan.due_date);
                                        const month = dueDate.toLocaleString('default', { month: 'short' });
                                        const day = dueDate.getDate();
                                        
                                        return (
                                            <div key={loan.id} className={`flex items-start gap-4 p-3 bg-surface-container-lowest rounded-lg border-l-4 ${isOverdue ? 'border-error' : 'border-primary'}`}>
                                                <div className={`flex flex-col items-center justify-center min-w-[48px] h-12 rounded font-bold ${isOverdue ? 'bg-error-container text-on-error-container' : 'bg-primary-container text-on-primary-container'}`}>
                                                    <span className="text-[10px] uppercase">{month}</span>
                                                    <span className="text-lg leading-none">{day}</span>
                                                </div>
                                                <div className="flex-1">
                                                    <h4 className="font-label-md text-label-md text-on-surface line-clamp-1">{loan.book_copy?.book?.title || 'Unknown Book'}</h4>
                                                    <p className={`text-[10px] font-medium ${isOverdue ? 'text-error' : 'text-on-surface-variant'}`}>
                                                        {isOverdue ? 'Overdue' : 'Active Loan'}
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
                            <div className="relative z-10">
                                <span className="material-symbols-outlined text-3xl mb-2" style={{ fontVariationSettings: "'FILL' 1" }}>lightbulb</span>
                                <h3 className="font-headline-md text-label-md mb-2 font-bold">Did you know?</h3>
                                <p className="font-body-sm text-xs opacity-90 leading-relaxed">
                                    You can borrow up to {user?.member?.borrow_limit || 5} physical books at a time. Upgrade to a Pro Membership to get lifetime access to premium digital e-books at a 20% discount!
                                </p>
                            </div>
                            <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-primary-container rounded-full blur-2xl opacity-50"></div>
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
