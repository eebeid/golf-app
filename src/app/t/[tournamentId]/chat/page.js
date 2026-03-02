"use client";

import { useSession, signIn } from 'next-auth/react';
import { useState, useEffect, useRef } from 'react';
import { Send, User as UserIcon } from 'lucide-react';
import Image from 'next/image';


export default function ChatPage() {
    const { data: session, status } = useSession();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const fetchMessages = async () => {
        try {
            const res = await fetch('/api/chat');
            if (res.ok) {
                const data = await res.json();
                setMessages(data);
            }
        } catch (error) {
            console.error('Error fetching messages:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchMessages();
        // Poll for new messages every 5 seconds
        const interval = setInterval(fetchMessages, 5000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !session) return;

        setIsSending(true);
        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text: newMessage }),
            });

            if (res.ok) {
                setNewMessage('');
                fetchMessages();
            }
        } catch (error) {
            console.error('Error sending message:', error);
        } finally {
            setIsSending(false);
        }
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    if (status === "loading") {
        return (
            <div className="flex-center" style={{ height: '50vh' }}>
                <div className="spinner"></div>
            </div>
        );
    }

    if (!session) {
        return (
            <div className="fade-in" style={{
                height: 'calc(100vh - 200px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: '1.5rem'
            }}>
                <div className="card" style={{ textAlign: 'center', padding: '3rem', maxWidth: '400px' }}>
                    <h2 style={{ marginBottom: '1rem', color: 'var(--accent)' }}>Tournament Chat</h2>
                    <p style={{ marginBottom: '2rem', color: 'var(--text-muted)' }}>
                        Sign in to connect with other players, discuss the tournament, and share updates.
                    </p>
                    <button
                        onClick={() => signIn('google')}
                        className="btn-primary"
                        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                    >
                        <UserIcon size={20} />
                        Sign in with Google
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fade-in" style={{
            height: 'calc(100vh - 140px)',
            display: 'flex',
            flexDirection: 'column',
            maxWidth: '800px',
            margin: '0 auto'
        }}>
            <div className="glass-panel" style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                position: 'relative',
                borderRadius: '1rem'
            }}>
                {/* Header */}
                <div style={{
                    padding: '1rem',
                    borderBottom: '1px solid rgba(255,255,255,0.1)',
                    background: 'rgba(0,0,0,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <h2 style={{ fontSize: '1.2rem', margin: 0 }}>Tournament Chat</h2>
                </div>

                {/* Messages Area */}
                <div style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem'
                }}>
                    {isLoading && messages.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                            Loading messages...
                        </div>
                    ) : messages.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                            No messages yet. Be the first to say hello!
                        </div>
                    ) : (
                        messages.map((msg) => {
                            const isMe = msg.user?.email === session.user?.email;

                            return (
                                <div key={msg.id} style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: isMe ? 'flex-end' : 'flex-start',
                                    maxWidth: '80%'
                                }}>
                                    <div style={{
                                        display: 'flex',
                                        gap: '0.5rem',
                                        marginBottom: '0.2rem',
                                        flexDirection: isMe ? 'row-reverse' : 'row',
                                        alignItems: 'center',
                                        fontSize: '0.8rem',
                                        color: 'var(--text-muted)'
                                    }}>
                                        <span>{msg.user?.name || 'Unknown User'}</span>
                                        <span>•</span>
                                        <span>{formatTime(msg.createdAt)}</span>
                                    </div>
                                    <div style={{
                                        padding: '0.8rem 1rem',
                                        borderRadius: '1rem',
                                        background: isMe ? 'var(--accent)' : 'rgba(255,255,255,0.1)',
                                        color: isMe ? '#000' : 'var(--text-main)',
                                        borderBottomRightRadius: isMe ? '0.2rem' : '1rem',
                                        borderBottomLeftRadius: isMe ? '1rem' : '0.2rem',
                                        wordBreak: 'break-word',
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
                <form onSubmit={handleSendMessage} style={{
                    padding: '1rem',
                    borderTop: '1px solid rgba(255,255,255,0.1)',
                    background: 'rgba(0,0,0,0.2)',
                    display: 'flex',
                    gap: '0.5rem'
                }}>
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        style={{
                            flex: 1,
                            padding: '0.8rem 1rem',
                            borderRadius: '2rem',
                            border: '1px solid rgba(255,255,255,0.2)',
                            background: 'rgba(0,0,0,0.2)',
                            color: 'var(--text-main)',
                            fontSize: '1rem',
                            outline: 'none'
                        }}
                    />
                    <button
                        type="submit"
                        disabled={!newMessage.trim() || isSending}
                        style={{
                            background: 'var(--accent)',
                            color: '#000',
                            border: 'none',
                            width: '45px',
                            height: '45px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: (!newMessage.trim() || isSending) ? 'not-allowed' : 'pointer',
                            opacity: (!newMessage.trim() || isSending) ? 0.7 : 1,
                            transition: 'all 0.2s ease'
                        }}
                    >
                        <Send size={20} />
                    </button>
                </form>
            </div>
        </div>
    );
}
