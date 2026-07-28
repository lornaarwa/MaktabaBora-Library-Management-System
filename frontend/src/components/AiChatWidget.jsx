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
        <div className="fixed bottom-6 right-6 z-50 w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[480px] animate-in slideUp" style={{ border: '1px solid var(--lightest-gray)' }}>
            {/* Header */}
            <div className="p-3.5 flex items-center justify-between" style={{ backgroundColor: 'var(--lightest-gray)', borderBottom: '1px solid var(--lighter-gray)' }}>
                <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg text-white shadow-sm" style={{ backgroundColor: 'var(--primary)' }}>
                        <Bot size={16} color="white" />
                    </div>
                    <div>
                        <h3 className="body-small font-bold" style={{ color: 'var(--black)', margin: 0 }}>AI Assistant</h3>
                        <p className="caption" style={{ margin: 0 }}>OpenAI Library Assistant</p>
                    </div>
                </div>
                <button onClick={onClose} className="p-1 rounded-lg" style={{ color: 'var(--dark-gray)' }} title="Close">
                    <X size={16} />
                </button>
            </div>

            {/* Messages Body */}
            <div className="flex-1 p-3.5 overflow-y-auto space-y-3" style={{ backgroundColor: '#F8FAFC' }}>
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex gap-2 max-w-[88%] ${
                            msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''
                        }`}
                    >
                        <div
                            className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-mono font-bold flex-shrink-0 shadow-sm"
                            style={{ 
                                backgroundColor: msg.sender === 'user' ? 'var(--primary)' : 'var(--white)',
                                color: msg.sender === 'user' ? 'var(--white)' : 'var(--primary-dark)',
                                border: msg.sender === 'user' ? 'none' : '1px solid var(--lighter-gray)'
                            }}
                        >
                            {msg.sender === 'user' ? <User size={12} color="white" /> : <Bot size={12} />}
                        </div>

                        <div
                            className={`p-2.5 rounded-xl text-sm leading-relaxed shadow-sm ${
                                msg.sender === 'user' ? 'rounded-tr-none' : 'rounded-tl-none'
                            }`}
                            style={{ 
                                backgroundColor: msg.sender === 'user' ? 'var(--primary)' : 'var(--white)',
                                color: msg.sender === 'user' ? 'var(--white)' : 'var(--dark-gray)',
                                border: msg.sender === 'user' ? 'none' : '1px solid var(--lighter-gray)'
                            }}
                        >
                            <p className="whitespace-pre-line" style={{ margin: 0 }}>{msg.text}</p>
                            {msg.tokens > 0 && (
                                <span className="caption block mt-1" style={{ color: msg.sender === 'user' ? 'var(--primary-lightest)' : 'var(--medium-gray)', textTransform: 'none' }}>
                                    Used: {msg.tokens} tokens
                                </span>
                            )}
                        </div>
                    </div>
                ))}

                {loading && (
                    <div className="flex items-center gap-2 text-xs p-2 rounded-lg w-fit font-mono shadow-sm" style={{ backgroundColor: 'var(--white)', color: 'var(--medium-gray)', border: '1px solid var(--lighter-gray)' }}>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Processing...
                    </div>
                )}

                {quotaError && (
                    <div className="p-2.5 rounded-lg text-xs flex items-center gap-2 shadow-sm" style={{ backgroundColor: '#FEE2E2', color: '#991B1B', border: '1px solid #F87171' }}>
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        <span>{quotaError}</span>
                    </div>
                )}

                <div ref={chatEndRef} />
            </div>

            {/* Input Form */}
            <form onSubmit={handleSend} className="p-2.5 flex items-center gap-2" style={{ backgroundColor: 'var(--white)', borderTop: '1px solid var(--lighter-gray)' }}>
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask AI librarian..."
                    className="flex-1 px-3 py-2 rounded-lg focus:outline-none"
                    style={{ 
                        backgroundColor: 'var(--lightest-gray)', 
                        border: '1px solid var(--lighter-gray)', 
                        color: 'var(--black)',
                        fontSize: '14px'
                    }}
                />
                <Button
                    type="submit"
                    variant="primary"
                    disabled={loading || !input.trim()}
                    style={{ padding: '8px', minWidth: '40px', borderRadius: '8px' }}
                >
                    <Send size={16} />
                </Button>
            </form>
        </div>
    );
}
