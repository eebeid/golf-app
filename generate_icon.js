const sharp = require('sharp');
const fs = require('fs');

async function generate() {
    const input = 'public/images/pinplaced_primary_logo_transparent.png';
    const output = 'public/images/AppIcon-1024.png';
    
    if (!fs.existsSync(input)) {
        console.error('Input file not found');
        return;
    }

    try {
        await sharp(input)
            .resize(1024, 1024, {
                fit: 'contain',
                background: { r: 255, g: 255, b: 255, alpha: 1 } // White background for App Store
            })
            // Remove alpha channel entirely as Apple rejects icons with transparency
            .flatten({ background: { r: 255, g: 255, b: 255 } })
            .toFormat('png')
            .toFile(output);
            
        console.log('Successfully generated AppIcon-1024.png');
    } catch (err) {
        console.error('Error:', err);
    }
}

generate();
