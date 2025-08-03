import axios from 'axios';

interface PokemonApiResponse {
  id: number;
  name: string;
  height: number;
  weight: number;
  sprites: {
    other: {
      'official-artwork': {
        front_default: string;
      };
    };
  };
  types: Array<{
    type: {
      name: string;
    };
  }>;
  stats: Array<{
    base_stat: number;
    stat: {
      name: string;
    };
  }>;
}

export class PokemonApiService {
  private baseUrl = 'https://pokeapi.co/api/v2';

  async getPokemonByName(name: string): Promise<PokemonApiResponse> {
    try {
      const response = await axios.get<PokemonApiResponse>(
        `${this.baseUrl}/pokemon/${name.toLowerCase()}`
      );
      return response.data;
    } catch (error) {
      console.error(`Error fetching Pokemon ${name}:`, error);
      throw new Error(`Pokemon ${name} not found`);
    }
  }

  async getPokemonById(id: number): Promise<PokemonApiResponse> {
    try {
      const response = await axios.get<PokemonApiResponse>(
        `${this.baseUrl}/pokemon/${id}`
      );
      return response.data;
    } catch (error) {
      console.error(`Error fetching Pokemon ID ${id}:`, error);
      throw new Error(`Pokemon with ID ${id} not found`);
    }
  }
}

export const pokemonApiService = new PokemonApiService();