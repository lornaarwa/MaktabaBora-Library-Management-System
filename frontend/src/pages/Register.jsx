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
        <main className="mb-reg">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=JetBrains+Mono:wght@400;500;600&family=Inter:wght@400;500&display=swap');

                .mb-reg {
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
                    .mb-reg { flex-direction: row; }
                }

                /* ---------- Left: card-catalogue cabinet ---------- */
                .mb-reg__cabinet {
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
                    .mb-reg__cabinet { width: 42%; height: auto; }
                }
                .mb-reg__cabinet svg { width: 100%; height: 100%; max-width: 460px; }
                .mb-reg__cabinet-caption {
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
                    .mb-reg__cabinet-caption { display: block; }
                }

                /* ---------- Right: form as index card ---------- */
                .mb-reg__stage {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 40px 20px 56px;
                    background:
                        radial-gradient(circle at 15% 20%, rgba(255,255,255,0.05), transparent 40%),
                        var(--green);
                }

                .mb-reg__card {
                    position: relative;
                    width: 100%;
                    max-width: 440px;
                    background: var(--paper);
                    padding: 44px 36px 32px;
                    box-shadow:
                        0 1px 0 rgba(255,255,255,0.4) inset,
                        0 30px 60px -20px rgba(0,0,0,0.55);
                    background-image:
                        linear-gradient(var(--paper) 0 0);
                }
                .mb-reg__card::before {
                    /* perforated tear edge */
                    content: '';
                    position: absolute;
                    top: 0; left: 0; right: 0;
                    height: 10px;
                    background-image: radial-gradient(circle, var(--green) 2.4px, transparent 2.6px);
                    background-size: 16px 16px;
                    background-position: 8px 0;
                    transform: translateY(-5px);
                }
                .mb-reg__punch {
                    position: absolute;
                    top: 22px;
                    left: 26px;
                    width: 16px;
                    height: 16px;
                    border-radius: 50%;
                    background: var(--green-dark);
                    box-shadow: inset 0 2px 3px rgba(0,0,0,0.6);
                }

                .mb-reg__eyebrow {
                    font-family: 'JetBrains Mono', monospace;
                    font-size: 11px;
                    letter-spacing: 0.16em;
                    text-transform: uppercase;
                    color: var(--stamp);
                    margin: 0 0 10px 44px;
                }
                .mb-reg__title {
                    font-family: 'Fraunces', Georgia, serif;
                    font-weight: 600;
                    font-size: 30px;
                    line-height: 1.15;
                    margin: 0 0 10px;
                    color: var(--ink);
                }
                .mb-reg__subtitle {
                    font-size: 14px;
                    line-height: 1.55;
                    color: var(--ink-soft);
                    margin: 0 0 26px;
                    max-width: 34ch;
                }

                .mb-reg__error {
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

                .mb-reg__field {
                    display: block;
                    margin-bottom: 22px;
                }
                .mb-reg__label {
                    display: block;
                    font-family: 'JetBrains Mono', monospace;
                    font-size: 10.5px;
                    letter-spacing: 0.12em;
                    text-transform: uppercase;
                    color: var(--ink-soft);
                    margin-bottom: 7px;
                }
                .mb-reg__input {
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
                .mb-reg__input::placeholder { color: #B4A98A; }
                .mb-reg__input:focus { border-bottom-color: var(--green); }
                .mb-reg__input:focus-visible { outline: 2px solid var(--brass); outline-offset: 3px; }

                .mb-reg__row {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 18px;
                }

                .mb-reg__stamp-btn {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    width: 100%;
                    margin-top: 8px;
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
                .mb-reg__stamp-btn:hover:not(:disabled) {
                    transform: rotate(0deg) scale(1.015);
                    background: var(--stamp);
                    color: var(--paper);
                }
                .mb-reg__stamp-btn:active:not(:disabled) {
                    transform: rotate(0deg) scale(0.97);
                }
                .mb-reg__stamp-btn:disabled { opacity: 0.6; cursor: default; transform: rotate(0deg); }
                .mb-reg__stamp-btn:focus-visible { outline: 2px solid var(--brass); outline-offset: 4px; }

                .mb-reg__spin {
                    display: inline-block;
                    width: 13px; height: 13px;
                    border: 2px solid currentColor;
                    border-top-color: transparent;
                    border-radius: 50%;
                    animation: mb-reg-spin 0.7s linear infinite;
                }
                @keyframes mb-reg-spin { to { transform: rotate(360deg); } }

                .mb-reg__footer {
                    text-align: center;
                    margin: 26px 0 0;
                    padding-top: 20px;
                    border-top: 1px dashed var(--line);
                    font-size: 13px;
                    color: var(--ink-soft);
                }
                .mb-reg__footer button {
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
                    .mb-reg__stamp-btn, .mb-reg__input, .mb-reg__spin { transition: none; animation: none; }
                }
            `}</style>

            {/* Left: illustrated card-catalogue cabinet */}
            <section className="mb-reg__cabinet" aria-hidden="true">
                <svg viewBox="0 0 400 460" xmlns="http://www.w3.org/2000/svg">
                    {/* cabinet body */}
                    <rect x="30" y="20" width="340" height="420" rx="4" fill="#4A2F1C" stroke="#2E1D10" strokeWidth="2" />
                    {/* drawer grid */}
                    {['A–D','E–H','I–L','M–P','Q–T','U–X','Y–Z','REG','NEW'].map((label, i) => {
                        const col = i % 3, row = Math.floor(i / 3);
                        const x = 48 + col * 108, y = 40 + row * 128;
                        const isOpen = i === 4;
                        return (
                            <g key={label}>
                                <rect x={x} y={y} width="92" height="112" rx="3"
                                    fill={isOpen ? '#2E1D10' : '#5C3A21'}
                                    stroke="#2E1D10" strokeWidth="1.5" />
                                {!isOpen && (
                                    <>
                                        <circle cx={x + 46} cy={y + 56} r="6" fill="#B8862E" stroke="#7A5518" strokeWidth="1" />
                                        <rect x={x + 20} y={y + 14} width="52" height="14" fill="#EFE6C9" opacity="0.9" />
                                        <text x={x + 46} y={y + 24} textAnchor="middle" fontSize="9" fontFamily="JetBrains Mono, monospace" fill="#4A2F1C">{label}</text>
                                    </>
                                )}
                                {isOpen && (
                                    <g>
                                        {/* fanned index cards poking out */}
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
                <p className="mb-reg__cabinet-caption">MaktabaBora · University Library Catalogue</p>
            </section>

            {/* Right: registration form styled as a borrower's index card */}
            <section className="mb-reg__stage">
                <form className="mb-reg__card" onSubmit={handleSubmit} noValidate>
                    <div className="mb-reg__punch" />
                    <p className="mb-reg__eyebrow">Library Membership · Form 07-B</p>
                    <h1 className="mb-reg__title">Register your library card</h1>
                    <p className="mb-reg__subtitle">
                        Join MaktabaBora to search the catalogue, reserve titles, and borrow from the university library.
                    </p>

                    {error && (
                        <div className="mb-reg__error" role="alert">
                            <span>{error}</span>
                        </div>
                    )}

                    <label className="mb-reg__field" htmlFor="name">
                        <span className="mb-reg__label">Full name</span>
                        <input
                            id="name"
                            type="text"
                            className="mb-reg__input"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Jane Wanjiku"
                            required
                        />
                    </label>

                    <label className="mb-reg__field" htmlFor="email">
                        <span className="mb-reg__label">Email address</span>
                        <input
                            id="email"
                            type="email"
                            className="mb-reg__input"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="jane.wanjiku@university.ac.ke"
                            required
                        />
                    </label>

                    <div className="mb-reg__row">
                        <label className="mb-reg__field" htmlFor="password">
                            <span className="mb-reg__label">Password</span>
                            <input
                                id="password"
                                type="password"
                                className="mb-reg__input"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                            />
                        </label>

                        <label className="mb-reg__field" htmlFor="confirmPassword">
                            <span className="mb-reg__label">Confirm</span>
                            <input
                                id="confirmPassword"
                                type="password"
                                className="mb-reg__input"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                            />
                        </label>
                    </div>

                    <button type="submit" className="mb-reg__stamp-btn" disabled={loading}>
                        {loading ? (
                            <>
                                <span className="mb-reg__spin" aria-hidden="true" />
                                Stamping…
                            </>
                        ) : (
                            'Create my card'
                        )}
                    </button>

                    <p className="mb-reg__footer">
                        Already a member?
                        <button type="button" onClick={() => navigate('/login')}>Log in</button>
                    </p>
                </form>
            </section>
        </main>
    );
}
