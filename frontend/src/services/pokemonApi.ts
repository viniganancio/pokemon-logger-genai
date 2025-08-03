import { Pokemon, PokemonSearchResult, BackendPokemonResult } from '@/types/pokemon';
import { apiService } from './api';

// PokeAPI direct access for search (since our backend doesn't have a full Pokemon list endpoint)
const POKEAPI_BASE_URL = 'https://pokeapi.co/api/v2';

export const pokemonApi = {
  // Search Pokemon using our backend
  async searchPokemon(query: string): Promise<BackendPokemonResult> {
    try {
      return await apiService.searchPokemon(query);
    } catch (error) {
      throw new Error('Pokemon not found');
    }
  },

  // Get Pokemon from PokeAPI for discovery
  async searchPokemonFromPokeAPI(query: string, limit: number = 20): Promise<PokemonSearchResult> {
    const response = await fetch(`${POKEAPI_BASE_URL}/pokemon?limit=1000`);
    const data = await response.json();
    
    // Filter results based on query
    const filteredResults = data.results.filter((pokemon: any) =>
      pokemon.name.toLowerCase().includes(query.toLowerCase())
    ).slice(0, limit);
    
    return {
      count: filteredResults.length,
      results: filteredResults
    };
  },

  async getPokemon(nameOrId: string | number): Promise<Pokemon> {
    const response = await fetch(`${POKEAPI_BASE_URL}/pokemon/${nameOrId}`);
    if (!response.ok) {
      throw new Error('Pokemon not found');
    }
    return response.json();
  },

  async getRandomPokemon(count: number = 12, generation: number = 1): Promise<Pokemon[]> {
    // Generation 1: IDs 1-151, Generation 2: 152-251, etc.
    const generationRanges = {
      1: { start: 1, end: 151 },
      2: { start: 152, end: 251 },
      3: { start: 252, end: 386 },
      4: { start: 387, end: 493 }
    };
    
    const range = generationRanges[generation as keyof typeof generationRanges] || generationRanges[1];
    const randomIds = Array.from({ length: count }, () => 
      Math.floor(Math.random() * (range.end - range.start + 1)) + range.start
    );
    
    const promises = randomIds.map(id => this.getPokemon(id));
    return Promise.all(promises);
  },

  async getPokemonByGeneration(generation: number = 1, page: number = 1, limit: number = 12): Promise<Pokemon[]> {
    const generationRanges = {
      1: { start: 1, end: 151 },
      2: { start: 152, end: 251 },
      3: { start: 252, end: 386 },
      4: { start: 387, end: 493 }
    };
    
    const range = generationRanges[generation as keyof typeof generationRanges] || generationRanges[1];
    const startId = range.start + ((page - 1) * limit);
    const endId = Math.min(startId + limit - 1, range.end);
    
    if (startId > range.end) return [];
    
    const ids = Array.from({ length: endId - startId + 1 }, (_, i) => startId + i);
    const promises = ids.map(id => this.getPokemon(id));
    return Promise.all(promises);
  },

  // User's Pokemon collection using backend
  async getMyPokemon(category?: string, page = 1, limit = 10) {
    return await apiService.getMyPokemon(category, page, limit);
  },

  async addPokemon(pokemonId: number, pokemonName: string, category: string, notes?: string) {
    return await apiService.addPokemon(pokemonId, pokemonName, category, notes);
  },

  async updatePokemon(id: string, category: string, notes?: string) {
    return await apiService.updatePokemon(id, category, notes);
  },

  async deletePokemon(id: string) {
    return await apiService.deletePokemon(id);
  },

  getPokemonImageUrl(pokemonId: number): string {
    return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemonId}.png`;
  }
};