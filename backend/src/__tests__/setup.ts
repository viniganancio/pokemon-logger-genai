import fs from 'fs';
import path from 'path';

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';
process.env.AWS_ACCESS_KEY_ID = 'test-key';
process.env.AWS_SECRET_ACCESS_KEY = 'test-secret';
process.env.AWS_REGION = 'us-east-1';
process.env.AWS_S3_BUCKET = 'test-bucket';

// Use in-memory database for tests
process.env.DATABASE_PATH = ':memory:';

// No need to clean up in-memory database

// Mock AWS services completely
jest.mock('../services/awsConfig', () => ({
  s3Client: {
    send: jest.fn().mockResolvedValue({ ETag: 'test-etag' }),
  },
  bedrockClient: {
    send: jest.fn().mockResolvedValue({
      body: Buffer.from(JSON.stringify({
        content: [{
          text: JSON.stringify({
            characteristics: ["test trait"],
            suggestedPokemon: "TestMon",
            pokemonizedDescription: "A test Pokemon",
            powerType: "Normal",
            abilities: ["Test Ability"],
            stats: { hp: 100, attack: 100, defense: 100 }
          })
        }]
      }))
    }),
  },
  AWS_CONFIG: {
    region: 'us-east-1',
    s3Bucket: 'test-bucket',
  },
}));

// Mock AWS SDK classes
jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn(),
  PutObjectCommand: jest.fn(),
}));

jest.mock('@aws-sdk/client-bedrock-runtime', () => ({
  BedrockRuntimeClient: jest.fn(),
  InvokeModelCommand: jest.fn(),
}));

// Mock image service
jest.mock('../services/imageService', () => ({
  imageService: {
    uploadImage: jest.fn().mockResolvedValue('test-image-key'),
    getSignedUrl: jest.fn().mockResolvedValue('https://test-url.com/image.jpg'),
  },
}));

// Mock PokeAPI calls
jest.mock('axios', () => ({
  get: jest.fn().mockImplementation((url: string) => {
    if (url.includes('pokemon/1')) {
      return Promise.resolve({
        data: {
          id: 1,
          name: 'bulbasaur',
          sprites: {
            other: {
              'official-artwork': {
                front_default: 'https://test-pokemon-image.com/1.png'
              }
            }
          },
          types: [{ type: { name: 'grass' } }, { type: { name: 'poison' } }],
          stats: [
            { base_stat: 45, stat: { name: 'hp' } },
            { base_stat: 49, stat: { name: 'attack' } },
            { base_stat: 49, stat: { name: 'defense' } },
          ],
          height: 7,
          weight: 69,
        }
      });
    }
    return Promise.reject(new Error('Pokemon not found'));
  }),
}));