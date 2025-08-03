// Base API configuration
const API_BASE_URL = 'http://localhost:3001/api';

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

class ApiService {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('pokemon-logger-token');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };
  }

  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      headers: this.getAuthHeaders(),
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Request failed');
      }

      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(error.message);
      }
      throw new Error('Network error');
    }
  }

  // Auth endpoints
  async login(email: string, password: string) {
    return this.request<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(email: string, password: string, name: string) {
    return this.request<{ token: string; user: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
  }

  // Pokemon endpoints
  async searchPokemon(query: string) {
    return this.request<{id: number, name: string, image: string, types: string[]}>(`/pokemon/search/${encodeURIComponent(query)}`);
  }

  async getMyPokemon(category?: string, page = 1, limit = 10) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(category && category !== 'all' && { category }),
    });
    
    return this.request<any[]>(`/pokemon/my-pokemon?${params}`);
  }

  async getMyPokemonById(id: string) {
    return this.request<any>(`/pokemon/my-pokemon/${id}`);
  }

  async addPokemon(pokemonId: number, pokemonName: string, category: string, notes?: string) {
    return this.request<any>('/pokemon/my-pokemon', {
      method: 'POST',
      body: JSON.stringify({ pokemonId, pokemonName, category, notes }),
    });
  }

  async updatePokemon(id: string, category: string, notes?: string) {
    return this.request<any>(`/pokemon/my-pokemon/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ category, notes }),
    });
  }

  async deletePokemon(id: string) {
    return this.request<{ message: string }>(`/pokemon/my-pokemon/${id}`, {
      method: 'DELETE',
    });
  }

  // Health check
  async healthCheck() {
    return this.request<{ status: string; message: string }>('/health');
  }

  // Image upload and identification
  async uploadAndIdentifyPokemon(imageFile: File) {
    const token = localStorage.getItem('pokemon-logger-token');
    const formData = new FormData();
    formData.append('image', imageFile);

    const response = await fetch(`${this.baseURL}/images/identify`, {
      method: 'POST',
      headers: {
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to upload image');
    }

    return response.json();
  }

  // Person pokemonization
  async pokemonizePerson(imageFile: File) {
    const token = localStorage.getItem('pokemon-logger-token');
    const formData = new FormData();
    formData.append('image', imageFile);

    const response = await fetch(`${this.baseURL}/images/pokemonize`, {
      method: 'POST',
      headers: {
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to pokemonize person');
    }

    return response.json();
  }

  // Save custom Pokemon to collection
  async saveCustomPokemon(pokemonData: {
    pokemonId: number;
    pokemonName: string;
    pokemonImage: string;
    pokemonTypes: string[];
    category: string;
    notes: string;
  }) {
    return this.request<any>('/images/save-custom-pokemon', {
      method: 'POST',
      body: JSON.stringify(pokemonData),
    });
  }
}

export const apiService = new ApiService(API_BASE_URL);