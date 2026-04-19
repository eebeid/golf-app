import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
    region: process.env.AWS_S3_REGION,
    credentials: {
        accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY,
    },
});

/**
 * Uploads a file (Buffer) to S3 and returns the public URL.
 * @param {Buffer} fileBuffer - The file content
 * @param {string} fileName - The name of the file (including path/prefix)
 * @param {string} contentType - The MIME type (e.g., 'image/jpeg')
 * @returns {Promise<string>} - The public URL of the uploaded image
 */
export async function uploadToS3(fileBuffer, fileName, contentType) {
    const bucketName = process.env.AWS_S3_BUCKET_NAME;

    const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: fileName,
        Body: fileBuffer,
        ContentType: contentType,
        // Optional: If your bucket isn't public by default, you might need ACL: 'public-read'
        // ObjectLockEnabled: false 
    });

    await s3Client.send(command);

    // Return the URL based on the region and bucket
    return `https://${bucketName}.s3.${process.env.AWS_S3_REGION}.amazonaws.com/${fileName}`;
}

/**
 * Deletes an object from S3.
 * @param {string} fileUrl - The full public URL of the file
 */
export async function deleteFromS3(fileUrl) {
    if (!fileUrl) return;

    try {
        const bucketName = process.env.AWS_S3_BUCKET_NAME;
        const region = process.env.AWS_S3_REGION;
        const baseUrl = `https://${bucketName}.s3.${region}.amazonaws.com/`;
        
        if (!fileUrl.startsWith(baseUrl)) {
            console.warn("Deleted URL does not match S3 base URL, skipping S3 deletion.");
            return;
        }

        const key = fileUrl.replace(baseUrl, "");

        const command = new DeleteObjectCommand({
            Bucket: bucketName,
            Key: key,
        });

        await s3Client.send(command);
    } catch (error) {
        console.error("Error deleting from S3:", error);
    }
}
