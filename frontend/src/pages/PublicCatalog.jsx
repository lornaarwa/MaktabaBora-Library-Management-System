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
            
            {/* Hero Banner (Warm Paper Theme) */}
            <div className="relative rounded-2xl border border-bark-100 bg-cream-light/60 p-6 sm:p-10 overflow-hidden shadow-card">
                <div className="max-w-2xl space-y-3 relative z-10">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[10px] font-mono font-bold bg-bark-700 text-cream-light uppercase tracking-wider">
                        <Layers className="w-3.5 h-3.5" /> Catalog & Digital Library
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
                                className="py-2.5 px-4 rounded-lg bg-bark-700 hover:bg-bark-900 text-cream-light font-bold text-xs flex items-center gap-1.5 shadow-sm transition"
                            >
                                <Sparkles className="w-4 h-4 text-olive" /> Join Pro Perks (20% Off E-Books)
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Search & Genre Filter Bar */}
            <div className="bg-paper border border-bark-100 rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-card">
                <div className="relative w-full sm:w-80">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-bark-300" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search title, author, or ISBN..."
                        className="w-full pl-9 pr-3 py-2 rounded-lg border border-bark-100 bg-paper text-xs text-bark-900 placeholder:text-bark-300 focus:outline-none focus:border-bark-500"
                    />
                </div>

                <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                    <Filter className="w-3.5 h-3.5 text-bark-500 mr-1" />
                    {['All', 'Software', 'Fiction', 'Science', 'History', 'Tech'].map((genre) => (
                        <button
                            key={genre}
                            onClick={() => setSelectedGenre(genre)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition border ${
                                selectedGenre === genre
                                    ? 'bg-bark-700 text-cream-light border-bark-900 font-bold'
                                    : 'bg-paper text-bark-700 border-bark-100 hover:bg-cream'
                            }`}
                        >
                            {genre}
                        </button>
                    ))}
                </div>
            </div>

            {/* Results Grid */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 text-bark-500 space-y-3">
                    <Loader2 className="w-7 h-7 animate-spin text-bark-700" />
                    <p className="text-xs font-mono">Searching catalog...</p>
                </div>
            ) : error ? (
                <div className="p-4 rounded-xl bg-paper border border-[#a8452f]/30 text-[#8c3620] flex items-center gap-2.5 text-xs">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{error}</span>
                </div>
            ) : books.length === 0 ? (
                <div className="text-center py-20 space-y-2 bg-cream-light/30 rounded-2xl border border-bark-100">
                    <BookOpen className="w-10 h-10 text-bark-300 mx-auto" />
                    <h3 className="text-base font-bold text-bark-900">No books found</h3>
                    <p className="text-xs text-bark-500">Try adjusting your search query or genre filter.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {books.map((book) => (
                        <BookCard
                            key={book.id}
                            book={book}
                            onReadDigital={handleReadDigital}
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
