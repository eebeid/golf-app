"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import Image from "next/image";

export default function SignInPage() {
    const [isLoading, setIsLoading] = useState(false);

    const handleSignIn = async (provider) => {
        setIsLoading(true);
        await signIn(provider, { callbackUrl: "/" });
    };

    return (
        <div
            className="fade-in"
            style={{
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "2rem",
            }}
        >
            <div
                className="glass-panel"
                style={{
                    maxWidth: "450px",
                    width: "100%",
                    padding: "3rem 2rem",
                    textAlign: "center",
                }}
            >
                <div
                    style={{
                        position: "relative",
                        width: "100px",
                        height: "100px",
                        margin: "0 auto 2rem",
                    }}
                >
                    <Image
                        src="/images/logo.png"
                        alt="Golf App Logo"
                        fill
                        style={{ objectFit: "contain" }}
                        priority
                    />
                </div>

                <h1
                    style={{
                        fontSize: "2rem",
                        marginBottom: "0.5rem",
                        color: "var(--accent)",
                    }}
                >
                    Admin Sign In
                </h1>
                <p
                    style={{
                        color: "var(--text-muted)",
                        marginBottom: "2rem",
                        lineHeight: "1.6",
                    }}
                >
                    Sign in with your authorized admin account to manage tournaments
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    <button
                        onClick={() => handleSignIn("google")}
                        disabled={isLoading}
                        className="btn"
                        style={{
                            width: "100%",
                            padding: "1rem",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "0.75rem",
                            fontSize: "1rem",
                        }}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24">
                            <path
                                fill="currentColor"
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                                fill="currentColor"
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                                fill="currentColor"
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            />
                            <path
                                fill="currentColor"
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            />
                        </svg>
                        Continue with Google
                    </button>

                    <button
                        onClick={() => handleSignIn("facebook")}
                        disabled={isLoading}
                        className="btn-outline"
                        style={{
                            width: "100%",
                            padding: "1rem",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "0.75rem",
                            fontSize: "1rem",
                        }}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24">
                            <path
                                fill="currentColor"
                                d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
                            />
                        </svg>
                        Continue with Facebook
                    </button>
                </div>

                <p
                    style={{
                        marginTop: "2rem",
                        fontSize: "0.85rem",
                        color: "var(--text-muted)",
                        lineHeight: "1.5",
                    }}
                >
                    Only authorized administrators can access this area. If you believe
                    you should have access, please contact the system administrator.
                </p>
            </div>
        </div>
    );
}
