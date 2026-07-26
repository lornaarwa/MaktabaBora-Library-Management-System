import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Register() {
    const { register } = useAuth();
    const navigate = useNavigate();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            await register({
                name,
                email,
                password,
                role: 'member',
            });
            navigate('/login');
        } catch (err) {
            setError(err.message || 'Registration failed.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen flex flex-col md:flex-row bg-background text-on-background font-body-md overflow-x-hidden selection:bg-primary-fixed selection:text-on-primary-fixed">
            {/* Left Section: Illustration */}
            <section className="relative w-full h-[353px] md:h-screen md:w-1/2 flex items-center justify-center overflow-hidden bg-primary">
                {/* Background Layer */}
                <div className="absolute inset-0 z-0">
                    <div className="w-full h-full object-cover opacity-80 bg-center bg-cover" data-alt="A cinematic, ultra-modern futuristic library interior" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuA31ifsaQk1nZNSgqi48TdsYNRoTY3h0q8Wglgvv8z-7Hj58xdy7VfQwsmzq7gCUTzVsOkolBq5YbEr8Kiv4uqJnHMqiFgso1u7COaPAtMgKszp_933jnT6C5t2Kcvoe3YYX61bBrjPC_PDuie5Ecr-NAVuBKI2Fl8Vf1T_epjh3cY30SCzXzH8ntENqIoKXDYMZ4saEMDViOP-BDr3bxCjyoXSmf11GBcj5G53GlSAWFI78PFxJjWsHeSfjWVdHtGobRqFmWTYSss')" }}></div>
                    <div className="absolute inset-0 bg-gradient-to-b md:bg-gradient-to-r from-primary/40 to-primary/10"></div>
                </div>
                {/* Content Overlay */}
                <div className="relative z-10 p-margin-mobile md:p-margin-desktop text-center md:text-left max-w-xl">
                    <div className="inline-flex items-center gap-2 mb-stack-md bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20">
                        <span className="material-symbols-outlined text-primary-fixed" style={{ fontVariationSettings: "'FILL' 1" }}>auto_stories</span>
                        <span className="font-label-md text-label-md text-white tracking-widest uppercase">Next-Gen Knowledge</span>
                    </div>
                    <h1 className="font-display text-display text-white mb-stack-sm leading-tight">
                        MaktabaBora
                    </h1>
                    <p className="font-body-lg text-body-lg text-white/90 max-w-md">
                        Empowering libraries with functional minimalism and professional excellence.
                    </p>
                    {/* Floating Decorative Element (Desktop only) */}
                    <div className="hidden md:block absolute -right-20 top-1/2 transform -translate-y-1/2 animate-float opacity-30">
                        <span className="material-symbols-outlined text-[240px] text-white">menu_book</span>
                    </div>
                </div>
            </section>

            {/* Right Section: Form */}
            <section className="relative w-full md:w-1/2 flex flex-col items-center justify-center p-margin-mobile md:p-margin-desktop gradient-mesh min-h-screen">
                <div className="w-full max-w-[440px] z-10">
                    {/* Branding for Mobile */}
                    <div className="md:hidden flex flex-col items-center mb-stack-lg">
                        <span className="material-symbols-outlined text-primary text-5xl mb-2" style={{ fontVariationSettings: "'FILL' 1" }}>library_books</span>
                    </div>

                    <div className="glass-card rounded-xl p-stack-lg md:p-stack-xl shadow-sm border border-outline-variant/30 relative">
                        {error && (
                            <div className="mb-4 p-3 rounded-lg bg-error-container text-on-error-container text-sm flex items-center gap-2">
                                <span className="material-symbols-outlined text-error">error</span>
                                <span>{error}</span>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-stack-md">
                            <div className="space-y-stack-xs">
                                <label htmlFor="name" className="font-label-md text-label-md text-on-surface-variant ml-1">Full Name</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-outline">
                                        <span className="material-symbols-outlined">person</span>
                                    </div>
                                    <input 
                                        type="text" 
                                        id="name" 
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full bg-white border border-outline-variant rounded-lg py-3 pl-12 pr-4 text-on-surface focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none font-body-md focus:scale-[1.01]" 
                                        placeholder="Enter your name" 
                                        required 
                                    />
                                </div>
                            </div>

                            <div className="space-y-stack-xs">
                                <label htmlFor="email" className="font-label-md text-label-md text-on-surface-variant ml-1">Email Address</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-outline">
                                        <span className="material-symbols-outlined">alternate_email</span>
                                    </div>
                                    <input 
                                        type="email" 
                                        id="email" 
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full bg-white border border-outline-variant rounded-lg py-3 pl-12 pr-4 text-on-surface focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none font-body-md focus:scale-[1.01]" 
                                        placeholder="user@maktababora.com" 
                                        required 
                                    />
                                </div>
                            </div>

                            <div className="space-y-stack-xs">
                                <div className="flex justify-between items-center px-1">
                                    <label htmlFor="password" className="font-label-md text-label-md text-on-surface-variant">Password</label>
                                </div>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-outline">
                                        <span className="material-symbols-outlined">lock</span>
                                    </div>
                                    <input 
                                        type="password" 
                                        id="password" 
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full bg-white border border-outline-variant rounded-lg py-3 pl-12 pr-4 text-on-surface focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none font-body-md focus:scale-[1.01]" 
                                        placeholder="••••••••••••" 
                                        required 
                                    />
                                </div>
                            </div>

                            <div className="space-y-stack-xs">
                                <div className="flex justify-between items-center px-1">
                                    <label htmlFor="confirmPassword" className="font-label-md text-label-md text-on-surface-variant">Confirm Password</label>
                                </div>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-outline">
                                        <span className="material-symbols-outlined">lock</span>
                                    </div>
                                    <input 
                                        type="password" 
                                        id="confirmPassword" 
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full bg-white border border-outline-variant rounded-lg py-3 pl-12 pr-4 text-on-surface focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none font-body-md focus:scale-[1.01]" 
                                        placeholder="••••••••••••" 
                                        required 
                                    />
                                </div>
                            </div>

                            <button 
                                type="submit" 
                                disabled={loading}
                                className="w-full bg-primary text-on-primary font-label-md text-label-md py-4 rounded-lg shadow-md hover:translate-y-[-2px] active:scale-95 transition-all flex items-center justify-center gap-2 group disabled:opacity-70 disabled:hover:translate-y-0 disabled:active:scale-100"
                            >
                                {loading ? (
                                    <>
                                        <span className="material-symbols-outlined animate-spin">progress_activity</span> 
                                        Registering...
                                    </>
                                ) : (
                                    <>
                                        Sign Up
                                        <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
                                    </>
                                )}
                            </button>
                        </form>
                        
                        <div className="mt-stack-lg pt-stack-lg border-t border-outline-variant/30 text-center">
                            <p className="font-body-sm text-body-sm text-on-surface-variant">
                                Already have an account? 
                                <button 
                                    type="button"
                                    onClick={() => navigate('/login')}
                                    className="text-primary font-bold hover:underline transition-all ml-1"
                                >
                                    Login
                                </button>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Atmospheric Blur Blobs */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[100px] pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary/5 rounded-full blur-[120px] pointer-events-none"></div>
            </section>
        </main>
    );
}
