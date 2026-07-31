import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { BookOpen, KeyRound, Mail, User, ShieldCheck, Loader2, AlertCircle, ArrowRight, HelpCircle, X, CheckSquare, Square } from 'lucide-react';

export default function Login() {
    const { user, login, register } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    
    // Auth Mode: 'signin' | 'signup'
    const initialMode = searchParams.get('mode') === 'signup' ? 'signup' : 'signin';
    const [mode, setMode] = useState(initialMode);
    const [forgotModalOpen, setForgotModalOpen] = useState(false);

    useEffect(() => {
        const paramMode = searchParams.get('mode');
        if (paramMode === 'signup' || paramMode === 'signin') {
            setMode(paramMode);
        }
    }, [searchParams]);

    useEffect(() => {
        if (user) {
            if (user.role === 'admin') navigate('/admin', { replace: true });
            else if (user.role === 'librarian') navigate('/librarian', { replace: true });
            else navigate('/member', { replace: true });
        }
    }, [user, navigate]);

    // Form fields
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(true);
    
    // Forgot Password fields
    const [forgotEmail, setForgotEmail] = useState('');
    const [forgotSuccess, setForgotSuccess] = useState(null);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (mode === 'signin') {
                const user = await login(email, password, rememberMe);
                if (user.role === 'admin') navigate('/admin');
                else if (user.role === 'librarian') navigate('/librarian');
                else navigate('/member');
            } else {
                const user = await register({
                    name,
                    email,
                    password,
                    role: 'member',
                });
                navigate('/member');
            }
        } catch (err) {
            setError(err.message || 'Authentication operation failed.');
        } finally {
            setLoading(false);
        }
    };

    const handleForgotSubmit = (e) => {
        e.preventDefault();
        setForgotSuccess(`Password reset instructions sent to ${forgotEmail}. Please check your inbox.`);
    };

    return (
        <div className="max-w-md mx-auto px-4 py-16">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-sm space-y-6">
                
                {/* Brand Header */}
                <div className="text-center space-y-2">
                    <div className="w-10 h-10 rounded-xl bg-zinc-100 text-zinc-950 flex items-center justify-center mx-auto shadow-sm">
                        <BookOpen className="w-5 h-5 text-zinc-950" />
                    </div>
                    <h1 className="text-2xl font-extrabold text-zinc-100 tracking-tight">MaktabaBora</h1>
                    <p className="text-xs text-zinc-400">
                        {mode === 'signin' ? 'Sign in to access your library account' : 'Create a new MaktabaBora member account'}
                    </p>
                </div>

                {/* Mode Selector Tabs */}
                <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-800 text-xs">
                    <button
                        type="button"
                        onClick={() => { setMode('signin'); setError(null); }}
                        className={`flex-1 py-2 rounded-lg font-semibold transition-all ${
                            mode === 'signin' ? 'bg-zinc-100 text-zinc-950 font-bold shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
                        }`}
                    >
                        Sign In
                    </button>
                    <button
                        type="button"
                        onClick={() => { setMode('signup'); setError(null); }}
                        className={`flex-1 py-2 rounded-lg font-semibold transition-all ${
                            mode === 'signup' ? 'bg-zinc-100 text-zinc-950 font-bold shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
                        }`}
                    >
                        Sign Up
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    {mode === 'signup' && (
                        <div>
                            <label className="block text-xs font-semibold text-zinc-300 mb-1">Full Name</label>
                            <div className="relative">
                                <User className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Jane Doe"
                                    required
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-10 pr-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-zinc-700"
                                />
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-semibold text-zinc-300 mb-1">Email Address</label>
                        <div className="relative">
                            <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="name@domain.com"
                                required
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-10 pr-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-zinc-700"
                            />
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <label className="block text-xs font-semibold text-zinc-300">Password</label>
                            {mode === 'signin' && (
                                <button
                                    type="button"
                                    onClick={() => setForgotModalOpen(true)}
                                    className="text-[11px] text-zinc-400 hover:text-zinc-200 font-medium"
                                >
                                    Forgot password?
                                </button>
                            )}
                        </div>
                        <div className="relative">
                            <KeyRound className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-10 pr-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-zinc-700"
                            />
                        </div>
                    </div>

                    {mode === 'signin' && (
                        <div className="flex items-center justify-between pt-1">
                            <label
                                onClick={() => setRememberMe(!rememberMe)}
                                className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer select-none"
                            >
                                {rememberMe ? (
                                    <CheckSquare className="w-4 h-4 text-zinc-100" />
                                ) : (
                                    <Square className="w-4 h-4 text-zinc-600" />
                                )}
                                <span>Remember me (Keep persistent session)</span>
                            </label>
                        </div>
                    )}

                    {error && (
                        <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-300 text-xs flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 flex-shrink-0 text-zinc-400" />
                            <span>{error}</span>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-2.5 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <Loader2 className="w-4 h-4 animate-spin text-zinc-950" />
                        ) : (
                            <>
                                <span>{mode === 'signin' ? 'Sign In to Account' : 'Create Account'}</span>
                                <ArrowRight className="w-4 h-4" />
                            </>
                        )}
                    </button>
                </form>
            </div>

            {/* Forgot Password Modal */}
            {forgotModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-md animate-in fade-in duration-200">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl relative">
                        <button
                            onClick={() => { setForgotModalOpen(false); setForgotSuccess(null); }}
                            className="absolute top-4 right-4 p-1.5 text-zinc-400 hover:text-white"
                        >
                            <X className="w-4 h-4" />
                        </button>

                        <div className="flex items-center gap-2.5">
                            <div className="p-2 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-300">
                                <HelpCircle className="w-4 h-4" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-zinc-100">Reset Password</h3>
                                <p className="text-xs text-zinc-400">Enter your email to receive recovery instructions</p>
                            </div>
                        </div>

                        <form onSubmit={handleForgotSubmit} className="space-y-3">
                            <div>
                                <label className="block text-xs font-semibold text-zinc-300 mb-1">Registered Email</label>
                                <input
                                    type="email"
                                    value={forgotEmail}
                                    onChange={(e) => setForgotEmail(e.target.value)}
                                    placeholder="name@domain.com"
                                    required
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-zinc-700"
                                />
                            </div>

                            {forgotSuccess && (
                                <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-300 text-xs flex items-center gap-2">
                                    <ShieldCheck className="w-4 h-4 flex-shrink-0 text-zinc-400" />
                                    <span>{forgotSuccess}</span>
                                </div>
                            )}

                            <button
                                type="submit"
                                className="w-full py-2.5 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 font-bold text-xs shadow-sm"
                            >
                                Dispatch Reset Instructions
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
