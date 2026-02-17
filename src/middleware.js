export { default } from "next-auth/middleware"

export const config = {
    matcher: [
        "/admin/:path*",
        "/t/:tournamentId/admin/:path*",
    ]
}
