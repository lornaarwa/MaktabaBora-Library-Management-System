import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, BookOpen, X, Layers, Sparkles, LibraryBig, RefreshCw } from 'lucide-react';
import BookCard from '../components/BookCard';
import DigitalReaderModal from '../components/DigitalReaderModal';
import DarajaPayModal from '../components/DarajaPayModal';
import SubscriptionPassModal from '../components/SubscriptionPassModal';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLibrary } from '../context/LibraryContext';
import { BookCardSkeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorState } from '../components/ui/ErrorState';
import { cn } from '../lib/utils';

export default function PublicCatalog() {
    const { user } = useAuth();
    const { pushToast } = useLibrary();
    const [books, setBooks] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedGenre, setSelectedGenre] = useState('All');
    // Bumping this refetches the catalogue (manual refresh button or returning to the tab)
    const [revision, setRevision] = useState(0);
    const lastAutoRefresh = useRef(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Modals state
    const [readerModal, setReaderModal] = useState({ isOpen: false, data: null });
    const [darajaModal, setDarajaModal] = useState({ isOpen: false, type: 'digital', item: null });
    const [subModalOpen, setSubModalOpen] = useState(false);

    useEffect(() => {
        const fetchCatalog = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await api.searchCatalog(searchQuery, selectedGenre === 'All' ? '' : selectedGenre);
                setBooks(res.data?.data || res.data || []);
            } catch (err) {
                setError(err.message || 'Could not fetch catalog.');
            } finally {
                setLoading(false);
            }
        };

        const timer = setTimeout(fetchCatalog, 300);
        return () => clearTimeout(timer);
    }, [searchQuery, selectedGenre, revision]);

    // Auto-refresh when the member returns to this tab, so books added by staff
    // (or in another tab) appear without a manual page reload. Debounced cooldown
    // avoids duplicate fetches when focus and visibility events fire together.
    useEffect(() => {
        const refreshIfActive = () => {
            const now = Date.now();
            if (!document.hidden && now - lastAutoRefresh.current > 1500) {
                lastAutoRefresh.current = now;
                setRevision((v) => v + 1);
            }
        };
        window.addEventListener('focus', refreshIfActive);
        document.addEventListener('visibilitychange', refreshIfActive);
        return () => {
            window.removeEventListener('focus', refreshIfActive);
            document.removeEventListener('visibilitychange', refreshIfActive);
        };
    }, []);

    const handleReadDigital = async (book) => {
        try {
            const res = await api.readDigitalBook(book.id);
            setReaderModal({ isOpen: true, data: res.data || res });
        } catch (err) {
            if (err.status === 403) {
                setDarajaModal({ isOpen: true, type: 'digital', item: book });
            } else {
                pushToast({ title: 'Reader Error', detail: err.message || 'Failed to stream digital book.', tone: 'error' });
            }
        }
    };

    const handleReserve = async (book) => {
        if (!user) {
            pushToast({ title: 'Authentication Required', detail: 'Please log in to place hold queue reservations.', tone: 'info' });
            return;
        }
        try {
            await api.reserveBook(book.id);
            pushToast({ title: 'Reservation Placed', detail: `Hold reservation placed for "${book.title}"! You can track your physical collection status in My Library.`, tone: 'success' });
        } catch (err) {
            pushToast({ title: 'Reservation Failed', detail: err.message || 'Could not place reservation.', tone: 'error' });
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

            {/* Hero Banner */}
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                className="relative rounded-2xl border border-bark-100 bg-cream-light/60 p-6 sm:p-10 overflow-hidden shadow-card"
            >
                <div className="max-w-2xl space-y-3 relative z-10">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[10px] font-mono font-bold bg-bark-700 text-cream-light uppercase tracking-wider">
                        <Layers className="w-3.5 h-3.5 text-tan" /> Catalog & Digital Library
                    </div>
                    <h1 className="text-2xl sm:text-4xl font-extrabold text-bark-900 tracking-tight">
                        Discover Books & Read Digital Editions
                    </h1>
                    <p className="text-bark-700 text-xs sm:text-sm leading-relaxed">
                        Search titles across genres, reserve physical copies, or stream e-books online. Pro members enjoy 20% off every digital title!
                    </p>

                    {!user?.member?.is_subscribed && (
                        <div className="pt-2">
                            <button
                                onClick={() => setSubModalOpen(true)}
                                className="py-2.5 px-4 rounded-lg bg-bark-700 hover:bg-bark-900 text-cream-light font-bold text-xs flex items-center gap-1.5 shadow-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-tan-dark/60"
                            >
                                <Sparkles className="w-4 h-4 text-tan" /> Join Pro Perks (20% Off E-Books)
                            </button>
                        </div>
                    )}
                </div>
            </motion.div>

            {/* Search & Genre Filter Bar */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.08, ease: 'easeOut' }}
                className="bg-paper border border-bark-100 rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-card"
            >
                <div className="relative w-full sm:w-80">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-bark-300" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search title, author, or ISBN..."
                        aria-label="Search books by title, author, or ISBN"
                        className="w-full pl-9 pr-9 py-2 rounded-lg border border-bark-100 bg-paper text-xs text-bark-900 placeholder:text-bark-300 focus:outline-none focus:border-bark-500 focus:ring-2 focus:ring-tan-dark/50"
                    />
                    {searchQuery && (
                        <button
                            type="button"
                            onClick={() => setSearchQuery('')}
                            aria-label="Clear search"
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-bark-400 transition hover:bg-cream-light/60 hover:text-bark-700"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    )}
                </div>

                <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                    <Filter className="w-3.5 h-3.5 text-bark-500 mr-1" />
                    {['All', 'Software', 'Fiction', 'Science', 'History', 'Tech'].map((genre) => (
                        <button
                            key={genre}
                            onClick={() => setSelectedGenre(genre)}
                            aria-pressed={selectedGenre === genre}
                            className={cn(
                                'px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition border focus:outline-none focus-visible:ring-2 focus-visible:ring-tan-dark/60',
                                selectedGenre === genre
                                    ? 'bg-bark-700 text-cream-light border-bark-900 font-bold'
                                    : 'bg-paper text-bark-700 border-bark-100 hover:bg-cream'
                            )}
                        >
                            {genre}
                        </button>
                    ))}
                    <button
                        type="button"
                        onClick={() => setRevision((v) => v + 1)}
                        title="Refresh the catalogue"
                        aria-label="Refresh the catalogue"
                        className="ml-1.5 p-2 rounded-lg border border-bark-100 bg-paper text-bark-600 transition hover:bg-cream hover:text-bark-900 shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-tan-dark/60"
                    >
                        <RefreshCw className="h-3.5 w-3.5" />
                    </button>
                </div>
            </motion.div>

            {/* Results Grid — keep existing results on screen while a background refresh runs */}
            {loading && books.length === 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5" aria-busy="true" aria-label="Loading catalog">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <BookCardSkeleton key={i} />
                    ))}
                </div>
            ) : error ? (
                <ErrorState
                    title="We couldn't load the catalog"
                    description={error}
                    onRetry={() => {
                        setLoading(true);
                        setError(null);
                        api.searchCatalog(searchQuery, selectedGenre === 'All' ? '' : selectedGenre)
                            .then((res) => setBooks(res.data?.data || res.data || []))
                            .catch((err) => setError(err.message || 'Could not fetch catalog.'))
                            .finally(() => setLoading(false));
                    }}
                />
            ) : books.length === 0 ? (
                <EmptyState
                    icon={LibraryBig}
                    title="No books found"
                    description="Try adjusting your search query or genre filter to discover more titles."
                    action={
                        <button
                            type="button"
                            onClick={() => { setSearchQuery(''); setSelectedGenre('All'); }}
                            className="rounded-lg bg-bark-700 px-4 py-2 text-xs font-bold text-cream-light shadow-sm transition hover:bg-bark-900"
                        >
                            Browse All Books
                        </button>
                    }
                />
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {books.map((book, index) => (
                        <BookCard
                            key={book.id}
                            book={book}
                            index={index}
                            memberActions={user?.role === 'member'}
                            onBuyDigital={(b) => setDarajaModal({ isOpen: true, type: 'digital', item: b })}
                            onReserve={handleReserve}
                        />
                    ))}
                </div>
            )}

            {/* Modals */}
            <DigitalReaderModal
                isOpen={readerModal.isOpen}
                onClose={() => setReaderModal({ isOpen: false, data: null })}
                bookData={readerModal.data}
            />

            <DarajaPayModal
                isOpen={darajaModal.isOpen}
                onClose={() => setDarajaModal({ isOpen: false, type: 'digital', item: null })}
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