import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import AppleProvider from "next-auth/providers/apple"
import EmailProvider from "next-auth/providers/email"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import prisma from "@/lib/prisma"

const useSecureCookies = process.env.NEXTAUTH_URL?.startsWith('https://') || process.env.NODE_ENV === 'production';
const cookiePrefix = useSecureCookies ? "__Secure-" : "";
const hostPrefix = useSecureCookies ? "__Host-" : "";

export const authOptions = {
    cookies: {
        pkceCodeVerifier: {
            name: `${cookiePrefix}next-auth.pkce.code_verifier`,
            options: {
                httpOnly: true,
                sameSite: "none",
                path: "/",
                secure: useSecureCookies,
                maxAge: 900
            },
        },
        state: {
            name: `${cookiePrefix}next-auth.state`,
            options: {
                httpOnly: true,
                sameSite: "none",
                path: "/",
                secure: useSecureCookies,
                maxAge: 900
            },
        },
        nonce: {
            name: `${cookiePrefix}next-auth.nonce`,
            options: {
                httpOnly: true,
                sameSite: "none",
                path: "/",
                secure: useSecureCookies,
            },
        },
        csrfToken: {
            name: `${hostPrefix}next-auth.csrf-token`,
            options: {
                httpOnly: true,
                sameSite: "none",
                path: "/",
                secure: useSecureCookies,
            },
        },
        callbackUrl: {
            name: `${cookiePrefix}next-auth.callback-url`,
            options: {
                sameSite: "none",
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
    session: {
        strategy: "jwt",
    },
    callbacks: {
        async jwt({ token, user, trigger, session }) {
            if (user) {
                token.id = user.id;
            }
            return token;
        },
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
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id;
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
