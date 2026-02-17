"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { LogIn } from "lucide-react";

export default function FloatingSignIn() {
    const { data: session, status } = useSession();

    // Don't show if already signed in or still loading
    if (status === "loading" || session) {
        return null;
    }

    return (
        <Link
            href="/auth/signin"
            style={{
                position: "fixed",
                bottom: "2rem",
                right: "2rem",
                zIndex: 1000,
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "1rem 1.5rem",
                background: "var(--accent)",
                color: "#000",
                borderRadius: "50px",
                fontWeight: "600",
                boxShadow: "0 4px 20px rgba(212, 175, 55, 0.4)",
                textDecoration: "none",
                transition: "all 0.3s ease",
            }}
            className="floating-signin"
        >
            <LogIn size={20} />
            <span className="desktop-only">Admin Sign In</span>
        </Link>
    );
}
