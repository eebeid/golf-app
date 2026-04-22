import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import AppleProvider from "next-auth/providers/apple"
import EmailProvider from "next-auth/providers/email"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import prisma from "@/lib/prisma"

export const authOptions = {
    adapter: PrismaAdapter(prisma),
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        }),
        AppleProvider({
            clientId: process.env.APPLE_ID,
            clientSecret: process.env.APPLE_SECRET,
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
            const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim().toLowerCase()) || [];

            // Always ensure Edmond is a Pro user automatically
            if (email === 'edebeid@gmail.com') {
                try {
                    if (user.id) {
                        await prisma.user.update({
                            where: { id: user.id },
                            data: { isPro: true }
                        });
                    }
                } catch (err) {
                    console.error("Error auto-upgrading edebeid@gmail.com:", err);
                }
            }

            // Security check: Only allow sign-ins from the admin list if it's configured
            // This prevents random users from creating accounts/sessions in our DB
            if (adminEmails.length > 0 && !adminEmails.includes(email)) {
                console.warn(`Blocked sign-in attempt from non-admin email: ${email}`);
                return false;
            }

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
