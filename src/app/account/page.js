"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { User, Mail, Calendar, Trash2, Shield, Loader2 } from "lucide-react";

export default function AccountSettingsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    if (status === "loading") {
        return (
            <div className="container fade-in" style={{ padding: "4rem 20px", textAlign: "center" }}>
                <Loader2 className="animate-spin" size={40} style={{ margin: "0 auto" }} />
                <p style={{ marginTop: "1rem", color: "var(--text-muted)" }}>Loading...</p>
            </div>
        );
    }

    if (!session) {
        router.push("/auth/signin");
        return null;
    }

    return (
        <div className="container fade-in" style={{ maxWidth: "800px", margin: "0 auto", padding: "4rem 20px" }}>
            <h1 className="section-title" style={{ marginBottom: "2rem" }}>Account Settings</h1>

            {/* Profile Information */}
            <div className="glass-panel" style={{ padding: "2rem", marginBottom: "2rem" }}>
                <h2 style={{ fontSize: "1.5rem", marginBottom: "1.5rem", color: "var(--accent)" }}>
                    Profile Information
                </h2>

                <div style={{ display: "flex", alignItems: "center", gap: "2rem", marginBottom: "2rem" }}>
                    {session.user.image && (
                        <div style={{ position: "relative", width: "80px", height: "80px", borderRadius: "50%", overflow: "hidden" }}>
                            <Image
                                src={session.user.image}
                                alt={session.user.name || "User"}
                                fill
                                style={{ objectFit: "cover" }}
                            />
                        </div>
                    )}
                    <div>
                        <h3 style={{ fontSize: "1.3rem", marginBottom: "0.25rem" }}>{session.user.name}</h3>
                        <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>{session.user.email}</p>
                    </div>
                </div>

                <div style={{ display: "grid", gap: "1rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem", background: "var(--bg-card)", borderRadius: "var(--radius)" }}>
                        <User size={20} style={{ color: "var(--accent)" }} />
                        <div>
                            <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Name</div>
                            <div>{session.user.name || "Not provided"}</div>
                        </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem", background: "var(--bg-card)", borderRadius: "var(--radius)" }}>
                        <Mail size={20} style={{ color: "var(--accent)" }} />
                        <div>
                            <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Email</div>
                            <div>{session.user.email}</div>
                        </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem", background: "var(--bg-card)", borderRadius: "var(--radius)" }}>
                        <Shield size={20} style={{ color: "var(--accent)" }} />
                        <div>
                            <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Account ID</div>
                            <div style={{ fontSize: "0.85rem", fontFamily: "monospace" }}>{session.user.id}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Privacy & Data */}
            <div className="glass-panel" style={{ padding: "2rem", marginBottom: "2rem" }}>
                <h2 style={{ fontSize: "1.5rem", marginBottom: "1.5rem", color: "var(--accent)" }}>
                    Privacy & Data
                </h2>

                <div style={{ display: "grid", gap: "1rem" }}>
                    <Link
                        href="/privacy"
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "1rem",
                            background: "var(--bg-card)",
                            borderRadius: "var(--radius)",
                            textDecoration: "none",
                            color: "var(--text-main)",
                            transition: "all 0.2s",
                        }}
                        className="hover-card"
                    >
                        <div>
                            <div style={{ fontWeight: "600", marginBottom: "0.25rem" }}>Privacy Policy</div>
                            <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                                Learn how we protect your data
                            </div>
                        </div>
                        <span style={{ color: "var(--accent)" }}>→</span>
                    </Link>

                    <Link
                        href="/terms"
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "1rem",
                            background: "var(--bg-card)",
                            borderRadius: "var(--radius)",
                            textDecoration: "none",
                            color: "var(--text-main)",
                            transition: "all 0.2s",
                        }}
                        className="hover-card"
                    >
                        <div>
                            <div style={{ fontWeight: "600", marginBottom: "0.25rem" }}>Terms of Service</div>
                            <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                                Review our terms and conditions
                            </div>
                        </div>
                        <span style={{ color: "var(--accent)" }}>→</span>
                    </Link>
                </div>
            </div>

            {/* Danger Zone */}
            <div
                className="glass-panel"
                style={{
                    padding: "2rem",
                    borderLeft: "4px solid #ef4444",
                }}
            >
                <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem", color: "#ef4444" }}>
                    Danger Zone
                </h2>
                <p style={{ color: "var(--text-muted)", marginBottom: "1.5rem", lineHeight: "1.6" }}>
                    Once you delete your account, there is no going back. All your tournaments, scores, and data will be permanently removed.
                </p>

                <Link
                    href="/account/delete"
                    className="btn"
                    style={{
                        background: "#ef4444",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        padding: "0.75rem 1.5rem",
                    }}
                >
                    <Trash2 size={18} />
                    Delete My Account
                </Link>
            </div>

            <style jsx>{`
        .hover-card:hover {
          background: rgba(212, 175, 55, 0.1) !important;
          transform: translateX(4px);
        }
      `}</style>
        </div>
    );
}
