import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, X, User, Loader2, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import { Button } from './ui/Button';

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
        <div className="fixed bottom-6 right-6 z-50 w-full max-w-sm bg-paper border border-bark-100 rounded-2xl shadow-lift overflow-hidden flex flex-col h-[480px] animate-in slideUp">
            {/* Header */}
            <div className="p-3.5 bg-cream-light/60 border-b border-bark-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-bark-700 text-cream-light shadow-sm">
                        <Bot size={16} />
                    </div>
                    <div>
                        <h3 className="text-xs font-bold text-bark-900 m-0">AI Assistant</h3>
                        <p className="font-mono text-[10px] text-bark-500 m-0">OpenAI Library Assistant</p>
                    </div>
                </div>
                <button onClick={onClose} className="p-1 rounded-lg text-bark-500 hover:text-bark-900 hover:bg-cream" title="Close">
                    <X size={16} />
                </button>
            </div>

            {/* Messages Body */}
            <div className="flex-1 p-3.5 overflow-y-auto space-y-3 mb-scroll bg-paper/60">
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex gap-2 max-w-[88%] ${
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
                            <p className="whitespace-pre-line m-0">{msg.text}</p>
                            {msg.tokens > 0 && (
                                <span className={`block mt-1 font-mono text-[9px] ${msg.sender === 'user' ? 'text-cream/80' : 'text-bark-500'}`}>
                                    Used: {msg.tokens} tokens
                                </span>
                            )}
                        </div>
                    </div>
                ))}

                {loading && (
                    <div className="flex items-center gap-2 text-xs p-2 rounded-lg w-fit font-mono shadow-sm bg-paper border border-bark-100 text-bark-500">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Processing...
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
                    placeholder="Ask AI librarian..."
                    className="flex-1 px-3 py-2 rounded-lg border border-bark-100 bg-cream-light/40 text-xs text-bark-900 placeholder:text-bark-300 focus:outline-none focus:border-bark-500"
                />
                <Button
                    type="submit"
                    variant="primary"
                    disabled={loading || !input.trim()}
                    className="p-2 min-w-[36px] rounded-lg"
                >
                    <Send size={14} />
                </Button>
            </form>
        </div>
    );
}
