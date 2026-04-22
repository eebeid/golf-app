import { NextResponse } from 'next/server';
import { chromium } from 'playwright';
import prisma from '@/lib/prisma';

/**
 * Helper to handle cookie consent banners that block the UI.
 * GHIN often shows these on the login page, dashboard, and lookup pages.
 */
async function acceptCookies(page) {
    // Try up to 3 times — GHIN can re-show the banner after navigation
    for (let attempt = 0; attempt < 3; attempt++) {
        try {
            const acceptBtn = page.locator([
                '#onetrust-accept-btn-handler',
                'button:has-text("Accept All")',
                'button:has-text("Accept all cookies")',
                'button:has-text("Accept Cookies")',
                'button:has-text("I Accept")',
                'button:has-text("ACCEPT")',
                '[aria-label*="accept" i]',
                '.cookie-accept',
                '.ot-sdk-row button',
            ].join(', ')).first();

            const visible = await acceptBtn.isVisible({ timeout: 2000 }).catch(() => false);
            if (visible) {
                await acceptBtn.click({ force: true });
                await page.waitForTimeout(600); // Wait for overlay animation
            } else {
                break; // No banner visible — done
            }
        } catch {
            break; // Banner gone or never appeared
        }
    }
}

/**
 * Shared logic to launch a browser and navigate to the ready-to-search state.
 * Consistent across sync, test, and search actions.
 */
async function getGhinSession() {
    const isHeadless = process.env.GHIN_HEADLESS === 'true' || process.env.NODE_ENV === 'production';
    
    const browser = await chromium.launch({ 
        headless: isHeadless, 
        args: ['--no-sandbox', '--disable-setuid-sandbox'] 
    });
    
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
        // 1. Login
        await page.goto('https://www.ghin.com/login', { waitUntil: 'domcontentloaded' });
        await acceptCookies(page);
        
        const GHIN_EMAIL = process.env.GHIN_EMAIL;
        const GHIN_PASSWORD = process.env.GHIN_PASSWORD;
        
        if (!GHIN_EMAIL || !GHIN_PASSWORD) {
            throw new Error('GHIN_EMAIL or GHIN_PASSWORD environment variables are missing');
        }

        await page.fill('#emailOrGhin', GHIN_EMAIL);
        await page.fill('#password', GHIN_PASSWORD);
        await page.press('#password', 'Enter');
        
        // Wait for post-login state (Dashboard or Golfer Lookup)
        try {
            await page.waitForURL('**/dashboard/**', { timeout: 15000 });
        } catch (e) {
            console.log('[GHIN] Login may have landed on non-dashboard page, continuing...');
        }
        
        await acceptCookies(page); // Post-login dashboard banner
        
        // 2. Navigate to Lookup page
        // Try to find the link, but if it fails to appear, try direct navigation
        const golferLookupLink = page.locator('a[href*="/golfer-lookup"]').first();
        try {
            await golferLookupLink.waitFor({ state: 'visible', timeout: 8000 });
            await golferLookupLink.click();
        } catch (e) {
            console.log('[GHIN] Golfer Lookup link not found in sidebar, trying direct navigation...');
            await page.goto('https://www.ghin.com/golfer-lookup', { waitUntil: 'domcontentloaded' });
        }
        
        // Verify we are on the lookup page
        await page.waitForURL('**/golfer-lookup**', { timeout: 15000 });

        // 3. Navigate to All Golfers tab
        const allGolfersTab = page.locator('a[href*="/golfer-lookup/all-golfers"]').first();
        if (await allGolfersTab.isVisible({ timeout: 5000 })) {
            await allGolfersTab.click();
            await page.waitForURL('**/golfer-lookup/all-golfers**', { timeout: 10000 });
        }
        await acceptCookies(page); // Lookup-specific banner

        return { browser, page };
    } catch (e) {
        if (browser) await browser.close();
        throw e;
    }
}

async function syncAllPlayers(tournamentSlugOrId) {
    let t = await prisma.tournament.findUnique({ where: { slug: tournamentSlugOrId } });
    if (!t) t = await prisma.tournament.findUnique({ where: { id: tournamentSlugOrId } });
    if (!t) return { synced: 0, failed: 0, total: 0, results: [{ error: 'Tournament not found' }] };

    const allPlayers = await prisma.player.findMany({ where: { tournamentId: t.id } });
    const validPlayers = allPlayers.filter(p => p.ghin && p.ghin.trim() !== '');

    if (!validPlayers.length) return { synced: 0, failed: 0, total: 0, results: [] };

    let synced = 0, failed = 0;
    const results = [];
    let session;

    try {
        session = await getGhinSession();
        const { page } = session;
        const searchInput = 'input#search';
        await page.waitForSelector(searchInput, { state: 'visible', timeout: 20000 });

        for (const player of validPlayers) {
            try {
                await page.fill(searchInput, '');
                await page.fill(searchInput, player.ghin);

                const responsePromise = page.waitForResponse(
                    response => response.url().includes('golfers.json') && response.status() === 200,
                    { timeout: 10000 }
                );
                
                await page.press(searchInput, 'Enter');
                
                try {
                    await responsePromise;
                    await page.waitForTimeout(200); // Wait for React render
                } catch {
                    await page.waitForTimeout(1000); 
                }

                const indexSelector = 'a.item.index';
                const hasResult = await page.isVisible(indexSelector);
                
                if (hasResult) {
                    const hcpText = await page.locator(indexSelector).first().innerText();
                    const newHcp = parseFloat(hcpText);

                    if (!isNaN(newHcp)) {
                        await prisma.player.update({
                            where: { id: player.id },
                            data: { handicapIndex: newHcp }
                        });
                        results.push({ name: player.name, status: 'updated', ghin: player.ghin, handicapIndex: newHcp });
                        synced++;
                    } else {
                        throw new Error(`Invalid handicap: ${hcpText}`);
                    }
                } else {
                    results.push({ name: player.name, status: 'not_found', ghin: player.ghin });
                    failed++;
                }
            } catch (e) {
                results.push({ name: player.name, status: 'error', error: e.message });
                failed++;
            }
        }
    } catch (e) {
        console.error('[GHIN Sync] Critical failure:', e);
        results.push({ error: `Critical failure: ${e.message}` });
    } finally {
        if (session?.browser) await session.browser.close().catch(()=>{});
    }

    return { synced, failed, total: validPlayers.length, results };
}

async function testGhinLogin() {
    let session;
    try {
        session = await getGhinSession();
        return { success: true, message: 'GHIN connection verified' };
    } catch (e) {
        return { success: false, error: e.message };
    } finally {
        if (session?.browser) await session.browser.close().catch(()=>{});
    }
}

async function searchGhinGolfers(query, ghin) {
    let session;
    try {
        session = await getGhinSession();
        const { page } = session;
        const searchInput = 'input#search';
        await page.waitForSelector(searchInput, { state: 'visible', timeout: 10000 });
        await page.fill(searchInput, ghin || query);
        
        try {
            await page.waitForResponse(r => r.url().includes('golfers.json'), { timeout: 10000 });
            await page.waitForTimeout(500);
        } catch {}

        const golfers = await page.evaluate(() => {
            const rows = Array.from(document.querySelectorAll('.item-row'));
            return rows.map(row => ({
                name: row.querySelector('.item.name')?.innerText?.trim(),
                ghinNumber: row.querySelector('.item.ghin')?.innerText?.trim(),
                handicapIndex: parseFloat(row.querySelector('.item.index')?.innerText) || 0,
                association: row.querySelector('.item.association')?.innerText?.trim()
            }));
        });

        return { golfers };
    } catch (e) {
        return { golfers: [], error: e.message };
    } finally {
        if (session?.browser) await session.browser.close().catch(()=>{});
    }
}


export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const action = searchParams.get('action');
        const tournamentId = searchParams.get('tournamentId');


        switch (action) {
            case 'sync':
                if (!tournamentId) return NextResponse.json({ error: 'tournamentId required' }, { status: 400 });
                return NextResponse.json(await syncAllPlayers(tournamentId));
            case 'login_test':
                return NextResponse.json(await testGhinLogin());
            case 'search':
                return NextResponse.json(await searchGhinGolfers(
                    searchParams.get('query') || '', 
                    searchParams.get('ghin') || ''
                ));

            default:
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }
    } catch (error) {
        console.error('[GHIN API Error]:', error);
        return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const body = await request.json();
        if (body.action === 'refresh_session') {
            /**
             * GHIN uses a stateless automation approach here. 
             * Since we launch a fresh browser for every sync/test/search, 
             * the session is always "refreshed" by default.
             */
            return NextResponse.json({ status: 'ok', message: 'GHIN session is refreshed on every automation run' });
        }
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
