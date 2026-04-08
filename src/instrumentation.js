export async function register() {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        try {
            await import('./sentry.server.config');
        } catch (e) {
            console.warn('[Sentry] Failed to load server config:', e.message);
        }
    }

    if (process.env.NEXT_RUNTIME === 'edge') {
        try {
            await import('./sentry.edge.config');
        } catch (e) {
            console.warn('[Sentry] Failed to load edge config:', e.message);
        }
    }
}
