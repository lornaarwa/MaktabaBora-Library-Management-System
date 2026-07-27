import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(true);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const user = await login(email, password, rememberMe);
            if (user.role === 'admin') navigate('/admin');
            else if (user.role === 'librarian') navigate('/librarian');
            else if (user.role === 'member') navigate('/member');
            else navigate('/');
        } catch (err) {
            setError(err.message || 'Authentication operation failed.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="mb-log">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=JetBrains+Mono:wght@400;500;600&family=Inter:wght@400;500&display=swap');

                .mb-log {
                    --paper: #F2ECDC;
                    --paper-shade: #E1D8BC;
                    --line: #C7BA95;
                    --ink: #221D15;
                    --ink-soft: #55503F;
                    --green: #2B4C3F;
                    --green-dark: #17281F;
                    --stamp: #A93226;
                    --brass: #B8862E;
                    --wood-a: #6B4526;
                    --wood-b: #402A18;

                    min-height: 100vh;
                    display: flex;
                    flex-direction: column;
                    background: var(--green-dark);
                    font-family: 'Inter', system-ui, sans-serif;
                    color: var(--ink);
                    overflow-x: hidden;
                }
                @media (min-width: 900px) {
                    .mb-log { flex-direction: row; }
                }

                /* ---------- Left: card-catalogue cabinet ---------- */
                .mb-log__cabinet {
                    position: relative;
                    width: 100%;
                    height: 220px;
                    background: linear-gradient(160deg, var(--wood-a), var(--wood-b));
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }
                @media (min-width: 900px) {
                    .mb-log__cabinet { width: 42%; height: auto; }
                }
                .mb-log__cabinet svg { width: 100%; height: 100%; max-width: 460px; }
                .mb-log__cabinet-caption {
                    position: absolute;
                    left: 24px;
                    bottom: 20px;
                    color: #EFE6C9;
                    font-family: 'JetBrains Mono', monospace;
                    font-size: 11px;
                    letter-spacing: 0.14em;
                    text-transform: uppercase;
                    opacity: 0.75;
                    display: none;
                }
                @media (min-width: 900px) {
                    .mb-log__cabinet-caption { display: block; }
                }

                /* ---------- Right: form as index card ---------- */
                .mb-log__stage {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 40px 20px 56px;
                    background:
                        radial-gradient(circle at 15% 20%, rgba(255,255,255,0.05), transparent 40%),
                        var(--green);
                }

                .mb-log__card {
                    position: relative;
                    width: 100%;
                    max-width: 420px;
                    background: var(--paper);
                    padding: 44px 36px 32px;
                    box-shadow:
                        0 1px 0 rgba(255,255,255,0.4) inset,
                        0 30px 60px -20px rgba(0,0,0,0.55);
                }
                .mb-log__card::before {
                    content: '';
                    position: absolute;
                    top: 0; left: 0; right: 0;
                    height: 10px;
                    background-image: radial-gradient(circle, var(--green) 2.4px, transparent 2.6px);
                    background-size: 16px 16px;
                    background-position: 8px 0;
                    transform: translateY(-5px);
                }
                .mb-log__punch {
                    position: absolute;
                    top: 22px;
                    left: 26px;
                    width: 16px;
                    height: 16px;
                    border-radius: 50%;
                    background: var(--green-dark);
                    box-shadow: inset 0 2px 3px rgba(0,0,0,0.6);
                }

                .mb-log__eyebrow {
                    font-family: 'JetBrains Mono', monospace;
                    font-size: 11px;
                    letter-spacing: 0.16em;
                    text-transform: uppercase;
                    color: var(--stamp);
                    margin: 0 0 10px 44px;
                }
                .mb-log__title {
                    font-family: 'Fraunces', Georgia, serif;
                    font-weight: 600;
                    font-size: 30px;
                    line-height: 1.15;
                    margin: 0 0 10px;
                    color: var(--ink);
                }
                .mb-log__subtitle {
                    font-size: 14px;
                    line-height: 1.55;
                    color: var(--ink-soft);
                    margin: 0 0 26px;
                    max-width: 34ch;
                }

                .mb-log__error {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 13px;
                    color: #7A241C;
                    background: #F3DCD6;
                    border: 1px solid #D9A79B;
                    padding: 10px 12px;
                    margin-bottom: 20px;
                }

                .mb-log__field { display: block; margin-bottom: 22px; }
                .mb-log__label {
                    display: block;
                    font-family: 'JetBrains Mono', monospace;
                    font-size: 10.5px;
                    letter-spacing: 0.12em;
                    text-transform: uppercase;
                    color: var(--ink-soft);
                    margin-bottom: 7px;
                }
                .mb-log__input {
                    width: 100%;
                    border: none;
                    border-bottom: 1.5px solid var(--line);
                    background: transparent;
                    padding: 6px 2px 8px;
                    font-family: 'Inter', system-ui, sans-serif;
                    font-size: 15px;
                    color: var(--ink);
                    outline: none;
                    transition: border-color 0.2s ease;
                }
                .mb-log__input::placeholder { color: #B4A98A; }
                .mb-log__input:focus { border-bottom-color: var(--green); }
                .mb-log__input:focus-visible { outline: 2px solid var(--brass); outline-offset: 3px; }

                .mb-log__remember {
                    display: flex;
                    align-items: center;
                    gap: 9px;
                    margin: -6px 0 26px;
                }
                .mb-log__checkbox {
                    appearance: none;
                    width: 16px;
                    height: 16px;
                    border: 1.5px solid var(--line);
                    border-radius: 2px;
                    background: var(--paper);
                    display: inline-grid;
                    place-content: center;
                    cursor: pointer;
                    flex-shrink: 0;
                }
                .mb-log__checkbox::before {
                    content: '';
                    width: 9px; height: 9px;
                    transform: scale(0);
                    transition: transform 0.12s ease;
                    background: var(--stamp);
                    clip-path: polygon(14% 44%, 0 65%, 50% 100%, 100% 16%, 80% 0%, 43% 62%);
                }
                .mb-log__checkbox:checked::before { transform: scale(1); }
                .mb-log__checkbox:focus-visible { outline: 2px solid var(--brass); outline-offset: 3px; }
                .mb-log__remember label {
                    font-size: 13px;
                    color: var(--ink-soft);
                    cursor: pointer;
                }

                .mb-log__stamp-btn {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    width: 100%;
                    margin-top: 4px;
                    padding: 14px 20px;
                    background: transparent;
                    color: var(--stamp);
                    font-family: 'JetBrains Mono', monospace;
                    font-size: 13px;
                    font-weight: 600;
                    letter-spacing: 0.1em;
                    text-transform: uppercase;
                    border: 2.5px solid var(--stamp);
                    border-radius: 3px;
                    box-shadow: 0 0 0 2px var(--paper), 0 0 0 3.5px var(--stamp);
                    cursor: pointer;
                    transform: rotate(-2.5deg);
                    transition: transform 0.18s ease, background 0.18s ease, color 0.18s ease;
                }
                .mb-log__stamp-btn:hover:not(:disabled) {
                    transform: rotate(0deg) scale(1.015);
                    background: var(--stamp);
                    color: var(--paper);
                }
                .mb-log__stamp-btn:active:not(:disabled) { transform: rotate(0deg) scale(0.97); }
                .mb-log__stamp-btn:disabled { opacity: 0.6; cursor: default; transform: rotate(0deg); }
                .mb-log__stamp-btn:focus-visible { outline: 2px solid var(--brass); outline-offset: 4px; }

                .mb-log__spin {
                    display: inline-block;
                    width: 13px; height: 13px;
                    border: 2px solid currentColor;
                    border-top-color: transparent;
                    border-radius: 50%;
                    animation: mb-log-spin 0.7s linear infinite;
                }
                @keyframes mb-log-spin { to { transform: rotate(360deg); } }

                .mb-log__footer {
                    text-align: center;
                    margin: 26px 0 0;
                    padding-top: 20px;
                    border-top: 1px dashed var(--line);
                    font-size: 13px;
                    color: var(--ink-soft);
                }
                .mb-log__footer button {
                    background: none;
                    border: none;
                    padding: 0;
                    margin-left: 4px;
                    color: var(--green);
                    font-weight: 600;
                    font-size: 13px;
                    cursor: pointer;
                    text-decoration: underline;
                    text-underline-offset: 3px;
                }

                @media (prefers-reduced-motion: reduce) {
                    .mb-log__stamp-btn, .mb-log__input, .mb-log__spin, .mb-log__checkbox::before { transition: none; animation: none; }
                }
            `}</style>

            {/* Left: illustrated card-catalogue cabinet */}
            <section className="mb-log__cabinet" aria-hidden="true">
                <svg viewBox="0 0 400 460" xmlns="http://www.w3.org/2000/svg">
                    <rect x="30" y="20" width="340" height="420" rx="4" fill="#4A2F1C" stroke="#2E1D10" strokeWidth="2" />
                    {['A–D','E–H','I–L','SIGN IN','Q–T','U–X','Y–Z','FINES','HOLDS'].map((label, i) => {
                        const col = i % 3, row = Math.floor(i / 3);
                        const x = 48 + col * 108, y = 40 + row * 128;
                        const isOpen = i === 3;
                        return (
                            <g key={label}>
                                <rect x={x} y={y} width="92" height="112" rx="3"
                                    fill={isOpen ? '#2E1D10' : '#5C3A21'}
                                    stroke="#2E1D10" strokeWidth="1.5" />
                                {!isOpen && (
                                    <>
                                        <circle cx={x + 46} cy={y + 56} r="6" fill="#B8862E" stroke="#7A5518" strokeWidth="1" />
                                        <rect x={x + 16} y={y + 14} width="60" height="14" fill="#EFE6C9" opacity="0.9" />
                                        <text x={x + 46} y={y + 24} textAnchor="middle" fontSize="8.5" fontFamily="JetBrains Mono, monospace" fill="#4A2F1C">{label}</text>
                                    </>
                                )}
                                {isOpen && (
                                    <g>
                                        <rect x={x + 10} y={y - 22} width="72" height="40" fill="#F2ECDC" stroke="#C7BA95" transform={`rotate(-6 ${x+46} ${y-2})`} />
                                        <rect x={x + 12} y={y - 16} width="72" height="40" fill="#EFE7D0" stroke="#C7BA95" transform={`rotate(3 ${x+48} ${y+4})`} />
                                        <rect x={x + 14} y={y - 10} width="72" height="40" fill="#F2ECDC" stroke="#C7BA95" />
                                        <circle cx={x + 46} cy={y + 90} r="6" fill="#B8862E" stroke="#7A5518" strokeWidth="1" />
                                    </g>
                                )}
                            </g>
                        );
                    })}
                </svg>
                <p className="mb-log__cabinet-caption">MaktabaBora · University Library Catalogue</p>
            </section>

            {/* Right: login form styled as a borrower's index card */}
            <section className="mb-log__stage">
                <form className="mb-log__card" onSubmit={handleSubmit} noValidate>
                    <div className="mb-log__punch" />
                    <p className="mb-log__eyebrow">Library Access · Form 07-A</p>
                    <h1 className="mb-log__title">Look up your card</h1>
                    <p className="mb-log__subtitle">
                        Sign in to reserve titles, track loans, and see what's due back at MaktabaBora.
                    </p>

                    {error && (
                        <div className="mb-log__error" role="alert">
                            <span>{error}</span>
                        </div>
                    )}

                    <label className="mb-log__field" htmlFor="email">
                        <span className="mb-log__label">Email address</span>
                        <input
                            id="email"
                            type="email"
                            className="mb-log__input"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="jane.wanjiku@university.ac.ke"
                            required
                        />
                    </label>

                    <label className="mb-log__field" htmlFor="password">
                        <span className="mb-log__label">Password</span>
                        <input
                            id="password"
                            type="password"
                            className="mb-log__input"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                        />
                    </label>

                    <div className="mb-log__remember">
                        <input
                            type="checkbox"
                            id="remember"
                            className="mb-log__checkbox"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                        />
                        <label htmlFor="remember">Keep me signed in</label>
                    </div>

                    <button type="submit" className="mb-log__stamp-btn" disabled={loading}>
                        {loading ? (
                            <>
                                <span className="mb-log__spin" aria-hidden="true" />
                                Verifying…
                            </>
                        ) : (
                            'Verify my card'
                        )}
                    </button>

                    <p className="mb-log__footer">
                        New to MaktabaBora?
                        <button type="button" onClick={() => navigate('/register')}>Create an account</button>
                    </p>
                </form>
            </section>
        </main>
    );
}
