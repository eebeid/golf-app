import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import util from 'util';
import path from 'path';

const execAsync = util.promisify(exec);

export async function POST(request) {
    try {
        const { url } = await request.json();
        
        if (!url) {
            return NextResponse.json({ error: 'URL is required' }, { status: 400 });
        }

        // Path to the python scraper 
        const scraperDir = path.join(process.cwd(), 'handicap-scraper');
        const scriptPath = path.join(scraperDir, 'main.py');
        
        // Execute the python script. Ensure python3 is used.
        // Assuming dependencies are installed globally or in environment.
        const command = `python3 ${scriptPath} --url "${url}"`;
        
        const { stdout, stderr } = await execAsync(command, { cwd: scraperDir });
        
        if (stderr && stderr.toLowerCase().includes('error')) {
            console.error('[Handicap Scraper]', stderr);
        }

        // The python script outputs JSON to stdout
        const data = JSON.parse(stdout);
        
        return NextResponse.json(data);
    } catch (error) {
        console.error('[Handicap API Error]', error);
        return NextResponse.json({ error: 'Failed to extract handicaps. Verify the URL is a valid HTML/PDF scorecard.', details: error.message }, { status: 500 });
    }
}
