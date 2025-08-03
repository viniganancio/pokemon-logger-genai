import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PokemonButton } from '@/components/ui/pokemon-button';
import { useToast } from '@/hooks/use-toast';
import { apiService } from '@/services/api';
import { Camera, Upload, X, Plus } from 'lucide-react';
import { PokemonCard } from '@/components/PokemonCard';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface IdentificationResult {
  success: boolean;
  pokemon?: {
    id: number;
    name: string;
    image: string;
    types: string[];
    stats: Array<{
      base_stat: number;
      stat: { name: string };
    }>;
    height: number;
    weight: number;
  };
  uploadedImageUrl?: string;
  identifiedAs?: string;
  message?: string;
}


interface PokemonImageUploadProps {
  onPokemonAdded?: () => void;
}

export default function PokemonImageUpload({ onPokemonAdded }: PokemonImageUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<IdentificationResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Add to collection dialog state
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<'caught' | 'want-to-catch' | 'favorites'>('caught');
  const [notes, setNotes] = useState('');

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file.",
        variant: "destructive"
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast({
        title: "File too large",
        description: "Please select an image under 10MB.",
        variant: "destructive"
      });
      return;
    }

    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setResult(null);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const uploadAndIdentify = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      const result = await apiService.uploadAndIdentifyPokemon(selectedFile);
      setResult(result);

      if (result.success && result.pokemon) {
        toast({
          title: "Pokemon identified!",
          description: `Found: ${result.pokemon.name}`,
        });
      } else {
        toast({
          title: "Identification failed",
          description: result.message || "Could not identify Pokemon from image",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload image",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const clearSelection = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const openAddDialog = (category: 'caught' | 'want-to-catch' | 'favorites') => {
    setSelectedCategory(category);
    setNotes('');
    setShowAddDialog(true);
  };

  const confirmAddToCollection = async () => {
    if (!result?.pokemon) return;

    try {
      // Import apiService at the top of the file
      const { apiService } = await import('@/services/api');
      
      await apiService.addPokemon(
        result.pokemon.id,
        result.pokemon.name,
        selectedCategory,
        notes || `Added via AI identification on ${new Date().toLocaleDateString()}`
      );

      toast({
        title: "Pokemon added!",
        description: `${result.pokemon.name} added to ${selectedCategory === 'want-to-catch' ? 'Want to Catch' : selectedCategory} collection`,
      });

      // Notify parent component to refresh collection
      if (onPokemonAdded) {
        onPokemonAdded();
      }

      // Close dialog and reset
      setShowAddDialog(false);
      setNotes('');
      
      // Clear the result to reset the component
      setResult(null);
      setSelectedFile(null);
      setPreviewUrl(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (error) {
      toast({
        title: "Failed to add Pokemon",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            Pokemon Image Identification
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Upload Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              previewUrl ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            {previewUrl ? (
              <div className="relative">
                <img
                  src={previewUrl}
                  alt="Selected pokemon"
                  className="max-w-full max-h-64 mx-auto rounded-lg"
                />
                <PokemonButton
                  variant="outline"
                  size="sm"
                  onClick={clearSelection}
                  className="absolute top-2 right-2"
                >
                  <X className="w-4 h-4" />
                </PokemonButton>
              </div>
            ) : (
              <div className="space-y-4">
                <Upload className="w-12 h-12 mx-auto text-muted-foreground" />
                <div>
                  <p className="text-lg font-medium">Drop your Pokemon image here</p>
                  <p className="text-muted-foreground">or click to browse</p>
                </div>
                <PokemonButton
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Select Image
                </PokemonButton>
              </div>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileInputChange}
            className="hidden"
          />

          {/* Upload Button */}
          {selectedFile && !result && (
            <div className="flex justify-center">
              <PokemonButton
                onClick={uploadAndIdentify}
                disabled={isUploading}
                className="w-full max-w-sm"
              >
                {isUploading ? 'Identifying Pokemon...' : 'Identify Pokemon'}
              </PokemonButton>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Result */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle>
              {result.success ? 'Pokemon Identified!' : 'Identification Result'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {result.success && result.pokemon ? (
              <div className="space-y-4">
                <div className="flex flex-col items-center space-y-4">
                  {/* Pokemon Image - Smaller Size */}
                  <div className="w-48 h-48 flex items-center justify-center bg-gray-50 rounded-lg border">
                    <img
                      src={result.pokemon.image}
                      alt={result.pokemon.name}
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                  
                  {/* Pokemon Info */}
                  <div className="text-center">
                    <h3 className="text-lg font-semibold capitalize">
                      {result.pokemon.name} #{result.pokemon.id}
                    </h3>
                    <div className="flex gap-1 justify-center mt-2">
                      {result.pokemon.types.map((type) => (
                        <span
                          key={type}
                          className={`px-2 py-1 rounded-full text-xs font-medium text-white ${
                            type === 'electric' ? 'bg-yellow-500' :
                            type === 'fire' ? 'bg-red-500' :
                            type === 'water' ? 'bg-blue-500' :
                            type === 'grass' ? 'bg-green-500' :
                            type === 'psychic' ? 'bg-pink-500' :
                            type === 'ice' ? 'bg-cyan-500' :
                            type === 'dragon' ? 'bg-purple-600' :
                            type === 'dark' ? 'bg-gray-800' :
                            type === 'fairy' ? 'bg-pink-300' :
                            type === 'fighting' ? 'bg-red-600' :
                            type === 'poison' ? 'bg-purple-500' :
                            type === 'ground' ? 'bg-yellow-600' :
                            type === 'flying' ? 'bg-indigo-400' :
                            type === 'bug' ? 'bg-green-400' :
                            type === 'rock' ? 'bg-yellow-800' :
                            type === 'ghost' ? 'bg-purple-700' :
                            type === 'steel' ? 'bg-gray-400' :
                            type === 'normal' ? 'bg-gray-500' :
                            'bg-gray-500'
                          }`}
                        >
                          {type}
                        </span>
                      ))}
                    </div>
                    
                    {/* Basic Stats */}
                    <div className="flex gap-4 justify-center mt-3 text-sm">
                      <div className="text-center">
                        <div className="font-semibold text-green-600">
                          {result.pokemon.stats.find(s => s.stat.name === 'hp')?.base_stat || 0}
                        </div>
                        <div className="text-gray-500">HP</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-red-600">
                          {result.pokemon.stats.find(s => s.stat.name === 'attack')?.base_stat || 0}
                        </div>
                        <div className="text-gray-500">ATK</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-blue-600">
                          {result.pokemon.stats.find(s => s.stat.name === 'defense')?.base_stat || 0}
                        </div>
                        <div className="text-gray-500">DEF</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Add to Collection Options */}
                <div className="space-y-2">
                  <p className="font-medium">Add to your collection:</p>
                  <div className="flex gap-2 flex-wrap">
                    <PokemonButton
                      size="sm"
                      onClick={() => openAddDialog('caught')}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Caught
                    </PokemonButton>
                    <PokemonButton
                      size="sm"
                      variant="outline"
                      onClick={() => openAddDialog('want-to-catch')}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Want to Catch
                    </PokemonButton>
                    <PokemonButton
                      size="sm"
                      variant="outline"
                      onClick={() => openAddDialog('favorites')}
                      className="border-yellow-500 text-yellow-600 hover:bg-yellow-50"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Favorite
                    </PokemonButton>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-muted-foreground">{result.message}</p>
                {result.identifiedAs && (
                  <p className="mt-2">
                    <span className="font-medium">Identified as:</span> {result.identifiedAs}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Add to Collection Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Add {result?.pokemon?.name} to Collection
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="category">Category</Label>
              <select
                id="category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as 'caught' | 'want-to-catch' | 'favorites')}
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
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes about this Pokemon..."
                className="mt-1"
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <PokemonButton onClick={confirmAddToCollection} className="flex-1">
                Add to Collection
              </PokemonButton>
              <PokemonButton variant="ghost" onClick={() => setShowAddDialog(false)} className="flex-1">
                Cancel
              </PokemonButton>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}