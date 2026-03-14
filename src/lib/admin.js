export function isSuperAdmin(email) {
    if (!email) return false;
    const cleanEmail = email.trim().toLowerCase();

    // Always allow the owner email as a fallback super admin
    if (cleanEmail === 'edebeid@gmail.com') return true;

    // Check environment variables securely
    const allowedAdmins = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim().toLowerCase()) || [];
    if (allowedAdmins.includes(cleanEmail)) return true;

    return false;
}
