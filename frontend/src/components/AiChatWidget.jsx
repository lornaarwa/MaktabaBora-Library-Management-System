import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, X, User, Loader2, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

export default function AiChatWidget({ isOpen, onClose }) {
    const [messages, setMessages] = useState([
        {
            id: 1,
            sender: 'ai',
            text: 'Hello! I am your MaktabaBora AI Librarian Assistant. How can I help you find books or recommendations today?',
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
            const aiMsgText = res.data?.response || res.response || 'I recommended checking our catalog for top titles.';
            const tokens = res.data?.tokens_used || res.tokens_used || 150;

            setMessages((prev) => [
                ...prev,
                { id: Date.now() + 1, sender: 'ai', text: aiMsgText, tokens },
            ]);
        } catch (err) {
            if (err.status === 429) {
                setQuotaError('Daily AI token quota limit reached. Please try again tomorrow.');
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
        <div className="fixed bottom-6 right-6 z-50 w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[480px] animate-in slide-in-from-bottom duration-300">
            {/* Header */}
            <div className="p-3.5 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300">
                        <Bot className="w-4 h-4" />
                    </div>
                    <div>
                        <h3 className="text-xs font-bold text-zinc-100">AI Assistant</h3>
                        <p className="text-[10px] text-zinc-500 font-mono">OpenAI Library Assistant</p>
                    </div>
                </div>
                <button onClick={onClose} className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800">
                    <X className="w-4 h-4" />
                </button>
            </div>

            {/* Messages Body */}
            <div className="flex-1 p-3.5 overflow-y-auto space-y-3 bg-zinc-950/60">
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex gap-2 max-w-[88%] ${
                            msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''
                        }`}
                    >
                        <div
                            className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-mono font-bold flex-shrink-0 ${
                                msg.sender === 'user'
                                    ? 'bg-zinc-100 text-zinc-950'
                                    : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                            }`}
                        >
                            {msg.sender === 'user' ? <User className="w-3 h-3 text-zinc-950" /> : <Bot className="w-3 h-3 text-zinc-300" />}
                        </div>

                        <div
                            className={`p-2.5 rounded-xl text-xs leading-relaxed ${
                                msg.sender === 'user'
                                    ? 'bg-zinc-100 text-zinc-950 rounded-tr-none font-medium'
                                    : 'bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-tl-none'
                            }`}
                        >
                            <p className="whitespace-pre-line">{msg.text}</p>
                            {msg.tokens > 0 && (
                                <span className="text-[9px] text-zinc-500 block mt-1 font-mono">
                                    Used: {msg.tokens} tokens
                                </span>
                            )}
                        </div>
                    </div>
                ))}

                {loading && (
                    <div className="flex items-center gap-2 text-xs text-zinc-400 bg-zinc-900 border border-zinc-800 p-2 rounded-lg w-fit font-mono">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-400" /> Processing...
                    </div>
                )}

                {quotaError && (
                    <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 flex-shrink-0 text-zinc-400" />
                        <span>{quotaError}</span>
                    </div>
                )}

                <div ref={chatEndRef} />
            </div>

            {/* Input Form */}
            <form onSubmit={handleSend} className="p-2.5 border-t border-zinc-800 bg-zinc-900 flex items-center gap-2">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask AI librarian..."
                    className="flex-1 px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-700"
                />
                <button
                    type="submit"
                    disabled={loading || !input.trim()}
                    className="p-2 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 disabled:opacity-40 transition-all shadow-sm"
                >
                    <Send className="w-3.5 h-3.5 text-zinc-950" />
                </button>
            </form>
        </div>
    );
}
