import React, { useState, useEffect } from 'react';
import { Search, Filter, Sparkles, BookOpen, AlertCircle, Loader2 } from 'lucide-react';
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
                setError(err.message || 'Could not fetch catalog from API.');
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
            setReaderModal({ isOpen: true, data: res.data });
        } catch (err) {
            if (err.status === 403) {
                // Digital access denied -> trigger purchase modal
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
            {/* Hero Header */}
            <div className="relative rounded-3xl bg-gradient-to-r from-indigo-950 via-slate-900 to-slate-950 border border-slate-800 p-8 sm:p-12 overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                
                <div className="max-w-3xl space-y-4 relative z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                        <Sparkles className="w-3.5 h-3.5" /> Next-Gen Library OPAC Search
                    </div>
                    <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
                        Explore Our Digital & Physical <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Catalog</span>
                    </h1>
                    <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
                        Search thousands of books, borrow physical copies, or unlock lifetime digital access. Subscribed members get 20% off all digital book purchases!
                    </p>

                    {/* Banner CTA */}
                    {!user?.member?.is_subscribed && (
                        <div className="pt-2">
                            <button
                                onClick={() => setSubModalOpen(true)}
                                className="py-2.5 px-5 rounded-2xl bg-gradient-to-r from-amber-500 to-purple-600 hover:from-amber-400 hover:to-purple-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all hover:scale-105"
                            >
                                <Sparkles className="w-4 h-4" /> Get 20% Off Perk Pass (KES 500/mo)
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Search & Filter Control Bar */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 backdrop-blur-md">
                <div className="relative w-full sm:w-96">
                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by title, author, or ISBN..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                    <Filter className="w-4 h-4 text-slate-400 mr-1" />
                    {['All', 'Software', 'Fiction', 'Science', 'History', 'Tech'].map((genre) => (
                        <button
                            key={genre}
                            onClick={() => setSelectedGenre(genre)}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                                selectedGenre === genre
                                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800 hover:border-slate-700'
                            }`}
                        >
                            {genre}
                        </button>
                    ))}
                </div>
            </div>

            {/* Results Grid */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-3">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                    <p className="text-xs">Searching library catalog...</p>
                </div>
            ) : error ? (
                <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <p className="text-xs">{error}</p>
                </div>
            ) : books.length === 0 ? (
                <div className="text-center py-20 space-y-3 bg-slate-900/40 rounded-3xl border border-slate-800/80">
                    <BookOpen className="w-12 h-12 text-slate-600 mx-auto" />
                    <h3 className="text-lg font-bold text-slate-300">No books found</h3>
                    <p className="text-xs text-slate-500">Try adjusting your search terms or filter selection.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
