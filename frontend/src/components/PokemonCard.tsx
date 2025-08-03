import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PokemonButton } from '@/components/ui/pokemon-button';
import { Badge } from '@/components/ui/badge';
import { Pokemon } from '@/types/pokemon';
import { Heart, Plus, Star } from 'lucide-react';

interface PokemonCardProps {
  pokemon: Pokemon;
  onAddToCollection: (pokemon: Pokemon, category: 'caught' | 'want-to-catch' | 'favorites') => void;
  isInCollection?: boolean;
}

const typeColors: Record<string, string> = {
  normal: 'bg-gray-400',
  fire: 'bg-red-500',
  water: 'bg-blue-500',
  electric: 'bg-yellow-400',
  grass: 'bg-green-500',
  ice: 'bg-blue-200',
  fighting: 'bg-red-700',
  poison: 'bg-purple-500',
  ground: 'bg-yellow-600',
  flying: 'bg-indigo-400',
  psychic: 'bg-pink-500',
  bug: 'bg-green-400',
  rock: 'bg-yellow-800',
  ghost: 'bg-purple-700',
  dragon: 'bg-indigo-700',
  dark: 'bg-gray-800',
  steel: 'bg-gray-500',
  fairy: 'bg-pink-300',
};

export const PokemonCard: React.FC<PokemonCardProps> = ({ 
  pokemon, 
  onAddToCollection, 
  isInCollection = false
}) => {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  const mainStat = pokemon.stats.find(stat => stat.stat.name === 'hp');
  const attack = pokemon.stats.find(stat => stat.stat.name === 'attack');
  const defense = pokemon.stats.find(stat => stat.stat.name === 'defense');

  const handleImageLoad = () => setImageLoading(false);
  const handleImageError = () => {
    setImageError(true);
    setImageLoading(false);
  };

  return (
    <Card className="shadow-card hover:shadow-pokemon transition-all duration-300 hover:scale-105">
      <CardHeader className="pb-2">
        <div className="aspect-square relative bg-gradient-to-br from-primary/10 to-accent/10 rounded-lg p-4">
          {imageLoading && !imageError && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          )}
          {!imageError ? (
            <img
              src={pokemon.sprites.other['official-artwork'].front_default || pokemon.sprites.front_default}
              alt={pokemon.name}
              className={`w-full h-full object-contain ${imageLoading ? 'opacity-0' : 'opacity-100'} transition-opacity`}
              onLoad={handleImageLoad}
              onError={handleImageError}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <span className="text-4xl">🔍</span>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div>
          <CardTitle className="text-lg capitalize flex items-center justify-between">
            {pokemon.name}
            <span className="text-sm font-normal text-muted-foreground">#{pokemon.id}</span>
          </CardTitle>
          
          <div className="flex gap-1 mt-2">
            {pokemon.types.map((type) => (
              <Badge
                key={type.type.name}
                className={`${typeColors[type.type.name]} text-white text-xs px-2 py-1`}
              >
                {type.type.name}
              </Badge>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 text-sm">
          <div className="text-center">
            <p className="font-medium text-success">{mainStat?.base_stat || 0}</p>
            <p className="text-xs text-muted-foreground">HP</p>
          </div>
          <div className="text-center">
            <p className="font-medium text-destructive">{attack?.base_stat || 0}</p>
            <p className="text-xs text-muted-foreground">ATK</p>
          </div>
          <div className="text-center">
            <p className="font-medium text-primary">{defense?.base_stat || 0}</p>
            <p className="text-xs text-muted-foreground">DEF</p>
          </div>
        </div>

        {!isInCollection && (
          <div className="flex gap-2 pt-2">
            <PokemonButton
              size="sm"
              variant="success"
              onClick={() => onAddToCollection(pokemon, 'caught')}
              className="flex-1"
            >
              <Plus className="w-3 h-3 mr-1" />
              Caught
            </PokemonButton>
            <PokemonButton
              size="sm"
              variant="warning"
              onClick={() => onAddToCollection(pokemon, 'want-to-catch')}
              className="flex-1"
            >
              <Star className="w-3 h-3 mr-1" />
              Want
            </PokemonButton>
            <PokemonButton
              size="sm"
              variant="destructive"
              onClick={() => onAddToCollection(pokemon, 'favorites')}
              className="flex-1"
            >
              <Heart className="w-3 h-3 mr-1" />
              Fav
            </PokemonButton>
          </div>
        )}
      </CardContent>
    </Card>
  );
};