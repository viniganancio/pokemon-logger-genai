import { Request } from 'express';

export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  createdAt: string;
}

export interface UserPokemon {
  id: string;
  userId: string;
  pokemonId: number;
  pokemonName: string;
  pokemonImage: string;
  pokemonTypes: string; // JSON string in database, array in API responses
  category: 'caught' | 'want-to-catch' | 'favorites';
  notes: string;
  dateAdded: string;
}

export interface UserPokemonResponse {
  id: string;
  userId: string;
  pokemonId: number;
  pokemonName: string;
  pokemonImage: string;
  pokemonTypes: string[]; // Array in API responses
  category: 'caught' | 'want-to-catch' | 'favorites';
  notes: string;
  dateAdded: string;
}

export interface AuthRequest extends Request {
  user?: User;
}