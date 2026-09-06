import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot, Send, X, User, Loader2, AlertCircle, Sparkles } from 'lucide-react';
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

function FormattedMessageText({ text, onNavigate }) {
    if (!text) return null;

    // Parse [Label](/path) into interactive navigation buttons
    const parts = [];
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    let lastIdx = 0;
    let match;

    while ((match = linkRegex.exec(text)) !== null) {
        if (match.index > lastIdx) {
            parts.push(text.slice(lastIdx, match.index));
        }
        const label = match[1];
        const path = match[2];
        parts.push(
            <button
                key={`${path}-${match.index}`}
                type="button"
                onClick={() => onNavigate(path)}
                className="inline-flex items-center text-primary-600 hover:text-primary-800 underline font-semibold transition px-1 py-0.5 rounded hover:bg-primary-50 text-xs"
            >
                {label}
            </button>
        );
        lastIdx = linkRegex.lastIndex;
    }

    if (lastIdx < text.length) {
        parts.push(text.slice(lastIdx));
    }

    return <div className="whitespace-pre-line m-0">{parts}</div>;
}

export default function AiChatWidget({ isOpen, onClose }) {
    const navigate = useNavigate();
    const [messages, setMessages] = useState([
        {
            id: 1,
            sender: 'ai',
            text: 'Hello! I am your SmartLib Library Assistant. I can search our catalog, recommend books, check your due dates, and guide you through the platform (like purchasing digital e-books or upgrading your pass). How can I assist you?',
            tokens: 0,
            books: [],
            provider: 'SmartLib AI',
        },
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [quotaError, setQuotaError] = useState(null);
    const [currentProvider, setCurrentProvider] = useState('SmartLib AI');
    const chatEndRef = useRef(null);

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
            const res = await api.sendAiMessage(promptText);
            const aiMsgText = res.message || res.response || 'I searched the catalog but could not compose an answer. Please try again.';
            const tokens = res.tokens_used || 0;
            const books = Array.isArray(res.books) ? res.books : [];
            const provider = res.provider || 'SmartLib AI';

            setCurrentProvider(provider);

            setMessages((prev) => [
                ...prev,
                { id: Date.now() + 1, sender: 'ai', text: aiMsgText, tokens, books, provider },
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
                        <div className="flex items-center gap-1.5">
                            <h3 className="text-xs font-bold text-bark-900 m-0">Library Assistant</h3>
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full bg-primary-50 text-[9px] font-medium text-primary-700 border border-primary-200">
                                <Sparkles size={9} /> {currentProvider}
                            </span>
                        </div>
                        <p className="font-mono text-[10px] text-bark-500 m-0">Live catalog & navigation guide</p>
                    </div>
                </div>
                <button onClick={onClose} className="p-1 rounded-lg text-bark-500 hover:text-bark-900 hover:bg-cream" title="Close" aria-label="Close assistant">
                    <X size={16} />
                </button>
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
                                <FormattedMessageText text={msg.text} onNavigate={handleNavigate} />
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