import { PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client, AWS_CONFIG } from './awsConfig';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';

export class ImageService {
  async uploadImage(buffer: Buffer, originalName: string): Promise<string> {
    try {
      console.log('Starting image upload...');
      console.log('AWS Config:', {
        region: process.env.AWS_REGION,
        bucket: process.env.AWS_S3_BUCKET,
        hasAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
        hasSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY,
        hasSessionToken: !!process.env.AWS_SESSION_TOKEN,
        accessKeyLength: process.env.AWS_ACCESS_KEY_ID?.length,
        secretKeyLength: process.env.AWS_SECRET_ACCESS_KEY?.length,
        sessionTokenLength: process.env.AWS_SESSION_TOKEN?.length
      });

      // Process image with Sharp (resize, optimize)
      const processedImage = await sharp(buffer)
        .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 85 })
        .toBuffer();
      
      console.log('Image processed with Sharp, size:', processedImage.length);

      // Generate unique filename
      const fileExtension = originalName.split('.').pop() || 'jpg';
      const fileName = `pokemon-images/${uuidv4()}.${fileExtension}`;

      // Upload to S3
      const putCommand = new PutObjectCommand({
        Bucket: AWS_CONFIG.s3Bucket,
        Key: fileName,
        Body: processedImage,
        ContentType: 'image/jpeg',
      });

      await s3Client.send(putCommand);

      return fileName;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw new Error('Failed to upload image');
    }
  }

  async getSignedUrl(fileName: string): Promise<string> {
    try {
      const getCommand = new GetObjectCommand({
        Bucket: AWS_CONFIG.s3Bucket,
        Key: fileName,
      });

      const signedUrl = await getSignedUrl(s3Client, getCommand, { expiresIn: 3600 });
      return signedUrl;
    } catch (error) {
      console.error('Error generating signed URL:', error);
      throw new Error('Failed to generate signed URL');
    }
  }
}

export const imageService = new ImageService();