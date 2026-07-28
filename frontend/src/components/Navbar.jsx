import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BookOpen, User, Shield, BookMarked, LogOut, Search, MessageCircle } from 'lucide-react';
import { Button } from './ui/Button';

export default function Navbar({ onOpenAiChat }) {
    const { user, logout } = useAuth();
    const location = useLocation();

    return (
        <header className="sticky top-0 z-40 bg-white border-b" style={{ borderColor: 'var(--lightest-gray)' }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                
                {/* MaktabaBora Brand Logo */}
                <Link to="/" className="flex items-center gap-3 group" style={{ textDecoration: 'none' }}>
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center transition-all shadow-sm" style={{ backgroundColor: 'var(--primary)', color: 'var(--white)' }}>
                        <BookOpen size={20} color="white" />
                    </div>
                    <div>
                        <span className="heading-3 block leading-tight" style={{ color: 'var(--primary-dark)', margin: 0 }}>
                            Maktaba<span style={{ color: 'var(--primary)' }}>Bora</span>
                        </span>
                        <span className="overline block" style={{ marginTop: '-2px' }}>Library System</span>
                    </div>
                </Link>

                {/* Navigation Links */}
                <nav className="hidden md:flex items-center gap-2 p-1 rounded-xl" style={{ backgroundColor: 'var(--lightest-gray)' }}>
                    <Link
                        to="/"
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
                            location.pathname === '/' ? 'bg-white shadow-sm' : ''
                        }`}
                        style={{ color: location.pathname === '/' ? 'var(--primary-dark)' : 'var(--dark-gray)' }}
                    >
                        <Search size={18} /> Catalog
                    </Link>

                    {user?.role === 'member' && (
                        <Link
                            to="/member"
                            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
                                location.pathname === '/member' ? 'bg-white shadow-sm' : ''
                            }`}
                            style={{ color: location.pathname === '/member' ? 'var(--primary-dark)' : 'var(--dark-gray)' }}
                        >
                            <BookMarked size={18} /> My Library
                        </Link>
                    )}

                    {(user?.role === 'librarian' || user?.role === 'admin') && (
                        <Link
                            to="/librarian"
                            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
                                location.pathname === '/librarian' ? 'bg-white shadow-sm' : ''
                            }`}
                            style={{ color: location.pathname === '/librarian' ? 'var(--primary-dark)' : 'var(--dark-gray)' }}
                        >
                            <User size={18} /> Librarian
                        </Link>
                    )}

                    {user?.role === 'admin' && (
                        <Link
                            to="/admin"
                            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
                                location.pathname === '/admin' ? 'bg-white shadow-sm' : ''
                            }`}
                            style={{ color: location.pathname === '/admin' ? 'var(--primary-dark)' : 'var(--dark-gray)' }}
                        >
                            <Shield size={18} /> Admin
                        </Link>
                    )}
                </nav>

                {/* Controls & User Account */}
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="small" onClick={onOpenAiChat} style={{ padding: '6px 12px' }}>
                        <MessageCircle size={18} style={{ color: 'var(--primary)' }} />
                        <span style={{ marginLeft: 4 }}>Assistant</span>
                    </Button>

                    {user ? (
                        <div className="flex items-center gap-3 pl-3" style={{ borderLeft: '1px solid var(--lighter-gray)' }}>
                            <div className="hidden sm:block text-right">
                                <span className="body-small font-bold block leading-tight" style={{ color: 'var(--black)' }}>{user.name}</span>
                                <span className="caption block">{user.role}</span>
                            </div>
                            <Button variant="ghost" onClick={() => logout()} title="Sign Out" style={{ padding: '8px' }}>
                                <LogOut size={20} style={{ color: 'var(--dark-gray)' }} />
                            </Button>
                        </div>
                    ) : (
                        <Link to="/login" style={{ textDecoration: 'none' }}>
                            <Button variant="primary">Sign In</Button>
                        </Link>
                    )}
                </div>
            </div>
        </header>
    );
}
