import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BookOpen, User, Shield, BookMarked, Sparkles, LogOut, Search } from 'lucide-react';

export default function Navbar({ onOpenAiChat }) {
    const { user, logout } = useAuth();
    const location = useLocation();

    return (
        <header className="sticky top-0 z-40 backdrop-blur-xl bg-slate-950/80 border-b border-slate-800/80 transition-all">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
                
                {/* MaktabaBora Brand Logo */}
                <Link to="/" className="flex items-center gap-3 group">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-all">
                        <BookOpen className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <span className="text-xl font-bold bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">
                            Maktaba<span className="text-indigo-400">Bora</span>
                        </span>
                        <span className="block text-xs font-medium text-slate-400">Digital & Physical Library</span>
                    </div>
                </Link>

                {/* Navigation Links */}
                <nav className="hidden md:flex items-center gap-1 bg-slate-900/60 p-1.5 rounded-full border border-slate-800/60">
                    <Link
                        to="/"
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                            location.pathname === '/' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                        }`}
                    >
                        <Search className="w-4 h-4" /> Catalog
                    </Link>

                    {user?.role === 'member' && (
                        <Link
                            to="/member"
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                                location.pathname === '/member' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                            }`}
                        >
                            <BookMarked className="w-4 h-4" /> My Library
                        </Link>
                    )}

                    {(user?.role === 'librarian' || user?.role === 'admin') && (
                        <Link
                            to="/librarian"
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                                location.pathname === '/librarian' ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30' : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                            }`}
                        >
                            <User className="w-4 h-4" /> Librarian Portal
                        </Link>
                    )}

                    {user?.role === 'admin' && (
                        <Link
                            to="/admin"
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                                location.pathname === '/admin' ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30' : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                            }`}
                        >
                            <Shield className="w-4 h-4" /> Admin Console
                        </Link>
                    )}
                </nav>

                {/* User Controls & AI Assistant */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={onOpenAiChat}
                        className="relative group px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500/10 via-indigo-500/10 to-purple-500/10 border border-indigo-500/30 text-indigo-300 hover:text-white hover:border-indigo-400 hover:shadow-lg hover:shadow-indigo-500/20 transition-all flex items-center gap-2 text-sm font-semibold"
                    >
                        <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
                        <span>AI Assistant</span>
                    </button>

                    {user ? (
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-300 font-semibold hidden sm:inline-block">
                                {user.name}
                            </span>
                            <button
                                onClick={() => logout()}
                                className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-rose-400 transition-colors"
                                title="Sign Out"
                            >
                                <LogOut className="w-5 h-5" />
                            </button>
                        </div>
                    ) : (
                        <Link
                            to="/login"
                            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-all shadow-md shadow-indigo-600/30"
                        >
                            Sign In
                        </Link>
                    )}
                </div>
            </div>
        </header>
    );
}
