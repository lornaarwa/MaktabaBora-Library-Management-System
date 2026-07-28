import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BookOpen, User, Shield, BookMarked, LogOut, Search, Bot } from 'lucide-react';
import { Button } from './ui/Button';

export default function Navbar({ onOpenAiChat }) {
    const { user, logout, switchRole } = useAuth();
    const location = useLocation();

    return (
        <header className="sticky top-0 z-40 border-b border-bark-100 bg-paper/95 backdrop-blur-md">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                
                {/* MaktabaBora Brand Logo */}
                <Link to="/" className="flex items-center gap-3 group">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-bark-700 font-black text-cream-light transition group-hover:bg-bark-900 shadow-sm">
                        <BookOpen className="h-5 w-5 text-cream-light" />
                    </div>
                    <div>
                        <span className="text-lg font-extrabold tracking-tight text-bark-900">
                            Maktaba<span className="text-tan-dark">Bora</span>
                        </span>
                        <span className="block font-mono text-[10px] uppercase tracking-widest text-bark-500">Library System</span>
                    </div>
                </Link>

                {/* Navigation Links */}
                <nav className="hidden items-center gap-1 rounded-xl border border-bark-100 bg-cream-light/60 p-1 md:flex">
                    <Link
                        to="/"
                        className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
                            location.pathname === '/' ? 'bg-paper font-bold text-bark-900 shadow-sm' : 'text-bark-500 hover:bg-paper/50 hover:text-bark-900'
                        }`}
                    >
                        <Search className="h-3.5 w-3.5" /> Catalog
                    </Link>

                    {user?.role === 'member' && (
                        <Link
                            to="/member"
                            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
                                location.pathname === '/member' ? 'bg-paper font-bold text-bark-900 shadow-sm' : 'text-bark-500 hover:bg-paper/50 hover:text-bark-900'
                            }`}
                        >
                            <BookMarked className="h-3.5 w-3.5" /> My Library
                        </Link>
                    )}

                    {(user?.role === 'librarian' || user?.role === 'admin') && (
                        <Link
                            to="/librarian"
                            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
                                location.pathname === '/librarian' ? 'bg-paper font-bold text-bark-900 shadow-sm' : 'text-bark-500 hover:bg-paper/50 hover:text-bark-900'
                            }`}
                        >
                            <User className="h-3.5 w-3.5" /> Circulation Desk
                        </Link>
                    )}

                    {user?.role === 'admin' && (
                        <Link
                            to="/admin"
                            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
                                location.pathname === '/admin' ? 'bg-paper font-bold text-bark-900 shadow-sm' : 'text-bark-500 hover:bg-paper/50 hover:text-bark-900'
                            }`}
                        >
                            <Shield className="h-3.5 w-3.5" /> Admin Console
                        </Link>
                    )}
                </nav>

                {/* Controls & User Account */}
                <div className="flex items-center gap-3">
                    <Button variant="ghost" onClick={onOpenAiChat}>
                        <Bot className="h-4 w-4 text-bark-700" />
                        <span>AI Assistant</span>
                    </Button>

                    {user ? (
                        <div className="flex items-center gap-3 border-l border-bark-100 pl-3">
                            <div className="hidden sm:block text-right">
                                <span className="block text-xs font-bold leading-tight text-bark-900">{user.name}</span>
                                <span className="block font-mono text-[9px] uppercase tracking-wider text-bark-500">{user.role}</span>
                            </div>
                            <Button variant="ghost" onClick={() => logout()} title="Sign Out">
                                <LogOut className="h-4 w-4 text-bark-700" />
                            </Button>
                        </div>
                    ) : (
                        <Link to="/login">
                            <Button variant="primary">Sign In</Button>
                        </Link>
                    )}
                </div>
            </div>
        </header>
    );
}
