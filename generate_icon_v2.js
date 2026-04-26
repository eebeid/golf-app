const sharp = require('sharp');

async function generate() {
    const input = 'public/images/pinplaced_primary_logo_transparent copy.png';
    
    try {
        // Create dark version
        await sharp({
            create: {
                width: 1024,
                height: 1024,
                channels: 4,
                background: { r: 10, g: 26, b: 15, alpha: 1 } // Dark Green
            }
        })
        .composite([
            { 
                input: await sharp(input).resize(700, 700, { fit: 'inside' }).toBuffer(),
                gravity: 'center'
            }
        ])
        .flatten({ background: '#0a1a0f' })
        .toFile('public/images/AppIcon-1024-Dark.png');

        // Create light version
        await sharp({
            create: {
                width: 1024,
                height: 1024,
                channels: 4,
                background: { r: 255, g: 255, b: 255, alpha: 1 } // White
            }
        })
        .composite([
            { 
                input: await sharp(input).resize(700, 700, { fit: 'inside' }).toBuffer(),
                gravity: 'center'
            }
        ])
        .flatten({ background: '#ffffff' })
        .toFile('public/images/AppIcon-1024-Light.png');

        console.log('Successfully generated new icons!');
    } catch (err) {
        console.error('Error:', err);
    }
}

generate();
