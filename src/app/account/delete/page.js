"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Trash2, AlertTriangle, Loader2 } from "lucide-react";

export default function AccountDeletionPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [confirmEmail, setConfirmEmail] = useState("");
    const [confirmText, setConfirmText] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState("");
    const [showConfirmation, setShowConfirmation] = useState(false);

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

    const handleDeleteAccount = async () => {
        if (confirmEmail !== session.user.email) {
            setError("Email does not match your account email");
            return;
        }

        if (confirmText !== "DELETE MY ACCOUNT") {
            setError('Please type "DELETE MY ACCOUNT" to confirm');
            return;
        }

        setIsDeleting(true);
        setError("");

        try {
            const response = await fetch(
                `/api/user/delete?userId=${session.user.id}&confirmEmail=${encodeURIComponent(confirmEmail)}`,
                {
                    method: "DELETE",
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to delete account");
            }

            // Sign out and redirect
            await signOut({ redirect: false });
            router.push("/?deleted=true");
        } catch (err) {
            setError(err.message);
            setIsDeleting(false);
        }
    };

    return (
        <div className="container fade-in" style={{ maxWidth: "700px", margin: "0 auto", padding: "4rem 20px" }}>
            <div className="glass-panel" style={{ padding: "2rem" }}>
                <div style={{ textAlign: "center", marginBottom: "2rem" }}>
                    <div
                        style={{
                            width: "80px",
                            height: "80px",
                            margin: "0 auto 1rem",
                            background: "rgba(239, 68, 68, 0.1)",
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <Trash2 size={40} style={{ color: "#ef4444" }} />
                    </div>
                    <h1 style={{ fontSize: "2rem", marginBottom: "0.5rem", color: "#ef4444" }}>
                        Delete Your Account
                    </h1>
                    <p style={{ color: "var(--text-muted)" }}>
                        This action cannot be undone. Please read carefully.
                    </p>
                </div>

                <div
                    style={{
                        padding: "1.5rem",
                        background: "rgba(239, 68, 68, 0.1)",
                        borderRadius: "var(--radius)",
                        borderLeft: "4px solid #ef4444",
                        marginBottom: "2rem",
                    }}
                >
                    <div style={{ display: "flex", gap: "1rem", alignItems: "start" }}>
                        <AlertTriangle size={24} style={{ color: "#ef4444", flexShrink: 0, marginTop: "2px" }} />
                        <div>
                            <h3 style={{ fontSize: "1.1rem", marginBottom: "0.5rem", color: "#ef4444" }}>
                                Warning: Permanent Data Deletion
                            </h3>
                            <p style={{ fontSize: "0.95rem", lineHeight: "1.6", marginBottom: "0.75rem" }}>
                                Deleting your account will permanently remove:
                            </p>
                            <ul style={{ fontSize: "0.9rem", lineHeight: "1.8", marginLeft: "1.5rem" }}>
                                <li>Your user profile and authentication data</li>
                                <li>All tournaments you have created</li>
                                <li>All players, scores, and leaderboards in your tournaments</li>
                                <li>Course information, tee times, and schedules</li>
                                <li>Photos, scorecards, and messages</li>
                                <li>Lodging and restaurant information</li>
                                <li>All settings and customizations</li>
                            </ul>
                            <p style={{ fontSize: "0.9rem", marginTop: "0.75rem", fontWeight: "600" }}>
                                This action is irreversible and cannot be undone.
                            </p>
                        </div>
                    </div>
                </div>

                {!showConfirmation ? (
                    <div style={{ textAlign: "center" }}>
                        <button
                            onClick={() => setShowConfirmation(true)}
                            className="btn"
                            style={{
                                background: "#ef4444",
                                padding: "1rem 2rem",
                                fontSize: "1rem",
                            }}
                        >
                            I Understand, Proceed with Deletion
                        </button>
                        <div style={{ marginTop: "1rem" }}>
                            <button
                                onClick={() => router.back()}
                                className="btn-outline"
                                style={{ padding: "0.75rem 1.5rem" }}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                ) : (
                    <div>
                        <div style={{ marginBottom: "1.5rem" }}>
                            <label
                                style={{
                                    display: "block",
                                    marginBottom: "0.5rem",
                                    fontWeight: "600",
                                    fontSize: "0.95rem",
                                }}
                            >
                                Confirm your email address
                            </label>
                            <input
                                type="email"
                                value={confirmEmail}
                                onChange={(e) => setConfirmEmail(e.target.value)}
                                placeholder={session.user.email}
                                style={{
                                    width: "100%",
                                    padding: "0.75rem",
                                    borderRadius: "var(--radius)",
                                    border: "1px solid var(--glass-border)",
                                    background: "var(--bg-card)",
                                    color: "var(--text-main)",
                                    fontSize: "1rem",
                                }}
                            />
                            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                                Current email: {session.user.email}
                            </p>
                        </div>

                        <div style={{ marginBottom: "1.5rem" }}>
                            <label
                                style={{
                                    display: "block",
                                    marginBottom: "0.5rem",
                                    fontWeight: "600",
                                    fontSize: "0.95rem",
                                }}
                            >
                                Type "DELETE MY ACCOUNT" to confirm
                            </label>
                            <input
                                type="text"
                                value={confirmText}
                                onChange={(e) => setConfirmText(e.target.value)}
                                placeholder="DELETE MY ACCOUNT"
                                style={{
                                    width: "100%",
                                    padding: "0.75rem",
                                    borderRadius: "var(--radius)",
                                    border: "1px solid var(--glass-border)",
                                    background: "var(--bg-card)",
                                    color: "var(--text-main)",
                                    fontSize: "1rem",
                                }}
                            />
                        </div>

                        {error && (
                            <div
                                style={{
                                    padding: "1rem",
                                    background: "rgba(239, 68, 68, 0.1)",
                                    borderRadius: "var(--radius)",
                                    color: "#ef4444",
                                    marginBottom: "1.5rem",
                                    fontSize: "0.9rem",
                                }}
                            >
                                {error}
                            </div>
                        )}

                        <div style={{ display: "flex", gap: "1rem", flexDirection: "column" }}>
                            <button
                                onClick={handleDeleteAccount}
                                disabled={isDeleting}
                                className="btn"
                                style={{
                                    background: "#ef4444",
                                    padding: "1rem",
                                    fontSize: "1rem",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: "0.5rem",
                                    opacity: isDeleting ? 0.6 : 1,
                                }}
                            >
                                {isDeleting ? (
                                    <>
                                        <Loader2 className="animate-spin" size={20} />
                                        Deleting Account...
                                    </>
                                ) : (
                                    <>
                                        <Trash2 size={20} />
                                        Permanently Delete My Account
                                    </>
                                )}
                            </button>

                            <button
                                onClick={() => {
                                    setShowConfirmation(false);
                                    setConfirmEmail("");
                                    setConfirmText("");
                                    setError("");
                                }}
                                disabled={isDeleting}
                                className="btn-outline"
                                style={{ padding: "0.75rem" }}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}

                <div
                    style={{
                        marginTop: "2rem",
                        padding: "1rem",
                        background: "var(--bg-card)",
                        borderRadius: "var(--radius)",
                        fontSize: "0.85rem",
                        color: "var(--text-muted)",
                        textAlign: "center",
                    }}
                >
                    <p>
                        Need help or have questions?{" "}
                        <a href="mailto:support@golftournamentmanager.com" style={{ color: "var(--accent)" }}>
                            Contact Support
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
}
