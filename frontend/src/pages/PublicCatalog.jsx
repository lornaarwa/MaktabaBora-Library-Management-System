import React, { useState, useEffect } from 'react';
import { Search, Filter, BookOpen, AlertCircle, Loader2, Sparkles, Layers } from 'lucide-react';
import BookCard from '../components/BookCard';
import DigitalReaderModal from '../components/DigitalReaderModal';
import DarajaPayModal from '../components/DarajaPayModal';
import SubscriptionPassModal from '../components/SubscriptionPassModal';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function PublicCatalog() {
    const { user } = useAuth();
    const [books, setBooks] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedGenre, setSelectedGenre] = useState('All');
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
                console.error('Failed to load catalog:', err);
                setError(err.message || 'Could not fetch catalog.');
            } finally {
                setLoading(false);
            }
        };

        const timer = setTimeout(fetchCatalog, 300);
        return () => clearTimeout(timer);
    }, [searchQuery, selectedGenre]);

    const handleReadDigital = async (book) => {
        try {
            const res = await api.readDigitalBook(book.id);
            setReaderModal({ isOpen: true, data: res.data || res });
        } catch (err) {
            if (err.status === 403) {
                setDarajaModal({ isOpen: true, type: 'digital', item: book });
            } else {
                alert(err.message || 'Failed to stream digital book.');
            }
        }
    };

    const handleReserve = async (book) => {
        if (!user) {
            alert('Please log in to place hold queue reservations.');
            return;
        }
        try {
            await api.reserveBook(book.id);
            alert(`Hold reservation placed successfully for "${book.title}"!`);
        } catch (err) {
            alert(err.message || 'Could not place reservation.');
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
            
            {/* Hero Banner (Monochrome Shadcn) */}
            <div className="relative rounded-2xl bg-zinc-900 border border-zinc-800 p-6 sm:p-10 overflow-hidden shadow-sm">
                <div className="max-w-2xl space-y-3 relative z-10">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[10px] font-mono font-bold bg-zinc-800 text-zinc-300 border border-zinc-700 uppercase tracking-wider">
                        <Layers className="w-3 h-3 text-zinc-400" /> Catalog & E-Book Store
                    </div>
                    <h1 className="text-2xl sm:text-4xl font-extrabold text-zinc-100 tracking-tight">
                        Library Books & Instant Digital Access
                    </h1>
                    <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
                        Search across genres, borrow physical copies, or unlock lifetime e-book access. Members enjoy 20% discount on digital titles!
                    </p>

                    {!user?.member?.is_subscribed && (
                        <div className="pt-2">
                            <button
                                onClick={() => setSubModalOpen(true)}
                                className="py-2 px-4 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
                            >
                                <Sparkles className="w-3.5 h-3.5" /> Join Pro Perks (20% Off E-Books)
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Search & Genre Filter Bar */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative w-full sm:w-80">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search title, author, or ISBN..."
                        className="w-full pl-9 pr-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-700"
                    />
                </div>

                <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                    <Filter className="w-3.5 h-3.5 text-zinc-500 mr-1" />
                    {['All', 'Software', 'Fiction', 'Science', 'History', 'Tech'].map((genre) => (
                        <button
                            key={genre}
                            onClick={() => setSelectedGenre(genre)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border ${
                                selectedGenre === genre
                                    ? 'bg-zinc-100 text-zinc-950 border-zinc-100 font-bold'
                                    : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-zinc-200 hover:border-zinc-700'
                            }`}
                        >
                            {genre}
                        </button>
                    ))}
                </div>
            </div>

            {/* Results Grid */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 text-zinc-400 space-y-3">
                    <Loader2 className="w-7 h-7 animate-spin text-zinc-400" />
                    <p className="text-xs font-mono">Loading catalog...</p>
                </div>
            ) : error ? (
                <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 flex items-center gap-2.5 text-xs">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 text-zinc-400" />
                    <span>{error}</span>
                </div>
            ) : books.length === 0 ? (
                <div className="text-center py-20 space-y-2 bg-zinc-900/40 rounded-2xl border border-zinc-800">
                    <BookOpen className="w-10 h-10 text-zinc-600 mx-auto" />
                    <h3 className="text-base font-bold text-zinc-300">No books found</h3>
                    <p className="text-xs text-zinc-500">Try adjusting your search query or genre filter.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {books.map((book) => (
                        <BookCard
                            key={book.id}
                            book={book}
                            onReserve={handleReserve}
                            onBuyDigital={(b) => setDarajaModal({ isOpen: true, type: 'digital', item: b })}
                            onReadDigital={handleReadDigital}
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
