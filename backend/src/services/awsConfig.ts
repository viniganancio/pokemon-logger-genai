import { S3Client } from '@aws-sdk/client-s3';
import { BedrockRuntimeClient } from '@aws-sdk/client-bedrock-runtime';

// Validate AWS credentials
const awsCredentials = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  sessionToken: process.env.AWS_SESSION_TOKEN,
};

// Debug credentials (without exposing sensitive data)
console.log('AWS Credentials Check:', {
  region: process.env.AWS_REGION,
  bucket: process.env.AWS_S3_BUCKET,
  hasAccessKey: !!awsCredentials.accessKeyId,
  hasSecretKey: !!awsCredentials.secretAccessKey,
  hasSessionToken: !!awsCredentials.sessionToken,
  accessKeyLength: awsCredentials.accessKeyId?.length,
  secretKeyLength: awsCredentials.secretAccessKey?.length,
  sessionTokenLength: awsCredentials.sessionToken?.length,
});

if (!awsCredentials.accessKeyId || !awsCredentials.secretAccessKey) {
  throw new Error('AWS credentials not found in environment variables');
}

// Configure AWS clients
export const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: awsCredentials,
});

export const bedrockClient = new BedrockRuntimeClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: awsCredentials,
});

export const AWS_CONFIG = {
  region: process.env.AWS_REGION || 'us-east-1',
  s3Bucket: process.env.AWS_S3_BUCKET || 'pokemon-logger-images',
};