import { NextResponse } from 'next/server';
import { chromium } from 'playwright';
import prisma from '@/lib/prisma';

async function syncAllPlayers(tournamentSlugOrId) {
    // 1. Resolve slug correctly to avoid Prisma 0-results
    let t = await prisma.tournament.findUnique({ where: { slug: tournamentSlugOrId } });
    if (!t) t = await prisma.tournament.findUnique({ where: { id: tournamentSlugOrId } });
    if (!t) return { synced: 0, failed: 0, total: 0, results: [{ error: 'Tournament not found' }] };

    // 2. Fetch all players and filter properly
    const allPlayers = await prisma.player.findMany({ where: { tournamentId: t.id } });
    const validPlayers = allPlayers.filter(p => p.ghin && p.ghin.trim() !== '');

    if (!validPlayers.length) return { synced: 0, failed: 0, total: 0, results: [] };

    const GHIN_EMAIL = process.env.GHIN_EMAIL;
    const GHIN_PASSWORD = process.env.GHIN_PASSWORD;

    console.log('[GHIN] Launching visible UI automation browser...');
    const browser = await chromium.launch({ headless: false, args: ['--no-sandbox', '--window-size=1024,768'] });
    const context = await browser.newContext();
    const page = await context.newPage();

    let synced = 0, failed = 0;
    const results = [];

    try {
        console.log('[GHIN UI] Step 1: Navigating to login...');
        await page.goto('https://www.ghin.com/login', { waitUntil: 'domcontentloaded' });
        
        console.log('[GHIN UI] Step 2: Accepting Cookies if present...');
        try {
            const acceptBtn = page.locator('#onetrust-accept-btn-handler, button:has-text("Accept All")').first();
            await acceptBtn.waitFor({ state: 'visible', timeout: 5000 });
            await acceptBtn.click({ force: true });
        } catch {}

        console.log('[GHIN UI] Step 3: Logging in...');
        await page.waitForSelector('#emailOrGhin', { state: 'visible', timeout: 15000 });
        await page.fill('#emailOrGhin', GHIN_EMAIL);
        await page.waitForTimeout(200);
        await page.fill('#password', GHIN_PASSWORD);
        await page.press('#password', 'Enter');
        
        console.log('[GHIN UI] Step 4: Loading Golfer Lookup...');
        await page.waitForSelector("a.nav__link[href='/golfer-lookup']", { timeout: 30000 });
        await page.goto('https://www.ghin.com/golfer-lookup/all-golfers', { waitUntil: 'load' });
        
        console.log('[GHIN UI] Step 5: Waiting for Search Field...');
        const searchInput = 'input#search';
        await page.waitForSelector(searchInput, { state: 'visible', timeout: 20000 });

        for (const player of validPlayers) {
            console.log(`[GHIN Sync] Processing ${player.name} (${player.ghin})...`);
            try {
                // Step 6: Enter GHIN
                await page.fill(searchInput, '');
                await page.fill(searchInput, player.ghin);

                // Wait specifically for the GHIN API to return the search JSON (blazing fast!)
                const responsePromise = page.waitForResponse(
                    response => response.url().includes('golfers.json') && response.status() === 200,
                    { timeout: 10000 }
                );
                
                await page.press(searchInput, 'Enter');
                
                try {
                    await responsePromise;
                    // Allow React 150ms to strictly parse the JSON and render the DOM row
                    await page.waitForTimeout(150);
                } catch {
                    console.log('Search API timeout, proceeding anyway to check DOM');
                    await page.waitForTimeout(1000);
                }

                // Step 7: Scrape Index
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
                        throw new Error(`Could not parse handicap ${hcpText}`);
                    }
                } else {
                    results.push({ name: player.name, status: 'not_found', error: `GHIN ${player.ghin} not found in search results` });
                    failed++;
                }

            } catch (e) {
                results.push({ name: player.name, status: 'error', error: e.message });
                failed++;
            }
        }
    } catch (e) {
        console.error('[GHIN UI] Critical failure', e);
        results.push({ error: `Critical UI Automation failure: ${e.message}` });
    } finally {
        await browser.close().catch(()=>{});
    }

    return { synced, failed, total: validPlayers.length, results };
}

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    if (searchParams.get('action') === 'sync') {
        const tournamentId = searchParams.get('tournamentId');
        if (!tournamentId) return NextResponse.json({ error: 'tournamentId required' }, { status: 400 });
        return NextResponse.json(await syncAllPlayers(tournamentId));
    }
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
