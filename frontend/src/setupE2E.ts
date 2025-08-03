import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

// Mock API responses for E2E tests
const server = setupServer(
  // Auth endpoints
  http.post('http://localhost:3001/api/auth/signup', () => {
    return HttpResponse.json({
      token: 'mock-jwt-token',
      user: {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User'
      }
    });
  }),

  http.post('http://localhost:3001/api/auth/login', () => {
    return HttpResponse.json({
      token: 'mock-jwt-token',
      user: {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User'
      }
    });
  }),

  // Pokemon endpoints
  http.get('http://localhost:3001/api/pokemon/search/:query', () => {
    return HttpResponse.json({
      id: 25,
      name: 'pikachu',
      image: 'https://mock-pokemon-image.com/pikachu.png',
      types: ['electric']
    });
  }),

  http.get('http://localhost:3001/api/pokemon/my-pokemon', () => {
    return HttpResponse.json([
      {
        id: 'pokemon-1',
        userId: 'user-123',
        pokemonId: 25,
        pokemonName: 'pikachu',
        pokemonImage: 'https://mock-pokemon-image.com/pikachu.png',
        pokemonTypes: ['electric'],
        category: 'caught',
        notes: 'My first Pokemon!',
        dateAdded: '2024-01-01'
      }
    ]);
  }),

  http.post('http://localhost:3001/api/pokemon/my-pokemon', () => {
    return HttpResponse.json({
      id: 'pokemon-2',
      userId: 'user-123',
      pokemonId: 1,
      pokemonName: 'bulbasaur',
      pokemonImage: 'https://mock-pokemon-image.com/bulbasaur.png',
      pokemonTypes: ['grass', 'poison'],
      category: 'caught',
      notes: 'Added via test',
      dateAdded: '2024-01-01'
    }, { status: 201 });
  }),

  http.put('http://localhost:3001/api/pokemon/my-pokemon/:id', () => {
    return HttpResponse.json({
      id: 'pokemon-1',
      userId: 'user-123',
      pokemonId: 25,
      pokemonName: 'pikachu',
      pokemonImage: 'https://mock-pokemon-image.com/pikachu.png',
      pokemonTypes: ['electric'],
      category: 'favorites',
      notes: 'Updated notes',
      dateAdded: '2024-01-01'
    });
  }),

  http.delete('http://localhost:3001/api/pokemon/my-pokemon/:id', () => {
    return HttpResponse.json({ message: 'Pokemon removed successfully' });
  }),

  // Image endpoints
  http.post('http://localhost:3001/api/images/pokemonize', () => {
    return HttpResponse.json({
      success: true,
      analysis: {
        characteristics: ['Energetic', 'Friendly', 'Tech-savvy'],
        suggestedPokemon: 'TechMon',
        pokemonizedDescription: 'A digital Pokemon with electric powers',
        powerType: 'Electric/Normal',
        abilities: ['Static', 'Download', 'Adaptability'],
        stats: { hp: 85, attack: 75, defense: 70 },
        imagePrompt: 'A cute electric Pokemon with tech features'
      },
      uploadedImageUrl: 'https://mock-s3.com/uploaded-image.jpg',
      generatedPokemonImageUrl: 'https://mock-s3.com/generated-pokemon.jpg'
    });
  }),

  http.post('http://localhost:3001/api/images/save-custom-pokemon', () => {
    return HttpResponse.json({
      id: 'custom-pokemon-1',
      userId: 'user-123',
      pokemonId: 99999,
      pokemonName: 'TechMon',
      pokemonImage: 'https://mock-s3.com/generated-pokemon.jpg',
      pokemonTypes: ['electric', 'normal'],
      category: 'favorites',
      notes: 'Custom Pokemon created from AI analysis',
      dateAdded: '2024-01-01'
    }, { status: 201 });
  })
);

// Establish API mocking before all tests
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'warn' });
});

// Reset any request handlers that we may add during the tests
afterEach(() => {
  server.resetHandlers();
});

// Clean up after the tests are finished
afterAll(() => {
  server.close();
});