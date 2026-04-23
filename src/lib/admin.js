export function isSuperAdmin(email) {
    if (!email) return false;
    const cleanEmail = email.trim().toLowerCase();

    // Hardcoded owner emails — always super admin regardless of env vars
    const ownerEmails = [
        'edebeid@gmail.com',
        'eebeid@blueechostudios.com'
    ];
    if (ownerEmails.includes(cleanEmail)) return true;

    // Additional admins from environment variable (comma-separated)
    const allowedAdmins = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim().toLowerCase()) || [];
    if (allowedAdmins.includes(cleanEmail)) return true;

    return false;
}
