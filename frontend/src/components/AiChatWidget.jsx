import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot, Send, X, User, Loader2, AlertCircle, RotateCcw } from 'lucide-react';
import { api } from '../services/api';
import { Button } from './ui/Button';
import BookMiniCard from './BookMiniCard';

const SUGGESTED_QUESTIONS = [
    'How do I buy an e-book via M-Pesa?',
    'Where can I see my active loans & fines?',
    'How do I upgrade my membership plan?',
    'Recommend books about software engineering',
    'Which books are available right now?',
];

function renderInline(text, onNavigate, isUser) {
    if (!text) return null;

    // Pattern for inline tokens:
    // 1. Bold link: **[Label](path)** or __[Label](path)__
    // 2. Regular link: [Label](path)
    // 3. Bold + Underline: **<u>text</u>**, <u>**text**</u>, **__text__**, __**text**__
    // 4. Bold: **text** or <b>text</b>
    // 5. Underline: <u>text</u> or __text__
    // 6. Code: `text`
    // 7. Italic: *text* or <i>text</i>
    const pattern = /(\*\*\[[^\]]+\]\([^)]+\)\*\*|__\[[^\]]+\]\([^)]+\)__|\[[^\]]+\]\([^)]+\)|\*\*<u>.*?<\/u>\*\*|<u>\*\*.*?\*\*<\/u>|\*\*__.*?__\*\*|__\*\*.*?\*\*__|\*\*.*?\*\*|<b>.*?<\/b>|<u>.*?<\/u>|__.*?__|`[^`]+`|\*.*?\*|<i>.*?<\/i>)/g;

    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = pattern.exec(text)) !== null) {
        if (match.index > lastIndex) {
            parts.push(text.slice(lastIndex, match.index));
        }

        const raw = match[0];
        const key = `inline-${match.index}`;

        // 1. Bold Link: **[Label](path)** or __[Label](path)__
        if ((raw.startsWith('**[') && raw.endsWith(')**')) || (raw.startsWith('__[') && raw.endsWith(')__'))) {
            const innerLink = raw.slice(2, -2);
            const linkMatch = innerLink.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
            if (linkMatch) {
                const [, label, path] = linkMatch;
                parts.push(
                    <button
                        key={key}
                        type="button"
                        onClick={() => onNavigate(path)}
                        className={`inline-flex items-center underline underline-offset-2 font-bold transition px-1 py-0.5 rounded text-xs cursor-pointer ${
                            isUser
                                ? 'text-cream-light hover:text-white hover:bg-bark-800'
                                : 'text-tan-dark hover:text-bark-900 hover:bg-cream-light/60'
                        }`}
                        title={`Navigate to ${path}`}
                    >
                        {label}
                    </button>
                );
            } else {
                parts.push(raw);
            }
        }
        // 2. Regular Link: [Label](path)
        else if (raw.startsWith('[') && raw.endsWith(')')) {
            const linkMatch = raw.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
            if (linkMatch) {
                const [, label, path] = linkMatch;
                parts.push(
                    <button
                        key={key}
                        type="button"
                        onClick={() => onNavigate(path)}
                        className={`inline-flex items-center underline underline-offset-2 font-semibold transition px-1 py-0.5 rounded text-xs cursor-pointer ${
                            isUser
                                ? 'text-cream-light hover:text-white hover:bg-bark-800'
                                : 'text-tan-dark hover:text-bark-900 hover:bg-cream-light/60'
                        }`}
                        title={`Navigate to ${path}`}
                    >
                        {label}
                    </button>
                );
            } else {
                parts.push(raw);
            }
        }
        // 3. Bold + Underline: **<u>text</u>**, <u>**text**</u>, **__text__**, __**text**__
        else if (
            (raw.startsWith('**<u>') && raw.endsWith('</u>**')) ||
            (raw.startsWith('<u>**') && raw.endsWith('**</u>')) ||
            (raw.startsWith('**__') && raw.endsWith('__**')) ||
            (raw.startsWith('__**') && raw.endsWith('**__'))
        ) {
            const inner = raw
                .replace(/^(\*\*<u>|<u>\*\*|\*\*__|__\*\*)/, '')
                .replace(/(<\/u>\*\*|\*\*<\/u>|__\*\*|\*\*__)$/, '');
            parts.push(
                <strong
                    key={key}
                    className={`font-bold underline underline-offset-2 decoration-1 ${
                        isUser
                            ? 'text-white decoration-cream-light'
                            : 'text-bark-900 decoration-tan-dark'
                    }`}
                >
                    {inner}
                </strong>
            );
        }
        // 4. Bold: **text** or <b>text</b>
        else if (raw.startsWith('**') && raw.endsWith('**')) {
            const inner = raw.slice(2, -2);
            parts.push(
                <strong key={key} className={`font-bold ${isUser ? 'text-white' : 'text-bark-900'}`}>
                    {inner}
                </strong>
            );
        } else if (raw.startsWith('<b>') && raw.endsWith('</b>')) {
            const inner = raw.slice(3, -4);
            parts.push(
                <strong key={key} className={`font-bold ${isUser ? 'text-white' : 'text-bark-900'}`}>
                    {inner}
                </strong>
            );
        }
        // 5. Underline: <u>text</u> or __text__
        else if (raw.startsWith('<u>') && raw.endsWith('</u>')) {
            const inner = raw.slice(3, -4);
            parts.push(
                <span
                    key={key}
                    className={`underline underline-offset-2 decoration-1 font-medium ${
                        isUser ? 'decoration-cream-light' : 'decoration-tan-dark'
                    }`}
                >
                    {inner}
                </span>
            );
        } else if (raw.startsWith('__') && raw.endsWith('__')) {
            const inner = raw.slice(2, -2);
            parts.push(
                <span
                    key={key}
                    className={`underline underline-offset-2 decoration-1 font-medium ${
                        isUser ? 'decoration-cream-light' : 'decoration-tan-dark'
                    }`}
                >
                    {inner}
                </span>
            );
        }
        // 6. Inline Code: `text`
        else if (raw.startsWith('`') && raw.endsWith('`')) {
            const inner = raw.slice(1, -1);
            parts.push(
                <code
                    key={key}
                    className={`font-mono text-[11px] px-1 py-0.5 rounded font-semibold ${
                        isUser
                            ? 'bg-bark-800 text-cream-light border border-bark-600'
                            : 'bg-cream-light/70 text-bark-800 border border-bark-200'
                    }`}
                >
                    {inner}
                </code>
            );
        }
        // 7. Italic: *text* or <i>text</i>
        else if (raw.startsWith('*') && raw.endsWith('*')) {
            const inner = raw.slice(1, -1);
            parts.push(
                <em key={key} className="italic">
                    {inner}
                </em>
            );
        } else if (raw.startsWith('<i>') && raw.endsWith('</i>')) {
            const inner = raw.slice(3, -4);
            parts.push(
                <em key={key} className="italic">
                    {inner}
                </em>
            );
        } else {
            parts.push(raw);
        }

        lastIndex = pattern.lastIndex;
    }

    if (lastIndex < text.length) {
        parts.push(text.slice(lastIndex));
    }

    return parts;
}

function FormattedMessageText({ text, onNavigate, isUser = false }) {
    if (!text) return null;

    // Normalize line breaks
    const normalized = text.replace(/\r\n/g, '\n');
    const rawBlocks = normalized.split(/\n{2,}/);

    return (
        <div className="space-y-2 text-xs leading-relaxed">
            {rawBlocks.map((block, bIdx) => {
                const lines = block.split('\n').map(l => l.trimEnd()).filter(l => l.length > 0);
                if (lines.length === 0) return null;

                // Horizontal rule (--- or ***)
                if (lines.length === 1 && /^[-*_]{3,}$/.test(lines[0].trim())) {
                    return <hr key={bIdx} className={`my-2 border-t ${isUser ? 'border-bark-600' : 'border-bark-100'}`} />;
                }

                // Check if heading (### or ## or #)
                const firstLine = lines[0].trim();
                if (/^#{1,4}\s+/.test(firstLine)) {
                    const headingContent = firstLine.replace(/^#{1,4}\s+/, '');
                    return (
                        <div key={bIdx} className="space-y-1">
                            <h4 className={`font-bold tracking-tight text-xs ${
                                isUser ? 'text-white' : 'text-bark-900 border-b border-bark-100 pb-0.5'
                            }`}>
                                {renderInline(headingContent, onNavigate, isUser)}
                            </h4>
                            {lines.slice(1).map((subLine, sIdx) => (
                                <p key={sIdx} className="m-0 leading-relaxed">
                                    {renderInline(subLine, onNavigate, isUser)}
                                </p>
                            ))}
                        </div>
                    );
                }

                // Check if all lines are unordered bullet list items (- item, * item, • item)
                const isUnorderedList = lines.every(l => /^[-*•]\s+/.test(l.trim()));
                if (isUnorderedList) {
                    return (
                        <ul key={bIdx} className="space-y-1 my-1 pl-0.5 list-none">
                            {lines.map((line, lIdx) => {
                                const content = line.trim().replace(/^[-*•]\s+/, '');
                                return (
                                    <li key={lIdx} className="flex items-start gap-1.5">
                                        <span className={`select-none text-xs leading-none mt-1 font-bold ${
                                            isUser ? 'text-cream-light' : 'text-tan-dark'
                                        }`}>•</span>
                                        <span className="flex-1">{renderInline(content, onNavigate, isUser)}</span>
                                    </li>
                                );
                            })}
                        </ul>
                    );
                }

                // Check if all lines are numbered list items (1. item, 2. item)
                const isOrderedList = lines.every(l => /^\d+\.\s+/.test(l.trim()));
                if (isOrderedList) {
                    return (
                        <ol key={bIdx} className="space-y-1 my-1 pl-0.5 list-none">
                            {lines.map((line, lIdx) => {
                                const numMatch = line.trim().match(/^(\d+)\.\s+(.*)/);
                                const num = numMatch ? numMatch[1] : (lIdx + 1);
                                const content = numMatch ? numMatch[2] : line;
                                return (
                                    <li key={lIdx} className="flex items-start gap-1.5">
                                        <span className={`select-none font-mono text-[10px] leading-relaxed font-bold ${
                                            isUser ? 'text-cream-light' : 'text-tan-dark'
                                        }`}>{num}.</span>
                                        <span className="flex-1">{renderInline(content, onNavigate, isUser)}</span>
                                    </li>
                                );
                            })}
                        </ol>
                    );
                }

                // Check if blockquote (> quote)
                if (lines.every(l => /^>\s*/.test(l.trim()))) {
                    const quoteContent = lines.map(l => l.trim().replace(/^>\s*/, '')).join(' ');
                    return (
                        <blockquote
                            key={bIdx}
                            className={`border-l-2 pl-2.5 py-0.5 my-1 italic rounded-r ${
                                isUser
                                    ? 'border-cream-light/60 bg-bark-800/40 text-cream-light'
                                    : 'border-tan-dark/70 bg-cream-light/30 text-bark-800'
                            }`}
                        >
                            {renderInline(quoteContent, onNavigate, isUser)}
                        </blockquote>
                    );
                }

                // Standard paragraph with lines joined by <br />
                return (
                    <p key={bIdx} className="m-0 leading-relaxed">
                        {lines.map((line, lIdx) => (
                            <React.Fragment key={lIdx}>
                                {lIdx > 0 && <br />}
                                {renderInline(line, onNavigate, isUser)}
                            </React.Fragment>
                        ))}
                    </p>
                );
            })}
        </div>
    );
}

const STORAGE_KEY_MESSAGES = 'smartlib_ai_chat_messages';
const STORAGE_KEY_SESSION_ID = 'smartlib_ai_chat_session_id';

const DEFAULT_GREETING = {
    id: 1,
    sender: 'ai',
    text: 'Hello! I am your MaktabaBora **Library Assistant**.\n\nI can search our catalog, recommend books, check shelf availability, and guide you across the platform (like purchasing digital e-books or upgrading membership plans).\n\n<u>How can I assist your reading journey today?</u>',
    tokens: 0,
    books: [],
};

export default function AiChatWidget({ isOpen, onClose }) {
    const navigate = useNavigate();

    // Session storage hydration
    const [messages, setMessages] = useState(() => {
        try {
            const saved = sessionStorage.getItem(STORAGE_KEY_MESSAGES);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    return parsed;
                }
            }
        } catch (e) {
            console.error('Failed to load chat messages from sessionStorage', e);
        }
        return [DEFAULT_GREETING];
    });

    const [sessionId, setSessionId] = useState(() => {
        try {
            return sessionStorage.getItem(STORAGE_KEY_SESSION_ID) || null;
        } catch (e) {
            return null;
        }
    });

    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [quotaError, setQuotaError] = useState(null);
    const chatEndRef = useRef(null);

    // Save messages to sessionStorage across the user's session
    useEffect(() => {
        try {
            sessionStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(messages));
        } catch (e) {
            console.error('Failed to save chat messages to sessionStorage', e);
        }
    }, [messages]);

    // Save active chat_session_id to sessionStorage
    useEffect(() => {
        try {
            if (sessionId) {
                sessionStorage.setItem(STORAGE_KEY_SESSION_ID, sessionId);
            } else {
                sessionStorage.removeItem(STORAGE_KEY_SESSION_ID);
            }
        } catch (e) {
            console.error('Failed to save sessionId to sessionStorage', e);
        }
    }, [sessionId]);

    useEffect(() => {
        if (isOpen) {
            chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isOpen]);

    if (!isOpen) return null;

    const handleNavigate = (path) => {
        if (path.startsWith('/')) {
            navigate(path);
            onClose();
        } else {
            window.open(path, '_blank');
        }
    };

    const handleClearChat = async () => {
        if (loading) return;
        const currentSession = sessionId;
        setMessages([DEFAULT_GREETING]);
        setSessionId(null);
        setQuotaError(null);

        try {
            sessionStorage.removeItem(STORAGE_KEY_MESSAGES);
            sessionStorage.removeItem(STORAGE_KEY_SESSION_ID);
            if (currentSession) {
                await api.clearAiChat(currentSession);
            }
        } catch (e) {
            // Ignore clear chat network errors
        }
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const userMsg = { id: Date.now(), sender: 'user', text: input, books: [] };
        setMessages((prev) => [...prev, userMsg]);
        const promptText = input;
        setInput('');
        setLoading(true);
        setQuotaError(null);

        try {
            const res = await api.sendAiMessage(promptText, sessionId);
            const aiMsgText = res.message || res.response || 'I searched the catalog but could not compose an answer. Please try again.';
            const tokens = res.tokens_used || 0;
            const books = Array.isArray(res.books) ? res.books : [];

            if (res.session_id) {
                setSessionId(res.session_id);
            }

            setMessages((prev) => [
                ...prev,
                { id: Date.now() + 1, sender: 'ai', text: aiMsgText, tokens, books },
            ]);
        } catch (err) {
            if (err.status === 429) {
                setQuotaError('Daily AI token quota limit reached. Please try again tomorrow.');
            } else {
                setMessages((prev) => [
                    ...prev,
                    { id: Date.now() + 1, sender: 'ai', text: `Sorry, I encountered an error: ${err.message}`, tokens: 0, books: [] },
                ]);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 w-full max-w-sm bg-paper border border-bark-100 rounded-2xl shadow-lift overflow-hidden flex flex-col h-[520px]">
            {/* Header */}
            <div className="p-3.5 bg-cream-light/60 border-b border-bark-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-bark-700 text-cream-light shadow-sm">
                        <Bot size={16} />
                    </div>
                    <div>
                        <h3 className="text-xs font-bold text-bark-900 m-0">Library Assistant</h3>
                        <p className="font-mono text-[10px] text-bark-500 m-0">Live catalog & navigation guide</p>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        onClick={handleClearChat}
                        className="p-1.5 rounded-lg text-bark-500 hover:text-bark-900 hover:bg-cream-light/60 transition"
                        title="Clear conversation"
                        aria-label="Clear conversation"
                    >
                        <RotateCcw size={14} />
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-bark-500 hover:text-bark-900 hover:bg-cream-light/60 transition"
                        title="Close"
                        aria-label="Close assistant"
                    >
                        <X size={15} />
                    </button>
                </div>
            </div>

            {/* Suggested questions */}
            <div className="flex gap-1.5 overflow-x-auto px-3.5 pt-3 pb-1 mb-scroll">
                {SUGGESTED_QUESTIONS.map((q) => (
                    <button
                        key={q}
                        type="button"
                        onClick={() => setInput(q)}
                        className="shrink-0 rounded-full border border-bark-100 bg-paper px-3 py-1 text-[10px] font-semibold text-bark-700 transition hover:border-bark-300 hover:bg-cream-light/60"
                    >
                        {q}
                    </button>
                ))}
            </div>

            {/* Messages Body */}
            <div className="flex-1 p-3.5 overflow-y-auto space-y-3 mb-scroll bg-paper/60">
                {messages.map((msg) => (
                    <div key={msg.id} className="space-y-2">
                        <div
                            className={`flex gap-2 max-w-[92%] ${
                                msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''
                            }`}
                        >
                            <div
                                className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-mono font-bold flex-shrink-0 shadow-sm ${
                                    msg.sender === 'user'
                                        ? 'bg-bark-700 text-cream-light'
                                        : 'bg-paper border border-bark-100 text-bark-900'
                                    }`}
                            >
                                {msg.sender === 'user' ? <User size={12} /> : <Bot size={12} />}
                            </div>

                            <div
                                className={`p-2.5 rounded-xl text-xs leading-relaxed shadow-sm ${
                                    msg.sender === 'user'
                                        ? 'bg-bark-700 text-cream-light rounded-tr-none'
                                        : 'bg-paper border border-bark-100 text-bark-900 rounded-tl-none'
                                }`}
                            >
                                <FormattedMessageText text={msg.text} onNavigate={handleNavigate} isUser={msg.sender === 'user'} />
                            </div>
                        </div>

                        {msg.sender === 'ai' && msg.books && msg.books.length > 0 && (
                            <div className="ml-8 space-y-1.5">
                                <p className="font-mono text-[9px] uppercase tracking-wider text-bark-500">
                                    From the catalog
                                </p>
                                {msg.books.map((book) => (
                                    <BookMiniCard key={book.id} book={book} />
                                ))}
                            </div>
                        )}
                    </div>
                ))}

                {loading && (
                    <div className="flex items-center gap-2 text-xs p-2 rounded-lg w-fit font-mono shadow-sm bg-paper border border-bark-100 text-bark-500">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Searching catalog...
                    </div>
                )}

                {quotaError && (
                    <div className="p-2.5 rounded-lg text-xs flex items-center gap-2 shadow-sm bg-[#a8452f]/10 border border-[#a8452f]/30 text-[#8c3620]">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        <span>{quotaError}</span>
                    </div>
                )}

                <div ref={chatEndRef} />
            </div>

            {/* Input Form */}
            <form onSubmit={handleSend} className="p-2.5 bg-paper border-t border-bark-100 flex items-center gap-2">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask the library assistant..."
                    aria-label="Message the library assistant"
                    className="flex-1 px-3 py-2 rounded-lg border border-bark-100 bg-cream-light/40 text-xs text-bark-900 placeholder:text-bark-300 focus:outline-none focus:border-bark-500 focus:ring-2 focus:ring-tan-dark/50"
                />
                <Button
                    type="submit"
                    variant="primary"
                    disabled={loading || !input.trim()}
                    className="p-2 min-w-[36px] rounded-lg"
                    aria-label="Send message"
                >
                    <Send size={14} />
                </Button>
            </form>
        </div>
    );
}