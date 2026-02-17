"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { LogIn, LogOut, Settings, User, ChevronDown } from "lucide-react";

export default function AuthButton() {
    const { data: session, status } = useSession();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    if (status === "loading") {
        return <div style={{ padding: "0.5rem 1rem" }}>Loading...</div>;
    }

    if (session) {
        return (
            <div style={{ position: "relative" }} ref={dropdownRef}>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        padding: "0.5rem 1rem",
                        background: "rgba(212, 175, 55, 0.1)",
                        border: "1px solid var(--glass-border)",
                        borderRadius: "var(--radius)",
                        color: "var(--text-main)",
                        cursor: "pointer",
                        fontSize: "0.9rem",
                        transition: "all 0.2s",
                    }}
                >
                    <User size={16} />
                    <span className="desktop-only">{session.user?.name?.split(' ')[0] || 'Account'}</span>
                    <ChevronDown size={14} style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }} />
                </button>

                {isOpen && (
                    <div
                        className="glass-panel"
                        style={{
                            position: "absolute",
                            top: "calc(100% + 0.5rem)",
                            right: 0,
                            minWidth: "200px",
                            padding: "0.5rem",
                            zIndex: 1000,
                            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
                        }}
                    >
                        <div style={{ padding: "0.75rem", borderBottom: "1px solid var(--glass-border)", marginBottom: "0.5rem" }}>
                            <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Signed in as</div>
                            <div style={{ fontSize: "0.9rem", fontWeight: "600", marginTop: "0.25rem" }}>{session.user?.email}</div>
                        </div>

                        <Link
                            href="/account"
                            onClick={() => setIsOpen(false)}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "0.75rem",
                                padding: "0.75rem",
                                borderRadius: "var(--radius)",
                                textDecoration: "none",
                                color: "var(--text-main)",
                                transition: "all 0.2s",
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = "rgba(212, 175, 55, 0.1)"}
                            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                        >
                            <Settings size={16} />
                            <span>Account Settings</span>
                        </Link>

                        <button
                            onClick={() => {
                                setIsOpen(false);
                                signOut();
                            }}
                            style={{
                                width: "100%",
                                display: "flex",
                                alignItems: "center",
                                gap: "0.75rem",
                                padding: "0.75rem",
                                background: "transparent",
                                border: "none",
                                borderRadius: "var(--radius)",
                                color: "var(--text-main)",
                                cursor: "pointer",
                                fontSize: "0.9rem",
                                textAlign: "left",
                                transition: "all 0.2s",
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)"}
                            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                        >
                            <LogOut size={16} />
                            <span>Sign Out</span>
                        </button>
                    </div>
                )}
            </div>
        );
    }

    return (
        <button
            onClick={() => signIn()}
            className="btn"
            style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.5rem 1rem",
                fontSize: "0.9rem",
            }}
        >
            <LogIn size={16} />
            Admin Sign In
        </button>
    );
}
