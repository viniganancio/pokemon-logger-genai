import request from 'supertest';
import express from 'express';
import cors from 'cors';
import { initDatabase } from '../database';
import { authRoutes } from '../auth';
import { pokemonRoutes } from '../pokemon';

// Create test app
const createApp = () => {
  const app = express();
  app.use(cors());
  app.use(express.json());
  
  // Initialize test database
  initDatabase();
  
  app.use('/api/auth', authRoutes);
  app.use('/api/pokemon', pokemonRoutes);
  return app;
};

describe('Pokemon Endpoints', () => {
  let app: express.Application;
  let authToken: string;
  let userId: string;

  beforeEach(async () => {
    app = createApp();
    
    // Create and login a test user
    const userData = {
      name: 'Pokemon Trainer',
      email: 'trainer@pokemon.com',
      password: 'pikachu123'
    };

    const signupResponse = await request(app)
      .post('/api/auth/signup')
      .send(userData);

    authToken = signupResponse.body.token;
    userId = signupResponse.body.user.id;
  });

  describe('GET /api/pokemon/search/:query', () => {
    it('should search for Pokemon by name', async () => {
      const response = await request(app)
        .get('/api/pokemon/search/bulbasaur')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', 1);
      expect(response.body).toHaveProperty('name', 'bulbasaur');
      expect(response.body).toHaveProperty('image');
      expect(response.body).toHaveProperty('types');
      expect(Array.isArray(response.body.types)).toBe(true);
    });

    it('should return 401 without authentication', async () => {
      await request(app)
        .get('/api/pokemon/search/pikachu')
        .expect(401);
    });

    it('should return 404 for non-existent Pokemon', async () => {
      const response = await request(app)
        .get('/api/pokemon/search/nonexistentpokemon')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/pokemon/my-pokemon', () => {
    it('should add Pokemon to user collection', async () => {
      const pokemonData = {
        pokemonId: 1,
        pokemonName: 'bulbasaur',
        category: 'caught',
        notes: 'My first Pokemon!'
      };

      const response = await request(app)
        .post('/api/pokemon/my-pokemon')
        .set('Authorization', `Bearer ${authToken}`)
        .send(pokemonData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('pokemonId', 1);
      expect(response.body).toHaveProperty('pokemonName', 'bulbasaur');
      expect(response.body).toHaveProperty('category', 'caught');
      expect(response.body).toHaveProperty('notes', 'My first Pokemon!');
      expect(response.body).toHaveProperty('userId', userId);
    });

    it('should return 400 for missing required fields', async () => {
      const incompleteData = {
        pokemonName: 'bulbasaur'
        // missing pokemonId and category
      };

      const response = await request(app)
        .post('/api/pokemon/my-pokemon')
        .set('Authorization', `Bearer ${authToken}`)
        .send(incompleteData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for invalid category', async () => {
      const invalidData = {
        pokemonId: 1,
        pokemonName: 'bulbasaur',
        category: 'invalid-category',
        notes: 'Test'
      };

      const response = await request(app)
        .post('/api/pokemon/my-pokemon')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Invalid category');
    });
  });

  describe('GET /api/pokemon/my-pokemon', () => {
    beforeEach(async () => {
      // Add some test Pokemon to the collection
      const testPokemon = [
        { pokemonId: 1, pokemonName: 'bulbasaur', category: 'caught', notes: 'First one' },
        { pokemonId: 25, pokemonName: 'pikachu', category: 'favorites', notes: 'Electric mouse' },
        { pokemonId: 6, pokemonName: 'charizard', category: 'want-to-catch', notes: 'Fire dragon' }
      ];

      for (const pokemon of testPokemon) {
        await request(app)
          .post('/api/pokemon/my-pokemon')
          .set('Authorization', `Bearer ${authToken}`)
          .send(pokemon);
      }
    });

    it('should get all user Pokemon without filters', async () => {
      const response = await request(app)
        .get('/api/pokemon/my-pokemon')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(3);
    });

    it('should filter Pokemon by category', async () => {
      const response = await request(app)
        .get('/api/pokemon/my-pokemon?category=caught')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      response.body.forEach((pokemon: any) => {
        expect(pokemon.category).toBe('caught');
      });
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/pokemon/my-pokemon?page=1&limit=2')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeLessThanOrEqual(2);
    });
  });

  describe('PUT /api/pokemon/my-pokemon/:id', () => {
    let pokemonId: string;

    beforeEach(async () => {
      // Add a test Pokemon first
      const response = await request(app)
        .post('/api/pokemon/my-pokemon')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          pokemonId: 1,
          pokemonName: 'bulbasaur',
          category: 'caught',
          notes: 'Original notes'
        });
      
      pokemonId = response.body.id;
    });

    it('should update Pokemon category and notes', async () => {
      const updateData = {
        category: 'favorites',
        notes: 'Updated notes - now my favorite!'
      };

      const response = await request(app)
        .put(`/api/pokemon/my-pokemon/${pokemonId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('category', 'favorites');
      expect(response.body).toHaveProperty('notes', 'Updated notes - now my favorite!');
    });

    it('should return 404 for non-existent Pokemon', async () => {
      const response = await request(app)
        .put('/api/pokemon/my-pokemon/nonexistent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ category: 'favorites' })
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('DELETE /api/pokemon/my-pokemon/:id', () => {
    let pokemonId: string;

    beforeEach(async () => {
      // Add a test Pokemon first
      const response = await request(app)
        .post('/api/pokemon/my-pokemon')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          pokemonId: 1,
          pokemonName: 'bulbasaur',
          category: 'caught',
          notes: 'To be deleted'
        });
      
      pokemonId = response.body.id;
    });

    it('should delete Pokemon from collection', async () => {
      const response = await request(app)
        .delete(`/api/pokemon/my-pokemon/${pokemonId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('removed');

      // Verify Pokemon is actually deleted
      await request(app)
        .get(`/api/pokemon/my-pokemon/${pokemonId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should return 404 for non-existent Pokemon', async () => {
      const response = await request(app)
        .delete('/api/pokemon/my-pokemon/nonexistent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });
  });
});