import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, X, Sparkles, User, Loader2, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

export default function AiChatWidget({ isOpen, onClose }) {
    const [messages, setMessages] = useState([
        {
            id: 1,
            sender: 'ai',
            text: 'Hello! I am your SmartLib AI Librarian Assistant. How can I help you find books or recommendations today?',
            tokens: 0,
        },
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [quotaError, setQuotaError] = useState(null);
    const chatEndRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isOpen]);

    if (!isOpen) return null;

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const userMsg = { id: Date.now(), sender: 'user', text: input };
        setMessages((prev) => [...prev, userMsg]);
        const promptText = input;
        setInput('');
        setLoading(true);
        setQuotaError(null);

        try {
            const res = await api.sendAiMessage(promptText);
            const aiMsgText = res.data?.response || res.response || 'I recommended checking our OPAC catalog for top titles.';
            const tokens = res.data?.tokens_used || res.tokens_used || 150;

            setMessages((prev) => [
                ...prev,
                { id: Date.now() + 1, sender: 'ai', text: aiMsgText, tokens },
            ]);
        } catch (err) {
            if (err.status === 429) {
                setQuotaError('Daily AI quota reached (20,000 tokens). Please try again tomorrow.');
            } else {
                setMessages((prev) => [
                    ...prev,
                    { id: Date.now() + 1, sender: 'ai', text: `Sorry, I encountered an error: ${err.message}` },
                ]);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[520px] animate-in slide-in-from-bottom duration-300">
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-indigo-950 via-slate-900 to-purple-950 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        <Bot className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                            SmartLib AI Assistant <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        </h3>
                        <p className="text-[10px] text-indigo-300">Powered by OpenAI & Daily Quota Guard</p>
                    </div>
                </div>
                <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800">
                    <X className="w-4 h-4" />
                </button>
            </div>

            {/* Messages Body */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-950/40">
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex gap-2.5 max-w-[85%] ${
                            msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''
                        }`}
                    >
                        <div
                            className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                                msg.sender === 'user'
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-slate-800 text-indigo-400 border border-slate-700'
                            }`}
                        >
                            {msg.sender === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                        </div>

                        <div
                            className={`p-3 rounded-2xl text-xs leading-relaxed ${
                                msg.sender === 'user'
                                    ? 'bg-indigo-600 text-white rounded-tr-none'
                                    : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none'
                            }`}
                        >
                            <p className="whitespace-pre-line">{msg.text}</p>
                            {msg.tokens > 0 && (
                                <span className="text-[9px] text-slate-400 block mt-1.5 font-mono">
                                    Used: {msg.tokens} tokens
                                </span>
                            )}
                        </div>
                    </div>
                ))}

                {loading && (
                    <div className="flex items-center gap-2 text-xs text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 p-2.5 rounded-2xl w-fit">
                        <Loader2 className="w-4 h-4 animate-spin" /> Thinking...
                    </div>
                )}

                {quotaError && (
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        <span>{quotaError}</span>
                    </div>
                )}

                <div ref={chatEndRef} />
            </div>

            {/* Input Form */}
            <form onSubmit={handleSend} className="p-3 border-t border-slate-800 bg-slate-900 flex items-center gap-2">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask for book recommendations..."
                    className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
                <button
                    type="submit"
                    disabled={loading || !input.trim()}
                    className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50 transition-all shadow-md shadow-indigo-600/20"
                >
                    <Send className="w-4 h-4" />
                </button>
            </form>
        </div>
    );
}
