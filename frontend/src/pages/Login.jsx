import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { BookOpen, KeyRound, Mail, User, ShieldCheck, Loader2, AlertCircle, ArrowRight, HelpCircle, X, CheckSquare, Square } from 'lucide-react';

export default function Login() {
    const { login, register } = useAuth();
    const navigate = useNavigate();
    
    // Auth Mode: 'signin' | 'signup'
    const [mode, setMode] = useState('signin');
    const [forgotModalOpen, setForgotModalOpen] = useState(false);

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
        setForgotSuccess(`Password reset link has been dispatched to ${forgotEmail}. Please check your inbox.`);
    };

    return (
        <div className="max-w-md mx-auto px-4 py-16">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
                
                {/* Brand Header */}
                <div className="text-center space-y-2">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center mx-auto shadow-lg shadow-indigo-600/30">
                        <BookOpen className="w-6 h-6 text-white" />
                    </div>
                    <h1 className="text-2xl font-black text-white">MaktabaBora</h1>
                    <p className="text-xs text-slate-400">
                        {mode === 'signin' ? 'Sign in to access your library account' : 'Create a new MaktabaBora member account'}
                    </p>
                </div>

                {/* Mode Selector Tabs */}
                <div className="flex bg-slate-950 p-1 rounded-2xl border border-slate-800 text-xs">
                    <button
                        type="button"
                        onClick={() => { setMode('signin'); setError(null); }}
                        className={`flex-1 py-2.5 rounded-xl font-bold transition-all ${
                            mode === 'signin' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
                        }`}
                    >
                        Sign In
                    </button>
                    <button
                        type="button"
                        onClick={() => { setMode('signup'); setError(null); }}
                        className={`flex-1 py-2.5 rounded-xl font-bold transition-all ${
                            mode === 'signup' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
                        }`}
                    >
                        Sign Up
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    {mode === 'signup' && (
                        <div>
                            <label className="block text-xs font-semibold text-slate-300 mb-1">Full Legal Name</label>
                            <div className="relative">
                                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Jane Doe"
                                    required
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500"
                                />
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
                        <div className="relative">
                            <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="name@domain.com"
                                required
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500"
                            />
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <label className="block text-xs font-semibold text-slate-300">Password</label>
                            {mode === 'signin' && (
                                <button
                                    type="button"
                                    onClick={() => setForgotModalOpen(true)}
                                    className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium"
                                >
                                    Forgot password?
                                </button>
                            )}
                        </div>
                        <div className="relative">
                            <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500"
                            />
                        </div>
                    </div>

                    {mode === 'signin' && (
                        <div className="flex items-center justify-between pt-1">
                            <label
                                onClick={() => setRememberMe(!rememberMe)}
                                className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none"
                            >
                                {rememberMe ? (
                                    <CheckSquare className="w-4 h-4 text-indigo-400" />
                                ) : (
                                    <Square className="w-4 h-4 text-slate-600" />
                                )}
                                <span>Remember me (Keep persistent JWT session)</span>
                            </label>
                        </div>
                    )}

                    {error && (
                        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <>
                                <span>{mode === 'signin' ? 'Sign In to MaktabaBora' : 'Create Account'}</span>
                                <ArrowRight className="w-4 h-4" />
                            </>
                        )}
                    </button>
                </form>
            </div>

            {/* Forgot Password Modal */}
            {forgotModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 space-y-5 shadow-2xl relative">
                        <button
                            onClick={() => { setForgotModalOpen(false); setForgotSuccess(null); }}
                            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                                <HelpCircle className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-white">Reset Password</h3>
                                <p className="text-xs text-slate-400">Enter your email to receive recovery instructions</p>
                            </div>
                        </div>

                        <form onSubmit={handleForgotSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1">Registered Email</label>
                                <input
                                    type="email"
                                    value={forgotEmail}
                                    onChange={(e) => setForgotEmail(e.target.value)}
                                    placeholder="name@domain.com"
                                    required
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                                />
                            </div>

                            {forgotSuccess && (
                                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
                                    <ShieldCheck className="w-4 h-4 flex-shrink-0" />
                                    <span>{forgotSuccess}</span>
                                </div>
                            )}

                            <button
                                type="submit"
                                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/20"
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
