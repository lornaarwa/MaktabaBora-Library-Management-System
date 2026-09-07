import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  LogIn,
  UserPlus,
  ShieldCheck,
  KeyRound,
  Mail,
  User as UserIcon,
  Loader2,
  AlertCircle,
  ArrowRight,
  Library,
  Sparkles,
  Bot,
  Compass,
  FileText,
  CheckCircle2,
  Sun,
  Moon,
  Bookmark,
  MapPin,
  Ticket,
  Receipt,
  Send,
  Check,
  ChevronRight,
  Star,
  Percent,
  Clock,
  RotateCcw,
  BookMarked,
  Layers,
  Search
} from 'lucide-react';
import { Brand } from '../components/ui/Brand';
import { BookCover } from '../components/ui/BookCover';
import { BookCardSkeleton } from '../components/ui/Skeleton';
import { api } from '../services/api';
import { cn } from '../lib/utils';

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, ease: 'easeOut' },
};

export default function Home() {
  const { user, login, register } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const authSectionRef = useRef(null);
  const tourSectionRef = useRef(null);

  // Next destination parameter support
  const intendedPath = () => {
    const next = new URLSearchParams(location.search).get('next');
    return next && next.startsWith('/') && !next.startsWith('//') ? next : null;
  };

  // Auth Mode: 'login' | 'register'
  const [mode, setMode] = useState(() => {
    const initialMode = new URLSearchParams(location.search).get('mode');
    return initialMode === 'register' ? 'register' : 'login';
  });

  // Auth Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Live catalogue preview
  const [featuredBooks, setFeaturedBooks] = useState([]);
  const [featuredLoading, setFeaturedLoading] = useState(true);

  // Interactive Onboarding Playground State
  const [activeTourTab, setActiveTourTab] = useState('ereader'); // 'ereader' | 'physical' | 'ai' | 'perks'

  // 1. E-Reader Simulator State
  const [readerTheme, setReaderTheme] = useState('sepia'); // 'day' | 'sepia' | 'night'
  const [readerFontSize, setReaderFontSize] = useState('md'); // 'sm' | 'md' | 'lg'
  const [readerPage, setReaderPage] = useState(1);
  const [readerMode, setReaderMode] = useState('paginated'); // 'paginated' | 'scroll'

  // 2. Physical Hold Simulator State
  const [holdReserved, setHoldReserved] = useState(false);
  const [holdQueuePos, setHoldQueuePos] = useState(1);

  // 3. AI Assistant Simulator State
  const [aiChatHistory, setAiChatHistory] = useState([
    {
      sender: 'ai',
      text: "Hello! I am your MaktabaBora AI Librarian. How can I assist your reading or research journey today?"
    }
  ]);
  const [aiTyping, setAiTyping] = useState(false);

  // 4. Perks Simulator State
  const [selectedTier, setSelectedTier] = useState('pro'); // 'free' | 'pro' | 'vip'
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.getBooks();
        const list = Array.isArray(res) ? res : res?.data || [];
        if (!cancelled) setFeaturedBooks(list.slice(0, 4));
      } catch (_) {
        // Fallback silently if offline or API unreachable
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

  const scrollToAuth = (targetMode = 'login') => {
    setMode(targetMode);
    setError(null);
    if (authSectionRef.current) {
      authSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const scrollToTour = () => {
    if (tourSectionRef.current) {
      tourSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const fillDemoCredentials = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setMode('login');
    setError(null);
    if (authSectionRef.current) {
      authSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

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
      setError(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // AI Simulator Prompt Handlers
  const handleAiPrompt = (promptText, replyText) => {
    if (aiTyping) return;
    setAiChatHistory(prev => [...prev, { sender: 'user', text: promptText }]);
    setAiTyping(true);

    setTimeout(() => {
      setAiChatHistory(prev => [...prev, { sender: 'ai', text: replyText }]);
      setAiTyping(false);
    }, 700);
  };

  // Sample book reader pages
  const readerPages = [
    {
      page: 1,
      title: "Chapter 1: The Modern Library",
      text: "Libraries are no longer passive repositories of paper; they are vibrant, connected intelligence networks. In the modern era, the reader transitions effortlessly from a physical desk to an in-browser digital scroll, carrying their bookmarks, annotations, and reading progress across devices seamlessly."
    },
    {
      page: 2,
      title: "Chapter 2: Shelf-to-Screen Synergy",
      text: "When a patron reserves a physical volume from our central stacks, automated shelf coordinates direct them to Rack 04, Shelf B. Meanwhile, our digital rental engine provides instantaneous preview access, ensuring that research and discovery never pause while in transit."
    },
    {
      page: 3,
      title: "Chapter 3: Artificial Intelligence at Your Desk",
      text: "MaktabaBora integrates contextual AI librarians capable of cross-referencing thousands of cataloged works. Whether seeking deep architectural paradigms or contemporary African literature, intelligent recommendations empower members to expand their horizons effortlessly."
    }
  ];

  return (
    <div className="min-h-screen bg-paper text-bark-900 pb-20">

      {/* =========================================================================
          GUEST TOP NAVIGATION BAR (High Visibility CTAs)
         ========================================================================= */}
      <header className="sticky top-0 z-40 w-full border-b border-bark-100/80 bg-paper/90 backdrop-blur-md transition-colors">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          
          {/* Logo & Identity */}
          <Link to="/" className="flex items-center gap-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-tan-dark/60 rounded-xl">
            <Brand variant="mark" className="h-11 w-11 rounded-xl shadow-card transition group-hover:scale-105" />
            <div className="flex flex-col">
              <span className="text-xl font-extrabold tracking-tight text-bark-900 dark:text-cream-light leading-none">
                Maktaba<span className="text-tan-dark">Bora</span>
              </span>
              <span className="font-mono text-[10px] uppercase tracking-widest text-bark-500 font-semibold mt-0.5">
                Smart Library System
              </span>
            </div>
          </Link>

          {/* Center Navigation Links */}
          <nav className="hidden md:flex items-center gap-6" aria-label="Guest Quick Links">
            <button
              onClick={scrollToTour}
              className="text-xs font-bold text-bark-600 hover:text-bark-900 dark:text-bark-300 dark:hover:text-cream-light transition flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-tan-dark" />
              Interactive Tour
            </button>
            <a
              href="#catalogue-preview"
              className="text-xs font-bold text-bark-600 hover:text-bark-900 dark:text-bark-300 dark:hover:text-cream-light transition"
            >
              Live Catalogue
            </a>
            <Link
              to="/about"
              className="text-xs font-bold text-bark-600 hover:text-bark-900 dark:text-bark-300 dark:hover:text-cream-light transition"
            >
              About
            </Link>
            <Link
              to="/contact"
              className="text-xs font-bold text-bark-600 hover:text-bark-900 dark:text-bark-300 dark:hover:text-cream-light transition"
            >
              Contact
            </Link>
          </nav>

          {/* Right Action Buttons: Theme Toggle & Prominent CTAs */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <button
              onClick={toggleTheme}
              type="button"
              className="p-2.5 rounded-xl border border-bark-100 bg-cream-light/50 hover:bg-cream dark:bg-bark-800 dark:border-bark-700 text-bark-700 dark:text-cream-light transition shadow-sm"
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label="Toggle dark mode"
            >
              {isDark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-bark-700" />}
            </button>

            {/* Clear, High-Visibility Login CTA */}
            <button
              onClick={() => scrollToAuth('login')}
              type="button"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-bark-200 dark:border-bark-700 bg-paper dark:bg-bark-800 hover:bg-cream-light/60 dark:hover:bg-bark-700 text-bark-900 dark:text-cream-light font-bold text-xs transition shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-tan-dark/60"
            >
              <LogIn className="w-3.5 h-3.5 text-bark-600 dark:text-bark-300" />
              <span>Log In</span>
            </button>

            {/* Clear, High-Visibility Register CTA */}
            <button
              onClick={() => scrollToAuth('register')}
              type="button"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-bark-700 hover:bg-bark-900 text-cream-light font-bold text-xs transition shadow-card hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-tan-dark/60"
            >
              <UserPlus className="w-3.5 h-3.5 text-tan" />
              <span>Register Free</span>
            </button>
          </div>
        </div>
      </header>

      {/* =========================================================================
          HERO SECTION (High Impact + Dual CTAs + Micro Stats)
         ========================================================================= */}
      <section className="relative overflow-hidden pt-12 pb-16 lg:pt-20 lg:pb-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Column: Value Proposition & Dual CTAs */}
            <motion.div
              {...fadeUp}
              className="lg:col-span-7 space-y-6 text-center lg:text-left"
            >
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cream-light/90 dark:bg-bark-800/90 border border-bark-200 dark:border-bark-700 text-bark-800 dark:text-bark-200 font-mono text-xs font-bold tracking-wide shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-tan-dark" />
                <span>Next-Gen Smart Library Experience</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-bark-900 dark:text-cream-light tracking-tight leading-[1.15]">
                Read Anywhere. <br />
                Borrow Physical. <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-tan-dark via-olive-dark to-bark-700 dark:from-tan dark:via-olive dark:to-tan-light">
                  Guided by AI.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-bark-600 dark:text-bark-300 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                MaktabaBora bridges digital freedom and physical library circulation. Stream e-books in your browser with our custom reader, reserve shelf copies with real-time queueing, and get instant recommendations from an AI assistant.
              </p>

              {/* Very Clear Action Station: Login and Registration CTAs */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5">
                <button
                  onClick={() => scrollToAuth('register')}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-bark-700 hover:bg-bark-900 text-cream-light font-bold text-sm shadow-card hover:shadow-lg transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-tan-dark/60 transform hover:-translate-y-0.5"
                >
                  <UserPlus className="w-4 h-4 text-tan" />
                  <span>Create Free Account</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </button>

                <button
                  onClick={() => scrollToAuth('login')}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl border-2 border-bark-200 dark:border-bark-700 bg-paper dark:bg-bark-800 hover:bg-cream dark:hover:bg-bark-700 text-bark-900 dark:text-cream-light font-bold text-sm shadow-sm transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-tan-dark/60"
                >
                  <LogIn className="w-4 h-4 text-bark-700 dark:text-bark-300" />
                  <span>Sign In to Your Account</span>
                </button>
              </div>

              {/* Interactive Tour Hint Button */}
              <div className="pt-1 flex items-center justify-center lg:justify-start gap-4 text-xs text-bark-500 dark:text-bark-400 font-medium">
                <button
                  onClick={scrollToTour}
                  className="inline-flex items-center gap-1.5 hover:text-bark-900 dark:hover:text-cream-light transition underline underline-offset-4"
                >
                  <Compass className="w-4 h-4 text-tan-dark" />
                  <span>Take the interactive tutorial below</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
                <span>•</span>
                <span>No credit card required</span>
              </div>

              {/* Micro stats strip */}
              <div className="pt-4 grid grid-cols-3 gap-3 max-w-md mx-auto lg:mx-0 border-t border-bark-100 dark:border-bark-800">
                <div className="space-y-0.5">
                  <p className="text-xl sm:text-2xl font-extrabold text-bark-900 dark:text-cream-light font-mono">10,000+</p>
                  <p className="text-[11px] text-bark-500 font-semibold uppercase tracking-wider">Titles in Catalog</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-xl sm:text-2xl font-extrabold text-tan-dark dark:text-tan font-mono">Instant</p>
                  <p className="text-[11px] text-bark-500 font-semibold uppercase tracking-wider">E-Reader Stream</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-xl sm:text-2xl font-extrabold text-olive-dark dark:text-olive font-mono">24/7</p>
                  <p className="text-[11px] text-bark-500 font-semibold uppercase tracking-wider">AI Librarian</p>
                </div>
              </div>
            </motion.div>

            {/* Right Column: Interactive Quick-Look Showcase Badge Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="lg:col-span-5"
            >
              <div className="relative mx-auto max-w-md rounded-3xl border border-bark-100 dark:border-bark-800 bg-paper dark:bg-bark-900/90 p-6 sm:p-7 shadow-card space-y-5">
                
                {/* Header of Quick Card */}
                <div className="flex items-center justify-between pb-3 border-b border-bark-100 dark:border-bark-800">
                  <div className="flex items-center gap-2.5">
                    <Brand variant="icon" className="h-9 w-9 rounded-xl shadow-sm" />
                    <div>
                      <p className="text-xs font-bold text-bark-900 dark:text-cream-light">MaktabaBora Live Tour</p>
                      <p className="text-[10px] text-bark-500 font-mono">Guest Mode Demo</p>
                    </div>
                  </div>
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono text-[10px] font-bold">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    ONLINE
                  </span>
                </div>

                {/* 4 Feature Snippets List */}
                <div className="space-y-2.5">
                  <button
                    onClick={() => { setActiveTourTab('ereader'); scrollToTour(); }}
                    className="w-full text-left p-3 rounded-xl border border-bark-100 dark:border-bark-800 hover:border-tan-dark dark:hover:border-tan bg-cream-light/40 dark:bg-bark-800/60 transition group flex items-start gap-3"
                  >
                    <div className="p-2 rounded-lg bg-tan/20 text-bark-900 dark:text-tan group-hover:scale-105 transition">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-bark-900 dark:text-cream-light flex items-center justify-between">
                        <span>1. Digital E-Reader</span>
                        <ChevronRight className="w-3.5 h-3.5 text-bark-400 group-hover:translate-x-0.5 transition" />
                      </p>
                      <p className="text-[11px] text-bark-500 truncate">Flip pages or continuous scroll with Sepia & Night modes</p>
                    </div>
                  </button>

                  <button
                    onClick={() => { setActiveTourTab('physical'); scrollToTour(); }}
                    className="w-full text-left p-3 rounded-xl border border-bark-100 dark:border-bark-800 hover:border-tan-dark dark:hover:border-tan bg-cream-light/40 dark:bg-bark-800/60 transition group flex items-start gap-3"
                  >
                    <div className="p-2 rounded-lg bg-olive/20 text-bark-900 dark:text-olive group-hover:scale-105 transition">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-bark-900 dark:text-cream-light flex items-center justify-between">
                        <span>2. Physical Shelf Holds</span>
                        <ChevronRight className="w-3.5 h-3.5 text-bark-400 group-hover:translate-x-0.5 transition" />
                      </p>
                      <p className="text-[11px] text-bark-500 truncate">Real-time rack & shelf locations + 1-click collection hold</p>
                    </div>
                  </button>

                  <button
                    onClick={() => { setActiveTourTab('ai'); scrollToTour(); }}
                    className="w-full text-left p-3 rounded-xl border border-bark-100 dark:border-bark-800 hover:border-tan-dark dark:hover:border-tan bg-cream-light/40 dark:bg-bark-800/60 transition group flex items-start gap-3"
                  >
                    <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 group-hover:scale-105 transition">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-bark-900 dark:text-cream-light flex items-center justify-between">
                        <span>3. Conversational AI Assistant</span>
                        <ChevronRight className="w-3.5 h-3.5 text-bark-400 group-hover:translate-x-0.5 transition" />
                      </p>
                      <p className="text-[11px] text-bark-500 truncate">Curated reading paths grounded strictly in our real catalog</p>
                    </div>
                  </button>

                  <button
                    onClick={() => { setActiveTourTab('perks'); scrollToTour(); }}
                    className="w-full text-left p-3 rounded-xl border border-bark-100 dark:border-bark-800 hover:border-tan-dark dark:hover:border-tan bg-cream-light/40 dark:bg-bark-800/60 transition group flex items-start gap-3"
                  >
                    <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 group-hover:scale-105 transition">
                      <Percent className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-bark-900 dark:text-cream-light flex items-center justify-between">
                        <span>4. Member Perks & Receipts</span>
                        <ChevronRight className="w-3.5 h-3.5 text-bark-400 group-hover:translate-x-0.5 transition" />
                      </p>
                      <p className="text-[11px] text-bark-500 truncate">20% digital discounts, tiered memberships, & verified slips</p>
                    </div>
                  </button>
                </div>

                {/* Quick Register Prompt */}
                <div className="p-3.5 rounded-2xl bg-bark-700 text-cream-light flex items-center justify-between shadow-sm">
                  <div className="text-left">
                    <p className="text-xs font-bold">Ready to start reading?</p>
                    <p className="text-[10px] text-cream/70">Join thousands of students and researchers</p>
                  </div>
                  <button
                    onClick={() => scrollToAuth('register')}
                    className="px-3 py-1.5 rounded-lg bg-tan text-bark-900 font-bold text-xs hover:bg-tan-light transition shadow-sm"
                  >
                    Sign Up
                  </button>
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* =========================================================================
          INTERACTIVE ONBOARDING HERO SECTION & TUTORIAL SNIPPETS ("Snip-bits")
         ========================================================================= */}
      <section
        ref={tourSectionRef}
        id="interactive-tour"
        className="py-16 sm:py-20 border-y border-bark-100 dark:border-bark-800 bg-cream-light/30 dark:bg-bark-900/40"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-10">
          
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-bark-700 text-cream-light font-mono text-[11px] font-bold uppercase tracking-wider shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-tan" /> Interactive Feature Tutorial
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-bark-900 dark:text-cream-light tracking-tight">
              Test Drive MaktabaBora Before Signing Up
            </h2>
            <p className="text-sm sm:text-base text-bark-600 dark:text-bark-300 leading-relaxed">
              Explore interactive snippets of our key modules below. Switch tabs, turn e-reader pages, test physical shelf holds, and chat with our simulated AI assistant!
            </p>
          </div>

          {/* Tutorial Tabs Bar */}
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 p-1.5 bg-paper dark:bg-bark-900 border border-bark-100 dark:border-bark-800 rounded-2xl max-w-3xl mx-auto shadow-sm">
            <button
              onClick={() => setActiveTourTab('ereader')}
              className={cn(
                'flex items-center gap-2 py-2.5 px-4 rounded-xl font-bold text-xs transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-tan-dark/60',
                activeTourTab === 'ereader'
                  ? 'bg-bark-700 text-cream-light shadow-card'
                  : 'text-bark-700 dark:text-bark-300 hover:bg-cream-light/60 dark:hover:bg-bark-800'
              )}
            >
              <BookOpen className="w-4 h-4" />
              <span>1. E-Reader Simulator</span>
            </button>

            <button
              onClick={() => setActiveTourTab('physical')}
              className={cn(
                'flex items-center gap-2 py-2.5 px-4 rounded-xl font-bold text-xs transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-tan-dark/60',
                activeTourTab === 'physical'
                  ? 'bg-bark-700 text-cream-light shadow-card'
                  : 'text-bark-700 dark:text-bark-300 hover:bg-cream-light/60 dark:hover:bg-bark-800'
              )}
            >
              <MapPin className="w-4 h-4" />
              <span>2. Shelf Holds Desk</span>
            </button>

            <button
              onClick={() => setActiveTourTab('ai')}
              className={cn(
                'flex items-center gap-2 py-2.5 px-4 rounded-xl font-bold text-xs transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-tan-dark/60',
                activeTourTab === 'ai'
                  ? 'bg-bark-700 text-cream-light shadow-card'
                  : 'text-bark-700 dark:text-bark-300 hover:bg-cream-light/60 dark:hover:bg-bark-800'
              )}
            >
              <Bot className="w-4 h-4" />
              <span>3. AI Assistant</span>
            </button>

            <button
              onClick={() => setActiveTourTab('perks')}
              className={cn(
                'flex items-center gap-2 py-2.5 px-4 rounded-xl font-bold text-xs transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-tan-dark/60',
                activeTourTab === 'perks'
                  ? 'bg-bark-700 text-cream-light shadow-card'
                  : 'text-bark-700 dark:text-bark-300 hover:bg-cream-light/60 dark:hover:bg-bark-800'
              )}
            >
              <Receipt className="w-4 h-4" />
              <span>4. Perks & Receipts</span>
            </button>
          </div>

          {/* =====================================================================
              MODULE 1: DIGITAL E-READER SIMULATOR SNIP-BIT
             ===================================================================== */}
          {activeTourTab === 'ereader' && (
            <motion.div
              key="tour-ereader"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-center"
            >
              {/* Left Explainer */}
              <div className="lg:col-span-5 space-y-4 text-left">
                <div className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-tan-dark dark:text-tan font-bold">
                  <BookMarked className="w-3.5 h-3.5" /> Module 01: In-Browser Reading
                </div>
                <h3 className="text-2xl font-extrabold text-bark-900 dark:text-cream-light">
                  Distraction-Free Reading, Built Right In
                </h3>
                <p className="text-xs sm:text-sm text-bark-600 dark:text-bark-300 leading-relaxed">
                  No third-party plugins or downloads needed. Our reader supports multiple color themes (Day, Sepia, Night), dynamic typographic scaling, and page flipping or smooth continuous scroll.
                </p>

                <div className="space-y-2 pt-2 text-xs text-bark-700 dark:text-bark-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Automatic reading progress & chapter bookmarks</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Instant offline caching for verified members</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Stream both licensed e-books and open textbooks</span>
                  </div>
                </div>

                <div className="pt-3">
                  <button
                    onClick={() => scrollToAuth('register')}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-bark-700 hover:bg-bark-900 text-cream-light font-bold text-xs shadow-card transition"
                  >
                    <span>Read Full Books as Member</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Right Interactive Simulator Card */}
              <div className="lg:col-span-7">
                <div className="rounded-2xl border border-bark-200 dark:border-bark-700 bg-paper dark:bg-bark-900 shadow-card overflow-hidden">
                  
                  {/* Simulator Top Controls Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-cream-light/60 dark:bg-bark-800 border-b border-bark-100 dark:border-bark-700">
                    
                    {/* Theme Selector */}
                    <div className="flex items-center gap-1 bg-paper dark:bg-bark-900 p-1 rounded-lg border border-bark-200 dark:border-bark-700">
                      <button
                        onClick={() => setReaderTheme('day')}
                        className={cn(
                          'px-2 py-1 rounded text-[10px] font-bold transition',
                          readerTheme === 'day' ? 'bg-cream text-bark-900 shadow-sm' : 'text-bark-500 hover:text-bark-900'
                        )}
                      >
                        Day
                      </button>
                      <button
                        onClick={() => setReaderTheme('sepia')}
                        className={cn(
                          'px-2 py-1 rounded text-[10px] font-bold transition',
                          readerTheme === 'sepia' ? 'bg-[#e8dcb8] text-[#5b4636] shadow-sm' : 'text-bark-500 hover:text-bark-900'
                        )}
                      >
                        Sepia
                      </button>
                      <button
                        onClick={() => setReaderTheme('night')}
                        className={cn(
                          'px-2 py-1 rounded text-[10px] font-bold transition',
                          readerTheme === 'night' ? 'bg-bark-900 text-cream shadow-sm' : 'text-bark-500 hover:text-bark-900'
                        )}
                      >
                        Night
                      </button>
                    </div>

                    {/* Font Size Toggle */}
                    <div className="flex items-center gap-1 bg-paper dark:bg-bark-900 p-1 rounded-lg border border-bark-200 dark:border-bark-700">
                      <button
                        onClick={() => setReaderFontSize('sm')}
                        className={cn('px-2 py-1 rounded text-[10px] font-bold', readerFontSize === 'sm' ? 'bg-bark-700 text-cream' : 'text-bark-500')}
                      >
                        A-
                      </button>
                      <button
                        onClick={() => setReaderFontSize('md')}
                        className={cn('px-2 py-1 rounded text-[10px] font-bold', readerFontSize === 'md' ? 'bg-bark-700 text-cream' : 'text-bark-500')}
                      >
                        A
                      </button>
                      <button
                        onClick={() => setReaderFontSize('lg')}
                        className={cn('px-2 py-1 rounded text-[10px] font-bold', readerFontSize === 'lg' ? 'bg-bark-700 text-cream' : 'text-bark-500')}
                      >
                        A+
                      </button>
                    </div>

                    {/* Mode Toggle */}
                    <button
                      onClick={() => setReaderMode(m => m === 'paginated' ? 'scroll' : 'paginated')}
                      className="px-2.5 py-1 rounded-lg border border-bark-200 dark:border-bark-700 bg-paper dark:bg-bark-900 text-[10px] font-bold text-bark-700 dark:text-bark-300 hover:bg-cream transition"
                    >
                      {readerMode === 'paginated' ? '📖 Flip Mode' : '📜 Scroll Mode'}
                    </button>
                  </div>

                  {/* Simulator Reading Stage */}
                  <div
                    className={cn(
                      'p-6 sm:p-8 min-h-[260px] transition-colors flex flex-col justify-between',
                      readerTheme === 'day' && 'bg-[#fcfaf7] text-bark-900',
                      readerTheme === 'sepia' && 'bg-[#f5ebd6] text-[#4a3b2c]',
                      readerTheme === 'night' && 'bg-[#18181b] text-[#e4e4e7]'
                    )}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between opacity-70 border-b pb-2 border-current/20">
                        <span className="text-[10px] font-mono uppercase tracking-wider">
                          The Smart Library Reader • v2.4
                        </span>
                        <span className="text-[10px] font-mono">
                          Page {readerPage} of {readerPages.length}
                        </span>
                      </div>

                      <h4 className="font-serif font-bold text-base sm:text-lg">
                        {readerPages[readerPage - 1].title}
                      </h4>

                      <p
                        className={cn(
                          'leading-relaxed font-serif',
                          readerFontSize === 'sm' && 'text-xs',
                          readerFontSize === 'md' && 'text-sm',
                          readerFontSize === 'lg' && 'text-base'
                        )}
                      >
                        {readerPages[readerPage - 1].text}
                      </p>
                    </div>

                    {/* Simulator Bottom Page Controls */}
                    <div className="pt-4 mt-4 border-t border-current/20 flex items-center justify-between text-xs font-sans">
                      <button
                        onClick={() => setReaderPage(p => Math.max(1, p - 1))}
                        disabled={readerPage === 1}
                        className="px-3 py-1.5 rounded-lg border border-current/30 disabled:opacity-30 hover:bg-current/10 transition font-bold"
                      >
                        ← Prev Page
                      </button>
                      <div className="flex items-center gap-1.5">
                        {[1, 2, 3].map(p => (
                          <button
                            key={p}
                            onClick={() => setReaderPage(p)}
                            className={cn(
                              'h-2 rounded-full transition-all',
                              readerPage === p ? 'w-6 bg-current' : 'w-2 bg-current/30'
                            )}
                            aria-label={`Go to page ${p}`}
                          />
                        ))}
                      </div>
                      <button
                        onClick={() => setReaderPage(p => Math.min(readerPages.length, p + 1))}
                        disabled={readerPage === readerPages.length}
                        className="px-3 py-1.5 rounded-lg border border-current/30 disabled:opacity-30 hover:bg-current/10 transition font-bold"
                      >
                        Next Page →
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* =====================================================================
              MODULE 2: PHYSICAL CATALOG & SHELF HOLDS SNIP-BIT
             ===================================================================== */}
          {activeTourTab === 'physical' && (
            <motion.div
              key="tour-physical"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-center"
            >
              {/* Left Explainer */}
              <div className="lg:col-span-5 space-y-4 text-left">
                <div className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-olive-dark dark:text-olive font-bold">
                  <MapPin className="w-3.5 h-3.5" /> Module 02: Physical Circulation
                </div>
                <h3 className="text-2xl font-extrabold text-bark-900 dark:text-cream-light">
                  Reserve Real Books from Real Shelves
                </h3>
                <p className="text-xs sm:text-sm text-bark-600 dark:text-bark-300 leading-relaxed">
                  Every physical copy in our collection has a precise campus location — floor, aisle, rack, and shelf call number. Members can place an instant hold and pick it up at the circulation desk within 48 hours.
                </p>

                <div className="space-y-2 pt-2 text-xs text-bark-700 dark:text-bark-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Real-time copy availability counter</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Automated queue position calculation</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Printable or mobile collection voucher</span>
                  </div>
                </div>

                <div className="pt-3">
                  <button
                    onClick={() => scrollToAuth('register')}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-bark-700 hover:bg-bark-900 text-cream-light font-bold text-xs shadow-card transition"
                  >
                    <span>Reserve Physical Copies Now</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Right Interactive Simulator Card */}
              <div className="lg:col-span-7">
                <div className="rounded-2xl border border-bark-200 dark:border-bark-700 bg-paper dark:bg-bark-900 p-6 shadow-card space-y-5">
                  
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="px-2.5 py-0.5 rounded-full bg-cream-light dark:bg-bark-800 border border-bark-200 dark:border-bark-700 text-[10px] font-mono font-bold text-bark-600 dark:text-bark-300">
                        SAMPLE CATALOG ENTRY
                      </span>
                      <h4 className="text-base font-extrabold text-bark-900 dark:text-cream-light mt-1">
                        Clean Architecture: A Craftsman's Guide
                      </h4>
                      <p className="text-xs text-bark-500">By Robert C. Martin • Software Engineering</p>
                    </div>
                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-mono text-xs font-bold">
                      <Check className="w-3.5 h-3.5" /> 2 Available on Shelf
                    </span>
                  </div>

                  {/* Real-time Shelf Locator Map Mockup */}
                  <div className="p-4 rounded-xl bg-cream-light/60 dark:bg-bark-800/80 border border-bark-100 dark:border-bark-700 space-y-2.5">
                    <p className="text-[10px] font-mono uppercase tracking-widest text-bark-500 font-bold flex items-center gap-1.5">
                      <Compass className="w-3.5 h-3.5 text-tan-dark" /> Physical Coordinates
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                      <div className="p-2 rounded-lg bg-paper dark:bg-bark-900 border border-bark-100 dark:border-bark-700">
                        <p className="text-[10px] text-bark-400 font-mono">Floor</p>
                        <p className="text-xs font-bold text-bark-900 dark:text-cream-light">2nd Floor</p>
                      </div>
                      <div className="p-2 rounded-lg bg-paper dark:bg-bark-900 border border-bark-100 dark:border-bark-700">
                        <p className="text-[10px] text-bark-400 font-mono">Aisle</p>
                        <p className="text-xs font-bold text-bark-900 dark:text-cream-light">Aisle 04</p>
                      </div>
                      <div className="p-2 rounded-lg bg-paper dark:bg-bark-900 border border-bark-100 dark:border-bark-700">
                        <p className="text-[10px] text-bark-400 font-mono">Rack / Shelf</p>
                        <p className="text-xs font-bold text-bark-900 dark:text-cream-light">Rack 3 · Shelf B2</p>
                      </div>
                      <div className="p-2 rounded-lg bg-paper dark:bg-bark-900 border border-bark-100 dark:border-bark-700">
                        <p className="text-[10px] text-bark-400 font-mono">Call No.</p>
                        <p className="text-xs font-bold text-bark-900 dark:text-cream-light font-mono">QA76.76.R6</p>
                      </div>
                    </div>
                  </div>

                  {/* Hold Simulation Action */}
                  {!holdReserved ? (
                    <div className="space-y-3 pt-1">
                      <button
                        onClick={() => {
                          setHoldReserved(true);
                          setHoldQueuePos(1);
                        }}
                        type="button"
                        className="w-full py-3 px-4 rounded-xl bg-bark-700 hover:bg-bark-900 text-cream-light font-bold text-xs shadow-card flex items-center justify-center gap-2 transition"
                      >
                        <Ticket className="w-4 h-4 text-tan" />
                        <span>Simulate "Reserve for Physical Collection"</span>
                      </button>
                      <p className="text-[11px] text-center text-bark-500">
                        Click the button above to test how our reservation engine operates!
                      </p>
                    </div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          Hold Confirmed! Queue Position #{holdQueuePos}
                        </span>
                        <span className="font-mono text-[10px] text-emerald-700 dark:text-emerald-400 font-bold">
                          HOLD #MB-9821
                        </span>
                      </div>

                      <div className="text-xs text-bark-700 dark:text-bark-300 space-y-1 bg-paper/80 dark:bg-bark-900/80 p-3 rounded-lg border border-emerald-500/20">
                        <p className="flex items-center justify-between">
                          <span className="text-bark-500">Pickup Location:</span>
                          <span className="font-bold">Desk A · Central Library</span>
                        </p>
                        <p className="flex items-center justify-between">
                          <span className="text-bark-500">Hold Expiry Window:</span>
                          <span className="font-bold">48 Hours from issuance</span>
                        </p>
                        <p className="flex items-center justify-between">
                          <span className="text-bark-500">Status:</span>
                          <span className="font-mono text-emerald-600 font-bold">READY_FOR_PICKUP</span>
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <button
                          onClick={() => setHoldReserved(false)}
                          className="text-[11px] font-bold text-bark-500 hover:text-bark-700 dark:hover:text-cream-light flex items-center gap-1"
                        >
                          <RotateCcw className="w-3 h-3" /> Reset Demo
                        </button>
                        <button
                          onClick={() => scrollToAuth('register')}
                          className="text-[11px] font-bold text-bark-900 dark:text-cream-light underline"
                        >
                          Sign up to reserve real books →
                        </button>
                      </div>
                    </motion.div>
                  )}

                </div>
              </div>
            </motion.div>
          )}

          {/* =====================================================================
              MODULE 3: INTELLIGENT AI LIBRARY ASSISTANT SNIP-BIT
             ===================================================================== */}
          {activeTourTab === 'ai' && (
            <motion.div
              key="tour-ai"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-center"
            >
              {/* Left Explainer */}
              <div className="lg:col-span-5 space-y-4 text-left">
                <div className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-indigo-600 dark:text-indigo-400 font-bold">
                  <Bot className="w-3.5 h-3.5" /> Module 03: AI Research Companion
                </div>
                <h3 className="text-2xl font-extrabold text-bark-900 dark:text-cream-light">
                  An AI Librarian Grounded in Real Catalog Data
                </h3>
                <p className="text-xs sm:text-sm text-bark-600 dark:text-bark-300 leading-relaxed">
                  Unlike generic bots, MaktabaBora's AI assistant is strictly connected to our actual inventory. It can recommend related reads, summarize complex chapters, and explain borrowing rules in seconds.
                </p>

                <div className="space-y-2 pt-2 text-xs text-bark-700 dark:text-bark-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Cross-references author, genre, and shelf status</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Gives exact shelf coordinates and availability</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Provides custom study plans and syllabi reading lists</span>
                  </div>
                </div>

                <div className="pt-3">
                  <button
                    onClick={() => scrollToAuth('register')}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-bark-700 hover:bg-bark-900 text-cream-light font-bold text-xs shadow-card transition"
                  >
                    <span>Unlock Full AI Assistant</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Right Interactive Simulator Card */}
              <div className="lg:col-span-7">
                <div className="rounded-2xl border border-bark-200 dark:border-bark-700 bg-paper dark:bg-bark-900 shadow-card flex flex-col h-[380px] overflow-hidden">
                  
                  {/* Chat Header */}
                  <div className="flex items-center justify-between p-3.5 bg-cream-light/60 dark:bg-bark-800 border-b border-bark-100 dark:border-bark-700">
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                        <Bot className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-bark-900 dark:text-cream-light">MaktabaBora AI Assistant</p>
                        <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">Catalog Knowledge: Live</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setAiChatHistory([{ sender: 'ai', text: "Hello! I am your MaktabaBora AI Librarian. How can I assist your reading or research journey today?" }])}
                      title="Clear chat"
                      className="p-1.5 rounded-lg hover:bg-cream dark:hover:bg-bark-700 text-bark-400 hover:text-bark-700 transition"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Chat Messages Body */}
                  <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs">
                    {aiChatHistory.map((msg, idx) => (
                      <div
                        key={idx}
                        className={cn(
                          'flex items-start gap-2 max-w-[85%]',
                          msg.sender === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
                        )}
                      >
                        <div
                          className={cn(
                            'p-1.5 rounded-lg text-xs flex-shrink-0',
                            msg.sender === 'user' ? 'bg-bark-700 text-cream-light' : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                          )}
                        >
                          {msg.sender === 'user' ? <UserIcon className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                        </div>
                        <div
                          className={cn(
                            'p-3 rounded-2xl leading-relaxed shadow-sm',
                            msg.sender === 'user'
                              ? 'bg-bark-700 text-cream-light rounded-tr-none'
                              : 'bg-cream-light/60 dark:bg-bark-800 text-bark-900 dark:text-cream-light rounded-tl-none border border-bark-100 dark:border-bark-700'
                          )}
                        >
                          {msg.text}
                        </div>
                      </div>
                    ))}

                    {aiTyping && (
                      <div className="flex items-center gap-2 text-bark-400 text-xs italic">
                        <Bot className="w-3.5 h-3.5 animate-pulse text-indigo-500" />
                        <span>MaktabaBora AI is searching the catalog...</span>
                      </div>
                    )}
                  </div>

                  {/* Interactive Prompt Pills */}
                  <div className="p-3 bg-cream-light/40 dark:bg-bark-800/80 border-t border-bark-100 dark:border-bark-700 space-y-2">
                    <p className="text-[10px] font-mono uppercase tracking-widest text-bark-400 font-bold">
                      Click a sample prompt to simulate:
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        onClick={() => handleAiPrompt(
                          "Recommend a great book on System Architecture",
                          "I recommend 'Clean Architecture' by Robert C. Martin and 'Designing Data-Intensive Applications' by Martin Kleppmann. Both are currently available for digital reading and physical shelf borrowing in Section A, Floor 2!"
                        )}
                        className="px-2.5 py-1 rounded-lg border border-bark-200 dark:border-bark-700 bg-paper dark:bg-bark-900 text-[11px] font-medium text-bark-700 dark:text-bark-300 hover:bg-cream transition"
                      >
                        💡 Architecture books
                      </button>

                      <button
                        onClick={() => handleAiPrompt(
                          "How long can I borrow physical books for?",
                          "Standard members can borrow physical copies for 14 days with up to 2 renewals. Pro & VIP members enjoy a 28-day window with automatic renewal reminders!"
                        )}
                        className="px-2.5 py-1 rounded-lg border border-bark-200 dark:border-bark-700 bg-paper dark:bg-bark-900 text-[11px] font-medium text-bark-700 dark:text-bark-300 hover:bg-cream transition"
                      >
                        ⏱️ Borrowing periods
                      </button>

                      <button
                        onClick={() => handleAiPrompt(
                          "Are digital books discounted for subscribers?",
                          "Yes! Active Scholar Pro and Patron VIP subscribers receive an automatic 20% discount on all digital e-book purchases at checkout."
                        )}
                        className="px-2.5 py-1 rounded-lg border border-bark-200 dark:border-bark-700 bg-paper dark:bg-bark-900 text-[11px] font-medium text-bark-700 dark:text-bark-300 hover:bg-cream transition"
                      >
                        🏷️ 20% Subscriber perks
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            </motion.div>
          )}

          {/* =====================================================================
              MODULE 4: MEMBER PERKS & RECEIPTS SNIP-BIT
             ===================================================================== */}
          {activeTourTab === 'perks' && (
            <motion.div
              key="tour-perks"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-center"
            >
              {/* Left Explainer */}
              <div className="lg:col-span-5 space-y-4 text-left">
                <div className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-amber-600 dark:text-amber-400 font-bold">
                  <Receipt className="w-3.5 h-3.5" /> Module 04: Tiered Perks & Transparency
                </div>
                <h3 className="text-2xl font-extrabold text-bark-900 dark:text-cream-light">
                  Member Discounts & Verified Official Receipts
                </h3>
                <p className="text-xs sm:text-sm text-bark-600 dark:text-bark-300 leading-relaxed">
                  Every transaction produces an authentic printable receipt with reference verification. Active subscribers enjoy 20% savings on digital titles and priority queues for physical holdings.
                </p>

                <div className="space-y-2 pt-2 text-xs text-bark-700 dark:text-bark-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Free Standard tier for all registered students</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Instant MPESA Daraja integration for easy checkout</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Downloadable PDF receipts with transaction hashes</span>
                  </div>
                </div>

                <div className="pt-3">
                  <button
                    onClick={() => scrollToAuth('register')}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-bark-700 hover:bg-bark-900 text-cream-light font-bold text-xs shadow-card transition"
                  >
                    <span>Claim Your Membership</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Right Interactive Simulator Card */}
              <div className="lg:col-span-7">
                <div className="rounded-2xl border border-bark-200 dark:border-bark-700 bg-paper dark:bg-bark-900 p-6 shadow-card space-y-5">
                  
                  {/* Tier Selector Bar */}
                  <div className="space-y-2">
                    <p className="text-[10px] font-mono uppercase tracking-widest text-bark-500 font-bold">
                      Select Membership Tier to preview perks:
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => setSelectedTier('free')}
                        className={cn(
                          'p-2.5 rounded-xl border text-left transition',
                          selectedTier === 'free'
                            ? 'border-bark-700 bg-bark-700 text-cream-light shadow-sm'
                            : 'border-bark-200 dark:border-bark-700 bg-cream-light/30 dark:bg-bark-800 text-bark-900 dark:text-cream-light'
                        )}
                      >
                        <p className="text-xs font-bold">Standard</p>
                        <p className="text-[10px] opacity-80">Free Forever</p>
                      </button>

                      <button
                        onClick={() => setSelectedTier('pro')}
                        className={cn(
                          'p-2.5 rounded-xl border text-left transition',
                          selectedTier === 'pro'
                            ? 'border-bark-700 bg-bark-700 text-cream-light shadow-sm'
                            : 'border-bark-200 dark:border-bark-700 bg-cream-light/30 dark:bg-bark-800 text-bark-900 dark:text-cream-light'
                        )}
                      >
                        <p className="text-xs font-bold flex items-center justify-between">
                          <span>Scholar Pro</span>
                          <span className="text-[9px] px-1 py-0.2 bg-tan text-bark-900 rounded font-mono font-bold">20% OFF</span>
                        </p>
                        <p className="text-[10px] opacity-80">KES 500 / month</p>
                      </button>

                      <button
                        onClick={() => setSelectedTier('vip')}
                        className={cn(
                          'p-2.5 rounded-xl border text-left transition',
                          selectedTier === 'vip'
                            ? 'border-bark-700 bg-bark-700 text-cream-light shadow-sm'
                            : 'border-bark-200 dark:border-bark-700 bg-cream-light/30 dark:bg-bark-800 text-bark-900 dark:text-cream-light'
                        )}
                      >
                        <p className="text-xs font-bold">Patron VIP</p>
                        <p className="text-[10px] opacity-80">KES 4,500 / year</p>
                      </button>
                    </div>
                  </div>

                  {/* Dynamic Pricing & Savings Calculator */}
                  <div className="p-4 rounded-xl bg-cream-light/60 dark:bg-bark-800/80 border border-bark-100 dark:border-bark-700 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-bark-900 dark:text-cream-light">
                        Sample E-Book Purchase: "Modern Database Design"
                      </span>
                      <span className="font-mono text-xs text-bark-500 line-through">KES 850</span>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1 border-t border-bark-200 dark:border-bark-700">
                      <span className="text-bark-600 dark:text-bark-300">
                        {selectedTier === 'free' ? 'Standard Member Price:' : 'Subscriber Discount Price (20% OFF):'}
                      </span>
                      <span className="text-base font-extrabold text-bark-900 dark:text-cream-light font-mono">
                        {selectedTier === 'free' ? 'KES 850' : 'KES 680'}
                      </span>
                    </div>

                    {selectedTier !== 'free' && (
                      <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> You save KES 170 on this single title!
                      </p>
                    )}
                  </div>

                  {/* Sample Receipt Generator Preview */}
                  <div className="p-4 rounded-xl border border-dashed border-bark-300 dark:border-bark-700 bg-paper dark:bg-bark-900 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] text-bark-500 uppercase tracking-wider">
                        OFFICIAL TRANSACTION RECEIPT #MB-2026-8894
                      </span>
                      <span className="text-[10px] font-bold text-emerald-600">VERIFIED</span>
                    </div>
                    <div className="text-xs font-mono text-bark-600 dark:text-bark-300 space-y-1">
                      <p>Date: {new Date().toLocaleDateString()} | Method: MPESA STK Push</p>
                      <p>Reference: QDF892KL91 | MaktabaBora Circulation Auth</p>
                    </div>
                  </div>

                </div>
              </div>
            </motion.div>
          )}

        </div>
      </section>

      {/* =========================================================================
          MAIN AUTH SELECTION STATION (Very Clear Login & Registration Forms)
         ========================================================================= */}
      <section
        ref={authSectionRef}
        id="auth-station"
        className="py-16 sm:py-20 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"
      >
        <div className="max-w-xl mx-auto space-y-8">
          
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cream-light dark:bg-bark-800 border border-bark-200 dark:border-bark-700 text-bark-700 dark:text-bark-300 font-mono text-[11px] font-bold uppercase tracking-wider">
              <KeyRound className="w-3.5 h-3.5 text-tan-dark" /> Member Authentication Desk
            </div>
            <h2 className="text-3xl font-extrabold text-bark-900 dark:text-cream-light tracking-tight">
              {mode === 'login' ? 'Sign In to Your Library Account' : 'Create Your Free Library Account'}
            </h2>
            <p className="text-xs sm:text-sm text-bark-500 dark:text-bark-400">
              {mode === 'login'
                ? 'Access your borrowed books, active holds, cart, and personalized reading shelf.'
                : 'Join MaktabaBora today to unlock digital streaming and physical circulation.'}
            </p>
          </div>

          {/* Distinct 2-Option Selector Tabs: Login vs Register */}
          <div className="grid grid-cols-2 gap-3 p-1.5 bg-cream-light/60 dark:bg-bark-800/80 border border-bark-200 dark:border-bark-700 rounded-2xl shadow-sm">
            <button
              type="button"
              onClick={() => { setMode('login'); setError(null); }}
              className={cn(
                'flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-xs transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-tan-dark/60',
                mode === 'login'
                  ? 'bg-bark-700 text-cream-light shadow-card'
                  : 'text-bark-700 dark:text-bark-300 hover:bg-paper/80 dark:hover:bg-bark-700'
              )}
            >
              <LogIn className="w-4 h-4" />
              <span>1. Sign In</span>
            </button>

            <button
              type="button"
              onClick={() => { setMode('register'); setError(null); }}
              className={cn(
                'flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-xs transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-tan-dark/60',
                mode === 'register'
                  ? 'bg-bark-700 text-cream-light shadow-card'
                  : 'text-bark-700 dark:text-bark-300 hover:bg-paper/80 dark:hover:bg-bark-700'
              )}
            >
              <UserPlus className="w-4 h-4" />
              <span>2. Register Account</span>
            </button>
          </div>

          {/* Form Container Card */}
          <div className="rounded-3xl border border-bark-100 dark:border-bark-800 bg-paper dark:bg-bark-900 p-6 sm:p-8 shadow-card space-y-6">
            
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {mode === 'register' && (
                <div>
                  <label htmlFor="home-name" className="block text-xs font-semibold text-bark-700 dark:text-bark-300 mb-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-bark-400 absolute left-3.5 top-3.5" />
                    <input
                      id="home-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Jane Wanjiku"
                      required
                      className="w-full bg-paper dark:bg-bark-800 border border-bark-200 dark:border-bark-700 rounded-xl pl-10 pr-3 py-3 text-xs text-bark-900 dark:text-cream-light focus:outline-none focus:border-bark-500 focus:ring-2 focus:ring-tan-dark/50"
                    />
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="home-email" className="block text-xs font-semibold text-bark-700 dark:text-bark-300 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-bark-400 absolute left-3.5 top-3.5" />
                  <input
                    id="home-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@example.com"
                    required
                    className="w-full bg-paper dark:bg-bark-800 border border-bark-200 dark:border-bark-700 rounded-xl pl-10 pr-3 py-3 text-xs text-bark-900 dark:text-cream-light focus:outline-none focus:border-bark-500 focus:ring-2 focus:ring-tan-dark/50"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="home-password" className="block text-xs font-semibold text-bark-700 dark:text-bark-300 mb-1">
                  Password
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-bark-400 absolute left-3.5 top-3.5" />
                  <input
                    id="home-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full bg-paper dark:bg-bark-800 border border-bark-200 dark:border-bark-700 rounded-xl pl-10 pr-3 py-3 text-xs text-bark-900 dark:text-cream-light focus:outline-none focus:border-bark-500 focus:ring-2 focus:ring-tan-dark/50"
                  />
                </div>
              </div>

              {mode === 'login' && (
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-bark-600 dark:text-bark-300">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-bark-300 text-bark-700 focus:ring-tan-dark"
                    />
                    <span>Remember me on this browser</span>
                  </label>
                  <Link to="/contact" className="text-xs text-bark-500 hover:text-bark-700 dark:hover:text-cream-light">
                    Need help?
                  </Link>
                </div>
              )}

              {error && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-400 text-xs flex items-center gap-2" role="alert">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-bark-700 hover:bg-bark-900 text-cream-light font-bold text-xs shadow-card transition-all flex items-center justify-center gap-2 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-tan-dark/60 transform hover:-translate-y-0.5"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-cream-light" />
                ) : (
                  <>
                    <span>{mode === 'login' ? 'Sign In to Dashboard' : 'Complete Free Registration'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo Credentials Assistant (For instant testing/review) */}
            <div className="pt-4 border-t border-bark-100 dark:border-bark-800 space-y-2.5">
              <p className="text-[10px] font-mono uppercase tracking-widest text-bark-500 font-bold text-center">
                Quick Test Credentials (Click to Auto-Fill):
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => fillDemoCredentials('member@maktababora.org', 'password123')}
                  className="p-2 rounded-xl border border-bark-100 dark:border-bark-800 bg-cream-light/40 dark:bg-bark-800 text-left hover:border-tan-dark transition"
                >
                  <p className="text-[11px] font-bold text-bark-900 dark:text-cream-light">Member</p>
                  <p className="text-[9px] text-bark-500 truncate font-mono">member@maktababora.org</p>
                </button>

                <button
                  type="button"
                  onClick={() => fillDemoCredentials('librarian@maktababora.org', 'password123')}
                  className="p-2 rounded-xl border border-bark-100 dark:border-bark-800 bg-cream-light/40 dark:bg-bark-800 text-left hover:border-tan-dark transition"
                >
                  <p className="text-[11px] font-bold text-bark-900 dark:text-cream-light">Librarian</p>
                  <p className="text-[9px] text-bark-500 truncate font-mono">librarian@maktababora.org</p>
                </button>

                <button
                  type="button"
                  onClick={() => fillDemoCredentials('admin@maktababora.org', 'password123')}
                  className="p-2 rounded-xl border border-bark-100 dark:border-bark-800 bg-cream-light/40 dark:bg-bark-800 text-left hover:border-tan-dark transition"
                >
                  <p className="text-[11px] font-bold text-bark-900 dark:text-cream-light">Admin</p>
                  <p className="text-[9px] text-bark-500 truncate font-mono">admin@maktababora.org</p>
                </button>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* =========================================================================
          LIVE CATALOGUE PREVIEW SECTION (Real Books from API)
         ========================================================================= */}
      <section
        id="catalogue-preview"
        className="py-16 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8"
        aria-label="Preview of the MaktabaBora catalogue"
      >
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-bark-100 dark:border-bark-800 pb-5">
          <div className="space-y-1.5">
            <p className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-tan-dark font-bold">
              <Library className="h-3.5 w-3.5" /> The Public Inventory
            </p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-bark-900 dark:text-cream-light tracking-tight">
              Featured Titles in the Stacks
            </h2>
            <p className="text-xs sm:text-sm text-bark-600 dark:text-bark-300 max-w-xl leading-relaxed">
              Explore a live snapshot of books available for physical checkout and digital e-reading. Sign in to search the full catalog or place holds.
            </p>
          </div>
          
          <button
            onClick={() => scrollToAuth('login')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-bark-700 hover:bg-bark-900 text-cream-light font-bold text-xs shadow-card transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-tan-dark/60"
          >
            <span>Log In to View All Books</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {featuredLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-5" aria-busy="true">
            {[0, 1, 2, 3].map((i) => (
              <BookCardSkeleton key={i} />
            ))}
          </div>
        ) : featuredBooks.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-5">
            {featuredBooks.map((book, i) => (
              <motion.article
                key={book.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.05, duration: 0.35, ease: 'easeOut' }}
              >
                <div
                  onClick={() => scrollToAuth('login')}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter') scrollToAuth('login'); }}
                  aria-label={`Open ${book.title} (sign in to borrow or stream)`}
                  className="group block rounded-2xl border border-bark-100 dark:border-bark-800 bg-paper dark:bg-bark-900 p-3.5 shadow-card space-y-3 transition hover:border-bark-300 dark:hover:border-bark-700 hover:shadow-md cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-tan-dark/60 text-left"
                >
                  <BookCover book={book} className="aspect-[3/4] w-full rounded-xl" />
                  <div className="space-y-1 px-0.5">
                    <p className="text-xs font-bold text-bark-900 dark:text-cream-light leading-snug line-clamp-2 group-hover:text-tan-dark transition">
                      {book.title}
                    </p>
                    <p className="text-[11px] text-bark-500 truncate">By {book.author}</p>
                    <div className="flex items-center justify-between pt-1">
                      <span className="inline-block px-2 py-0.5 rounded-full bg-cream-light dark:bg-bark-800 border border-bark-100 dark:border-bark-700 font-mono text-[9px] uppercase tracking-wider text-bark-600 dark:text-bark-300">
                        {book.genre || 'General'}
                      </span>
                      <span className="text-[10px] font-bold text-tan-dark dark:text-tan">
                        Sign In →
                      </span>
                    </div>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 text-bark-500 text-xs">
            Catalog is currently updating. Please sign in to search all titles.
          </div>
        )}

        {/* Security & Verification trust strip */}
        <div className="pt-8 border-t border-bark-100 dark:border-bark-800 flex flex-wrap items-center justify-center gap-6 text-[11px] font-mono uppercase tracking-widest text-bark-500">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            Verified Student & Staff Circulation
          </span>
          <span className="flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-tan-dark" />
            Real-Time Shelf Tracking
          </span>
          <span className="flex items-center gap-1.5">
            <Bot className="h-4 w-4 text-indigo-500" />
            AI Catalog Intelligence
          </span>
        </div>
      </section>

    </div>
  );
}