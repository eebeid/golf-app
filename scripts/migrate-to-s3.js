const { PrismaClient } = require('@prisma/client');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();
const s3Client = new S3Client({
    region: process.env.AWS_S3_REGION,
    credentials: {
        accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY,
    },
});

async function uploadToS3(base64String, fileName) {
    const base64Data = base64String.split(',')[1];
    const contentType = base64String.split(';')[0].split(':')[1];
    const buffer = Buffer.from(base64Data, 'base64');
    const bucketName = process.env.AWS_S3_BUCKET_NAME;

    const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: fileName,
        Body: buffer,
        ContentType: contentType,
    });

    await s3Client.send(command);
    return `https://${bucketName}.s3.${process.env.AWS_S3_REGION}.amazonaws.com/${fileName}`;
}

async function migrate() {
    console.log('🚀 Starting S3 Migration...');

    // 1. Migrate Players
    const players = await prisma.player.findMany({
        where: {
            imageUrl: { startsWith: 'data:image/' }
        }
    });

    console.log(`📸 Found ${players.length} players with Base64 images.`);

    for (const player of players) {
        try {
            const fileName = `players/${player.id}-${Date.now()}.jpg`;
            const s3Url = await uploadToS3(player.imageUrl, fileName);
            
            await prisma.player.update({
                where: { id: player.id },
                data: { imageUrl: s3Url }
            });
            
            console.log(`✅ Migrated player: ${player.name}`);
        } catch (error) {
            console.error(`❌ Failed to migrate player ${player.name}:`, error.message);
        }
    }

    // 2. Migrate Gallery Photos
    const photos = await prisma.photo.findMany({
        where: {
            url: { startsWith: 'data:image/' }
        }
    });

    console.log(`🖼️ Found ${photos.length} gallery photos with Base64 data.`);

    for (const photo of photos) {
        try {
            const fileName = `gallery/${photo.id}-${Date.now()}.jpg`;
            const s3Url = await uploadToS3(photo.url, fileName);
            
            await prisma.photo.update({
                where: { id: photo.id },
                data: { url: s3Url }
            });
            
            console.log(`✅ Migrated photo: ${photo.id}`);
        } catch (error) {
            console.error(`❌ Failed to migrate photo ${photo.id}:`, error.message);
        }
    }

    console.log('🏁 Migration Complete!');
}

migrate()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
