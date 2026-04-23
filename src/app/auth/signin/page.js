"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";


export default function SignInPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [email, setEmail] = useState("");

    const handleSignIn = async (provider) => {
        setIsLoading(true);
        await signIn(provider, { callbackUrl: "/" });
    };

    const handleEmailSignIn = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        await signIn("email", { email, callbackUrl: "/" });
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
                <div style={{ width: "100px", height: "100px", margin: "0 auto 2rem" }}>
                    <img
                        src="/images/pinplaced_primary_logo_transparent.png"
                        alt="PinPlaced Logo"
                        style={{ width: "100px", height: "100px", objectFit: "contain" }}
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
                        onClick={() => handleSignIn("apple")}
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
                            background: "#000",
                            color: "#fff",
                            border: "1px solid #333"
                        }}
                    >
                        <svg width="20" height="20" viewBox="0 0 384 512">
                            <path
                                fill="currentColor"
                                d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"
                            />
                        </svg>
                        Continue with Apple
                    </button>

                    <div style={{ position: "relative", margin: "1rem 0", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                        <div style={{ position: "absolute", top: "50%", left: "0", right: "0", borderTop: "1px solid var(--glass-border)", zIndex: 1 }}></div>
                        <span style={{ position: "relative", zIndex: 2, background: "var(--bg-card)", padding: "0 10px" }}>OR</span>
                    </div>

                    <form onSubmit={handleEmailSignIn} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="mail@example.com"
                            required
                            disabled={isLoading}
                            className="input-field"
                            style={{
                                width: "100%",
                                padding: "1rem",
                                fontSize: "1rem",
                                borderRadius: "8px",
                                border: "1px solid var(--glass-border)",
                                background: "rgba(255, 255, 255, 0.05)",
                                color: "#fff",
                                textAlign: "center"
                            }}
                        />
                        <button
                            type="submit"
                            disabled={isLoading || !email}
                            className="btn"
                            style={{
                                width: "100%",
                                padding: "1rem",
                                fontSize: "1rem",
                                background: "var(--text-main)",
                                color: "#000"
                            }}
                        >
                            Sign In with Magic Link
                        </button>
                    </form>
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
