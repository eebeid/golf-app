"use client";

import { useState, useEffect, useRef } from 'react';
import { Send, User } from 'lucide-react';

export default function ChatPage() {
    const [messages, setMessages] = useState([]);
    const [name, setName] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef(null);
    const [hasName, setHasName] = useState(false);

    // Initial load and polling
    useEffect(() => {
        fetchMessages();
        const interval = setInterval(fetchMessages, 3000); // Poll every 3 seconds
        return () => clearInterval(interval);
    }, []);

    // Scroll to bottom on new messages
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const fetchMessages = async () => {
        try {
            const res = await fetch('/api/chat');
            if (res.ok) {
                const data = await res.json();
                setMessages(data);
                setLoading(false);
            }
        } catch (error) {
            console.error('Error fetching messages:', error);
            setLoading(false);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!message.trim() || !name.trim()) return;

        const newMessage = { sender: name, text: message };

        // Optimistic UI update
        // setMessages(prev => [...prev, { ...newMessage, id: 'temp-' + Date.now(), createdAt: new Date().toISOString() }]);
        setMessage('');

        try {
            await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newMessage)
            });
            fetchMessages(); // Refresh immediately
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    const handleNameSubmit = (e) => {
        e.preventDefault();
        if (name.trim()) {
            setHasName(true);
            localStorage.setItem('chat_username', name);
        }
    };

    // Load name from local storage on mount
    useEffect(() => {
        const savedName = localStorage.getItem('chat_username');
        if (savedName) {
            setName(savedName);
            setHasName(true);
        }
    }, []);

    if (!hasName) {
        return (
            <div className="fade-in" style={{
                height: 'calc(100vh - 100px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '1rem'
            }}>
                <form onSubmit={handleNameSubmit} className="card" style={{ maxWidth: '400px', width: '100%', textAlign: 'center' }}>
                    <h1 style={{ marginBottom: '1.5rem', color: 'var(--accent)' }}>Join the Chat</h1>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem' }}>What&apos;s your name?</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter your name..."
                            autoFocus
                            style={{
                                width: '100%',
                                padding: '12px',
                                borderRadius: 'var(--radius)',
                                border: '1px solid var(--glass-border)',
                                background: 'var(--bg-dark)',
                                color: 'var(--text-main)',
                                fontSize: '1.1rem',
                                textAlign: 'center'
                            }}
                        />
                    </div>
                    <button type="submit" className="btn" disabled={!name.trim()} style={{ width: '100%' }}>
                        Join
                    </button>
                </form>
            </div>
        );
    }

    return (
        <div className="fade-in" style={{
            maxWidth: '800px',
            margin: '0 auto',
            height: 'calc(100vh - 100px)',
            display: 'flex',
            flexDirection: 'column',
            padding: '1rem'
        }}>
            <h1 className="section-title">Player Chat</h1>

            <div className="glass-panel" style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                position: 'relative'
            }}>
                {/* Messages Area */}
                <div style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '1.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem'
                }}>
                    {loading ? (
                        <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Loading messages...</div>
                    ) : messages.length === 0 ? (
                        <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '2rem' }}>
                            No messages yet. Be the first to say hello!
                        </div>
                    ) : (
                        messages.map((msg) => {
                            const isMe = msg.sender === name;
                            return (
                                <div key={msg.id} style={{
                                    alignSelf: isMe ? 'flex-end' : 'flex-start',
                                    maxWidth: '80%',
                                    marginBottom: '0.5rem'
                                }}>
                                    <div style={{
                                        fontSize: '0.75rem',
                                        color: 'var(--text-muted)',
                                        marginBottom: '0.25rem',
                                        textAlign: isMe ? 'right' : 'left',
                                        marginLeft: '0.5rem',
                                        marginRight: '0.5rem'
                                    }}>
                                        {msg.sender}
                                    </div>
                                    <div style={{
                                        padding: '0.8rem 1.2rem',
                                        borderRadius: '18px',
                                        borderBottomRightRadius: isMe ? '4px' : '18px',
                                        borderBottomLeftRadius: isMe ? '18px' : '4px',
                                        background: isMe ? 'var(--accent)' : 'rgba(255, 255, 255, 0.1)',
                                        color: isMe ? '#000' : 'var(--text-main)',
                                        boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                                    }}>
                                        {msg.text}
                                    </div>
                                </div>
                            );
                        })
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div style={{
                    padding: '1rem',
                    background: 'rgba(0, 0, 0, 0.2)',
                    borderTop: '1px solid var(--glass-border)'
                }}>
                    <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '0.75rem' }}>
                        <input
                            type="text"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Type a message..."
                            style={{
                                flex: 1,
                                padding: '12px',
                                borderRadius: '24px',
                                border: '1px solid var(--glass-border)',
                                background: 'var(--bg-dark)',
                                color: 'var(--text-main)',
                                fontSize: '1rem'
                            }}
                        />
                        <button
                            type="submit"
                            disabled={!message.trim()}
                            style={{
                                background: 'var(--accent)',
                                color: '#000',
                                border: 'none',
                                borderRadius: '50%',
                                width: '46px',
                                height: '46px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: message.trim() ? 'pointer' : 'default',
                                opacity: message.trim() ? 1 : 0.5,
                                transition: 'all 0.2s'
                            }}
                        >
                            <Send size={20} />
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
