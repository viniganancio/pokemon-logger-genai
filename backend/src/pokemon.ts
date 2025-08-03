import express from 'express';
import axios from 'axios';
import { db } from './database';
import { authenticateToken } from './middleware';
import { AuthRequest, UserPokemon, UserPokemonResponse } from './types';

const router = express.Router();

// PokeAPI integration
const POKEAPI_BASE_URL = 'https://pokeapi.co/api/v2';

interface PokeApiPokemon {
  id: number;
  name: string;
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
}

// Search Pokemon from PokeAPI
router.get('/search/:query', async (req, res) => {
  try {
    const { query } = req.params;
    const response = await axios.get(`${POKEAPI_BASE_URL}/pokemon/${query.toLowerCase()}`);
    const pokemon: PokeApiPokemon = response.data;

    const formattedPokemon = {
      id: pokemon.id,
      name: pokemon.name,
      image: pokemon.sprites.other['official-artwork'].front_default,
      types: pokemon.types.map(type => type.type.name)
    };

    res.json(formattedPokemon);
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return res.status(404).json({ error: 'Pokemon not found' });
    }
    res.status(500).json({ error: 'Failed to fetch Pokemon data' });
  }
});

// Get all user's Pokemon
router.get('/my-pokemon', authenticateToken, (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const { category, page = 1, limit = 10 } = req.query;

  let query = 'SELECT * FROM user_pokemon WHERE userId = ?';
  const params: any[] = [userId];

  if (category && category !== 'all') {
    query += ' AND category = ?';
    params.push(category);
  }

  query += ' ORDER BY dateAdded DESC';

  const offset = (Number(page) - 1) * Number(limit);
  query += ' LIMIT ? OFFSET ?';
  params.push(Number(limit), offset);

  db.all(query, params, (err, rows: UserPokemon[]) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    // Parse pokemonTypes back to array
    const formattedPokemon: UserPokemonResponse[] = rows.map(pokemon => ({
      ...pokemon,
      pokemonTypes: JSON.parse(pokemon.pokemonTypes)
    }));

    res.json(formattedPokemon);
  });
});

// Get single user Pokemon
router.get('/my-pokemon/:id', authenticateToken, (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const { id } = req.params;

  db.get(
    'SELECT * FROM user_pokemon WHERE id = ? AND userId = ?',
    [id, userId],
    (err, row: UserPokemon) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!row) {
        return res.status(404).json({ error: 'Pokemon not found' });
      }

      const formattedPokemon: UserPokemonResponse = {
        ...row,
        pokemonTypes: JSON.parse(row.pokemonTypes)
      };

      res.json(formattedPokemon);
    }
  );
});

// Add Pokemon to user's collection
router.post('/my-pokemon', authenticateToken, async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const { pokemonId, pokemonName, category, notes = '' } = req.body;

  if (!pokemonId || !pokemonName || !category) {
    return res.status(400).json({ error: 'Pokemon ID, name, and category are required' });
  }

  if (!['caught', 'want-to-catch', 'favorites'].includes(category)) {
    return res.status(400).json({ error: 'Invalid category' });
  }

  try {
    // Fetch Pokemon data from PokeAPI
    const response = await axios.get(`${POKEAPI_BASE_URL}/pokemon/${pokemonId}`);
    const pokemon: PokeApiPokemon = response.data;

    const userPokemonId = Date.now().toString();
    const dateAdded = new Date().toISOString();

    db.run(
      `INSERT INTO user_pokemon 
       (id, userId, pokemonId, pokemonName, pokemonImage, pokemonTypes, category, notes, dateAdded) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userPokemonId,
        userId,
        pokemon.id,
        pokemon.name,
        pokemon.sprites.other['official-artwork'].front_default,
        JSON.stringify(pokemon.types.map(type => type.type.name)),
        category,
        notes,
        dateAdded
      ],
      function(err) {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }

        res.status(201).json({
          id: userPokemonId,
          userId,
          pokemonId: pokemon.id,
          pokemonName: pokemon.name,
          pokemonImage: pokemon.sprites.other['official-artwork'].front_default,
          pokemonTypes: pokemon.types.map(type => type.type.name),
          category,
          notes,
          dateAdded
        });
      }
    );
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return res.status(404).json({ error: 'Pokemon not found in PokeAPI' });
    }
    res.status(500).json({ error: 'Failed to add Pokemon' });
  }
});

// Update user's Pokemon
router.put('/my-pokemon/:id', authenticateToken, (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const { id } = req.params;
  const { category, notes } = req.body;

  if (!category) {
    return res.status(400).json({ error: 'Category is required' });
  }

  if (!['caught', 'want-to-catch', 'favorites'].includes(category)) {
    return res.status(400).json({ error: 'Invalid category' });
  }

  db.run(
    'UPDATE user_pokemon SET category = ?, notes = ? WHERE id = ? AND userId = ?',
    [category, notes || '', id, userId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Pokemon not found' });
      }

      res.json({ message: 'Pokemon updated successfully' });
    }
  );
});

// Delete user's Pokemon
router.delete('/my-pokemon/:id', authenticateToken, (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const { id } = req.params;

  db.run(
    'DELETE FROM user_pokemon WHERE id = ? AND userId = ?',
    [id, userId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Pokemon not found' });
      }

      res.json({ message: 'Pokemon deleted successfully' });
    }
  );
});

export { router as pokemonRoutes };