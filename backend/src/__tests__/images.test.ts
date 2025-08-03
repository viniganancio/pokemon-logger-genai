import request from 'supertest';
import express from 'express';
import cors from 'cors';
import { initDatabase } from '../database';
import { authRoutes } from '../auth';
import imageRoutes from '../routes/imageRoutes';

// Create test app
const createApp = () => {
  const app = express();
  app.use(cors());
  app.use(express.json());
  
  // Initialize test database
  initDatabase();
  
  app.use('/api/auth', authRoutes);
  app.use('/api/images', imageRoutes);
  return app;
};

describe('Image Endpoints', () => {
  let app: express.Application;
  let authToken: string;
  let userId: string;

  beforeEach(async () => {
    app = createApp();
    
    // Create and login a test user
    const userData = {
      name: 'Image Tester',
      email: 'imagetester@pokemon.com',
      password: 'imagepass123'
    };

    const signupResponse = await request(app)
      .post('/api/auth/signup')
      .send(userData);

    authToken = signupResponse.body.token;
    userId = signupResponse.body.user.id;
  });

  describe('POST /api/images/pokemonize', () => {
    it('should pokemonize a person image successfully', async () => {
      // Create a simple test image buffer
      const testImageBuffer = Buffer.from('fake-image-data');

      const response = await request(app)
        .post('/api/images/pokemonize')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('image', testImageBuffer, 'test.jpg')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('analysis');
      expect(response.body).toHaveProperty('uploadedImageUrl');
      
      // Check analysis structure
      const analysis = response.body.analysis;
      expect(analysis).toHaveProperty('characteristics');
      expect(analysis).toHaveProperty('suggestedPokemon');
      expect(analysis).toHaveProperty('pokemonizedDescription');
      expect(analysis).toHaveProperty('powerType');
      expect(analysis).toHaveProperty('abilities');
      expect(analysis).toHaveProperty('stats');
      
      expect(Array.isArray(analysis.characteristics)).toBe(true);
      expect(Array.isArray(analysis.abilities)).toBe(true);
      expect(typeof analysis.suggestedPokemon).toBe('string');
      expect(typeof analysis.pokemonizedDescription).toBe('string');
      expect(typeof analysis.powerType).toBe('string');
    });

    it('should return 401 without authentication', async () => {
      const testImageBuffer = Buffer.from('fake-image-data');

      await request(app)
        .post('/api/images/pokemonize')
        .attach('image', testImageBuffer, 'test.jpg')
        .expect(401);
    });

    it('should return 400 without image file', async () => {
      const response = await request(app)
        .post('/api/images/pokemonize')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('image file');
    });

    it('should handle large image files within limits', async () => {
      // Create a larger test image (but still within 10MB limit)
      const largeImageBuffer = Buffer.alloc(1024 * 1024, 'x'); // 1MB

      const response = await request(app)
        .post('/api/images/pokemonize')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('image', largeImageBuffer, 'large-test.jpg')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });
  });

  describe('POST /api/images/save-custom-pokemon', () => {
    it('should save custom Pokemon to collection', async () => {
      const customPokemonData = {
        pokemonId: 99999,
        pokemonName: 'TestMon',
        pokemonImage: 'https://test-image.com/testmon.jpg',
        pokemonTypes: ['normal', 'psychic'],
        category: 'favorites',
        notes: 'Custom Pokemon created from AI analysis'
      };

      const response = await request(app)
        .post('/api/images/save-custom-pokemon')
        .set('Authorization', `Bearer ${authToken}`)
        .send(customPokemonData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('pokemonId', 99999);
      expect(response.body).toHaveProperty('pokemonName', 'TestMon');
      expect(response.body).toHaveProperty('pokemonImage', 'https://test-image.com/testmon.jpg');
      expect(response.body).toHaveProperty('pokemonTypes');
      expect(response.body).toHaveProperty('category', 'favorites');
      expect(response.body).toHaveProperty('userId', userId);
      
      expect(Array.isArray(response.body.pokemonTypes)).toBe(true);
      expect(response.body.pokemonTypes).toEqual(['normal', 'psychic']);
    });

    it('should return 400 for missing required fields', async () => {
      const incompleteData = {
        pokemonName: 'TestMon'
        // missing pokemonId and category
      };

      const response = await request(app)
        .post('/api/images/save-custom-pokemon')
        .set('Authorization', `Bearer ${authToken}`)
        .send(incompleteData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for invalid category', async () => {
      const invalidData = {
        pokemonId: 99999,
        pokemonName: 'TestMon',
        pokemonImage: 'https://test.com/image.jpg',
        pokemonTypes: ['normal'],
        category: 'invalid-category',
        notes: 'Test'
      };

      const response = await request(app)
        .post('/api/images/save-custom-pokemon')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Invalid category');
    });

    it('should return 401 without authentication', async () => {
      const customPokemonData = {
        pokemonId: 99999,
        pokemonName: 'TestMon',
        pokemonImage: 'https://test.com/image.jpg',
        pokemonTypes: ['normal'],
        category: 'favorites',
        notes: 'Test'
      };

      await request(app)
        .post('/api/images/save-custom-pokemon')
        .send(customPokemonData)
        .expect(401);
    });
  });

  describe('GET /api/images/url/:fileName', () => {
    it('should return signed URL for valid file', async () => {
      const response = await request(app)
        .get('/api/images/url/test-file.jpg')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('url');
      expect(typeof response.body.url).toBe('string');
      expect(response.body.url).toContain('https://');
    });

    it('should return 401 without authentication', async () => {
      await request(app)
        .get('/api/images/url/test-file.jpg')
        .expect(401);
    });
  });
});