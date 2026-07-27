import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export default function Explore() {
    const { user } = useAuth();
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

                if (bookArray.length > 0) {
                    setTrendingBooks(bookArray.slice(0, 4));
                    setNewArrivals(bookArray.slice(4, 9));
                } else {
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

    const Icon = ({ name, size = 20 }) => {
        const c = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' };
        switch (name) {
            case 'sun': return <svg {...c}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>;
            case 'moon': return <svg {...c}><path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z" /></svg>;
            case 'bell': return <svg {...c}><path d="M6 8a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z" /><path d="M10 21a2 2 0 0 0 4 0" /></svg>;
            case 'search': return <svg {...c}><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>;
            case 'home': return <svg {...c}><path d="M3 11l9-8 9 8" /><path d="M5 10v10h14V10" /></svg>;
            case 'book': return <svg {...c}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" /></svg>;
            case 'person': return <svg {...c}><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 5-6 8-6s6.5 2 8 6" /></svg>;
            case 'star': return <svg {...c} fill="currentColor" stroke="none"><path d="M12 2.5l2.9 6.3 6.9.7-5.1 4.7 1.5 6.8L12 17.7l-6.2 3.3 1.5-6.8-5.1-4.7 6.9-.7L12 2.5Z" /></svg>;
            case 'arrow': return <svg {...c}><path d="M5 12h14M13 6l6 6-6 6" /></svg>;
            case 'plus': return <svg {...c}><path d="M12 5v14M5 12h14" /></svg>;
            case 'empty': return <svg {...c}><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M8 2v4M16 2v4M3 10h18" /></svg>;
            case 'flask': return <svg {...c}><path d="M9 2h6M10 2v6l-5.5 9.5A2 2 0 0 0 6.2 21h11.6a2 2 0 0 0 1.7-3.5L14 8V2" /><path d="M7.5 15h9" /></svg>;
            case 'clock': return <svg {...c}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.5 2" /></svg>;
            case 'palette': return <svg {...c}><path d="M12 2a10 10 0 1 0 0 20c1.5 0 2-1 2-2s-.5-1.5-.5-2.5S14 16 15.5 16H17a4 4 0 0 0 4-4c0-5.5-4-10-9-10Z" /><circle cx="7.5" cy="10.5" r="1" fill="currentColor" stroke="none" /><circle cx="9" cy="15" r="1" fill="currentColor" stroke="none" /><circle cx="14" cy="7.5" r="1" fill="currentColor" stroke="none" /></svg>;
            case 'medical': return <svg {...c}><circle cx="12" cy="12" r="9" /><path d="M12 8v8M8 12h8" /></svg>;
            case 'dots': return <svg {...c}><circle cx="5" cy="12" r="1.2" fill="currentColor" /><circle cx="12" cy="12" r="1.2" fill="currentColor" /><circle cx="19" cy="12" r="1.2" fill="currentColor" /></svg>;
            case 'spinner': return <svg {...c} className="mb-explore__spin"><path d="M21 12a9 9 0 1 1-9-9" /></svg>;
            default: return null;
        }
    };

    const genreMeta = {
        Fiction: 'book', Science: 'flask', History: 'clock', Medicine: 'medical', Art: 'palette', More: 'dots'
    };

    return (
        <div className="mb-explore">
            <style dangerouslySetInnerHTML={{ __html: `
                @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=JetBrains+Mono:wght@400;500;600&family=Inter:wght@400;500;600&display=swap');

                .mb-explore {
                    --bg: #F7F2E4; --surface: #FFFDF7; --surface-2: #EDE5CE;
                    --ink: #221D15; --ink-soft: #5C5643; --line: #CBBE97;
                    --green: #2B4C3F; --green-dark: #17281F; --stamp: #A93226; --brass: #B8862E;
                    background: var(--bg); color: var(--ink);
                    font-family: 'Inter', system-ui, sans-serif;
                    min-height: 100vh; padding-bottom: 76px;
                    transition: background 0.3s ease, color 0.3s ease;
                }
                html.dark .mb-explore {
                    --bg: #101E18; --surface: #16261F; --surface-2: #1D2F26;
                    --ink: #EEE6CC; --ink-soft: #A79C7D; --line: #3A4A3F;
                    --green: #6FA98C; --green-dark: #0B140F;
                }
                @media (min-width: 860px) { .mb-explore { padding-bottom: 0; } }
                .mb-explore button, .mb-explore select, .mb-explore input { font-family: inherit; }

                /* Header */
                .mb-explore__nav {
                    position: sticky; top: 0; z-index: 50; height: 66px;
                    display: flex; align-items: center;
                    background: color-mix(in srgb, var(--surface) 88%, transparent);
                    backdrop-filter: blur(14px); border-bottom: 1px solid var(--line);
                }
                .mb-explore__nav-inner { width: 100%; max-width: 1180px; margin: 0 auto; padding: 0 24px; display: flex; align-items: center; justify-content: space-between; }
                .mb-explore__logo { display: flex; align-items: center; gap: 9px; }
                .mb-explore__logo-mark { width: 28px; height: 28px; border-radius: 3px; background: var(--green); color: var(--surface); display: flex; align-items: center; justify-content: center; font-family: 'Fraunces', serif; font-weight: 700; font-size: 13px; }
                html.dark .mb-explore__logo-mark { color: var(--green-dark); }
                .mb-explore__logo-text { font-family: 'Fraunces', serif; font-weight: 600; font-size: 18px; color: var(--green); }
                .mb-explore__links { display: none; align-items: center; gap: 4px; }
                @media (min-width: 860px) { .mb-explore__links { display: flex; } }
                .mb-explore__links a, .mb-explore__links .item {
                    font-size: 13.5px; font-weight: 500; color: var(--ink-soft); padding: 8px 14px;
                    border-radius: 999px; text-decoration: none; cursor: pointer; transition: background .15s, color .15s;
                }
                .mb-explore__links a.active { color: var(--green); font-weight: 700; background: var(--surface-2); }
                .mb-explore__links a:hover, .mb-explore__links .item:hover { background: var(--surface-2); color: var(--ink); }
                .mb-explore__nav-actions { display: flex; align-items: center; gap: 8px; }
                .mb-explore__icon-btn { display: flex; align-items: center; justify-content: center; width: 34px; height: 34px; border-radius: 50%; background: transparent; border: none; color: var(--ink-soft); cursor: pointer; transition: background .15s; }
                .mb-explore__icon-btn:hover { background: var(--surface-2); }
                .mb-explore__avatar { width: 30px; height: 30px; border-radius: 50%; background: var(--green); color: var(--surface); display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; cursor: pointer; }
                html.dark .mb-explore__avatar { color: var(--green-dark); }
                .mb-explore__login-btn { padding: 8px 16px; border-radius: 5px; border: 1.5px solid var(--stamp); color: var(--stamp); font-size: 12.5px; font-weight: 700; text-decoration: none; }

                .mb-explore__main { max-width: 1180px; margin: 0 auto; padding: 40px 20px 60px; }

                /* Search hero */
                .mb-explore__hero { text-align: center; margin-bottom: 30px; }
                .mb-explore__title { font-family: 'Fraunces', serif; font-weight: 600; font-size: clamp(24px, 4vw, 32px); margin: 0 0 22px; }
                .mb-explore__search-shell {
                    max-width: 720px; margin: 0 auto; display: flex; align-items: center; gap: 0;
                    background: var(--surface); border: 1.5px solid var(--line); border-radius: 10px;
                    box-shadow: 0 12px 30px -20px rgba(0,0,0,0.35); padding: 4px 14px; position: relative;
                }
                .mb-explore__search-shell select {
                    border: none; background: transparent; font-size: 13px; color: var(--ink-soft);
                    outline: none; cursor: pointer; padding: 12px 6px;
                }
                .mb-explore__search-shell .divider { width: 1px; height: 22px; background: var(--line); margin: 0 6px; }
                .mb-explore__search-shell input { flex: 1; border: none; background: transparent; outline: none; font-size: 14.5px; padding: 12px 6px; color: var(--ink); }
                .mb-explore__search-shell input::placeholder { color: var(--ink-soft); }
                .mb-explore__kbd {
                    display: none; font-family: 'JetBrains Mono', monospace; font-size: 10.5px;
                    color: var(--ink-soft); border: 1px solid var(--line); border-radius: 4px; padding: 2px 7px;
                }
                @media (min-width: 700px) { .mb-explore__kbd { display: inline-block; } }
                .mb-explore__spin { animation: mb-explore-spin 0.8s linear infinite; color: var(--stamp); }
                @keyframes mb-explore-spin { to { transform: rotate(360deg); } }

                .mb-explore__chips { display: flex; gap: 8px; margin-top: 18px; overflow-x: auto; justify-content: center; flex-wrap: wrap; }
                .mb-explore__chip {
                    padding: 8px 16px; border-radius: 999px; font-size: 12.5px; font-weight: 600;
                    border: 1.5px solid var(--line); background: var(--surface); color: var(--ink-soft);
                    cursor: pointer; white-space: nowrap; transition: all .15s;
                }
                .mb-explore__chip.active { background: var(--green); border-color: var(--green); color: var(--surface); }
                html.dark .mb-explore__chip.active { color: var(--green-dark); }

                /* Section shells */
                .mb-explore__section { margin-bottom: 46px; }
                .mb-explore__section-head { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 18px; gap: 12px; flex-wrap: wrap; }
                .mb-explore__section-title { font-family: 'Fraunces', serif; font-weight: 600; font-size: 21px; margin: 0 0 3px; }
                .mb-explore__section-sub { color: var(--ink-soft); font-size: 13px; margin: 0; }
                .mb-explore__see-all { display: flex; align-items: center; gap: 4px; color: var(--green); font-weight: 700; font-size: 13px; background: none; border: none; cursor: pointer; }

                .mb-explore__empty { text-align: center; padding: 56px 20px; background: var(--surface); border: 1px solid var(--line); border-radius: 16px; color: var(--ink-soft); }
                .mb-explore__empty svg { margin-bottom: 10px; opacity: .6; }

                /* Book grid / cards */
                .mb-explore__grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 18px; }
                @media (min-width: 700px) { .mb-explore__grid { grid-template-columns: repeat(4, 1fr); } }
                .mb-explore__row { display: flex; gap: 18px; overflow-x: auto; padding-bottom: 8px; }

                .mb-explore__card { background: var(--surface); border: 1px solid var(--line); border-radius: 12px; padding: 14px; display: flex; flex-direction: column; flex-shrink: 0; }
                .mb-explore__grid .mb-explore__card { flex-shrink: unset; }
                .mb-explore__row .mb-explore__card { width: 220px; }
                .mb-explore__cover { position: relative; aspect-ratio: 3/4; border-radius: 8px; overflow: hidden; margin-bottom: 10px; background: var(--surface-2); }
                .mb-explore__cover img { width: 100%; height: 100%; object-fit: cover; }
                .mb-explore__cover-empty { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: var(--ink-soft); }
                .mb-explore__tag { position: absolute; top: 8px; left: 8px; background: var(--stamp); color: var(--surface); font-size: 10px; font-weight: 700; padding: 3px 8px; border-radius: 999px; }
                .mb-explore__card-title { font-weight: 700; font-size: 13.5px; margin: 0 0 2px; line-height: 1.3; }
                .mb-explore__card-author { font-size: 12px; color: var(--ink-soft); margin: 0 0 10px; }
                .mb-explore__card-meta { display: flex; justify-content: space-between; align-items: center; font-size: 11.5px; margin-bottom: 10px; }
                .mb-explore__genre-label { font-weight: 700; color: var(--ink-soft); }
                .mb-explore__status { padding: 2px 9px; border-radius: 999px; font-weight: 700; font-size: 10.5px; }
                .mb-explore__status.available { background: color-mix(in srgb, var(--green) 18%, transparent); color: var(--green); }
                .mb-explore__status.borrowed { background: color-mix(in srgb, var(--stamp) 15%, transparent); color: var(--stamp); }
                .mb-explore__rating { display: flex; align-items: center; gap: 4px; font-size: 12px; font-weight: 700; color: var(--brass); }
                .mb-explore__reserve-btn {
                    width: 100%; padding: 9px; border-radius: 7px; font-weight: 700; font-size: 12px; cursor: pointer; border: none;
                    background: var(--green); color: var(--surface); margin-top: auto;
                }
                html.dark .mb-explore__reserve-btn { color: var(--green-dark); }
                .mb-explore__reserve-btn:disabled { background: var(--surface-2); color: var(--ink-soft); cursor: not-allowed; }

                /* Bento */
                .mb-explore__bento { display: grid; grid-template-columns: 1fr; gap: 16px; }
                @media (min-width: 860px) { .mb-explore__bento { grid-template-columns: repeat(4, 1fr); grid-auto-rows: 190px; } }
                .mb-explore__bento-feature {
                    grid-column: span 2; grid-row: span 2; border-radius: 18px; position: relative; overflow: hidden;
                    display: flex; flex-direction: column; justify-content: flex-end; padding: 26px; min-height: 340px;
                    background: var(--green-dark); color: #F2ECDC;
                }
                .mb-explore__bento-feature img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; opacity: 0.35; }
                .mb-explore__bento-feature::after { content: ''; position: absolute; inset: 0; background: linear-gradient(to top, var(--green-dark), transparent 70%); }
                .mb-explore__bento-tag { position: relative; z-index: 1; display: inline-block; background: rgba(255,255,255,0.15); padding: 4px 12px; border-radius: 999px; font-size: 11px; margin-bottom: 12px; width: fit-content; }
                .mb-explore__bento-title { position: relative; z-index: 1; font-family: 'Fraunces', serif; font-weight: 600; font-size: 24px; margin: 0 0 10px; line-height: 1.2; }
                .mb-explore__bento-desc { position: relative; z-index: 1; font-size: 13.5px; opacity: 0.85; margin: 0 0 16px; max-width: 40ch; }
                .mb-explore__bento-btn { position: relative; z-index: 1; align-self: flex-start; background: #F2ECDC; color: var(--green-dark); border: none; padding: 9px 18px; border-radius: 999px; font-weight: 700; font-size: 12.5px; cursor: pointer; }
                .mb-explore__bento-item {
                    background: var(--surface); border: 1px solid var(--line); border-radius: 16px; padding: 16px;
                    display: flex; gap: 14px; align-items: center;
                }
                .mb-explore__bento-item img { width: 62px; height: 86px; object-fit: cover; border-radius: 6px; flex-shrink: 0; }
                .mb-explore__bento-item h4 { font-size: 13px; font-weight: 700; margin: 0 0 3px; }
                .mb-explore__bento-item p { font-size: 12px; color: var(--ink-soft); margin: 0 0 6px; }
                .mb-explore__new-tag { color: var(--stamp); font-weight: 700; font-size: 11px; }
                .mb-explore__bento-wide {
                    grid-column: span 2; background: var(--surface-2); border: 1px solid var(--line); border-radius: 16px;
                    padding: 20px; display: flex; justify-content: space-between; align-items: center;
                }
                .mb-explore__bento-wide h4 { font-family: 'Fraunces', serif; font-weight: 600; font-size: 17px; margin: 0 0 4px; }
                .mb-explore__bento-wide p { font-size: 12.5px; color: var(--ink-soft); margin: 0 0 10px; max-width: 30ch; }
                .mb-explore__bento-wide button { display: flex; align-items: center; gap: 6px; background: none; border: none; color: var(--green); font-weight: 700; font-size: 12.5px; cursor: pointer; }

                /* Genre grid */
                .mb-explore__genre-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; }
                @media (min-width: 700px) { .mb-explore__genre-grid { grid-template-columns: repeat(6, 1fr); } }
                .mb-explore__genre-card {
                    background: var(--surface); border: 1px solid var(--line); border-radius: 16px; padding: 20px 14px;
                    display: flex; flex-direction: column; align-items: center; text-align: center; gap: 8px; cursor: pointer;
                }
                .mb-explore__genre-icon {
                    width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
                    background: color-mix(in srgb, var(--green) 14%, transparent); color: var(--green);
                }
                .mb-explore__genre-card span { font-size: 12.5px; font-weight: 600; }

                /* FAB */
                .mb-explore__fab {
                    position: fixed; bottom: 88px; right: 20px; width: 54px; height: 54px; border-radius: 50%;
                    background: var(--stamp); color: var(--surface); border: none; display: flex; align-items: center;
                    justify-content: center; cursor: pointer; box-shadow: 0 14px 30px -14px rgba(0,0,0,0.5); z-index: 40;
                    transform: rotate(-3deg); transition: transform .15s;
                }
                .mb-explore__fab:hover { transform: rotate(0deg) scale(1.05); }
                @media (min-width: 860px) { .mb-explore__fab { bottom: 32px; right: 32px; } }

                /* Bottom nav */
                .mb-explore__bottom-nav {
                    display: flex; position: fixed; bottom: 0; left: 0; right: 0; z-index: 50; height: 62px;
                    background: var(--surface); border-top: 1px solid var(--line); justify-content: space-around; align-items: center;
                }
                @media (min-width: 860px) { .mb-explore__bottom-nav { display: none; } }
                .mb-explore__bottom-nav a, .mb-explore__bottom-nav .item {
                    display: flex; flex-direction: column; align-items: center; gap: 2px; color: var(--ink-soft);
                    font-size: 10px; text-decoration: none; cursor: pointer; padding: 4px 12px; border-radius: 999px;
                }
                .mb-explore__bottom-nav a.active { color: var(--green); background: var(--surface-2); font-weight: 700; }
            `}} />

            {/* Header */}
            <nav className="mb-explore__nav">
                <div className="mb-explore__nav-inner">
                    <div className="mb-explore__logo">
                        <span className="mb-explore__logo-mark">Mb</span>
                        <span className="mb-explore__logo-text">MaktabaBora</span>
                    </div>
                    <div className="mb-explore__links">
                        <Link to="/">Home</Link>
                        <Link className="active" to="/explore">Search</Link>
                        <Link to="/member">My Books</Link>
                        <div className="item" onClick={handleProfileClick}>Profile</div>
                    </div>
                    <div className="mb-explore__nav-actions">
                        <button onClick={toggleDarkMode} className="mb-explore__icon-btn" title="Toggle dark/light mode">
                            <Icon name={isDarkMode ? 'sun' : 'moon'} />
                        </button>
                        <button className="mb-explore__icon-btn" title="Notifications">
                            <Icon name="bell" />
                        </button>
                        {user ? (
                            <div onClick={handleProfileClick} className="mb-explore__avatar">{user.name.substring(0, 2).toUpperCase()}</div>
                        ) : (
                            <Link to="/login" className="mb-explore__login-btn">Log in</Link>
                        )}
                    </div>
                </div>
            </nav>

            <main className="mb-explore__main">
                {/* Search hero */}
                <section className="mb-explore__hero">
                    <h1 className="mb-explore__title">Search the catalogue</h1>
                    <form onSubmit={handleSearchSubmit} className="mb-explore__search-shell">
                        {loading ? <Icon name="spinner" /> : <Icon name="search" />}
                        <select
                            value={searchField}
                            onChange={(e) => {
                                setSearchField(e.target.value);
                                fetchBooks(searchQuery, selectedGenre, e.target.value);
                            }}
                        >
                            <option value="all">All Fields</option>
                            <option value="author">Author</option>
                            <option value="isbn">ISBN</option>
                        </select>
                        <div className="divider" />
                        <input
                            ref={searchInputRef}
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                fetchBooks(e.target.value, selectedGenre, searchField);
                            }}
                            placeholder={
                                searchField === 'author' ? 'Search specifically by author…' :
                                searchField === 'isbn' ? 'Search specifically by ISBN…' :
                                'Search by title, author, or ISBN…'
                            }
                            type="text"
                        />
                        <kbd className="mb-explore__kbd">⌘K</kbd>
                    </form>

                    <div className="mb-explore__chips">
                        {genres.map((genre) => (
                            <button
                                key={genre}
                                onClick={() => handleGenreChange(genre)}
                                className={`mb-explore__chip ${selectedGenre === genre ? 'active' : ''}`}
                            >
                                {genre}
                            </button>
                        ))}
                    </div>
                </section>

                {searchResultText ? (
                    <section className="mb-explore__section">
                        <h2 className="mb-explore__section-title">{searchResultText}</h2>
                        {books.length === 0 ? (
                            <div className="mb-explore__empty">
                                <Icon name="empty" size={34} />
                                <p>No books match your search. Try a different title, author, or genre.</p>
                            </div>
                        ) : (
                            <div className="mb-explore__grid">
                                {books.map((book) => (
                                    <div key={book.id} className="mb-explore__card">
                                        <div className="mb-explore__cover">
                                            {book.cover_image_path ? (
                                                <img src={book.cover_image_path} alt={book.title} />
                                            ) : (
                                                <div className="mb-explore__cover-empty"><Icon name="book" size={30} /></div>
                                            )}
                                        </div>
                                        <h3 className="mb-explore__card-title">{book.title}</h3>
                                        <p className="mb-explore__card-author">{book.author}</p>
                                        <div className="mb-explore__card-meta">
                                            <span className="mb-explore__genre-label">{book.genre}</span>
                                            <span className={`mb-explore__status ${book.available_copies > 0 ? 'available' : 'borrowed'}`}>
                                                {book.available_copies > 0 ? 'Available' : 'On loan'}
                                            </span>
                                        </div>
                                        {book.available_copies > 0 ? (
                                            <button className="mb-explore__reserve-btn" onClick={() => handleReserve(book.id)}>Reserve copy</button>
                                        ) : (
                                            <button className="mb-explore__reserve-btn" disabled>Join waitlist</button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                ) : (
                    <>
                        {/* Most borrowed */}
                        <section className="mb-explore__section">
                            <div className="mb-explore__section-head">
                                <div>
                                    <h2 className="mb-explore__section-title">Most borrowed this month</h2>
                                    <p className="mb-explore__section-sub">What's moving fastest off the shelf right now</p>
                                </div>
                                <button className="mb-explore__see-all" onClick={() => handleGenreChange('All Genres')}>
                                    See all <Icon name="arrow" size={15} />
                                </button>
                            </div>
                            <div className="mb-explore__row">
                                {trendingBooks.map((book, idx) => (
                                    <div key={book.id} className="mb-explore__card">
                                        <div className="mb-explore__cover">
                                            <img src={book.cover_image_path} alt={book.title} />
                                            {idx === 0 && <span className="mb-explore__tag">#1 Most Borrowed</span>}
                                        </div>
                                        <h3 className="mb-explore__card-title">{book.title}</h3>
                                        <p className="mb-explore__card-author">{book.author}</p>
                                        <div className="mb-explore__card-meta">
                                            <span className="mb-explore__rating"><Icon name="star" size={13} /> {book.rating || '4.8'}</span>
                                            <span className={`mb-explore__status ${book.available_copies > 0 ? 'available' : 'borrowed'}`}>
                                                {book.available_copies > 0 ? 'Available' : 'On loan'}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Recently added */}
                        <section className="mb-explore__section">
                            <div className="mb-explore__section-head">
                                <div>
                                    <h2 className="mb-explore__section-title">Recently added to the shelf</h2>
                                    <p className="mb-explore__section-sub">New acquisitions this term</p>
                                </div>
                            </div>
                            <div className="mb-explore__bento">
                                <div className="mb-explore__bento-feature">
                                    <img src={newArrivals[2]?.cover_image_path || newArrivals[0]?.cover_image_path} alt="Featured arrival" />
                                    <span className="mb-explore__bento-tag">Librarian's pick</span>
                                    <h3 className="mb-explore__bento-title">{newArrivals[2]?.title || 'The Future of Digital Ethics'}</h3>
                                    <p className="mb-explore__bento-desc">{newArrivals[2]?.description || "Freshly catalogued and ready to borrow — ask the front desk for the shelf location."}</p>
                                    <button className="mb-explore__bento-btn" onClick={() => navigate('/explore')}>Browse the catalogue</button>
                                </div>

                                <div className="mb-explore__bento-item">
                                    <img src={newArrivals[0]?.cover_image_path} alt={newArrivals[0]?.title} />
                                    <div>
                                        <h4>{newArrivals[0]?.title || 'Sustainable Growth'}</h4>
                                        <p>{newArrivals[0]?.author || 'P. Thompson'}</p>
                                        <span className="mb-explore__new-tag">New on shelf</span>
                                    </div>
                                </div>

                                <div className="mb-explore__bento-item">
                                    <img src={newArrivals[1]?.cover_image_path} alt={newArrivals[1]?.title} />
                                    <div>
                                        <h4>{newArrivals[1]?.title || 'The Art of Simplicity'}</h4>
                                        <p>{newArrivals[1]?.author || 'L. Kazuki'}</p>
                                        <span className="mb-explore__new-tag">New on shelf</span>
                                    </div>
                                </div>

                                <div className="mb-explore__bento-wide">
                                    <div>
                                        <h4>Can't find a title?</h4>
                                        <p>Suggest a book and the library can consider ordering extra copies.</p>
                                        <button onClick={() => navigate('/member')}>Suggest a book <Icon name="arrow" size={14} /></button>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Browse by genre */}
                        <section className="mb-explore__section">
                            <h2 className="mb-explore__section-title" style={{ marginBottom: 18 }}>Browse by genre</h2>
                            <div className="mb-explore__genre-grid">
                                {['Fiction', 'Science', 'History', 'Medicine', 'Art', 'More'].map((name) => (
                                    <div key={name} className="mb-explore__genre-card" onClick={() => handleGenreChange(name === 'More' ? 'All Genres' : name)}>
                                        <div className="mb-explore__genre-icon"><Icon name={genreMeta[name]} size={20} /></div>
                                        <span>{name}</span>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </>
                )}
            </main>

            {/* Bottom nav */}
            <nav className="mb-explore__bottom-nav">
                <Link to="/"><Icon name="home" size={19} />Home</Link>
                <Link className="active" to="/explore"><Icon name="search" size={19} />Search</Link>
                <Link to="/member"><Icon name="book" size={19} />My Books</Link>
                <div className="item" onClick={handleProfileClick}><Icon name="person" size={19} />Profile</div>
            </nav>

            {/* FAB */}
            <button className="mb-explore__fab" onClick={() => navigate('/member')} title="Suggest a book">
                <Icon name="plus" size={22} />
            </button>
        </div>
    );
}
