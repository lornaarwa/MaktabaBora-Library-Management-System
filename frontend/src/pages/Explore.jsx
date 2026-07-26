import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export default function Explore() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const searchInputRef = useRef(null);

    const [isDarkMode, setIsDarkMode] = useState(() => {
        return document.documentElement.classList.contains('dark') || 
               localStorage.getItem('theme') === 'dark';
    });

    const [searchQuery, setSearchQuery] = useState('');
    const [searchField, setSearchField] = useState('all'); // 'all', 'author', 'isbn'
    const [selectedGenre, setSelectedGenre] = useState('All Genres');
    const [books, setBooks] = useState([]);
    const [trendingBooks, setTrendingBooks] = useState([]);
    const [newArrivals, setNewArrivals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchResultText, setSearchResultText] = useState('');

    const toggleDarkMode = () => {
        setIsDarkMode(!isDarkMode);
    };

    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [isDarkMode]);

    // Keyboard shortcut CMD/CTRL + K to focus search
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                if (searchInputRef.current) {
                    searchInputRef.current.focus();
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const fetchBooks = async (query = '', genre = '', field = 'all') => {
        setLoading(true);
        try {
            const dbGenre = genre === 'All Genres' ? '' : genre;
            
            // Build filter params for database query
            const params = {};
            if (dbGenre) params.genre = dbGenre;
            
            if (query) {
                if (field === 'author') {
                    params.author = query;
                } else if (field === 'isbn') {
                    params.isbn = query;
                } else {
                    params.q = query;
                }
            }

            const res = await api.searchCatalog(params);
            
            // Handle different paginated structures
            const bookData = res.data || res.results?.data || res.results || res || [];
            const bookArray = Array.isArray(bookData) ? bookData : (bookData.data || []);
            setBooks(bookArray);

            if (query || dbGenre) {
                const totalCount = Array.isArray(bookData) ? bookData.length : (bookData.total || bookArray.length || 0);
                const fieldLabel = field === 'author' ? 'Author' : field === 'isbn' ? 'ISBN' : 'Query';
                setSearchResultText(`Search Results for ${fieldLabel}: "${query || 'Any'}" (${totalCount})`);
            } else {
                setSearchResultText('');
            }
        } catch (err) {
            console.error('Error fetching catalog:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBooks(searchQuery, selectedGenre, searchField);

        const fetchSections = async () => {
            try {
                const res = await api.getBooks();
                const allBooks = res.data || res.results?.data || res.results || res || [];
                const bookArray = Array.isArray(allBooks) ? allBooks : (allBooks.data || []);
                
                // Fallbacks in case DB is empty
                if (bookArray.length > 0) {
                    setTrendingBooks(bookArray.slice(0, 4));
                    setNewArrivals(bookArray.slice(4, 9));
                } else {
                    // Fallback placeholders
                    setTrendingBooks([
                        { id: 1, title: "Shadows of the City", author: "Elena Richardson", genre: "Fiction", available_copies: 5, cover_image_path: "https://lh3.googleusercontent.com/aida-public/AB6AXuBahr21CD373CmrKN6QSQKAcderrIdk0tguqn_8EKxiwPabXBM_Se_No7vsyiQwuj-GtmsoIYdNaxPF8JR8jbH0IfneFPQFVzsge-41BYmS3mZuqit_OqcfT99aCLEq4uYsCMyzHWq3bgWEwfaQbh-qiVZ9eB3IyYzabJ0ucKdDgwoDgIqdJcmmOhYkz-gcZPhtIBtLa14AdQksZyNIMe-CGBzi6o7jjWJNekhCrGT8A8ja8ujb0R4s4-ybnKDJMSaUVVjlnIHcNeY", rating: "4.9" },
                        { id: 2, title: "The Quantum Mind", author: "Dr. Alistair Vance", genre: "Science", available_copies: 0, cover_image_path: "https://lh3.googleusercontent.com/aida-public/AB6AXuCroR58OlkH2Wvb_eQpaZFYZUn5dtMBvhyp36m2ASnFeHQbLEd_WjShrm5VmuxPeXO_V2OWS7svs1lCHIp-BZzYEWKy_DNIguREP799g2xSQhMnCOnR1Qca8BnWGe_WVgHYg9yp8slfAsVOH70rLSYnwzhVrmq3KCSUYE8zVqqjLjAzywsvBq0UOaMgKBWMcRLq6ubTUziU5TGOuCzQZCQIOKfmw6yPEVu_NWLmPOMH65K3FXIl-bWoT7EL7j-HMy_FoJvm1vA-8JQ", rating: "4.8" },
                        { id: 3, title: "Empire of Sands", author: "Sarah J. Miller", genre: "History", available_copies: 3, cover_image_path: "https://lh3.googleusercontent.com/aida-public/AB6AXuB8XAaU37kDilvFA1rgdpqMXnYDa6dQtLRVjqNEcnPvHZwOqJRSjZO-r3KBWcGBT86DmeXhO15wnSjYJRfCH3NtlVNp6HLWLX5GZnhX00zn4vlYg-I5em26eWYGcdvJH5-Y2ckZYdTRrHZXRFACfiYIAIAxErwiPhS_UWezm9UKdETu16NGzkHT-8Q_wDBLm1e5YJVNUdbyldF59cablu-hWGbVodqIlDyRJyMR1S0bTml-inVirkPs-54gf_5iZWulBxZsB4-OY9Q", rating: "4.7" },
                        { id: 4, title: "Designing Flow", author: "Marcus Chen", genre: "Design", available_copies: 2, cover_image_path: "https://lh3.googleusercontent.com/aida-public/AB6AXuAI3wAueMnxM8cNMxqKzyQdbDeUKY4d2qH-yQCASBZMO4w6kCTvIkf6u5q88fnrsA1qm8zAn2OsV6L2-u6B7Dkot_npnP8LXyHI52Y8Yr8-5xc228w5AZ0VxFxu8Ri1GURLl8SIrrbaICyfA-nF39wCHtZMbNsumjIdHMm8fg2wC3jX480CICo78fAtYUj6KhQnToGAD1ze-9vjN4SjRNMWiT_82YHDt9bljgtTwq9Yov9MB2W3jsq-kYiYjPtExVOVer2l1W_bYuM", rating: "5.0" }
                    ]);
                    setNewArrivals([
                        { id: 5, title: "Sustainable Growth", author: "P. Thompson", genre: "Technology", cover_image_path: "https://lh3.googleusercontent.com/aida-public/AB6AXuDv_6eS50VbSkapI0YFtyKysVX_78DY_0rIA37VG1qTGE_eUzQLHyH7_qiopSnNwhgQP7jG-WrH5POH-wM0FBOvo8NAxcUCwEMMkQf81kqyg-g31BJdClc6XYInWgQpmuQ9ewINsrDUQCFfLyWxaF8t2culT3FdT1iZs8FiriYbPVAP1SPSuE-rXnEDjUhPfKfHu5FAbhiTpBQ10et96SQMgM_CD0PF9DycTf7u6iYAwY7U6-mDpAKOFJ2IfvmgMoCLSjx_CkCKVdU" },
                        { id: 6, title: "The Art of Simplicity", author: "L. Kazuki", genre: "Design", cover_image_path: "https://lh3.googleusercontent.com/aida-public/AB6AXuAQMv86Qt7sx-Bs6ZvKSr0pboXoqMIjQL9FiT0MMHmJcoYeX60tZAxYYIjtbMCogkxFLFO0sX6Dx6oFechCKcTI3zLyxJbhd9kcA_QphHqfEUEnuAZDQ7_Cmt4KHtcxhNsXULXFTAn59UePW3JaFjHcBAvV4gauMYMg1Pwmeo9kSol-of-9NiXLjppeDgdoI0pxi6LGLQQRq38oPBK18nFRgeAXeNGJymTI20PPdbaOPJpMl5ShxC5GGhYNd_SI15DyUZF8fO-00SI" },
                        { id: 7, title: "The Future of Digital Ethics", author: "Curator's Choice", genre: "Technology", cover_image_path: "https://lh3.googleusercontent.com/aida-public/AB6AXuBGHKrxxn3uhVdkD9C8NWCIfO-pPcqQxMCoNvV-2bok8IAeRJRTJ702KafonB6nEvbIsAM2zgULvGfjKEFb6fFqlRuzV7TkHe45tvTt5GfFOskK16CIZVuZriJZrrQr6p6XUXrz52cmVO1NljrmNW5kMALKm3nH-W1gqgAroVq3XroW5YN7m8AFvd8uEFEMrJS0UTo81vBKjCrbUt-tGYDqryzjxE8IDqdmZmsq5BXxFErCPz2N0873FBXlJubwz6Mn6BTEDEksdfg" }
                    ]);
                }
            } catch (err) {
                console.error('Error fetching sections:', err);
            }
        };
        fetchSections();
    }, []);

    const handleSearchSubmit = (e) => {
        if (e) e.preventDefault();
        fetchBooks(searchQuery, selectedGenre, searchField);
    };

    const handleGenreChange = (genre) => {
        setSelectedGenre(genre);
        fetchBooks(searchQuery, genre, searchField);
    };

    const handleReserve = async (bookId) => {
        if (!user) {
            navigate('/login');
            return;
        }
        try {
            await api.reserveBook(bookId);
            alert('Book copy reserved successfully!');
            fetchBooks(searchQuery, selectedGenre, searchField);
        } catch (err) {
            alert(err.message || 'Failed to reserve book copy.');
        }
    };

    const handleProfileClick = () => {
        if (!user) {
            navigate('/login');
            return;
        }
        if (user.role === 'admin') navigate('/admin');
        else if (user.role === 'librarian') navigate('/librarian');
        else if (user.role === 'member') navigate('/member');
        else navigate('/');
    };

    const genres = ["All Genres", "Fiction", "Science", "History", "Technology", "Design", "Psychology"];

    return (
        <div className="bg-background dark:bg-zinc-950 text-on-background dark:text-zinc-50 font-body-md antialiased min-h-screen pb-16 md:pb-0 transition-colors duration-300">
            <style dangerouslySetInnerHTML={{__html: `
                .dark .glass-card {
                    background: rgba(24, 24, 27, 0.7) !important;
                    border-color: rgba(63, 63, 70, 0.4) !important;
                }
            `}} />

            {/* Top Navigation Shell */}
            <nav className="bg-surface/70 dark:bg-zinc-900/70 border-b border-surface-variant dark:border-zinc-800 w-full top-0 sticky z-50 flex justify-between items-center px-gutter h-16 backdrop-blur-md transition-colors duration-300">
                <div className="flex items-center gap-stack-sm">
                    <span className="material-symbols-outlined text-primary dark:text-emerald-400 text-headline-md">menu_book</span>
                    <span className="font-headline-md text-headline-md font-bold text-primary dark:text-emerald-400">MaktabaBora</span>
                </div>
                <div className="hidden md:flex gap-stack-lg items-center">
                    <Link className="text-on-surface-variant dark:text-zinc-400 font-label-md text-label-md hover:bg-surface-container-high dark:hover:bg-zinc-800 transition-colors px-4 py-1.5 rounded-full" to="/">Home</Link>
                    <Link className="text-primary dark:text-emerald-400 font-bold font-label-md text-label-md hover:bg-surface-container-high dark:hover:bg-zinc-800 transition-colors px-4 py-1.5 rounded-full" to="/explore">Search</Link>
                    <Link className="text-on-surface-variant dark:text-zinc-400 font-label-md text-label-md hover:bg-surface-container-high dark:hover:bg-zinc-800 transition-colors px-4 py-1.5 rounded-full" to="/member">My Books</Link>
                    <div onClick={handleProfileClick} className="text-on-surface-variant dark:text-zinc-400 font-label-md text-label-md hover:bg-surface-container-high dark:hover:bg-zinc-800 transition-colors px-4 py-1.5 rounded-full cursor-pointer">Profile</div>
                </div>
                <div className="flex items-center gap-stack-md">
                    <button onClick={toggleDarkMode} className="p-stack-xs hover:bg-surface-container-high dark:hover:bg-zinc-800 rounded-full transition-colors active:opacity-80" title="Toggle Dark/Light Mode">
                        <span className="material-symbols-outlined text-on-surface dark:text-zinc-350">{isDarkMode ? 'light_mode' : 'dark_mode'}</span>
                    </button>
                    <button className="p-stack-xs hover:bg-surface-container-high dark:hover:bg-zinc-800 rounded-full transition-colors active:opacity-80">
                        <span className="material-symbols-outlined text-on-surface dark:text-zinc-350">notifications</span>
                    </button>
                    {user ? (
                        <div onClick={handleProfileClick} className="w-8 h-8 rounded-full bg-primary dark:bg-emerald-600 text-on-primary dark:text-zinc-950 flex items-center justify-center font-bold text-label-sm cursor-pointer hover:scale-105 transition-transform">
                            {user.name.substring(0, 2).toUpperCase()}
                        </div>
                    ) : (
                        <Link to="/login" className="px-3 py-1.5 bg-primary dark:bg-emerald-600 text-on-primary dark:text-zinc-950 rounded-lg text-xs font-bold shadow-sm">Login</Link>
                    )}
                </div>
            </nav>

            <main className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-stack-lg pb-stack-xl">
                {/* Search Section */}
                <section className="mb-stack-xl flex flex-col items-center text-center">
                    <h1 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg mb-stack-md text-on-background dark:text-zinc-100">Explore Your Next Story</h1>
                    <form onSubmit={handleSearchSubmit} className="w-full max-w-2xl relative group">
                        <div className="w-full relative flex items-center bg-surface dark:bg-zinc-900 border border-outline-variant dark:border-zinc-800 rounded-xl focus-within:ring-4 focus-within:ring-primary/10 dark:focus-within:ring-emerald-400/10 focus-within:border-primary dark:focus-within:border-emerald-500 transition-all shadow-sm">
                            <span className="material-symbols-outlined ml-4 text-outline group-focus-within:text-primary dark:group-focus-within:text-emerald-400 transition-colors">search</span>
                            <select 
                                value={searchField} 
                                onChange={(e) => {
                                    setSearchField(e.target.value);
                                    fetchBooks(searchQuery, selectedGenre, e.target.value);
                                }} 
                                className="bg-transparent border-none outline-none ml-2 text-sm text-outline dark:text-zinc-400 focus:ring-0 cursor-pointer"
                            >
                                <option value="all" className="bg-surface dark:bg-zinc-900 text-on-surface dark:text-zinc-150">All Fields</option>
                                <option value="author" className="bg-surface dark:bg-zinc-900 text-on-surface dark:text-zinc-150">Author</option>
                                <option value="isbn" className="bg-surface dark:bg-zinc-900 text-on-surface dark:text-zinc-150">ISBN</option>
                            </select>
                            <div className="h-6 w-px bg-outline-variant dark:bg-zinc-800 mx-2"></div>
                            <input 
                                ref={searchInputRef}
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    fetchBooks(e.target.value, selectedGenre, searchField);
                                }}
                                className="w-full pr-24 py-4 bg-transparent border-none outline-none font-body-md text-body-md dark:text-zinc-100 focus:ring-0 focus:outline-none" 
                                placeholder={
                                    searchField === 'author' ? "Search specifically by Author..." :
                                    searchField === 'isbn' ? "Search specifically by ISBN..." :
                                    "Search by title, author, or ISBN..."
                                } 
                                type="text"
                            />
                            <kbd className="hidden md:inline-flex absolute right-4 top-1/2 -translate-y-1/2 bg-surface-container dark:bg-zinc-800 border border-outline-variant dark:border-zinc-700 px-2 py-0.5 rounded text-label-sm text-outline dark:text-zinc-400">CMD + K</kbd>
                        </div>
                    </form>
                    
                    {/* Category Chips */}
                    <div className="flex gap-stack-sm mt-stack-md overflow-x-auto w-full justify-start md:justify-center hide-scrollbar pb-2">
                        {genres.map((genre) => (
                            <button 
                                key={genre}
                                onClick={() => handleGenreChange(genre)}
                                className={`flex items-center gap-stack-xs px-4 py-2 rounded-full font-label-md text-label-md transition-all whitespace-nowrap ${
                                    selectedGenre === genre 
                                        ? 'bg-primary dark:bg-emerald-600 text-on-primary dark:text-zinc-950 shadow-md shadow-primary/20' 
                                        : 'bg-white dark:bg-zinc-900 border border-outline-variant dark:border-zinc-800 hover:border-primary dark:hover:border-emerald-500 text-on-surface-variant dark:text-zinc-300'
                                }`}
                            >
                                {genre}
                            </button>
                        ))}
                    </div>
                </section>

                {/* Conditional Rendering of Search Results */}
                {searchResultText ? (
                    <section className="mb-stack-xl animate-fade-in">
                        <h2 className="font-headline-md text-headline-md text-on-background dark:text-zinc-100 mb-stack-md">{searchResultText}</h2>
                        {books.length === 0 ? (
                            <div className="text-center py-12 bg-white dark:bg-zinc-900 border border-outline-variant dark:border-zinc-800 rounded-2xl">
                                <span className="material-symbols-outlined text-4xl text-outline mb-2">find_in_page</span>
                                <p className="text-on-surface-variant dark:text-zinc-450 font-body-md">No books match your criteria. Try another search.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-stack-lg animate-fade-in">
                                {books.map((book) => (
                                    <div key={book.id} className="bg-white dark:bg-zinc-900 rounded-xl p-4 premium-card-shadow flex flex-col border border-surface-variant dark:border-zinc-800 transition-colors duration-300">
                                        <div className="relative w-full aspect-[3/4] mb-4 rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-800 animate-pulse-slow">
                                            {book.cover_image_path ? (
                                                <img className="w-full h-full object-cover" src={book.cover_image_path} alt={book.title} />
                                            ) : (
                                                <div className="w-full h-full flex flex-col items-center justify-center text-zinc-400">
                                                    <span className="material-symbols-outlined text-4xl">book</span>
                                                </div>
                                            )}
                                        </div>
                                        <h3 className="font-headline-md text-base text-on-background dark:text-zinc-100 line-clamp-1 font-bold">{book.title}</h3>
                                        <p className="text-on-surface-variant dark:text-zinc-400 font-body-sm text-sm mb-2">{book.author}</p>
                                        <div className="mt-auto flex flex-col gap-2">
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="font-bold text-on-background dark:text-zinc-300">{book.genre}</span>
                                                <span className={`px-2 py-0.5 rounded-full ${book.available_copies > 0 ? 'bg-primary-container text-on-primary-container dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-error-container text-on-error-container dark:bg-red-950/40 dark:text-red-300'}`}>
                                                    {book.available_copies > 0 ? 'Available' : 'Borrowed'}
                                                </span>
                                            </div>
                                            {book.available_copies > 0 ? (
                                                <button onClick={() => handleReserve(book.id)} className="w-full py-1.5 bg-primary dark:bg-emerald-600 text-on-primary dark:text-zinc-950 font-bold rounded-lg text-xs hover:bg-surface-tint dark:hover:bg-emerald-500 active:scale-[0.98] transition-all shadow">
                                                    Reserve Book
                                                </button>
                                            ) : (
                                                <button disabled className="w-full py-1.5 bg-zinc-200 dark:bg-zinc-800 text-zinc-450 rounded-lg text-xs cursor-not-allowed">
                                                    Unavailable
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                ) : (
                    <>
                        {/* Trending Now Carousel */}
                        <section className="mb-stack-xl">
                            <div className="flex justify-between items-end mb-stack-md">
                                <div>
                                    <h2 className="font-headline-md text-headline-md text-on-background dark:text-zinc-100">Trending Now</h2>
                                    <p className="text-on-surface-variant dark:text-zinc-400 font-body-sm text-body-sm">Most read books this week in the community</p>
                                </div>
                                <button onClick={() => handleGenreChange('All Genres')} className="text-primary dark:text-emerald-400 font-label-md text-label-md hover:underline flex items-center">
                                    See All <span className="material-symbols-outlined text-label-md ml-1">arrow_forward</span>
                                </button>
                            </div>
                            <div className="flex gap-stack-md overflow-x-auto hide-scrollbar -mx-margin-mobile px-margin-mobile md:mx-0 md:px-0">
                                {trendingBooks.map((book, idx) => (
                                    <div key={book.id} className="min-w-[280px] md:min-w-[320px] bg-white dark:bg-zinc-900 rounded-xl p-4 premium-card-shadow flex flex-col border border-surface-variant dark:border-zinc-800 transition-colors duration-300">
                                        <div className="relative w-full aspect-[3/4] mb-4 rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                                            <img className="w-full h-full object-cover" src={book.cover_image_path} alt={book.title} />
                                            {idx === 0 && (
                                                <div className="absolute top-2 left-2 bg-secondary text-on-secondary px-2 py-1 rounded-full font-label-sm text-label-sm">#1 Trending</div>
                                            )}
                                        </div>
                                        <h3 className="font-headline-md text-headline-md text-on-background dark:text-zinc-100 line-clamp-1">{book.title}</h3>
                                        <p className="text-on-surface-variant dark:text-zinc-400 font-body-sm text-body-sm mb-2">{book.author}</p>
                                        <div className="mt-auto flex justify-between items-center">
                                            <div className="flex items-center gap-1">
                                                <span className="material-symbols-outlined text-primary dark:text-emerald-400 text-label-md" style={{fontVariationSettings: "'FILL' 1"}}>star</span>
                                                <span className="font-label-md text-label-md text-on-background dark:text-zinc-200">{book.rating || "4.8"}</span>
                                            </div>
                                            <span className={`px-2 py-1 rounded-full text-label-sm ${book.available_copies > 0 ? 'bg-primary-container text-on-primary-container dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-error-container text-on-error-container dark:bg-red-950/40 dark:text-red-300'}`}>
                                                {book.available_copies > 0 ? 'Available' : 'Borrowed'}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* New Arrivals Grid (Bento Style) */}
                        <section className="mb-stack-xl">
                            <div className="flex justify-between items-end mb-stack-md">
                                <div>
                                    <h2 className="font-headline-md text-headline-md text-on-background dark:text-zinc-100">New Arrivals</h2>
                                    <p className="text-on-surface-variant dark:text-zinc-400 font-body-sm text-body-sm">Freshly curated additions to our library catalog</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-stack-md">
                                {/* Large Featured Bento Item */}
                                <div className="md:col-span-2 md:row-span-2 bg-primary rounded-2xl overflow-hidden relative group p-stack-lg flex flex-col justify-end text-on-primary min-h-[400px]">
                                    <div className="absolute inset-0 z-0">
                                        <img className="w-full h-full object-cover opacity-40 group-hover:scale-105 transition-transform duration-700" src={newArrivals[2]?.cover_image_path || newArrivals[0]?.cover_image_path} alt="Featured Bento" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-primary via-transparent to-transparent"></div>
                                    </div>
                                    <div className="relative z-10 text-white">
                                        <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full font-label-sm text-label-sm mb-stack-md inline-block">Curator's Choice</span>
                                        <h3 className="font-display text-display mb-stack-sm leading-tight">{newArrivals[2]?.title || "The Future of Digital Ethics"}</h3>
                                        <p className="text-on-primary/80 font-body-lg text-body-lg mb-stack-md max-w-md">{newArrivals[2]?.description || "Explore the complex intersection of artificial intelligence and human morality in this groundbreaking new release."}</p>
                                        <button onClick={() => navigate('/explore')} className="bg-white text-primary px-4 py-2 rounded-full font-label-md text-label-md hover:bg-primary-fixed transition-colors font-bold">Explore Catalog</button>
                                    </div>
                                </div>
                                
                                {/* Grid Item 2 */}
                                <div className="bg-white dark:bg-zinc-900 p-stack-md rounded-2xl border border-surface-variant dark:border-zinc-800 premium-card-shadow flex items-center gap-stack-md transition-colors duration-300">
                                    <img className="w-20 h-28 object-cover rounded shadow-sm flex-shrink-0" src={newArrivals[0]?.cover_image_path} alt={newArrivals[0]?.title} />
                                    <div>
                                        <h4 className="font-label-md text-label-md text-on-background dark:text-zinc-100 line-clamp-2">{newArrivals[0]?.title || "Sustainable Growth"}</h4>
                                        <p className="text-on-surface-variant dark:text-zinc-400 font-body-sm text-body-sm mb-2">{newArrivals[0]?.author || "P. Thompson"}</p>
                                        <span className="text-primary dark:text-emerald-400 font-bold text-label-sm">New</span>
                                    </div>
                                </div>
                                
                                {/* Grid Item 3 */}
                                <div className="bg-white dark:bg-zinc-900 p-stack-md rounded-2xl border border-surface-variant dark:border-zinc-800 premium-card-shadow flex items-center gap-stack-md transition-colors duration-300">
                                    <img className="w-20 h-28 object-cover rounded shadow-sm flex-shrink-0" src={newArrivals[1]?.cover_image_path} alt={newArrivals[1]?.title} />
                                    <div>
                                        <h4 className="font-label-md text-label-md text-on-background dark:text-zinc-100 line-clamp-2">{newArrivals[1]?.title || "The Art of Simplicity"}</h4>
                                        <p className="text-on-surface-variant dark:text-zinc-400 font-body-sm text-body-sm mb-2">{newArrivals[1]?.author || "L. Kazuki"}</p>
                                        <span className="text-primary dark:text-emerald-400 font-bold text-label-sm">New</span>
                                    </div>
                                </div>
                                
                                {/* Grid Item 4 (Horizontal span) */}
                                <div className="md:col-span-2 bg-surface-container-low dark:bg-zinc-900/60 p-stack-md rounded-2xl border border-surface-variant dark:border-zinc-800 flex justify-between items-center relative overflow-hidden group transition-colors duration-300">
                                    <div className="relative z-10">
                                        <h4 className="font-headline-md text-headline-md text-on-background dark:text-zinc-100">Explore Audiobooks</h4>
                                        <p className="text-on-surface-variant dark:text-zinc-400 font-body-sm text-body-sm">Listen to your favorites on the go.</p>
                                        <button className="mt-4 flex items-center gap-2 text-primary dark:text-emerald-400 font-bold text-label-md hover:underline">
                                            Browse Collection <span className="material-symbols-outlined">headphones</span>
                                        </button>
                                    </div>
                                    <span className="material-symbols-outlined text-[80px] text-primary/10 dark:text-emerald-400/10 group-hover:scale-110 transition-transform">graphic_eq</span>
                                </div>
                            </div>
                        </section>

                        {/* Browse by Genre Sections */}
                        <section className="mb-stack-xl">
                            <h2 className="font-headline-md text-headline-md text-on-background dark:text-zinc-100 mb-stack-md">Browse by Genre</h2>
                            <div className="grid grid-cols-2 md:grid-cols-6 gap-stack-md">
                                {[
                                    { name: "Fiction", icon: "psychology", color: "secondary" },
                                    { name: "Science", icon: "science", color: "primary" },
                                    { name: "History", icon: "history", color: "tertiary" },
                                    { name: "Medicine", icon: "biotech", color: "secondary" },
                                    { name: "Art", icon: "palette", color: "primary" },
                                    { name: "More", icon: "more_horiz", color: "tertiary" }
                                ].map((item) => (
                                    <div key={item.name} onClick={() => handleGenreChange(item.name === 'More' ? 'All Genres' : item.name)} className="group flex flex-col items-center text-center p-stack-md bg-white dark:bg-zinc-900 border border-surface-variant dark:border-zinc-800 rounded-2xl premium-card-shadow cursor-pointer transition-colors duration-300">
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-stack-sm group-hover:scale-110 transition-transform ${
                                            item.color === 'primary' ? 'bg-primary-container/10 text-primary dark:text-emerald-400' :
                                            item.color === 'secondary' ? 'bg-secondary-container/10 text-secondary dark:text-indigo-400' :
                                            'bg-tertiary-container/10 text-tertiary dark:text-amber-400'
                                        }`}>
                                            <span className="material-symbols-outlined">{item.icon}</span>
                                        </div>
                                        <span className="font-label-md text-label-md text-on-background dark:text-zinc-200">{item.name}</span>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </>
                )}
            </main>

            {/* Bottom Navigation Shell (Mobile Only) */}
            <footer className="md:hidden fixed bottom-0 left-0 w-full flex justify-around items-center h-16 bg-surface dark:bg-zinc-900 border-t border-surface-variant dark:border-zinc-800 z-50 shadow-sm transition-colors duration-300">
                <Link className="flex flex-col items-center justify-center text-on-surface-variant dark:text-zinc-400 px-base py-xs hover:bg-surface-container-low transition-all scale-95 active:scale-90" to="/">
                    <span className="material-symbols-outlined">home</span>
                    <span className="font-label-sm text-label-sm">Home</span>
                </Link>
                <Link className="flex flex-col items-center justify-center bg-primary dark:bg-emerald-600 text-on-primary dark:text-zinc-950 rounded-full px-4 py-1 scale-95 active:scale-90" to="/explore">
                    <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 1"}}>search</span>
                    <span className="font-label-sm text-label-sm">Search</span>
                </Link>
                <Link className="flex flex-col items-center justify-center text-on-surface-variant dark:text-zinc-400 px-base py-xs hover:bg-surface-container-low transition-all scale-95 active:scale-90" to="/member">
                    <span className="material-symbols-outlined">book_2</span>
                    <span className="font-label-sm text-label-sm">My Books</span>
                </Link>
                <div onClick={handleProfileClick} className="flex flex-col items-center justify-center text-on-surface-variant dark:text-zinc-400 px-base py-xs hover:bg-surface-container-low transition-all scale-95 active:scale-90 cursor-pointer">
                    <span className="material-symbols-outlined">person</span>
                    <span className="font-label-sm text-label-sm">Profile</span>
                </div>
            </footer>

            {/* FAB (Contextual) */}
            <button className="fixed bottom-24 right-6 md:bottom-12 md:right-12 w-14 h-14 bg-primary dark:bg-emerald-600 text-on-primary dark:text-zinc-950 rounded-full shadow-lg flex items-center justify-center hover:scale-110 active:scale-95 transition-transform z-40 group">
                <span className="material-symbols-outlined">add</span>
                <span className="absolute right-full mr-4 bg-on-surface text-surface px-3 py-1 rounded text-label-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">Suggest a Book</span>
            </button>
        </div>
    );
}
