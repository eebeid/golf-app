"use client";

import { useSession, signIn } from 'next-auth/react';
import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Send, User as UserIcon, Image as ImageIcon, X } from 'lucide-react';
import Image from 'next/image';


export default function ChatPage() {
    const { data: session, status } = useSession();
    const params = useParams();
    const tournamentId = params?.tournamentId;
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [image, setImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);
    const isAtBottomRef = useRef(true);

    const handleScroll = () => {
        if (messagesContainerRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
            isAtBottomRef.current = scrollHeight - clientHeight - scrollTop < 50;
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const fetchMessages = async () => {
        try {
            const res = await fetch(`/api/chat?tournamentId=${tournamentId}`);
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
        const fetchSettings = async () => {
            try {
                const res = await fetch(`/api/settings?tournamentId=${tournamentId}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data?.showChat === false) {
                        window.location.href = `/t/${tournamentId}`;
                    }
                }
            } catch (error) {
                console.error('Error fetching settings:', error);
            }
        };
        fetchSettings();

        fetchMessages();
        // Poll for new messages every 5 seconds
        const interval = setInterval(fetchMessages, 5000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (isAtBottomRef.current) {
            scrollToBottom();
        }
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if ((!newMessage.trim() && !image) || !session) return;

        setIsSending(true);
        try {
            let uploadedImageUrl = null;

            if (image) {
                const photoRes = await fetch('/api/photos', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url: image, caption: 'Shared in Chat', tournamentId })
                });
                if (photoRes.ok) {
                    const photoData = await photoRes.json();
                    uploadedImageUrl = photoData.url;
                }
            }

            const messageContent = JSON.stringify({
                text: newMessage.trim(),
                imageUrl: uploadedImageUrl
            });

            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text: messageContent, tournamentId }),
            });

            if (res.ok) {
                setNewMessage('');
                setImage(null);
                setImagePreview(null);
                isAtBottomRef.current = true;
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
                        onClick={() => window.location.href = '/auth/signin'}
                        className="btn-primary"
                        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                    >
                        <UserIcon size={20} />
                        Sign In to Chat
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fade-in" style={{
            height: 'calc(100dvh - 160px)',
            display: 'flex',
            flexDirection: 'column',
            maxWidth: '800px',
            margin: '0 auto',
            width: '100%',
        }}>
            <div className="glass-panel" style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                position: 'relative',
                borderRadius: '1rem',
                margin: '0 0.5rem',
                marginBottom: 'env(safe-area-inset-bottom)'
            }}>
                {/* Header */}
                <div style={{
                    padding: '0.75rem',
                    borderBottom: '1px solid rgba(255,255,255,0.1)',
                    background: 'rgba(0,0,0,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <h2 style={{ fontSize: '1.1rem', margin: 0 }}>Tournament Chat</h2>
                </div>

                {/* Messages Area */}
                <div 
                    ref={messagesContainerRef}
                    onScroll={handleScroll}
                    style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '1rem 0.75rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem'
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

                            let parsedMsg = { text: msg.text, imageUrl: null };
                            try {
                                const parsed = JSON.parse(msg.text);
                                if (parsed && typeof parsed === 'object') {
                                    parsedMsg = parsed;
                                }
                            } catch(e) {
                                // Fallback to plain text
                            }

                            return (
                                <div key={msg.id} style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignSelf: isMe ? 'flex-end' : 'flex-start',
                                    alignItems: isMe ? 'flex-end' : 'flex-start',
                                    maxWidth: '85%'
                                }}>
                                    <div style={{
                                        display: 'flex',
                                        gap: '0.4rem',
                                        marginBottom: '0.2rem',
                                        flexDirection: isMe ? 'row-reverse' : 'row',
                                        alignItems: 'center',
                                        fontSize: '0.75rem',
                                        color: 'var(--text-muted)'
                                    }}>
                                        <span>{msg.user?.name || 'Unknown User'}</span>
                                        <span>•</span>
                                        <span>{formatTime(msg.createdAt)}</span>
                                    </div>
                                    <div style={{
                                        padding: parsedMsg.imageUrl && !parsedMsg.text ? '0' : '0.6rem 0.8rem',
                                        borderRadius: '1rem',
                                        background: parsedMsg.imageUrl && !parsedMsg.text ? 'transparent' : (isMe ? 'var(--accent)' : 'rgba(255,255,255,0.1)'),
                                        color: isMe ? '#000' : 'var(--text-main)',
                                        borderBottomRightRadius: isMe ? '0.2rem' : '1rem',
                                        borderBottomLeftRadius: isMe ? '1rem' : '0.2rem',
                                        wordBreak: 'break-word',
                                        boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                                        fontSize: '0.95rem',
                                        lineHeight: '1.4'
                                    }}>
                                        {parsedMsg.imageUrl && (
                                            <img 
                                                src={parsedMsg.imageUrl} 
                                                alt="Shared image"
                                                style={{ 
                                                    maxWidth: '100%', 
                                                    borderRadius: '0.8rem', 
                                                    marginBottom: parsedMsg.text ? '0.5rem' : '0',
                                                    display: 'block'
                                                }} 
                                            />
                                        )}
                                        {parsedMsg.text && <span>{parsedMsg.text}</span>}
                                    </div>
                                </div>
                            );
                        })
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <form onSubmit={handleSendMessage} style={{
                    padding: '0.75rem',
                    borderTop: '1px solid rgba(255,255,255,0.1)',
                    background: 'rgba(0,0,0,0.2)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem'
                }}>
                    {imagePreview && (
                        <div style={{ position: 'relative', alignSelf: 'flex-start', marginBottom: '0.5rem' }}>
                            <img src={imagePreview} style={{ height: '80px', borderRadius: '0.5rem', border: '1px solid var(--glass-border)' }} />
                            <button
                                type="button"
                                onClick={() => { setImage(null); setImagePreview(null); }}
                                style={{
                                    position: 'absolute', top: '-10px', right: '-10px',
                                    background: 'rgba(0,0,0,0.8)', color: 'white',
                                    border: 'none', borderRadius: '50%', padding: '4px', cursor: 'pointer'
                                }}
                            >
                                <X size={14} />
                            </button>
                        </div>
                    )}
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <label style={{ cursor: 'pointer', color: 'var(--text-muted)', padding: '0.5rem' }}>
                            <ImageIcon size={24} />
                            <input 
                                type="file" 
                                accept="image/*" 
                                style={{ display: 'none' }} 
                                onChange={(e) => {
                                    const file = e.target.files[0];
                                    if (file) {
                                        const reader = new FileReader();
                                        reader.onloadend = () => {
                                            setImage(reader.result);
                                            setImagePreview(reader.result);
                                        };
                                        reader.readAsDataURL(file);
                                    }
                                }} 
                            />
                        </label>
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Type a message..."
                            style={{
                                flex: 1,
                                padding: '0.6rem 1rem',
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
                            disabled={(!newMessage.trim() && !image) || isSending}
                            style={{
                                background: 'var(--accent)',
                                color: '#000',
                                border: 'none',
                                width: '40px',
                                height: '40px',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: ((!newMessage.trim() && !image) || isSending) ? 'not-allowed' : 'pointer',
                                opacity: ((!newMessage.trim() && !image) || isSending) ? 0.7 : 1,
                                transition: 'all 0.2s ease',
                                flexShrink: 0
                            }}
                        >
                            <Send size={18} />
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
