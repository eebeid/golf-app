import { withAuth } from "next-auth/middleware"

const authMiddleware = withAuth({
    pages: {
        signIn: '/auth/signin',
    }
});

export default async function middleware(req, event) {
    const response = await authMiddleware(req, event);

    // AWS Lightsail Container Services often overwrite the Host header
    // causing NextAuth to redirect to the internal .cs.amazonlightsail.com domain
    if (response?.headers.has("Location")) {
        let location = response.headers.get("Location");

        if (location && location.includes(".cs.amazonlightsail.com")) {
            const canonicalUrl = process.env.NEXTAUTH_URL || "https://pinplaced.com";
            const canonicalHost = new URL(canonicalUrl).host;

            // Replace the base origin
            location = location.replace(/https:\/\/[^/]+\.cs\.amazonlightsail\.com/g, canonicalUrl);

            // Replace URL-encoded instances in query parameters (like callbackUrl)
            // e.g. %3A%2F%2Fgolf-app-service.xxx.cs.amazonlightsail.com -> %3A%2F%2Fpinplaced.com
            location = location.replace(
                /%3A%2F%2F[^%]+\.cs\.amazonlightsail\.com/g,
                `%3A%2F%2F${canonicalHost}`
            );

            response.headers.set("Location", location);
        }
    }

    return response;
}

export const config = {
    matcher: [
        "/admin/:path*",
        "/t/:tournamentId/admin/:path*",
    ]
}
