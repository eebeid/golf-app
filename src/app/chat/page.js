"use client";

import { useState, useEffect, useRef } from 'react';
import { Send } from 'lucide-react';
import { useSession, signIn, signOut } from "next-auth/react";

export default function ChatPage() {
    const { data: session, status } = useSession();
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef(null);

    const isAuthenticated = status === "authenticated";

    // Initial load and polling
    useEffect(() => {
        if (isAuthenticated) {
            fetchMessages();
            const interval = setInterval(fetchMessages, 3000); // Poll every 3 seconds
            return () => clearInterval(interval);
        }
    }, [isAuthenticated]);

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
        if (!message.trim()) return;

        const newMessage = { text: message };
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

    if (status === "loading") {
        return <div className="fade-in" style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>;
    }

    if (!isAuthenticated) {
        return (
            <div className="fade-in" style={{
                height: 'calc(100vh - 100px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '1rem'
            }}>
                <div className="card" style={{ maxWidth: '400px', width: '100%', textAlign: 'center' }}>
                    <h1 style={{ marginBottom: '1.5rem', color: 'var(--accent)' }}>Join the Chat</h1>
                    <p style={{ marginBottom: '2rem', color: 'var(--text-muted)' }}>
                        Please sign in to view and send messages.
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <button onClick={() => signIn('google')} className="btn" style={{ width: '100%', background: '#fff', color: '#000' }}>
                            Sign in with Google
                        </button>
                        <button onClick={() => signIn('apple')} className="btn" style={{ width: '100%', background: '#000', color: '#fff' }}>
                            Sign in with Apple
                        </button>
                    </div>
                </div>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h1 className="section-title" style={{ margin: 0 }}>Player Chat</h1>
                <button onClick={() => signOut()} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', textDecoration: 'underline' }}>
                    Sign Out
                </button>
            </div>

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
                            const isMe = msg.user?.email === session.user.email;
                            const senderName = msg.user?.name || 'Unknown';
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
                                        {senderName}
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
                            placeholder={`Message as ${session.user.name}...`}
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
