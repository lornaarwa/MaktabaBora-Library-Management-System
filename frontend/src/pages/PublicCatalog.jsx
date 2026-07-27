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

    const Icon = ({ name, size = 20 }) => {
        const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' };
        switch (name) {
            case 'sun':
                return <svg {...common}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>;
            case 'moon':
                return <svg {...common}><path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z" /></svg>;
            case 'logout':
                return <svg {...common}><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><path d="M10 17l5-5-5-5" /><path d="M15 12H3" /></svg>;
            case 'search':
                return <svg {...common}><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>;
            case 'home':
                return <svg {...common}><path d="M3 11l9-8 9 8" /><path d="M5 10v10h14V10" /></svg>;
            case 'book':
                return <svg {...common}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" /></svg>;
            case 'person':
                return <svg {...common}><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 5-6 8-6s6.5 2 8 6" /></svg>;
            default:
                return null;
        }
    };

    const shelfBooks = [
        { title: 'Introduction to Algorithms', author: 'Cormen et al.', status: '2 copies available', callNumber: 'QA76.6 .C662', img: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300&q=80' },
        { title: 'Organic Chemistry', author: 'Clayden, Greeves', status: '1 copy — reserve now', callNumber: 'QD251.3 .C53', img: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=300&q=80' },
        { title: 'Principles of Macroeconomics', author: 'N. Gregory Mankiw', status: '4 copies available', callNumber: 'HB172.5 .M354', img: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=300&q=80' },
        { title: 'Research Methods in Education', author: 'Cohen, Manion, Morrison', status: '3 copies available', callNumber: 'LB1028 .C572', img: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=300&q=80' },
        { title: 'Structural Analysis', author: 'R.C. Hibbeler', status: 'On loan — join waitlist', callNumber: 'TA645 .H49', img: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=300&q=80' },
        { title: 'Constitutional Law of Kenya', author: 'Migai Akech', status: '2 copies available', callNumber: 'KEN 342.7 .A34', img: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=300&q=80' },
    ];

    return (
        <div className="mb-home">
            <style dangerouslySetInnerHTML={{ __html: `
                @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=JetBrains+Mono:wght@400;500;600&family=Inter:wght@400;500;600&display=swap');

                .mb-home {
                    --bg: #F7F2E4;
                    --surface: #FFFDF7;
                    --surface-2: #EDE5CE;
                    --ink: #221D15;
                    --ink-soft: #5C5643;
                    --line: #CBBE97;
                    --green: #2B4C3F;
                    --green-dark: #17281F;
                    --stamp: #A93226;
                    --brass: #B8862E;
                    --wood-a: #6B4526;
                    --wood-b: #402A18;
                    background: var(--bg);
                    color: var(--ink);
                    font-family: 'Inter', system-ui, sans-serif;
                    min-height: 100vh;
                    transition: background 0.3s ease, color 0.3s ease;
                }
                html.dark .mb-home {
                    --bg: #101E18;
                    --surface: #16261F;
                    --surface-2: #1D2F26;
                    --ink: #EEE6CC;
                    --ink-soft: #A79C7D;
                    --line: #3A4A3F;
                    --green: #6FA98C;
                    --green-dark: #0B140F;
                }

                .mb-home a, .mb-home button { font-family: inherit; }

                /* ---------- Header ---------- */
                .mb-home__header {
                    position: fixed; top: 0; left: 0; right: 0; z-index: 50;
                    height: 68px;
                    display: flex; align-items: center;
                    background: color-mix(in srgb, var(--surface) 88%, transparent);
                    backdrop-filter: blur(14px);
                    border-bottom: 1px solid var(--line);
                }
                .mb-home__header-inner {
                    width: 100%; max-width: 1180px; margin: 0 auto;
                    padding: 0 24px;
                    display: flex; align-items: center; justify-content: space-between;
                }
                .mb-home__logo { display: flex; align-items: center; gap: 10px; }
                .mb-home__logo-mark {
                    width: 30px; height: 30px; border-radius: 3px;
                    background: var(--green);
                    display: flex; align-items: center; justify-content: center;
                    color: var(--surface); font-family: 'Fraunces', serif; font-weight: 700; font-size: 14px;
                }
                .mb-home__logo-text { font-family: 'Fraunces', serif; font-weight: 600; font-size: 19px; color: var(--green); }
                html.dark .mb-home__logo-mark { color: var(--green-dark); }

                .mb-home__nav { display: none; align-items: center; gap: 6px; }
                @media (min-width: 860px) { .mb-home__nav { display: flex; } }
                .mb-home__nav a, .mb-home__nav .mb-home__nav-item {
                    font-size: 13.5px; font-weight: 500; color: var(--ink-soft);
                    padding: 8px 14px; border-radius: 6px; text-decoration: none; cursor: pointer;
                    transition: background 0.15s ease, color 0.15s ease;
                }
                .mb-home__nav a:hover, .mb-home__nav .mb-home__nav-item:hover { background: var(--surface-2); color: var(--ink); }
                .mb-home__nav a.active { color: var(--green); font-weight: 700; }

                .mb-home__actions { display: flex; align-items: center; gap: 10px; }
                .mb-home__icon-btn {
                    display: flex; align-items: center; justify-content: center;
                    width: 34px; height: 34px; border-radius: 50%;
                    background: transparent; border: none; color: var(--ink-soft); cursor: pointer;
                    transition: background 0.15s ease;
                }
                .mb-home__icon-btn:hover { background: var(--surface-2); }
                .mb-home__login-btn {
                    padding: 9px 18px; border-radius: 5px; border: 1.5px solid var(--stamp);
                    color: var(--stamp); font-size: 13px; font-weight: 700; text-decoration: none;
                    letter-spacing: 0.02em; transition: background 0.15s ease, color 0.15s ease;
                }
                .mb-home__login-btn:hover { background: var(--stamp); color: var(--surface); }
                .mb-home__avatar {
                    width: 32px; height: 32px; border-radius: 50%;
                    background: var(--green); color: var(--surface);
                    display: flex; align-items: center; justify-content: center;
                    font-size: 11px; font-weight: 700; cursor: pointer;
                }

                /* ---------- Stamp badge (signature motif) ---------- */
                .mb-home__stamp-badge {
                    display: inline-flex; align-items: center; gap: 6px;
                    border: 1.5px dashed var(--stamp);
                    color: var(--stamp);
                    font-family: 'JetBrains Mono', monospace;
                    font-size: 11px; font-weight: 600; letter-spacing: 0.09em; text-transform: uppercase;
                    padding: 5px 12px; border-radius: 3px;
                    transform: rotate(-2deg);
                }

                /* ---------- Hero ---------- */
                .hero-gradient {
                    position: relative;
                    padding: 150px 24px 90px;
                    background-image:
                        radial-gradient(circle at 85% 15%, color-mix(in srgb, var(--green) 12%, transparent), transparent 45%),
                        radial-gradient(circle at 10% 85%, color-mix(in srgb, var(--brass) 10%, transparent), transparent 40%);
                }
                .mb-home__hero-inner { max-width: 780px; margin: 0 auto; text-align: center; }
                .mb-home__hero-title {
                    font-family: 'Fraunces', Georgia, serif;
                    font-weight: 600;
                    font-size: clamp(32px, 5.5vw, 54px);
                    line-height: 1.08;
                    margin: 20px 0 16px;
                }
                .mb-home__hero-title em { color: var(--green); font-style: italic; }
                .mb-home__hero-sub {
                    font-size: 16px; line-height: 1.6; color: var(--ink-soft);
                    max-width: 52ch; margin: 0 auto 36px;
                }

                .mb-home__search {
                    max-width: 620px; margin: 0 auto 48px;
                    display: flex; align-items: center; gap: 6px;
                    background: var(--surface); border: 1.5px solid var(--line);
                    border-radius: 8px; padding: 6px 6px 6px 18px;
                    box-shadow: 0 12px 30px -18px rgba(0,0,0,0.35);
                }
                .mb-home__search input {
                    flex: 1; border: none; background: transparent; outline: none;
                    font-size: 14.5px; color: var(--ink); padding: 10px 4px;
                }
                .mb-home__search input::placeholder { color: var(--ink-soft); }
                .mb-home__search button {
                    background: var(--green); color: var(--surface);
                    border: none; border-radius: 6px; padding: 12px 22px;
                    font-size: 13.5px; font-weight: 700; cursor: pointer;
                    white-space: nowrap;
                    transition: transform 0.15s ease;
                }
                .mb-home__search button:hover { transform: translateY(-1px); }
                html.dark .mb-home__search button { color: var(--green-dark); }

                .mb-home__stats { display: flex; flex-wrap: wrap; justify-content: center; gap: 40px; }
                .mb-home__stat { text-align: center; }
                .mb-home__stat-num { font-family: 'Fraunces', serif; font-weight: 700; font-size: 26px; color: var(--green); }
                .mb-home__stat-label { font-size: 12.5px; color: var(--ink-soft); margin-top: 2px; }

                /* ---------- Section shell ---------- */
                .mb-home__section { max-width: 1180px; margin: 0 auto; padding: 64px 24px; }
                .mb-home__section-head { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 28px; gap: 16px; flex-wrap: wrap; }
                .mb-home__section-title { font-family: 'Fraunces', serif; font-weight: 600; font-size: 26px; margin: 0 0 4px; }
                .mb-home__section-sub { color: var(--ink-soft); font-size: 14px; margin: 0; }
                .mb-home__view-all { color: var(--green); font-weight: 700; font-size: 13.5px; background: none; border: none; cursor: pointer; }

                /* ---------- Ask Bora section ---------- */
                .mb-home__bora {
                    background: var(--surface-2);
                    border: 1px solid var(--line);
                    border-radius: 20px;
                    display: flex; flex-wrap: wrap;
                    overflow: hidden;
                }
                .mb-home__bora-copy { flex: 1 1 380px; padding: 44px; }
                .mb-home__bora-eyebrow {
                    font-family: 'JetBrains Mono', monospace; font-size: 11px; letter-spacing: 0.14em;
                    text-transform: uppercase; color: var(--stamp); margin-bottom: 10px;
                }
                .mb-home__bora-title { font-family: 'Fraunces', serif; font-weight: 600; font-size: 25px; line-height: 1.25; margin: 0 0 14px; }
                .mb-home__bora-desc { color: var(--ink-soft); font-size: 14.5px; line-height: 1.6; margin-bottom: 24px; max-width: 46ch; }
                .mb-home__bora-buttons { display: flex; gap: 12px; flex-wrap: wrap; }
                .mb-home__btn-primary {
                    background: var(--green); color: var(--surface); border: none; border-radius: 999px;
                    padding: 11px 24px; font-size: 13.5px; font-weight: 700; cursor: pointer;
                }
                html.dark .mb-home__btn-primary { color: var(--green-dark); }
                .mb-home__btn-secondary {
                    background: transparent; border: 1.5px solid var(--line); color: var(--ink);
                    border-radius: 999px; padding: 11px 24px; font-size: 13.5px; font-weight: 700; cursor: pointer;
                }
                .mb-home__bora-demo {
                    flex: 1 1 320px;
                    background: var(--green-dark);
                    display: flex; align-items: center; justify-content: center;
                    padding: 32px;
                }
                .mb-home__chat-bubble {
                    background: var(--surface); border-radius: 14px; padding: 18px 20px;
                    max-width: 320px; box-shadow: 0 20px 40px -24px rgba(0,0,0,0.6);
                }
                .mb-home__chat-row { display: flex; gap: 12px; margin-bottom: 14px; }
                .mb-home__chat-avatar {
                    width: 30px; height: 30px; border-radius: 50%; flex-shrink: 0;
                    background: var(--stamp); color: var(--surface);
                    display: flex; align-items: center; justify-content: center;
                    font-family: 'JetBrains Mono', monospace; font-size: 11px; font-weight: 700;
                }
                .mb-home__chat-name { font-size: 12px; font-weight: 700; color: var(--stamp); margin: 0 0 3px; }
                .mb-home__chat-text { font-size: 13px; line-height: 1.5; color: var(--ink); margin: 0; }
                .mb-home__chat-row:last-child { margin-bottom: 0; }
                .mb-home__chat-row.user .mb-home__chat-avatar { background: var(--green); }
                html.dark .mb-home__chat-row.user .mb-home__chat-avatar { color: var(--green-dark); }

                /* ---------- Shelf / catalogue strip ---------- */
                .mb-home__shelf { display: flex; overflow-x: auto; gap: 22px; padding-bottom: 12px; scrollbar-width: none; }
                .mb-home__shelf::-webkit-scrollbar { display: none; }
                .mb-home__book { flex-shrink: 0; width: 168px; cursor: pointer; }
                .mb-home__book-cover {
                    position: relative; aspect-ratio: 2/3; border-radius: 8px; overflow: hidden;
                    margin-bottom: 10px; box-shadow: 0 10px 22px -14px rgba(0,0,0,0.5);
                    transition: transform 0.2s ease;
                }
                .mb-home__book:hover .mb-home__book-cover { transform: translateY(-4px); }
                .mb-home__book-cover img { width: 100%; height: 100%; object-fit: cover; }
                .mb-home__book-badge {
                    position: absolute; top: 8px; left: 8px;
                    background: color-mix(in srgb, var(--surface) 92%, transparent);
                    color: var(--stamp);
                    font-family: 'JetBrains Mono', monospace; font-size: 9.5px; font-weight: 700;
                    padding: 3px 7px; border-radius: 3px; letter-spacing: 0.03em;
                }
                .mb-home__book-title { font-weight: 700; font-size: 13.5px; margin: 0 0 2px; }
                .mb-home__book-author { font-size: 12px; color: var(--ink-soft); margin: 0 0 2px; }
                .mb-home__book-call { font-family: 'JetBrains Mono', monospace; font-size: 10.5px; color: var(--ink-soft); }

                /* ---------- Membership section ---------- */
                .mb-home__membership { background: var(--surface-2); }
                .mb-home__plans { display: grid; gap: 22px; }
                @media (min-width: 860px) { .mb-home__plans { grid-template-columns: repeat(3, 1fr); } }
                .mb-home__plan {
                    background: var(--surface); border: 1px solid var(--line); border-radius: 16px;
                    padding: 30px; display: flex; flex-direction: column;
                }
                .mb-home__plan.featured { border: 2px solid var(--green); position: relative; }
                .mb-home__plan-tag {
                    position: absolute; top: -13px; left: 50%; transform: translateX(-50%);
                    background: var(--green); color: var(--surface);
                    font-family: 'JetBrains Mono', monospace; font-size: 10px; font-weight: 700;
                    letter-spacing: 0.08em; padding: 4px 12px; border-radius: 999px;
                }
                html.dark .mb-home__plan-tag { color: var(--green-dark); }
                .mb-home__plan-name { font-family: 'Fraunces', serif; font-weight: 600; font-size: 19px; margin: 6px 0 8px; }
                .mb-home__plan-price { font-size: 26px; font-weight: 700; margin-bottom: 22px; }
                .mb-home__plan-price span { font-size: 13px; font-weight: 500; color: var(--ink-soft); }
                .mb-home__plan-list { list-style: none; padding: 0; margin: 0 0 26px; flex-grow: 1; }
                .mb-home__plan-list li { display: flex; gap: 9px; font-size: 13.5px; color: var(--ink-soft); margin-bottom: 12px; align-items: flex-start; }
                .mb-home__plan-list li::before { content: '✓'; color: var(--green); font-weight: 700; flex-shrink: 0; }
                .mb-home__plan-btn {
                    width: 100%; padding: 12px; border-radius: 8px; font-weight: 700; font-size: 13.5px; cursor: pointer;
                    border: 1.5px solid var(--green); background: transparent; color: var(--green);
                }
                .mb-home__plan.featured .mb-home__plan-btn { background: var(--green); color: var(--surface); border-color: var(--green); }
                html.dark .mb-home__plan.featured .mb-home__plan-btn { color: var(--green-dark); }

                /* ---------- Footer ---------- */
                .mb-home__footer { border-top: 1px solid var(--line); padding: 56px 24px 28px; }
                .mb-home__footer-grid { max-width: 1180px; margin: 0 auto 40px; display: grid; gap: 32px; grid-template-columns: 1fr; }
                @media (min-width: 760px) { .mb-home__footer-grid { grid-template-columns: 1.4fr repeat(2, 1fr); } }
                .mb-home__footer-desc { font-size: 13.5px; color: var(--ink-soft); margin-top: 12px; max-width: 32ch; }
                .mb-home__footer h4 { font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; margin: 0 0 14px; color: var(--ink-soft); }
                .mb-home__footer ul { list-style: none; padding: 0; margin: 0; }
                .mb-home__footer li { margin-bottom: 10px; }
                .mb-home__footer a { color: var(--ink-soft); text-decoration: none; font-size: 13.5px; cursor: pointer; }
                .mb-home__footer a:hover { color: var(--green); }
                .mb-home__footer-bottom {
                    max-width: 1180px; margin: 0 auto; padding-top: 22px; border-top: 1px solid var(--line);
                    display: flex; flex-wrap: wrap; justify-content: space-between; gap: 12px;
                    font-size: 12px; color: var(--ink-soft);
                }
                .mb-home__status { display: flex; align-items: center; gap: 6px; }
                .mb-home__status-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--green); }

                /* ---------- Mobile bottom nav ---------- */
                .mb-home__bottom-nav {
                    display: flex; md:hidden; position: fixed; bottom: 0; left: 0; right: 0; z-index: 50;
                    background: var(--surface); border-top: 1px solid var(--line);
                    justify-content: space-around; align-items: center;
                    padding: 8px 12px calc(8px + env(safe-area-inset-bottom));
                }
                @media (min-width: 860px) { .mb-home__bottom-nav { display: none; } }
                .mb-home__bottom-nav a, .mb-home__bottom-nav .mb-home__bn-item {
                    display: flex; flex-direction: column; align-items: center; gap: 2px;
                    color: var(--ink-soft); font-size: 10.5px; text-decoration: none; cursor: pointer;
                    padding: 4px 14px; border-radius: 999px;
                }
                .mb-home__bottom-nav a.active { color: var(--green); background: var(--surface-2); font-weight: 700; }

                @media (min-width: 860px) { .mb-home__main { padding-bottom: 0; } }
                .mb-home__main { padding-bottom: 72px; }
                @media (min-width: 860px) { .mb-home__main { padding-bottom: 0; } }
            `}} />

            {/* Header */}
            <header className="mb-home__header">
                <div className="mb-home__header-inner">
                    <div className="mb-home__logo">
                        <span className="mb-home__logo-mark">Mb</span>
                        <span className="mb-home__logo-text">MaktabaBora</span>
                    </div>
                    <nav className="mb-home__nav">
                        <Link className="active" to="/">Home</Link>
                        <Link to="/explore">Catalogue</Link>
                        <Link to="/member">My Loans</Link>
                        <div onClick={handleProfileClick} className="mb-home__nav-item">Profile</div>
                    </nav>
                    <div className="mb-home__actions">
                        <button onClick={toggleDarkMode} className="mb-home__icon-btn" title="Toggle dark/light mode">
                            <Icon name={isDarkMode ? 'sun' : 'moon'} />
                        </button>
                        {user ? (
                            <div className="mb-home__actions">
                                <div onClick={handleProfileClick} className="mb-home__avatar">
                                    {user.name.substring(0, 2).toUpperCase()}
                                </div>
                                <button onClick={() => logout()} className="mb-home__icon-btn" title="Sign out">
                                    <Icon name="logout" />
                                </button>
                            </div>
                        ) : (
                            <Link to="/login" className="mb-home__login-btn">Log in</Link>
                        )}
                    </div>
                </div>
            </header>

            <main className="mb-home__main">
                {/* Hero */}
                <section className="hero-gradient">
                    <div className="mb-home__hero-inner">
                        <span className="mb-home__stamp-badge">Open today · 8am – 9pm</span>
                        <h1 className="mb-home__hero-title">
                            Borrow smarter.<br /><em>Return on time.</em>
                        </h1>
                        <p className="mb-home__hero-sub">
                            Search the university catalogue, see what's on the shelf right now, and reserve your copy.
                            No downloads — just the real book, waiting for you at the front desk.
                        </p>
                        <div className="mb-home__search">
                            <span style={{ display: 'flex', color: 'var(--ink-soft)' }}><Icon name="search" /></span>
                            <input placeholder="Search by title, author, or ISBN…" type="text" />
                            <button>Search catalogue</button>
                        </div>
                        <div className="mb-home__stats">
                            <div className="mb-home__stat">
                                <div className="mb-home__stat-num">12,400+</div>
                                <div className="mb-home__stat-label">Titles catalogued</div>
                            </div>
                            <div className="mb-home__stat">
                                <div className="mb-home__stat-num">3,150+</div>
                                <div className="mb-home__stat-label">Active members</div>
                            </div>
                            <div className="mb-home__stat">
                                <div className="mb-home__stat-num">48 hrs</div>
                                <div className="mb-home__stat-label">Reservation hold time</div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Ask Bora — rule-based chatbot */}
                <section className="mb-home__section">
                    <div className="mb-home__bora">
                        <div className="mb-home__bora-copy">
                            <div className="mb-home__bora-eyebrow">Ask Bora</div>
                            <h2 className="mb-home__bora-title">Quick answers, no queueing at the desk.</h2>
                            <p className="mb-home__bora-desc">
                                Bora answers the questions librarians get asked most: opening hours, loan limits,
                                fines, reservations, and what to do if a book's gone missing. Rule-based and always
                                accurate to current library policy — no guessing.
                            </p>
                            <div className="mb-home__bora-buttons">
                                <button className="mb-home__btn-primary" onClick={() => navigate('/chatbot')}>Ask Bora a question</button>
                                <button className="mb-home__btn-secondary" onClick={() => navigate('/help')}>Browse FAQs</button>
                            </div>
                        </div>
                        <div className="mb-home__bora-demo">
                            <div className="mb-home__chat-bubble">
                                <div className="mb-home__chat-row user">
                                    <div className="mb-home__chat-avatar">Q</div>
                                    <div>
                                        <p className="mb-home__chat-name">You</p>
                                        <p className="mb-home__chat-text">How long can I keep a book, and what if it's late?</p>
                                    </div>
                                </div>
                                <div className="mb-home__chat-row">
                                    <div className="mb-home__chat-avatar">B</div>
                                    <div>
                                        <p className="mb-home__chat-name">Bora</p>
                                        <p className="mb-home__chat-text">Standard loans run 14 days, renewable once if no one's reserved it. Overdue books accrue a small daily fine until returned.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* On the shelf now */}
                <section className="mb-home__section">
                    <div className="mb-home__section-head">
                        <div>
                            <h2 className="mb-home__section-title">On the shelf right now</h2>
                            <p className="mb-home__section-sub">Recommended for your programme, based on availability</p>
                        </div>
                        <button className="mb-home__view-all" onClick={() => navigate('/explore')}>View full catalogue →</button>
                    </div>
                    <div className="mb-home__shelf">
                        {shelfBooks.map((book, i) => (
                            <div key={i} className="mb-home__book" onClick={() => navigate('/explore')}>
                                <div className="mb-home__book-cover">
                                    <img src={book.img} alt={book.title} />
                                    <span className="mb-home__book-badge">{book.status}</span>
                                </div>
                                <h3 className="mb-home__book-title">{book.title}</h3>
                                <p className="mb-home__book-author">{book.author}</p>
                                <p className="mb-home__book-call">{book.callNumber}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Membership */}
                <section className="mb-home__section mb-home__membership">
                    <div className="mb-home__section-head" style={{ justifyContent: 'center', textAlign: 'center', flexDirection: 'column' }}>
                        <h2 className="mb-home__section-title">Become a member</h2>
                        <p className="mb-home__section-sub">A one-time registration fee activates your borrowing privileges, no monthly billing.</p>
                    </div>
                    <div className="mb-home__plans">
                        <div className="mb-home__plan">
                            <h3 className="mb-home__plan-name">Undergraduate</h3>
                            <div className="mb-home__plan-price">Ksh 500 <span>/ year</span></div>
                            <ul className="mb-home__plan-list">
                                <li>Borrow up to 3 books at a time</li>
                                <li>14-day loan period</li>
                                <li>Standard reservation queue</li>
                            </ul>
                            <button className="mb-home__plan-btn" onClick={() => navigate('/register')}>Register</button>
                        </div>
                        <div className="mb-home__plan featured">
                            <span className="mb-home__plan-tag">Most common</span>
                            <h3 className="mb-home__plan-name">Postgraduate &amp; Staff</h3>
                            <div className="mb-home__plan-price">Ksh 1,200 <span>/ year</span></div>
                            <ul className="mb-home__plan-list">
                                <li>Borrow up to 6 books at a time</li>
                                <li>21-day loan period</li>
                                <li>Priority reservation queue</li>
                                <li>Renewal reminders by email/SMS</li>
                            </ul>
                            <button className="mb-home__plan-btn" onClick={() => navigate('/register')}>Register</button>
                        </div>
                        <div className="mb-home__plan">
                            <h3 className="mb-home__plan-name">Department &amp; Alumni</h3>
                            <div className="mb-home__plan-price">Custom</div>
                            <ul className="mb-home__plan-list">
                                <li>Site membership for whole departments</li>
                                <li>Extended external-borrower access</li>
                                <li>Dedicated librarian contact</li>
                            </ul>
                            <button className="mb-home__plan-btn" onClick={() => navigate('/contact')}>Contact the library</button>
                        </div>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="mb-home__footer">
                <div className="mb-home__footer-grid">
                    <div>
                        <div className="mb-home__logo">
                            <span className="mb-home__logo-mark">Mb</span>
                            <span className="mb-home__logo-text">MaktabaBora</span>
                        </div>
                        <p className="mb-home__footer-desc">Digitizing how the university manages its physical library — borrowing, reservations, fines, and reports, all in one place.</p>
                    </div>
                    <div>
                        <h4>Library</h4>
                        <ul>
                            <li><a onClick={() => navigate('/explore')}>Catalogue</a></li>
                            <li><a onClick={() => navigate('/chatbot')}>Ask Bora</a></li>
                            <li><a onClick={() => navigate('/register')}>Membership</a></li>
                            <li><a onClick={() => navigate('/member')}>My loans &amp; reservations</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4>Support</h4>
                        <ul>
                            <li><a>Help centre</a></li>
                            <li><a>Borrowing &amp; fine policy</a></li>
                            <li><a>Lost book procedure</a></li>
                            <li><a>Contact the library</a></li>
                        </ul>
                    </div>
                </div>
                <div className="mb-home__footer-bottom">
                    <p>© 2026 MaktabaBora University Library.</p>
                    <span className="mb-home__status">
                        <span className="mb-home__status-dot"></span> System operational
                    </span>
                </div>
            </footer>

            {/* Mobile bottom nav */}
            <nav className="mb-home__bottom-nav">
                <Link className="active" to="/">
                    <Icon name="home" size={19} />
                    Home
                </Link>
                <Link to="/explore">
                    <Icon name="search" size={19} />
                    Search
                </Link>
                <Link to="/member">
                    <Icon name="book" size={19} />
                    My Books
                </Link>
                <div onClick={handleProfileClick} className="mb-home__bn-item">
                    <Icon name="person" size={19} />
                    Profile
                </div>
            </nav>
        </div>
    );
}
