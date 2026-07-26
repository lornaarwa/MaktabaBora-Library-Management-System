import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function PublicCatalog() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    
    const [isDarkMode, setIsDarkMode] = useState(() => {
        return document.documentElement.classList.contains('dark') || 
               localStorage.getItem('theme') === 'dark';
    });

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

    useEffect(() => {
        const handleScroll = () => {
            const scrolled = window.pageYOffset;
            const heroBg = document.querySelector('.hero-gradient');
            if (heroBg) {
                heroBg.style.backgroundPositionY = -(scrolled * 0.2) + 'px';
            }
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

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

    return (
        <div className="bg-background dark:bg-zinc-950 text-on-background dark:text-zinc-50 font-body-md selection:bg-primary-fixed-dim selection:text-on-primary-fixed min-h-screen pb-16 md:pb-0 transition-colors duration-300">
            <style dangerouslySetInnerHTML={{__html: `
                .dark .glass-card {
                    background: rgba(24, 24, 27, 0.7) !important;
                    border-color: rgba(63, 63, 70, 0.4) !important;
                }
                .dark .hero-gradient {
                    background: radial-gradient(circle at top right, rgba(126, 218, 143, 0.08), transparent),
                                radial-gradient(circle at bottom left, rgba(113, 42, 226, 0.03), transparent) !important;
                }
            `}} />

            {/* Top Navigation Bar */}
            <header className="fixed top-0 w-full z-50 bg-surface/70 dark:bg-zinc-900/70 backdrop-blur-xl border-b border-outline-variant dark:border-zinc-800 shadow-sm h-16 transition-colors duration-300">
                <div className="flex justify-between items-center px-margin-mobile md:px-margin-desktop h-full w-full max-w-container-max mx-auto">
                    <div className="flex items-center gap-stack-sm">
                        <span className="material-symbols-outlined text-primary dark:text-emerald-400 text-3xl">menu_book</span>
                        <span className="font-headline-lg-mobile text-headline-lg-mobile font-bold text-primary dark:text-emerald-400">MaktabaBora</span>
                    </div>
                    <nav className="hidden md:flex items-center gap-stack-lg">
                        <Link className="font-label-md text-label-md text-primary dark:text-emerald-400 font-bold cursor-pointer" to="/">Home</Link>
                        <Link className="font-label-md text-label-md text-on-surface-variant dark:text-zinc-400 hover:bg-surface-container-high dark:hover:bg-zinc-800 transition-colors px-3 py-2 rounded-lg cursor-pointer" to="/explore">Explore</Link>
                        <Link className="font-label-md text-label-md text-on-surface-variant dark:text-zinc-400 hover:bg-surface-container-high dark:hover:bg-zinc-800 transition-colors px-3 py-2 rounded-lg cursor-pointer" to="/member">My Books</Link>
                        <div onClick={handleProfileClick} className="font-label-md text-label-md text-on-surface-variant dark:text-zinc-400 hover:bg-surface-container-high dark:hover:bg-zinc-800 transition-colors px-3 py-2 rounded-lg cursor-pointer">Profile</div>
                    </nav>
                    <div className="flex items-center gap-stack-md">
                        <button onClick={toggleDarkMode} className="material-symbols-outlined text-on-surface-variant dark:text-zinc-400 hover:bg-surface-container-high dark:hover:bg-zinc-800 p-2 rounded-full transition-colors" title="Toggle Dark/Light Mode">
                            {isDarkMode ? 'light_mode' : 'dark_mode'}
                        </button>
                        <button className="material-symbols-outlined text-on-surface-variant dark:text-zinc-400 hover:bg-surface-container-high dark:hover:bg-zinc-800 p-2 rounded-full transition-colors hidden md:block">search</button>
                        
                        {user ? (
                            <div className="flex items-center gap-2 pl-2 border-l border-outline-variant dark:border-zinc-850">
                                <div onClick={handleProfileClick} className="h-8 w-8 rounded-full bg-primary-container dark:bg-emerald-900/50 flex items-center justify-center text-on-primary-container dark:text-emerald-200 font-bold text-xs cursor-pointer hover:bg-primary dark:hover:bg-emerald-500 hover:text-white dark:hover:text-zinc-950 transition-colors">
                                    {user.name.substring(0, 2).toUpperCase()}
                                </div>
                                <button onClick={() => logout()} className="material-symbols-outlined text-on-surface-variant dark:text-zinc-400 hover:text-error transition-colors p-1" title="Sign Out">logout</button>
                            </div>
                        ) : (
                            <Link to="/login" className="px-4 py-1.5 rounded-lg bg-primary dark:bg-emerald-600 hover:bg-surface-tint dark:hover:bg-emerald-500 text-on-primary dark:text-zinc-950 text-xs font-bold transition-all shadow-sm">
                                Login
                            </Link>
                        )}
                    </div>
                </div>
            </header>

            <main className="pt-16 pb-32">
                {/* Hero Section */}
                <section className="relative hero-gradient overflow-hidden py-stack-xl md:py-32">
                    <div className="absolute top-0 right-0 w-1/3 h-full opacity-10 pointer-events-none"></div>
                    <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop text-center relative z-10">
                        <div className="inline-flex items-center gap-2 bg-primary-fixed-dim/20 text-primary dark:text-emerald-400 px-4 py-1.5 rounded-full mb-stack-lg border border-primary/10 dark:border-emerald-400/20">
                            <span className="material-symbols-outlined text-sm" style={{fontVariationSettings: "'FILL' 1"}}>auto_awesome</span>
                            <span className="font-label-sm text-label-sm uppercase tracking-wider font-bold">Next-Gen Library Platform</span>
                        </div>
                        <h1 className="font-display text-display max-w-4xl mx-auto mb-stack-md text-on-surface dark:text-zinc-100">
                            Your Gateway to <span className="text-primary dark:text-emerald-400 italic">Infinite Knowledge</span>
                        </h1>
                        <p className="font-body-lg text-body-lg text-on-surface-variant dark:text-zinc-450 max-w-2xl mx-auto mb-stack-xl">
                            Experience the future of reading with our AI-powered Smart Library ecosystem. Access millions of titles, curated insights, and collaborative study spaces.
                        </p>
                        <div className="max-w-3xl mx-auto mb-stack-xl">
                            <div className="glass-card rounded-2xl p-2 flex items-center shadow-lg transition-transform hover:scale-[1.01]">
                                <span className="material-symbols-outlined text-outline ml-4">search</span>
                                <input className="w-full bg-transparent border-none focus:ring-0 text-body-md px-4 outline-none placeholder:text-outline dark:text-zinc-100" placeholder="Search by title, author, ISBN or AI topic..." type="text"/>
                                <button className="bg-primary dark:bg-emerald-600 text-on-primary dark:text-zinc-950 px-8 py-3 rounded-xl font-label-md text-label-md font-bold hover:bg-surface-tint dark:hover:bg-emerald-500 active:scale-95 transition-all hidden sm:block">Search Library</button>
                            </div>
                        </div>
                        
                        {/* Quick Stats */}
                        <div className="flex flex-wrap justify-center gap-stack-xl mt-12">
                            <div className="text-center group">
                                <div className="text-headline-lg font-bold text-primary dark:text-emerald-400 mb-1">1M+</div>
                                <div className="text-label-md text-on-surface-variant dark:text-zinc-400 group-hover:text-primary dark:group-hover:text-emerald-400 transition-colors">Digital Books</div>
                            </div>
                            <div className="w-px h-12 bg-outline-variant dark:bg-zinc-800 hidden md:block"></div>
                            <div className="text-center group">
                                <div className="text-headline-lg font-bold text-primary dark:text-emerald-400 mb-1">50k+</div>
                                <div className="text-label-md text-on-surface-variant dark:text-zinc-400 group-hover:text-primary dark:group-hover:text-emerald-400 transition-colors">Active Members</div>
                            </div>
                            <div className="w-px h-12 bg-outline-variant dark:bg-zinc-800 hidden md:block"></div>
                            <div className="text-center group">
                                <div className="text-headline-lg font-bold text-primary dark:text-emerald-400 mb-1">24/7</div>
                                <div className="text-label-md text-on-surface-variant dark:text-zinc-400 group-hover:text-primary dark:group-hover:text-emerald-400 transition-colors">AI Assistance</div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* AI Librarian Teaser */}
                <section className="py-stack-xl px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto">
                    <div className="bg-surface-container-low dark:bg-zinc-900 rounded-[32px] overflow-hidden border border-outline-variant/30 dark:border-zinc-800 shadow-sm flex flex-col md:flex-row items-center transition-colors duration-300">
                        <div className="w-full md:w-1/2 p-stack-lg md:p-16">
                            <div className="inline-flex items-center gap-2 text-secondary dark:text-indigo-400 font-bold mb-stack-sm">
                                <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 1"}}>psychology</span>
                                <span className="font-label-md text-label-md">MEET BORA AI</span>
                            </div>
                            <h2 className="font-headline-lg text-headline-lg text-on-surface dark:text-zinc-100 mb-stack-md leading-tight">
                                A personal librarian <br/>who knows every page.
                            </h2>
                            <p className="font-body-md text-body-md text-on-surface-variant dark:text-zinc-400 mb-stack-lg">
                                Bora AI doesn't just find books; it understands them. Ask for summaries, complex cross-references, or research assistance in plain natural language.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-stack-sm">
                                <button className="bg-secondary dark:bg-indigo-600 text-on-secondary dark:text-white px-8 py-3 rounded-full font-label-md text-label-md font-bold hover:shadow-lg hover:shadow-secondary/20 dark:hover:shadow-indigo-500/20 transition-all flex items-center justify-center gap-2">
                                    Try AI Chat <span className="material-symbols-outlined">arrow_forward</span>
                                </button>
                                <button className="bg-white dark:bg-zinc-800 border border-outline-variant dark:border-zinc-700 px-8 py-3 rounded-full font-label-md text-label-md font-bold text-on-surface-variant dark:text-zinc-300 hover:bg-surface-container dark:hover:bg-zinc-700 transition-all">
                                    Learn More
                                </button>
                            </div>
                        </div>
                        <div className="w-full md:w-1/2 relative min-h-[320px] bg-secondary-container dark:bg-indigo-950 flex items-center justify-center p-stack-md">
                            <div className="absolute inset-0 opacity-20"></div>
                            <div className="glass-card p-6 rounded-2xl shadow-2xl max-w-sm relative z-10">
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-full bg-secondary dark:bg-indigo-600 flex-shrink-0 flex items-center justify-center text-white">
                                        <span className="material-symbols-outlined text-sm">robot_2</span>
                                    </div>
                                    <div>
                                        <p className="text-body-sm font-bold text-secondary dark:text-indigo-400 mb-1">Bora AI</p>
                                        <p className="text-body-sm text-on-surface dark:text-zinc-200 leading-relaxed">
                                            "I've found 3 books on quantum computing that mention 'entanglement' specifically in the context of teleportation. Would you like a combined summary?"
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Featured Collections */}
                <section className="py-stack-xl">
                    <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop mb-stack-lg flex justify-between items-end">
                        <div>
                            <h2 className="font-headline-lg text-headline-lg text-on-surface dark:text-zinc-100">Curated for You</h2>
                            <p className="text-on-surface-variant dark:text-zinc-400">Recommended based on your reading history</p>
                        </div>
                        <button className="text-primary dark:text-emerald-400 font-bold font-label-md hover:underline flex items-center gap-1">
                            View All <span className="material-symbols-outlined">chevron_right</span>
                        </button>
                    </div>
                    <div className="flex overflow-x-auto hide-scrollbar gap-stack-lg px-margin-mobile md:px-margin-desktop pb-8">
                        {/* Book Cards */}
                        {[
                            { title: "The Quantum Horizon", author: "Dr. Alan Thorne", img: "https://lh3.googleusercontent.com/aida-public/AB6AXuDricZAE-FZ8WbmLBMLrlKSx0ZigiGWnnzVEgWVn6JsFFIvlxZ2lFGW5YXNr_NyZRQMpTBA64TC88EIfwy0IewVlHGosTwMXDRtNgcviFTjrneBJpURHnErKECmDsjy4QyjXlREAf7Nulea5b9Z3p9mv2KrBQeaUbIp6TiHa4HSjApSepy3AvrwRMC1JjxDoMUC9BGrK6mdIbgKrWMTv_PGHQUE1NmdlMXu58gQi4Votm5YF6UjdU6PWBUVqXAyQCZ6K5HY-7zS4OQ" },
                            { title: "Exponential Growth", author: "Sarah Jenkins", img: "https://lh3.googleusercontent.com/aida-public/AB6AXuAONi_3sNRUfgyoUTbBw5hCLFG8DwQMlFt2RU2bjK_nc7TQXlgBIl2wfnSEpimp8NWJXlX5KemrJdpUmkPQkrrVwa54kZFU5UnpFE5LrRxgZnDwKMG2buA-ckg7IXAGpUpZ07O1w5xiNJUx2pRKyxOjxxwCPU-jAWA3mx8Dl1vfK8lJ-Sofjx6txhyzpgkAfpfqXq_aUVl2tTeicgb9lRFHCU9uTGfLPBY4XI5njXqPJWFlw4P2jFTeiEbh_bHfkeJGKTHguE0O3NY" },
                            { title: "Echoes of the Past", author: "Marcus Vane", img: "https://lh3.googleusercontent.com/aida-public/AB6AXuAkf6t9_AKL03w-SB33_0Yk6rKOlXlBm3s2Cc3k4BqDxI4RtRuxjraC0vy9HT9EKkR_oHcFA1uD8Zqs_nZJNH5M9k831OYQbxnJlH8D75Az_7IsEG6H01OB5cHEdjOq1-yUeyZC4qYb4BQhlZ0Bg77h7_56HwWY5xca7nnIWfWXxCVyKBOcmmTYPkKyPTwiGhTqi8nLo6mw2ytJcFYUTHiEwjhz1vhw7m7udceUF-96dfCxndOySGv_X4XlFvGLaWtXYa3VIaH_cV4" },
                            { title: "Systems Thinking", author: "Hiroshi Tanaka", img: "https://lh3.googleusercontent.com/aida-public/AB6AXuC3ouOlSI-r57Z6zhxDSa-mL9VGcnLYzPUK7kQsC45gTCv0OBFw199DsaGCiISfa4TE9IL5F6Yxl3UzQgQ9SukCWp78OlUc6w5bF3kty8KfEGmEip1QfTX3_1woLGXmZY1I0OSNsbyFzRH5zv0rhKPlWc1lpB7pFn3dW6H-eJ_4mkQ6WVcMjVgR01fLXPju4OKEsBGhmMn5mua6Gel0KGFXwEcltyLeZ97geoF35AkJdtWdzw7NJV2D9pB27E6GWnzxQaw2QyaB5Cw" },
                            { title: "The Green Revolution", author: "Elena Rossi", img: "https://lh3.googleusercontent.com/aida-public/AB6AXuA6_Szf1zPRIybAGGbHsJzxcRK5_lyWBf9xuOGo_6nZger0OF9njt8AOXSDaoCmrueucc7h9xJUgoa0mnHBLPb8CJiXG6qpyFppCSWAUigyFnbvXXyLnAOpVL4YTElFv3cmT4BQQgYyqrVSbXMIhs9qBhgYjyMVCp2MsgJgIK6Ek0wsXNjk28tzQqTjaou84-TRGW50Z3w8LRRr7Kn5YX9dpF77qK6Pw8gVYOKcB7UAZo56zbE6oFgBohFcKhX7dOEqSIMX0CSF3nY" },
                            { title: "Digital Zen", author: "Leo Kofman", img: "https://lh3.googleusercontent.com/aida-public/AB6AXuCenxPgVT09Ds3T8IZ6bNOmzY7v3dU6J1BWqayUeGP99K01B36-RQdIiIx9Wq97cfJXScfRAzkz6rM8N6HZc9fYergmHp_l7srEgvXAhprN3-WWHqpUEh7D3c4j_ZCNwpMpIb-w1XhtXs25HKl0Oxnp46q5Bw54-xazzPFWZ4o3sVJNrzVoLqslX0Qy3PYm7LZJEVU2QzJZsiIQJOdFNBdgZ3D-1yiVopuSNtS8YfeK6XoVSLKITZvAxqv0i8GsPkEAI1sLQnP7FOo" }
                        ].map((book, i) => (
                            <div key={i} className="flex-shrink-0 w-48 group cursor-pointer">
                                <div className="aspect-[2/3] rounded-xl overflow-hidden shadow-md mb-3 transition-transform group-hover:-translate-y-2">
                                    <img className="w-full h-full object-cover" src={book.img} alt={book.title} />
                                </div>
                                <h3 className="font-bold text-body-sm text-on-surface dark:text-zinc-150 truncate">{book.title}</h3>
                                <p className="text-label-sm text-on-surface-variant dark:text-zinc-400">{book.author}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Subscription Tiers */}
                <section className="py-stack-xl bg-surface-container dark:bg-zinc-900/50">
                    <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop text-center mb-stack-xl">
                        <h2 className="font-display text-headline-lg text-on-surface dark:text-zinc-100 mb-4">Elevate Your Journey</h2>
                        <p className="text-on-surface-variant dark:text-zinc-400">Flexible plans for every curious mind.</p>
                    </div>
                    <div className="max-w-6xl mx-auto px-margin-mobile md:px-margin-desktop grid md:grid-cols-3 gap-stack-lg">
                        {/* Student */}
                        <div className="bg-surface dark:bg-zinc-900 rounded-2xl p-stack-lg border border-outline-variant dark:border-zinc-800 shadow-sm flex flex-col">
                            <div className="mb-stack-lg">
                                <h3 className="font-headline-md text-on-surface dark:text-zinc-100 mb-2">Student</h3>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-2xl font-bold text-on-surface dark:text-zinc-100">$5</span>
                                    <span className="text-on-surface-variant dark:text-zinc-450">/month</span>
                                </div>
                            </div>
                            <ul className="space-y-4 mb-stack-xl flex-grow">
                                <li className="flex items-center gap-3 text-body-sm text-on-surface-variant dark:text-zinc-300">
                                    <span className="material-symbols-outlined text-primary dark:text-emerald-400 text-lg">check_circle</span>
                                    Access to 500k+ Textbook titles
                                </li>
                                <li className="flex items-center gap-3 text-body-sm text-on-surface-variant dark:text-zinc-300">
                                    <span className="material-symbols-outlined text-primary dark:text-emerald-400 text-lg">check_circle</span>
                                    Basic AI Search
                                </li>
                                <li className="flex items-center gap-3 text-body-sm text-on-surface-variant dark:text-zinc-300">
                                    <span className="material-symbols-outlined text-primary dark:text-emerald-400 text-lg">check_circle</span>
                                    5 Offline Downloads
                                </li>
                            </ul>
                            <button className="w-full py-3 border border-primary dark:border-emerald-500 text-primary dark:text-emerald-400 font-bold rounded-xl hover:bg-primary/5 dark:hover:bg-emerald-500/10 transition-colors">Select Plan</button>
                        </div>
                        {/* Professional */}
                        <div className="bg-surface dark:bg-zinc-900 rounded-2xl p-stack-lg border-2 border-primary dark:border-emerald-500 shadow-xl flex flex-col relative md:scale-105 z-10">
                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary dark:bg-emerald-600 text-on-primary dark:text-zinc-950 px-4 py-1 rounded-full text-label-sm font-bold shadow-lg">MOST POPULAR</div>
                            <div className="mb-stack-lg">
                                <h3 className="font-headline-md text-on-surface dark:text-zinc-100 mb-2">Professional</h3>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-4xl font-bold text-on-surface dark:text-zinc-100">$15</span>
                                    <span className="text-on-surface-variant dark:text-zinc-450">/month</span>
                                </div>
                            </div>
                            <ul className="space-y-4 mb-stack-xl flex-grow">
                                <li className="flex items-center gap-3 text-body-sm text-on-surface dark:text-zinc-200 font-medium">
                                    <span className="material-symbols-outlined text-primary dark:text-emerald-400 text-lg" style={{fontVariationSettings: "'FILL' 1"}}>check_circle</span>
                                    Unlimited Access to all 1M+ titles
                                </li>
                                <li className="flex items-center gap-3 text-body-sm text-on-surface dark:text-zinc-200 font-medium">
                                    <span className="material-symbols-outlined text-primary dark:text-emerald-400 text-lg" style={{fontVariationSettings: "'FILL' 1"}}>check_circle</span>
                                    Priority Bora AI Assistance
                                </li>
                                <li className="flex items-center gap-3 text-body-sm text-on-surface dark:text-zinc-200 font-medium">
                                    <span className="material-symbols-outlined text-primary dark:text-emerald-400 text-lg" style={{fontVariationSettings: "'FILL' 1"}}>check_circle</span>
                                    Unlimited Downloads
                                </li>
                                <li className="flex items-center gap-3 text-body-sm text-on-surface dark:text-zinc-200 font-medium">
                                    <span className="material-symbols-outlined text-primary dark:text-emerald-400 text-lg" style={{fontVariationSettings: "'FILL' 1"}}>check_circle</span>
                                    Advanced Annotation Tools
                                </li>
                            </ul>
                            <button className="w-full py-3 bg-primary dark:bg-emerald-600 text-on-primary dark:text-zinc-950 font-bold rounded-xl shadow-lg hover:shadow-primary/30 active:scale-[0.98] transition-all">Get Started</button>
                        </div>
                        {/* Institutional */}
                        <div className="bg-surface dark:bg-zinc-900 rounded-2xl p-stack-lg border border-outline-variant dark:border-zinc-800 shadow-sm flex flex-col">
                            <div className="mb-stack-lg">
                                <h3 className="font-headline-md text-on-surface dark:text-zinc-100 mb-2">Institutional</h3>
                                <div className="text-xl font-bold text-on-surface dark:text-zinc-100">Custom Pricing</div>
                            </div>
                            <ul className="space-y-4 mb-stack-xl flex-grow">
                                <li className="flex items-center gap-3 text-body-sm text-on-surface-variant dark:text-zinc-300">
                                    <span className="material-symbols-outlined text-primary dark:text-emerald-400 text-lg">check_circle</span>
                                    Site-wide Access for Universities
                                </li>
                                <li className="flex items-center gap-3 text-body-sm text-on-surface-variant dark:text-zinc-300">
                                    <span className="material-symbols-outlined text-primary dark:text-emerald-400 text-lg">check_circle</span>
                                    Dedicated Account Manager
                                </li>
                                <li className="flex items-center gap-3 text-body-sm text-on-surface-variant dark:text-zinc-300">
                                    <span className="material-symbols-outlined text-primary dark:text-emerald-400 text-lg">check_circle</span>
                                    Advanced Usage Analytics
                                </li>
                            </ul>
                            <button className="w-full py-3 border border-outline dark:border-zinc-700 text-on-surface-variant dark:text-zinc-300 font-bold rounded-xl hover:bg-surface-container dark:hover:bg-zinc-800 transition-colors">Contact Sales</button>
                        </div>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="bg-surface-container-lowest dark:bg-zinc-950 border-t border-outline-variant dark:border-zinc-850 py-stack-xl transition-colors duration-300">
                <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop grid md:grid-cols-4 gap-stack-lg mb-stack-xl">
                    <div className="col-span-1 md:col-span-1">
                        <div className="flex items-center gap-stack-sm mb-stack-md">
                            <span className="material-symbols-outlined text-primary dark:text-emerald-400 text-3xl">menu_book</span>
                            <span className="font-headline-lg-mobile text-headline-lg-mobile font-bold text-primary dark:text-emerald-400">MaktabaBora</span>
                        </div>
                        <p className="text-body-sm text-on-surface-variant dark:text-zinc-400">Building the world's most intelligent reading ecosystem for lifelong learners.</p>
                    </div>
                    <div>
                        <h4 className="font-label-md text-label-md text-on-surface dark:text-zinc-200 font-bold mb-4">Platform</h4>
                        <ul className="space-y-2 text-body-sm text-on-surface-variant dark:text-zinc-400">
                            <li><a className="hover:text-primary dark:hover:text-emerald-400 transition-colors cursor-pointer">Digital Library</a></li>
                            <li><a className="hover:text-primary dark:hover:text-emerald-400 transition-colors cursor-pointer">Bora AI</a></li>
                            <li><a className="hover:text-primary dark:hover:text-emerald-400 transition-colors cursor-pointer">Mobile App</a></li>
                            <li><a className="hover:text-primary dark:hover:text-emerald-400 transition-colors cursor-pointer">Collaborative Hub</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-label-md text-label-md text-on-surface dark:text-zinc-200 font-bold mb-4">Resources</h4>
                        <ul className="space-y-2 text-body-sm text-on-surface-variant dark:text-zinc-400">
                            <li><a className="hover:text-primary dark:hover:text-emerald-400 transition-colors cursor-pointer">Help Center</a></li>
                            <li><a className="hover:text-primary dark:hover:text-emerald-400 transition-colors cursor-pointer">Privacy Policy</a></li>
                            <li><a className="hover:text-primary dark:hover:text-emerald-400 transition-colors cursor-pointer">Terms of Service</a></li>
                            <li><a className="hover:text-primary dark:hover:text-emerald-400 transition-colors cursor-pointer">Cookie Settings</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-label-md text-label-md text-on-surface dark:text-zinc-200 font-bold mb-4">Follow Us</h4>
                        <div className="flex gap-4">
                            <a className="w-10 h-10 rounded-full bg-surface-container dark:bg-zinc-800 flex items-center justify-center text-on-surface-variant dark:text-zinc-400 hover:bg-primary dark:hover:bg-emerald-600 hover:text-white dark:hover:text-zinc-950 transition-all cursor-pointer">
                                <span className="material-symbols-outlined text-lg">share</span>
                            </a>
                            <a className="w-10 h-10 rounded-full bg-surface-container dark:bg-zinc-800 flex items-center justify-center text-on-surface-variant dark:text-zinc-400 hover:bg-primary dark:hover:bg-emerald-600 hover:text-white dark:hover:text-zinc-950 transition-all cursor-pointer">
                                <span className="material-symbols-outlined text-lg">public</span>
                            </a>
                        </div>
                    </div>
                </div>
                <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop pt-stack-md border-t border-outline-variant dark:border-zinc-850 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-label-sm text-outline dark:text-zinc-500">© 2026 MaktabaBora. All rights reserved.</p>
                    <div className="flex gap-stack-lg">
                        <span className="flex items-center gap-1 text-label-sm text-outline dark:text-zinc-500">
                            <span className="w-2 h-2 rounded-full bg-primary dark:bg-emerald-500"></span> System Operational
                        </span>
                    </div>
                </div>
            </footer>

            {/* Bottom Navigation Bar (Mobile only) */}
            <nav className="md:hidden fixed bottom-0 left-0 w-full bg-surface dark:bg-zinc-900 border-t border-outline-variant dark:border-zinc-800 flex justify-around items-center py-stack-sm px-margin-mobile pb-safe z-50 rounded-t-xl shadow-[0px_-4px_12px_rgba(0,0,0,0.03)]">
                <Link className="flex flex-col items-center justify-center bg-primary-container dark:bg-emerald-900/50 text-on-primary-container dark:text-emerald-250 rounded-full px-5 py-1 cursor-pointer" to="/">
                    <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 1"}}>home</span>
                    <span className="font-label-sm text-label-sm">Home</span>
                </Link>
                <Link className="flex flex-col items-center justify-center text-on-surface-variant dark:text-zinc-400 hover:text-primary dark:hover:text-emerald-400 transition-colors cursor-pointer" to="/explore">
                    <span className="material-symbols-outlined">search</span>
                    <span className="font-label-sm text-label-sm">Search</span>
                </Link>
                <Link className="flex flex-col items-center justify-center text-on-surface-variant dark:text-zinc-400 hover:text-primary dark:hover:text-emerald-400 transition-colors cursor-pointer" to="/member">
                    <span className="material-symbols-outlined">book_5</span>
                    <span className="font-label-sm text-label-sm">My Books</span>
                </Link>
                <div onClick={handleProfileClick} className="flex flex-col items-center justify-center text-on-surface-variant dark:text-zinc-400 hover:text-primary dark:hover:text-emerald-400 transition-colors cursor-pointer">
                    <span className="material-symbols-outlined">person</span>
                    <span className="font-label-sm text-label-sm">Profile</span>
                </div>
            </nav>
        </div>
    );
}
