import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { pokemonApi } from '@/services/pokemonApi';
import { Pokemon, UserPokemon } from '@/types/pokemon';
import { PokemonCard } from '@/components/PokemonCard';
import { UserPokemonCard } from '@/components/UserPokemonCard';
import PokemonImageUpload from '@/components/PokemonImageUpload';
import PersonToPokemonUpload from '@/components/PersonToPokemonUpload';
import { PokemonButton } from '@/components/ui/pokemon-button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Search, Plus, LogOut, User, Zap, Heart, Star, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const { toast } = useToast();

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Pokemon[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Collection state
  const [userPokemon, setUserPokemon] = useState<UserPokemon[]>([]);
  const [fullCollection, setFullCollection] = useState<UserPokemon[]>([]);
  const [filteredPokemon, setFilteredPokemon] = useState<UserPokemon[]>([]);
  const [collectionFilter, setCollectionFilter] = useState<'all' | 'caught' | 'want-to-catch' | 'favorites'>('all');
  const [collectionSearch, setCollectionSearch] = useState('');

  // Add Pokemon dialog state
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedPokemon, setSelectedPokemon] = useState<Pokemon | null>(null);
  const [addCategory, setAddCategory] = useState<'caught' | 'want-to-catch' | 'favorites'>('caught');
  const [addNotes, setAddNotes] = useState('');
  const [isAddingPokemon, setIsAddingPokemon] = useState(false);

  // Discovery state
  const [discoveryPokemon, setDiscoveryPokemon] = useState<Pokemon[]>([]);
  const [loadingDiscovery, setLoadingDiscovery] = useState(true);
  const [discoveryMode, setDiscoveryMode] = useState<'random' | 'browse'>('random');
  const [discoveryGeneration, setDiscoveryGeneration] = useState(1);
  const [discoveryPage, setDiscoveryPage] = useState(1);
  const [discoveryLimit] = useState(12);

  // Collection pagination
  const [collectionPage, setCollectionPage] = useState(1);
  const [collectionLimit] = useState(8);
  const [totalCollectionPages, setTotalCollectionPages] = useState(1);
  const [loadingCollection, setLoadingCollection] = useState(false);

  // Load full collection for stats (once)
  useEffect(() => {
    const loadFullCollection = async () => {
      if (user) {
        try {
          // Load ALL Pokemon without filters for stats calculation
          const allPokemon = await pokemonApi.getMyPokemon(undefined, 1, 1000); // Large limit to get all
          setFullCollection(allPokemon);
        } catch (error) {
          console.error('Error loading full collection:', error);
        }
      }
    };

    loadFullCollection();
  }, [user]);

  // Load user's Pokemon collection from backend with pagination
  useEffect(() => {
    const loadUserPokemon = async () => {
      if (user) {
        setLoadingCollection(true);
        try {
          const collection = await pokemonApi.getMyPokemon(
            collectionFilter === 'all' ? undefined : collectionFilter,
            collectionPage,
            collectionLimit
          );
          setUserPokemon(collection);
          
          // Calculate total pages (rough estimate since backend doesn't return total count)
          setTotalCollectionPages(collection.length < collectionLimit ? collectionPage : collectionPage + 1);
        } catch (error) {
          console.error('Error loading collection:', error);
          toast({
            title: "Error loading collection",
            description: "Could not load your Pokemon collection",
            variant: "destructive"
          });
        } finally {
          setLoadingCollection(false);
        }
      }
    };

    loadUserPokemon();
  }, [user, toast, collectionFilter, collectionPage, collectionLimit]);

  // Load Pokemon for discovery
  useEffect(() => {
    const loadDiscoveryPokemon = async () => {
      setLoadingDiscovery(true);
      try {
        if (discoveryMode === 'random') {
          const pokemon = await pokemonApi.getRandomPokemon(discoveryLimit, discoveryGeneration);
          setDiscoveryPokemon(pokemon);
        } else {
          const pokemon = await pokemonApi.getPokemonByGeneration(discoveryGeneration, discoveryPage, discoveryLimit);
          setDiscoveryPokemon(pokemon);
        }
      } catch (error) {
        console.error('Error loading discovery Pokemon:', error);
        toast({
          title: "Error loading Pokemon",
          description: "Could not load Pokemon for discovery",
          variant: "destructive"
        });
      } finally {
        setLoadingDiscovery(false);
      }
    };

    loadDiscoveryPokemon();
  }, [discoveryMode, discoveryGeneration, discoveryPage, discoveryLimit, toast]);

  // Filter collection based on search (category filtering is now done on backend)
  useEffect(() => {
    let filtered = userPokemon;

    if (collectionSearch) {
      filtered = filtered.filter(p => 
        p.pokemonName.toLowerCase().includes(collectionSearch.toLowerCase())
      );
    }

    setFilteredPokemon(filtered);
  }, [userPokemon, collectionSearch]);

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCollectionPage(1);
  }, [collectionFilter]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      // Try backend search first (for exact matches)
      try {
        const backendResult = await pokemonApi.searchPokemon(searchQuery);
        
        // Fetch complete Pokemon data from PokeAPI to get stats
        const completePokemon = await pokemonApi.getPokemon(backendResult.name);
        
        // Use backend data for basic info but PokeAPI data for stats
        const pokemon: Pokemon = {
          ...completePokemon,
          // Override with backend image (which is more reliable)
          sprites: {
            ...completePokemon.sprites,
            other: {
              'official-artwork': {
                front_default: backendResult.image
              }
            }
          }
        };
        
        setSearchResults([pokemon]);
        setShowSearchResults(true);
      } catch (backendError) {
        // Fallback to PokeAPI for discovery search
        const searchResponse = await pokemonApi.searchPokemonFromPokeAPI(searchQuery, 12);
        const pokemonDetails = await Promise.all(
          searchResponse.results.map(result => pokemonApi.getPokemon(result.name))
        );
        setSearchResults(pokemonDetails);
        setShowSearchResults(true);
      }
    } catch (error) {
      toast({
        title: "Search failed",
        description: "Could not search for Pokemon. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddToCollection = (pokemon: Pokemon, category: 'caught' | 'want-to-catch' | 'favorites') => {
    // Check if Pokemon already exists in collection
    const exists = fullCollection.some(p => p.pokemonId === pokemon.id);
    if (exists) {
      toast({
        title: "Already in collection",
        description: "This Pokemon is already in your collection",
        variant: "destructive"
      });
      return;
    }

    // Open modal with pre-selected category
    setSelectedPokemon(pokemon);
    setAddCategory(category);
    setAddNotes('');
    setShowAddDialog(true);
  };

  const confirmAddToCollection = async () => {
    if (!selectedPokemon || !user || isAddingPokemon) return;

    // Check if Pokemon already exists in collection
    const exists = userPokemon.some(p => p.pokemonId === selectedPokemon.id);
    if (exists) {
      toast({
        title: "Already in collection",
        description: "This Pokemon is already in your collection",
        variant: "destructive"
      });
      setShowAddDialog(false);
      return;
    }

    setIsAddingPokemon(true);
    try {
      const newPokemon = await pokemonApi.addPokemon(
        selectedPokemon.id,
        selectedPokemon.name,
        addCategory,
        addNotes
      );

      // Refresh both collections
      const allPokemon = await pokemonApi.getMyPokemon(undefined, 1, 1000);
      setFullCollection(allPokemon);
      
      const updatedCollection = await pokemonApi.getMyPokemon(collectionFilter === 'all' ? undefined : collectionFilter, collectionPage, collectionLimit);
      setUserPokemon(updatedCollection);

      toast({
        title: "Pokemon added!",
        description: `${selectedPokemon.name} has been added to your collection`
      });

      setShowAddDialog(false);
      setSelectedPokemon(null);
      setAddNotes('');
    } catch (error) {
      toast({
        title: "Failed to add Pokemon",
        description: "Could not add Pokemon to your collection. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsAddingPokemon(false);
    }
  };

  const updateUserPokemon = async (id: string, updates: Partial<UserPokemon>) => {
    try {
      if (updates.category || updates.notes !== undefined) {
        await pokemonApi.updatePokemon(id, updates.category!, updates.notes);
      }

      // Refresh both collections
      const allPokemon = await pokemonApi.getMyPokemon(undefined, 1, 1000);
      setFullCollection(allPokemon);
      
      const updatedCollection = await pokemonApi.getMyPokemon(collectionFilter === 'all' ? undefined : collectionFilter, collectionPage, collectionLimit);
      setUserPokemon(updatedCollection);

      toast({
        title: "Pokemon updated",
        description: "Your Pokemon has been updated successfully"
      });
    } catch (error) {
      toast({
        title: "Update failed",
        description: "Could not update Pokemon. Please try again.",
        variant: "destructive"
      });
    }
  };

  const deleteUserPokemon = async (id: string) => {
    try {
      await pokemonApi.deletePokemon(id);

      // Refresh both collections
      const allPokemon = await pokemonApi.getMyPokemon(undefined, 1, 1000);
      setFullCollection(allPokemon);
      
      const updatedCollection = await pokemonApi.getMyPokemon(collectionFilter === 'all' ? undefined : collectionFilter, collectionPage, collectionLimit);
      setUserPokemon(updatedCollection);

      toast({
        title: "Pokemon removed",
        description: "Pokemon has been removed from your collection"
      });
    } catch (error) {
      toast({
        title: "Delete failed",
        description: "Could not remove Pokemon. Please try again.",
        variant: "destructive"
      });
    }
  };

  const getCollectionStats = () => {
    // Use fullCollection for accurate stats, not the filtered userPokemon
    const caught = fullCollection.filter(p => p.category === 'caught').length;
    const wantToCatch = fullCollection.filter(p => p.category === 'want-to-catch').length;
    const favorites = fullCollection.filter(p => p.category === 'favorites').length;
    return { caught, wantToCatch, favorites, total: fullCollection.length };
  };

  const stats = getCollectionStats();

  return (
    <div className="min-h-screen bg-gradient-background">
      {/* Header */}
      <header className="bg-card shadow-card border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex items-center">
                <Zap className="w-8 h-8 text-primary mr-2" />
                <h1 className="text-2xl font-bold text-foreground">Pokemon Logger</h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-muted-foreground">Welcome back, {user?.name}!</span>
              <PokemonButton variant="ghost" size="sm" onClick={logout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </PokemonButton>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="shadow-card">
            <CardContent className="p-4">
              <div className="flex items-center">
                <CheckCircle className="w-8 h-8 text-success mr-3" />
                <div>
                  <p className="text-2xl font-bold text-success">{stats.caught}</p>
                  <p className="text-sm text-muted-foreground">Caught</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-card">
            <CardContent className="p-4">
              <div className="flex items-center">
                <Star className="w-8 h-8 text-warning mr-3" />
                <div>
                  <p className="text-2xl font-bold text-warning">{stats.wantToCatch}</p>
                  <p className="text-sm text-muted-foreground">Want to Catch</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-card">
            <CardContent className="p-4">
              <div className="flex items-center">
                <Heart className="w-8 h-8 text-destructive mr-3" />
                <div>
                  <p className="text-2xl font-bold text-destructive">{stats.favorites}</p>
                  <p className="text-sm text-muted-foreground">Favorites</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-card">
            <CardContent className="p-4">
              <div className="flex items-center">
                <User className="w-8 h-8 text-primary mr-3" />
                <div>
                  <p className="text-2xl font-bold text-primary">{stats.total}</p>
                  <p className="text-sm text-muted-foreground">Total Pokemon</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="collection" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="collection">My Collection</TabsTrigger>
            <TabsTrigger value="search">Search Pokemon</TabsTrigger>
            <TabsTrigger value="discover">Discover</TabsTrigger>
            <TabsTrigger value="camera">Camera</TabsTrigger>
            <TabsTrigger value="creator">Creator</TabsTrigger>
          </TabsList>

          {/* My Collection Tab */}
          <TabsContent value="collection" className="space-y-6">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>My Pokemon Collection</CardTitle>
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <Input
                      placeholder="Search your collection..."
                      value={collectionSearch}
                      onChange={(e) => setCollectionSearch(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <div className="flex gap-2">
                    <PokemonButton
                      variant={collectionFilter === 'all' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setCollectionFilter('all')}
                    >
                      All
                    </PokemonButton>
                    <PokemonButton
                      variant={collectionFilter === 'caught' ? 'success' : 'ghost'}
                      size="sm"
                      onClick={() => setCollectionFilter('caught')}
                    >
                      Caught
                    </PokemonButton>
                    <PokemonButton
                      variant={collectionFilter === 'want-to-catch' ? 'warning' : 'ghost'}
                      size="sm"
                      onClick={() => setCollectionFilter('want-to-catch')}
                    >
                      Want to Catch
                    </PokemonButton>
                    <PokemonButton
                      variant={collectionFilter === 'favorites' ? 'destructive' : 'ghost'}
                      size="sm"
                      onClick={() => setCollectionFilter('favorites')}
                    >
                      Favorites
                    </PokemonButton>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {filteredPokemon.length === 0 ? (
                  <div className="text-center py-12">
                    <Zap className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">No Pokemon found</h3>
                    <p className="text-muted-foreground mb-4">
                      {userPokemon.length === 0 
                        ? "Start building your collection by searching for Pokemon!"
                        : "Try adjusting your filters or search terms."
                      }
                    </p>
                  </div>
                ) : (
                  <>
                    {loadingCollection ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {Array.from({ length: collectionLimit }).map((_, i) => (
                          <div key={i} className="animate-pulse">
                            <div className="bg-muted rounded-lg h-64"></div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredPokemon.map((pokemon) => (
                          <UserPokemonCard
                            key={pokemon.id}
                            userPokemon={pokemon}
                            onUpdate={updateUserPokemon}
                            onDelete={deleteUserPokemon}
                          />
                        ))}
                      </div>
                    )}
                    
                    {/* Collection Pagination */}
                    {!loadingCollection && filteredPokemon.length > 0 && (
                      <div className="flex justify-center gap-2 mt-6">
                        <PokemonButton
                          variant="ghost"
                          size="sm"
                          onClick={() => setCollectionPage(prev => Math.max(1, prev - 1))}
                          disabled={collectionPage === 1}
                        >
                          Previous
                        </PokemonButton>
                        <span className="px-3 py-1 text-sm text-muted-foreground">
                          Page {collectionPage}
                        </span>
                        <PokemonButton
                          variant="ghost"
                          size="sm"
                          onClick={() => setCollectionPage(prev => prev + 1)}
                          disabled={filteredPokemon.length < collectionLimit}
                        >
                          Next
                        </PokemonButton>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Search Tab */}
          <TabsContent value="search" className="space-y-6">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Search Pokemon</CardTitle>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter Pokemon name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    className="flex-1"
                  />
                  <PokemonButton onClick={handleSearch} disabled={isSearching}>
                    {isSearching ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <Search className="w-4 h-4" />
                    )}
                  </PokemonButton>
                </div>
              </CardHeader>
              {showSearchResults && (
                <CardContent>
                  {searchResults.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No Pokemon found matching your search.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {searchResults.map((pokemon) => (
                        <PokemonCard
                          key={pokemon.id}
                          pokemon={pokemon}
                          onAddToCollection={handleAddToCollection}
                          isInCollection={userPokemon.some(p => p.pokemonId === pokemon.id)}
                        />
                      ))}
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          </TabsContent>

          {/* Discover Tab */}
          <TabsContent value="discover" className="space-y-6">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Discover Pokemon</CardTitle>
                <p className="text-muted-foreground">Explore Pokemon from different generations!</p>
                
                {/* Discovery Controls */}
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <div className="flex gap-2">
                    <PokemonButton
                      variant={discoveryMode === 'random' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setDiscoveryMode('random')}
                    >
                      Random
                    </PokemonButton>
                    <PokemonButton
                      variant={discoveryMode === 'browse' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setDiscoveryMode('browse')}
                    >
                      Browse
                    </PokemonButton>
                  </div>
                  
                  <div className="flex gap-2">
                    <select
                      value={discoveryGeneration}
                      onChange={(e) => {
                        setDiscoveryGeneration(Number(e.target.value));
                        setDiscoveryPage(1);
                      }}
                      className="px-3 py-1 border border-input rounded-md bg-background text-sm"
                    >
                      <option value={1}>Gen 1 (Kanto)</option>
                      <option value={2}>Gen 2 (Johto)</option>
                      <option value={3}>Gen 3 (Hoenn)</option>
                      <option value={4}>Gen 4 (Sinnoh)</option>
                    </select>
                    
                    {discoveryMode === 'random' && (
                      <PokemonButton
                        size="sm"
                        onClick={() => setDiscoveryPage(prev => prev + 1)}
                        disabled={loadingDiscovery}
                      >
                        New Random
                      </PokemonButton>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                {loadingDiscovery ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {Array.from({ length: discoveryLimit }).map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="bg-muted rounded-lg h-64"></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {discoveryPokemon.map((pokemon) => (
                        <PokemonCard
                          key={pokemon.id}
                          pokemon={pokemon}
                          onAddToCollection={handleAddToCollection}
                          isInCollection={userPokemon.some(p => p.pokemonId === pokemon.id)}
                        />
                      ))}
                    </div>
                    
                    {/* Discovery Pagination */}
                    {discoveryMode === 'browse' && discoveryPokemon.length === discoveryLimit && (
                      <div className="flex justify-center gap-2 mt-6">
                        <PokemonButton
                          variant="ghost"
                          size="sm"
                          onClick={() => setDiscoveryPage(prev => Math.max(1, prev - 1))}
                          disabled={discoveryPage === 1}
                        >
                          Previous
                        </PokemonButton>
                        <span className="px-3 py-1 text-sm text-muted-foreground">
                          Page {discoveryPage}
                        </span>
                        <PokemonButton
                          variant="ghost"
                          size="sm"
                          onClick={() => setDiscoveryPage(prev => prev + 1)}
                          disabled={discoveryPokemon.length < discoveryLimit}
                        >
                          Next
                        </PokemonButton>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Camera Tab */}
          <TabsContent value="camera" className="space-y-6">
            <PokemonImageUpload 
              onPokemonAdded={async () => {
                // Refresh both collections when a Pokemon is added via Camera
                try {
                  // Update full collection for stats
                  const allPokemon = await pokemonApi.getMyPokemon(undefined, 1, 1000);
                  setFullCollection(allPokemon);
                  
                  // Update filtered collection for display
                  const updatedCollection = await pokemonApi.getMyPokemon(collectionFilter === 'all' ? undefined : collectionFilter, collectionPage, collectionLimit);
                  setUserPokemon(updatedCollection);
                } catch (error) {
                  console.error('Failed to refresh collection:', error);
                }
              }}
            />
          </TabsContent>

          {/* Creator Tab */}
          <TabsContent value="creator" className="space-y-6">
            <PersonToPokemonUpload 
              onPokemonCreated={async () => {
                // Refresh both collections when a custom Pokemon is created
                try {
                  // Update full collection for stats
                  const allPokemon = await pokemonApi.getMyPokemon(undefined, 1, 1000);
                  setFullCollection(allPokemon);
                  
                  // Update filtered collection for display
                  const updatedCollection = await pokemonApi.getMyPokemon(collectionFilter === 'all' ? undefined : collectionFilter, collectionPage, collectionLimit);
                  setUserPokemon(updatedCollection);
                } catch (error) {
                  console.error('Failed to refresh collection:', error);
                }
              }}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Add Pokemon Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add {selectedPokemon?.name} to Collection</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="category">Category</Label>
              <select
                id="category"
                value={addCategory}
                onChange={(e) => setAddCategory(e.target.value as any)}
                className="w-full mt-1 px-3 py-2 border border-input rounded-md bg-background"
              >
                <option value="caught">Caught</option>
                <option value="want-to-catch">Want to Catch</option>
                <option value="favorites">Favorites</option>
              </select>
            </div>
            
            <div>
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                value={addNotes}
                onChange={(e) => setAddNotes(e.target.value)}
                placeholder="Add any notes about this Pokemon..."
                className="mt-1"
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <PokemonButton 
                onClick={confirmAddToCollection} 
                disabled={isAddingPokemon}
                className="flex-1"
              >
                {isAddingPokemon && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                )}
                {isAddingPokemon ? 'Adding...' : 'Add to Collection'}
              </PokemonButton>
              <PokemonButton 
                variant="ghost" 
                onClick={() => setShowAddDialog(false)} 
                disabled={isAddingPokemon}
                className="flex-1"
              >
                Cancel
              </PokemonButton>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}