import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import AppleProvider from "next-auth/providers/apple"
import EmailProvider from "next-auth/providers/email"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import prisma from "@/lib/prisma"

const useSecureCookies = process.env.NODE_ENV === 'production';
const cookiePrefix = useSecureCookies ? "__Secure-" : "";
const hostPrefix = useSecureCookies ? "__Host-" : "";
// In dev (http), sameSite must be 'lax' — browsers reject sameSite=none on non-secure contexts
const sameSitePolicy = useSecureCookies ? "none" : "lax";

export const authOptions = {
    cookies: {
        pkceCodeVerifier: {
            name: `${cookiePrefix}next-auth.pkce.code_verifier`,
            options: {
                httpOnly: true,
                sameSite: sameSitePolicy,
                path: "/",
                secure: useSecureCookies,
                maxAge: 900
            },
        },
        state: {
            name: `${cookiePrefix}next-auth.state`,
            options: {
                httpOnly: true,
                sameSite: sameSitePolicy,
                path: "/",
                secure: useSecureCookies,
                maxAge: 900
            },
        },
        nonce: {
            name: `${cookiePrefix}next-auth.nonce`,
            options: {
                httpOnly: true,
                sameSite: sameSitePolicy,
                path: "/",
                secure: useSecureCookies,
            },
        },
        csrfToken: {
            name: `${hostPrefix}next-auth.csrf-token`,
            options: {
                httpOnly: true,
                sameSite: sameSitePolicy,
                path: "/",
                secure: useSecureCookies,
            },
        },
        callbackUrl: {
            name: `${cookiePrefix}next-auth.callback-url`,
            options: {
                sameSite: sameSitePolicy,
                path: "/",
                secure: useSecureCookies,
            },
        }
    },
    adapter: PrismaAdapter(prisma),
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            allowDangerousEmailAccountLinking: true,
        }),
        AppleProvider({
            clientId: process.env.APPLE_ID,
            clientSecret: process.env.APPLE_SECRET,
            allowDangerousEmailAccountLinking: true,
        }),
        EmailProvider({
            server: {
                host: "smtp.resend.com",
                port: 465,
                auth: {
                    user: "resend",
                    pass: process.env.RESEND_API_KEY
                }
            },
            from: process.env.EMAIL_FROM || "onboarding@resend.dev"
        })
    ],
    // Using database sessions (required when PrismaAdapter is set).
    // JWT strategy + database adapter causes session lookup failures → login loop.
    session: {
        strategy: "database",
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },
    callbacks: {
        async signIn({ user }) {
            const email = user.email?.toLowerCase();

            // Auto-upgrade owner accounts to Pro
            const ownerEmails = ['edebeid@gmail.com', 'eebeid@blueechostudios.com'];
            if (ownerEmails.includes(email)) {
                try {
                    if (user.id) {
                        await prisma.user.update({
                            where: { id: user.id },
                            data: { isPro: true }
                        });
                    }
                } catch (err) {
                    console.error("Error auto-upgrading owner account:", err);
                }
            }

            // Allow all users to sign in
            return true;
        },
        async session({ session, user }) {
            // With database sessions, `user` (not `token`) contains the DB record
            if (session.user) {
                session.user.id = user.id;
            }
            return session;
        }
    },
    pages: {
        signIn: '/auth/signin',
    },
    secret: process.env.NEXTAUTH_SECRET,
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
