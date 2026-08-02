import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BookOpen, LogIn, UserPlus, ShieldCheck, KeyRound, Mail, User as UserIcon, Loader2, AlertCircle, ArrowRight } from 'lucide-react';

export default function Home() {
    const { user, login, register } = useAuth();
    const navigate = useNavigate();

    // Mode: 'login' | 'register'
    const [mode, setMode] = useState('login');

    // Form states
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

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
            if (mode === 'login') {
                const authenticatedUser = await login(email, password, rememberMe);
                if (authenticatedUser.role === 'admin') navigate('/admin', { replace: true });
                else if (authenticatedUser.role === 'librarian') navigate('/librarian', { replace: true });
                else navigate('/member', { replace: true });
            } else {
                const newUser = await register({ name, email, password, role: 'member' });
                if (newUser.role === 'admin') navigate('/admin', { replace: true });
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
            <div className="text-center max-w-2xl mx-auto space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-bark-700 text-cream-light font-mono text-xs font-bold uppercase tracking-widest shadow-sm">
                    <BookOpen className="w-4 h-4" /> MaktabaBora System
                </div>
                <h1 className="text-3xl sm:text-5xl font-extrabold text-bark-900 tracking-tight leading-tight">
                    Welcome to Maktaba<span className="text-tan-dark">Bora</span>
                </h1>
                <p className="text-bark-700 text-sm sm:text-base leading-relaxed">
                    Access our physical catalog, digital e-book reader, circulation desk, and library management services. Please select an option below to continue.
                </p>
            </div>

            {/* Main Auth Selection Section: 2 Options */}
            <div className="max-w-md mx-auto space-y-6">
                
                {/* 2 Options Buttons Header */}
                <div className="grid grid-cols-2 gap-3 p-1.5 bg-cream-light/60 border border-bark-100 rounded-2xl shadow-sm">
                    <button
                        type="button"
                        onClick={() => { setMode('login'); setError(null); }}
                        className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-xs transition-all ${
                            mode === 'login'
                                ? 'bg-bark-700 text-cream-light shadow-card'
                                : 'text-bark-700 hover:bg-paper/80'
                        }`}
                    >
                        <LogIn className="w-4 h-4" />
                        <span>1. Login</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => { setMode('register'); setError(null); }}
                        className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-xs transition-all ${
                            mode === 'register'
                                ? 'bg-bark-700 text-cream-light shadow-card'
                                : 'text-bark-700 hover:bg-paper/80'
                        }`}
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
                                <label className="block text-xs font-semibold text-bark-700 mb-1">Full Name</label>
                                <div className="relative">
                                    <UserIcon className="w-4 h-4 text-bark-400 absolute left-3 top-3" />
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Jane Doe"
                                        required
                                        className="w-full bg-paper border border-bark-100 rounded-xl pl-9 pr-3 py-2.5 text-xs text-bark-900 focus:outline-none focus:border-bark-500"
                                    />
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="block text-xs font-semibold text-bark-700 mb-1">Email Address</label>
                            <div className="relative">
                                <Mail className="w-4 h-4 text-bark-400 absolute left-3 top-3" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="user@example.com"
                                    required
                                    className="w-full bg-paper border border-bark-100 rounded-xl pl-9 pr-3 py-2.5 text-xs text-bark-900 focus:outline-none focus:border-bark-500"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-bark-700 mb-1">Password</label>
                            <div className="relative">
                                <KeyRound className="w-4 h-4 text-bark-400 absolute left-3 top-3" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    className="w-full bg-paper border border-bark-100 rounded-xl pl-9 pr-3 py-2.5 text-xs text-bark-900 focus:outline-none focus:border-bark-500"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="p-3 rounded-xl bg-cream border border-[#a8452f]/30 text-[#8c3620] text-xs flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 rounded-xl bg-bark-700 hover:bg-bark-900 text-cream-light font-bold text-xs shadow-card transition-all flex items-center justify-center gap-2"
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
            </div>
        </div>
    );
}
