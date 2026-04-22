import { withAuth } from "next-auth/middleware"
import { NextResponse } from 'next/server';

const authMiddleware = withAuth({
    pages: {
        signIn: '/auth/signin',
    }
});

export default async function middleware(req, event) {
    const { pathname } = req.nextUrl;

    // 1. HTTPS enforcement in production
    const proto = req.headers.get('x-forwarded-proto');
    if (process.env.NODE_ENV === 'production' && proto === 'http') {
        const url = req.nextUrl.clone();
        url.protocol = 'https:';
        return NextResponse.redirect(url);
    }

    // 2. Run Auth Middleware for protected routes
    let response;
    if (pathname.includes('/admin') || pathname.includes('/super-admin') || pathname.includes('/account')) {
        response = await authMiddleware(req, event);
    }
    
    if (!response) {
        response = NextResponse.next();
    }

    // 3. AWS Lightsail Container Services Fix (overwriting Host header)
    if (response?.headers.has("Location")) {
        let location = response.headers.get("Location");
        if (location && location.includes(".cs.amazonlightsail.com")) {
            const canonicalUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
            const canonicalHost = new URL(canonicalUrl).host;
            location = location.replace(/https:\/\/[^/]+\.cs\.amazonlightsail\.com/g, canonicalUrl);
            location = location.replace(/%3A%2F%2F[^%]+\.cs\.amazonlightsail\.com/g, `%3A%2F%2F${canonicalHost}`);
            response.headers.set("Location", location);
        }
    }

    // 4. Global Security Headers
    const cspHeader = `
        default-src 'self';
        script-src 'self' 'unsafe-inline' 'unsafe-eval' https://maps.googleapis.com https://accounts.google.com https://appleid.cdn-apple.com;
        style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
        img-src 'self' blob: data: https:;
        font-src 'self' https://fonts.gstatic.com;
        object-src 'none';
        base-uri 'self';
        form-action 'self';
        frame-ancestors 'none';
        frame-src https://accounts.google.com https://appleid.apple.com;
        connect-src 'self' https://maps.googleapis.com https://*.pusher.com wss://*.pusher.com;
    `.replace(/\s{2,}/g, ' ').trim();

    if (response && response.headers) {
        response.headers.set('Content-Security-Policy', cspHeader);
        response.headers.set('X-Frame-Options', 'DENY');
        response.headers.set('X-Content-Type-Options', 'nosniff');
        response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
        response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self "https://maps.googleapis.com"), interest-cohort=()');
        response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    }

    return response;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api/auth (NextAuth needs its own headers/cookies)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api/auth|_next/static|_next/image|favicon.ico).*)',
    ]
}
