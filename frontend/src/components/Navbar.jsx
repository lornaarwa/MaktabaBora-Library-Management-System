import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BookOpen, User, Shield, BookMarked, LogOut, Search, Bot } from 'lucide-react';

export default function Navbar({ onOpenAiChat }) {
    const { user, logout } = useAuth();
    const location = useLocation();

    return (
        <header className="sticky top-0 z-40 backdrop-blur-md bg-zinc-950/90 border-b border-zinc-800 transition-all">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                
                {/* MaktabaBora Brand Logo */}
                <Link to="/" className="flex items-center gap-3 group">
                    <div className="w-9 h-9 rounded-lg bg-zinc-100 text-zinc-950 flex items-center justify-center font-black group-hover:bg-white transition-all shadow-sm">
                        <BookOpen className="w-5 h-5 text-zinc-950" />
                    </div>
                    <div>
                        <span className="text-lg font-extrabold text-zinc-100 tracking-tight">
                            Maktaba<span className="text-zinc-400">Bora</span>
                        </span>
                        <span className="block text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Library System</span>
                    </div>
                </Link>

                {/* Navigation Links */}
                <nav className="hidden md:flex items-center gap-1 bg-zinc-900/80 p-1 rounded-xl border border-zinc-800">
                    <Link
                        to="/"
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                            location.pathname === '/' ? 'bg-zinc-100 text-zinc-950 font-bold shadow-sm' : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60'
                        }`}
                    >
                        <Search className="w-3.5 h-3.5" /> Catalog
                    </Link>

                    {user?.role === 'member' && (
                        <Link
                            to="/member"
                            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                                location.pathname === '/member' ? 'bg-zinc-100 text-zinc-950 font-bold shadow-sm' : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60'
                            }`}
                        >
                            <BookMarked className="w-3.5 h-3.5" /> My Library
                        </Link>
                    )}

                    {(user?.role === 'librarian' || user?.role === 'admin') && (
                        <Link
                            to="/librarian"
                            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                                location.pathname === '/librarian' ? 'bg-zinc-100 text-zinc-950 font-bold shadow-sm' : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60'
                            }`}
                        >
                            <User className="w-3.5 h-3.5" /> Librarian Desk
                        </Link>
                    )}

                    {user?.role === 'admin' && (
                        <Link
                            to="/admin"
                            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                                location.pathname === '/admin' ? 'bg-zinc-100 text-zinc-950 font-bold shadow-sm' : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60'
                            }`}
                        >
                            <Shield className="w-3.5 h-3.5" /> Admin Console
                        </Link>
                    )}
                </nav>

                {/* Controls & User Account */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={onOpenAiChat}
                        className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white transition-all flex items-center gap-1.5 text-xs font-semibold"
                    >
                        <Bot className="w-3.5 h-3.5 text-zinc-400" />
                        <span>AI Assistant</span>
                    </button>

                    {user ? (
                        <div className="flex items-center gap-2 pl-2 border-l border-zinc-800">
                            <div className="hidden sm:block text-right">
                                <span className="text-xs font-bold text-zinc-200 block leading-tight">{user.name}</span>
                                <span className="text-[9px] font-mono text-zinc-500 uppercase">{user.role}</span>
                            </div>
                            <button
                                onClick={() => logout()}
                                className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors"
                                title="Sign Out"
                            >
                                <LogOut className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        <Link
                            to="/login"
                            className="px-4 py-1.5 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-bold transition-all shadow-sm"
                        >
                            Sign In
                        </Link>
                    )}
                </div>
            </div>
        </header>
    );
}
