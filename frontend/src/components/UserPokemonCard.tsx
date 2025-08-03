import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PokemonButton } from '@/components/ui/pokemon-button';
import { Badge } from '@/components/ui/badge';
import { UserPokemon } from '@/types/pokemon';
import { Edit2, Trash2, Heart, Star, CheckCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface UserPokemonCardProps {
  userPokemon: UserPokemon;
  onUpdate: (id: string, updates: Partial<UserPokemon>) => void;
  onDelete: (id: string) => void;
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

const categoryIcons = {
  caught: CheckCircle,
  'want-to-catch': Star,
  favorites: Heart
};

const categoryColors = {
  caught: 'success',
  'want-to-catch': 'warning',
  favorites: 'destructive'
} as const;

export const UserPokemonCard: React.FC<UserPokemonCardProps> = ({ 
  userPokemon, 
  onUpdate, 
  onDelete 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    notes: userPokemon.notes,
    category: userPokemon.category
  });

  const CategoryIcon = categoryIcons[userPokemon.category];

  const handleSave = () => {
    onUpdate(userPokemon.id, editData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditData({
      notes: userPokemon.notes,
      category: userPokemon.category
    });
    setIsEditing(false);
  };

  return (
    <Card className="shadow-card hover:shadow-pokemon transition-all duration-300">
      <CardHeader className="pb-2">
        <div className="aspect-square relative bg-gradient-to-br from-primary/10 to-accent/10 rounded-lg p-4">
          <img
            src={userPokemon.pokemonImage}
            alt={userPokemon.pokemonName}
            className="w-full h-full object-contain"
            onError={(e) => {
              e.currentTarget.src = '/placeholder.svg';
            }}
          />
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div>
          <CardTitle className="text-lg capitalize flex items-center justify-between">
            {userPokemon.pokemonName}
            <div className="flex items-center gap-2">
              <CategoryIcon className={`w-4 h-4 text-${categoryColors[userPokemon.category]}`} />
              <span className="text-sm font-normal text-muted-foreground">#{userPokemon.pokemonId}</span>
            </div>
          </CardTitle>
          
          <div className="flex gap-1 mt-2">
            {userPokemon.pokemonTypes.map((type) => (
              <Badge
                key={type}
                className={`${typeColors[type]} text-white text-xs px-2 py-1`}
              >
                {type}
              </Badge>
            ))}
          </div>
        </div>

        {isEditing ? (
          <div className="space-y-3">
            <div>
              <Label htmlFor="category">Category</Label>
              <select
                id="category"
                value={editData.category}
                onChange={(e) => setEditData(prev => ({ ...prev, category: e.target.value as any }))}
                className="w-full mt-1 px-3 py-2 border border-input rounded-md bg-background"
              >
                <option value="caught">Caught</option>
                <option value="want-to-catch">Want to Catch</option>
                <option value="favorites">Favorites</option>
              </select>
            </div>
            
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={editData.notes}
                onChange={(e) => setEditData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Add your notes about this Pokemon..."
                className="mt-1"
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <PokemonButton size="sm" variant="success" onClick={handleSave} className="flex-1">
                Save
              </PokemonButton>
              <PokemonButton size="sm" variant="ghost" onClick={handleCancel} className="flex-1">
                Cancel
              </PokemonButton>
            </div>
          </div>
        ) : (
          <>
            {userPokemon.notes && (
              <div className="text-sm text-muted-foreground bg-muted p-2 rounded-md">
                {userPokemon.notes}
              </div>
            )}

            <div className="text-xs text-muted-foreground">
              Added on {new Date(userPokemon.dateAdded).toLocaleDateString()}
            </div>

            <div className="flex gap-2">
              <PokemonButton
                size="sm"
                variant="ghost"
                onClick={() => setIsEditing(true)}
                className="flex-1"
              >
                <Edit2 className="w-3 h-3 mr-1" />
                Edit
              </PokemonButton>
              <PokemonButton
                size="sm"
                variant="destructive"
                onClick={() => onDelete(userPokemon.id)}
                className="flex-1"
              >
                <Trash2 className="w-3 h-3 mr-1" />
                Delete
              </PokemonButton>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};