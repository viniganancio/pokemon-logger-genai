export interface Pokemon {
  id: number;
  name: string;
  height: number;
  weight: number;
  sprites: {
    front_default: string;
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

export interface UserPokemon {
  id: string;
  pokemonId: number;
  pokemonName: string;
  pokemonImage: string;
  pokemonTypes: string[];
  category: 'caught' | 'want-to-catch' | 'favorites';
  notes: string;
  dateAdded: string;
  userId: string;
}

export interface PokemonSearchResult {
  count: number;
  results: Array<{
    name: string;
    url: string;
  }>;
}

export interface BackendPokemonResult {
  id: number;
  name: string;
  image: string;
  types: string[];
}