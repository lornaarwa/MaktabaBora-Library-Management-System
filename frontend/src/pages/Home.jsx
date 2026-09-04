import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { BookOpen, LogIn, UserPlus, ShieldCheck, KeyRound, Mail, User as UserIcon, Loader2, AlertCircle, ArrowRight, Library } from 'lucide-react';
import { Brand } from '../components/ui/Brand';
import { BookCover } from '../components/ui/BookCover';
import { BookCardSkeleton } from '../components/ui/Skeleton';
import { api } from '../services/api';
import { cn } from '../lib/utils';

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: 'easeOut' },
};

export default function Home() {
    const { user, login, register } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Book cards send guests to the login page with a ?next= destination; once
    // authenticated we send them straight back to that book.
    const intendedPath = () => {
        const next = new URLSearchParams(location.search).get('next');
        return next && next.startsWith('/') && !next.startsWith('//') ? next : null;
    };

    // Mode: 'login' | 'register'
    const [mode, setMode] = useState('login');

    // Form states
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Live catalogue preview for visitors (the catalogue itself requires a member login)
    const [featuredBooks, setFeaturedBooks] = useState([]);
    const [featuredLoading, setFeaturedLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const res = await api.getBooks();
                const list = Array.isArray(res) ? res : res?.data || [];
                if (!cancelled) setFeaturedBooks(list.slice(0, 4));
            } catch (_) {
                // Hide the preview quietly if the catalogue is unreachable.
            } finally {
                if (!cancelled) setFeaturedLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, []);

    // Redirect authenticated users to their dashboard according to role
    useEffect(() => {
        if (user) {
            if (user.role === 'admin') navigate('/admin', { replace: true });
            else if (user.role === 'librarian') navigate('/librarian', { replace: true });
            else navigate('/member', { replace: true });
        }
    }, [user, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const next = intendedPath();
            if (mode === 'login') {
                const authenticatedUser = await login(email, password, rememberMe);
                if (next) navigate(next, { replace: true });
                else if (authenticatedUser.role === 'admin') navigate('/admin', { replace: true });
                else if (authenticatedUser.role === 'librarian') navigate('/librarian', { replace: true });
                else navigate('/member', { replace: true });
            } else {
                const newUser = await register({ name, email, password, role: 'member' });
                if (next) navigate(next, { replace: true });
                else if (newUser.role === 'admin') navigate('/admin', { replace: true });
                else if (newUser.role === 'librarian') navigate('/librarian', { replace: true });
                else navigate('/member', { replace: true });
            }
        } catch (err) {
            setError(err.message || 'Authentication failed. Please check your details.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto px-4 py-12 space-y-12">

            {/* Hero Banner */}
            <motion.div
                {...fadeUp}
                className="text-center max-w-2xl mx-auto space-y-5"
            >
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-bark-700 text-cream-light font-mono text-xs font-bold uppercase tracking-widest shadow-sm">
                    <BookOpen className="w-4 h-4 text-tan" /> MaktabaBora System
                </div>
                <Brand variant="icon" className="mx-auto h-32 w-32 sm:h-40 sm:w-40 rounded-2xl border border-bark-100 bg-paper shadow-card" />
                <h1 className="text-3xl sm:text-5xl font-extrabold text-bark-900 tracking-tight leading-tight">
                    Welcome to Maktaba<span className="text-tan-dark">Bora</span>
                </h1>
                <p className="text-bark-700 text-sm sm:text-base leading-relaxed">
                    Access our physical catalog, digital e-book reader, circulation desk, and library management services. Please select an option below to continue.
                </p>
            </motion.div>

            {/* Main Auth Selection Section: 2 Options */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.15, ease: 'easeOut' }}
                className="max-w-md mx-auto space-y-6"
            >

                {/* 2 Options Buttons Header */}
                <div className="grid grid-cols-2 gap-3 p-1.5 bg-cream-light/60 border border-bark-100 rounded-2xl shadow-sm">
                    <button
                        type="button"
                        onClick={() => { setMode('login'); setError(null); }}
                        className={cn(
                            'flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-xs transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-tan-dark/60',
                            mode === 'login'
                                ? 'bg-bark-700 text-cream-light shadow-card'
                                : 'text-bark-700 hover:bg-paper/80'
                        )}
                    >
                        <LogIn className="w-4 h-4" />
                        <span>1. Login</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => { setMode('register'); setError(null); }}
                        className={cn(
                            'flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-xs transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-tan-dark/60',
                            mode === 'register'
                                ? 'bg-bark-700 text-cream-light shadow-card'
                                : 'text-bark-700 hover:bg-paper/80'
                        )}
                    >
                        <UserPlus className="w-4 h-4" />
                        <span>2. Register</span>
                    </button>
                </div>

                {/* Selected Form Container */}
                <div className="bg-paper border border-bark-100 rounded-2xl p-6 sm:p-8 shadow-card space-y-6">

                    <div className="text-center space-y-1">
                        <h2 className="text-lg font-bold text-bark-900">
                            {mode === 'login' ? 'Log In with Credentials' : 'Create New Account'}
                        </h2>
                        <p className="text-xs text-bark-500">
                            {mode === 'login'
                                ? 'Enter your email and password to access your dashboard'
                                : 'Fill in your details to register as a new library member'}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {mode === 'register' && (
                            <div>
                                <label htmlFor="home-name" className="block text-xs font-semibold text-bark-700 mb-1">Full Name</label>
                                <div className="relative">
                                    <UserIcon className="w-4 h-4 text-bark-400 absolute left-3 top-3" />
                                    <input
                                        id="home-name"
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Jane Doe"
                                        required
                                        className="w-full bg-paper border border-bark-100 rounded-xl pl-9 pr-3 py-2.5 text-xs text-bark-900 focus:outline-none focus:border-bark-500 focus:ring-2 focus:ring-tan-dark/50"
                                    />
                                </div>
                            </div>
                        )}

                        <div>
                            <label htmlFor="home-email" className="block text-xs font-semibold text-bark-700 mb-1">Email Address</label>
                            <div className="relative">
                                <Mail className="w-4 h-4 text-bark-400 absolute left-3 top-3" />
                                <input
                                    id="home-email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="user@example.com"
                                    required
                                    className="w-full bg-paper border border-bark-100 rounded-xl pl-9 pr-3 py-2.5 text-xs text-bark-900 focus:outline-none focus:border-bark-500 focus:ring-2 focus:ring-tan-dark/50"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="home-password" className="block text-xs font-semibold text-bark-700 mb-1">Password</label>
                            <div className="relative">
                                <KeyRound className="w-4 h-4 text-bark-400 absolute left-3 top-3" />
                                <input
                                    id="home-password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    className="w-full bg-paper border border-bark-100 rounded-xl pl-9 pr-3 py-2.5 text-xs text-bark-900 focus:outline-none focus:border-bark-500 focus:ring-2 focus:ring-tan-dark/50"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="p-3 rounded-xl bg-cream border border-[#a8452f]/30 text-[#8c3620] text-xs flex items-center gap-2" role="alert">
                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 rounded-xl bg-bark-700 hover:bg-bark-900 text-cream-light font-bold text-xs shadow-card transition-all flex items-center justify-center gap-2 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-tan-dark/60"
                        >
                            {loading ? (
                                <Loader2 className="w-4 h-4 animate-spin text-cream-light" />
                            ) : (
                                <>
                                    <span>{mode === 'login' ? 'Sign In to Dashboard' : 'Complete Registration'}</span>
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </motion.div>

            {/* Live catalogue preview for visitors (real data from the public API) */}
            {(featuredLoading || featuredBooks.length > 0) && (
                <motion.section
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, delay: 0.25, ease: 'easeOut' }}
                    className="space-y-5"
                    aria-label="Preview of the MaktabaBora catalogue"
                >
                    <div className="flex flex-wrap items-end justify-between gap-4">
                        <div className="space-y-1.5">
                            <p className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-bark-500">
                                <Library className="h-3.5 w-3.5 text-tan-dark" /> The MaktabaBora Catalogue
                            </p>
                            <h2 className="text-xl sm:text-2xl font-extrabold text-bark-900 tracking-tight">
                                Latest titles in the library
                            </h2>
                            <p className="text-xs sm:text-sm text-bark-600 max-w-xl leading-relaxed">
                                A live preview of the books available for borrowing and streaming — sign in as a member to
                                search the full catalogue, reserve copies, or start reading.
                            </p>
                        </div>
                        <Link
                            to="/login"
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-bark-700 hover:bg-bark-900 text-cream-light font-bold text-xs shadow-card transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-tan-dark/60"
                        >
                            Explore the full catalogue
                            <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                    </div>

                    {featuredLoading ? (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-5" aria-busy="true" aria-label="Loading catalogue preview">
                            {[0, 1, 2, 3].map((i) => (
                                <BookCardSkeleton key={i} />
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-5">
                            {featuredBooks.map((book, i) => (
                                <motion.article
                                    key={book.id}
                                    initial={{ opacity: 0, y: 14 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 + i * 0.07, duration: 0.35, ease: 'easeOut' }}
                                >
                                    <Link
                                        to={`/login?next=${encodeURIComponent(`/books/${book.id}`)}`}
                                        aria-label={`Open ${book.title} (sign in to continue)`}
                                        className="group block rounded-xl border border-bark-100 bg-paper p-3 shadow-card space-y-2.5 transition hover:border-bark-300 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-tan-dark/60"
                                    >
                                        <BookCover book={book} className="aspect-[3/4] w-full" />
                                        <div className="space-y-1 px-0.5">
                                            <p className="text-xs font-bold text-bark-900 leading-snug line-clamp-2 group-hover:text-bark-700">{book.title}</p>
                                            <p className="text-[11px] text-bark-500 truncate">By {book.author}</p>
                                            <span className="inline-block px-2 py-0.5 rounded-full bg-cream-light border border-bark-100 font-mono text-[9px] uppercase tracking-wider text-bark-600">
                                                {book.genre}
                                            </span>
                                        </div>
                                    </Link>
                                </motion.article>
                            ))}
                        </div>
                    )}
                </motion.section>
            )}

            {/* Trust strip */}
            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="flex items-center justify-center gap-2 text-[11px] font-mono uppercase tracking-widest text-bark-500"
            >
                <ShieldCheck className="h-3.5 w-3.5 text-olive-dark" />
                Secure member accounts & verified borrowing records
            </motion.p>
        </div>
    );
}