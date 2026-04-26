import { NextResponse } from 'next/server';

export default async function middleware(req) {
    const { pathname } = req.nextUrl;

    // 1. HTTPS enforcement in production
    const proto = req.headers.get('x-forwarded-proto');
    if (process.env.NODE_ENV === 'production' && proto === 'http') {
        const url = req.nextUrl.clone();
        url.protocol = 'https:';
        return NextResponse.redirect(url);
    }

    // 2. Protect admin/account routes by checking for a session cookie.
    //    NOTE: We use strategy:"database" so NextAuth stores an opaque session token
    //    (not a JWT) in the cookie. The Edge runtime cannot query the DB to validate
    //    it, so we check for the cookie's *presence* here as a lightweight gate.
    //    Full session validation happens in API routes (getServerSession) and
    //    client components (useSession). If the cookie is missing the user is
    //    definitely not logged in and we redirect immediately.
    const isProtected =
        pathname.includes('/admin') ||
        pathname.includes('/super-admin') ||
        pathname.includes('/account');

    if (isProtected) {
        // NextAuth v4 database-session cookie name
        const useSecureCookies = process.env.NODE_ENV === 'production';
        const sessionCookieName = useSecureCookies
            ? '__Secure-next-auth.session-token'
            : 'next-auth.session-token';

        const sessionCookie = req.cookies.get(sessionCookieName);

        if (!sessionCookie?.value) {
            const signInUrl = req.nextUrl.clone();
            signInUrl.pathname = '/auth/signin';
            signInUrl.searchParams.set('callbackUrl', req.nextUrl.pathname);
            return NextResponse.redirect(signInUrl);
        }
    }

    // 3. AWS Lightsail Container Services Fix (overwriting Host header)
    let response = NextResponse.next();
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
        script-src 'self' 'unsafe-inline' 'unsafe-eval' https://maps.googleapis.com https://accounts.google.com https://appleid.cdn-apple.com https://www.googletagmanager.com;
        style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
        img-src * 'self' data: blob: https:;
        font-src 'self' https://fonts.gstatic.com;
        object-src 'none';
        base-uri 'self';
        form-action 'self';
        frame-ancestors 'none';
        frame-src https://accounts.google.com https://appleid.apple.com https://*.google.com https://*.googleapis.com;
        connect-src 'self' https://maps.googleapis.com https://*.pusher.com wss://*.pusher.com https://www.google-analytics.com;
    `.replace(/\s{2,}/g, ' ').trim();

    response.headers.set('Content-Security-Policy', cspHeader);
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self "https://maps.googleapis.com"), interest-cohort=()');
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');

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
