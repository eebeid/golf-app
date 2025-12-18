const jwt = require('jsonwebtoken');
const fs = require('fs');

// Usage: node scripts/generate-apple-secret.js <path-to-p8-file> <team-id> <key-id> <client-id>
// Example: node scripts/generate-apple-secret.js ./AuthKey_123456.p8 TEAM123 KEY123 com.example.app

const args = process.argv.slice(2);

if (args.length !== 4) {
    console.error('Usage: node scripts/generate-apple-secret.js <path-to-p8-file> <team-id> <key-id> <client-id>');
    process.exit(1);
}

const [privateKeyPath, teamId, keyId, clientId] = args;

try {
    const privateKey = fs.readFileSync(privateKeyPath);

    const token = jwt.sign({}, privateKey, {
        algorithm: 'ES256',
        expiresIn: '180d', // 6 months (max allowed by Apple)
        audience: 'https://appleid.apple.com',
        issuer: teamId,
        subject: clientId,
        keyid: keyId,
    });

    console.log('\nAssign this value to APPLE_SECRET in your .env file:\n');
    console.log(token);
    console.log('\n(This token is valid for 6 months)\n');

} catch (error) {
    console.error('Error generating token:', error.message);
}
