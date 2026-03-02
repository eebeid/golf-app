import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import prisma from "@/lib/prisma"

export const authOptions = {
    adapter: PrismaAdapter(prisma),
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        }),
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
            // Access Control: Only allow specific admins
            const allowedAdmins = process.env.ADMIN_EMAILS?.split(',') || [];
            const email = user.email?.toLowerCase();

            if (!email || !allowedAdmins.map(e => e.trim().toLowerCase()).includes(email)) {
                console.log(`Access Denied for: ${email}`);
                return false; // Return false to display a default error message
            }

            // Always ensure Edmond is a Pro user automatically
            if (email === 'edebeid@gmail.com') {
                try {
                    // Update user.id directly if the user already exists in DB
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
