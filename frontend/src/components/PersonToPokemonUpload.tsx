import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PokemonButton } from '@/components/ui/pokemon-button';
import { useToast } from '@/hooks/use-toast';
import { apiService } from '@/services/api';
import { Camera, Upload, X, Sparkles, User } from 'lucide-react';

interface PokemonizationResult {
  success: boolean;
  analysis?: {
    characteristics: string[];
    suggestedPokemon: string;
    pokemonizedDescription: string;
    powerType: string;
    abilities: string[];
    stats?: {
      hp: number;
      attack: number;
      defense: number;
    };
    imagePrompt?: string;
  };
  uploadedImageUrl?: string;
  generatedPokemonImageUrl?: string;
  message?: string;
}

interface PersonToPokemonUploadProps {
  onPokemonCreated?: () => void;
}

export default function PersonToPokemonUpload({ onPokemonCreated }: PersonToPokemonUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [result, setResult] = useState<PokemonizationResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

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

  const analyzePerson = async () => {
    if (!selectedFile) return;

    setIsAnalyzing(true);
    setIsGeneratingImage(true);
    try {
      const result = await apiService.pokemonizePerson(selectedFile);
      setResult(result);

      if (result.success) {
        if (result.generatedPokemonImageUrl) {
          toast({
            title: "🎨 Pokemon Character Created!",
            description: "AI analysis complete with generated Pokemon image!",
          });
        } else {
          toast({
            title: "📝 Pokemon Character Analyzed!",
            description: "Analysis complete! Image generation may have failed, but character details are ready.",
          });
        }
      } else {
        toast({
          title: "Analysis failed",
          description: result.message || "Could not analyze the person",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        title: "Analysis failed",
        description: error instanceof Error ? error.message : "Failed to analyze image",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
      setIsGeneratingImage(false);
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

  const saveCustomPokemon = async () => {
    if (!result?.analysis) return;

    try {
      // Generate a unique Pokemon ID (high number to avoid conflicts)
      const customPokemonId = Math.floor(Math.random() * 100000) + 10000;
      
      // Use the generated image or fallback to original image
      const pokemonImage = result.generatedPokemonImageUrl || result.uploadedImageUrl || '';
      
      // Extract types from powerType (e.g., "Electric/Fighting" -> ["Electric", "Fighting"])
      const pokemonTypes = result.analysis.powerType.split('/').map(type => type.trim().toLowerCase());
      
      // Save to collection using the new custom Pokemon endpoint
      await apiService.saveCustomPokemon({
        pokemonId: customPokemonId,
        pokemonName: result.analysis.suggestedPokemon,
        pokemonImage: pokemonImage,
        pokemonTypes: pokemonTypes,
        category: 'favorites', // Default to favorites for custom Pokemon
        notes: `Custom Pokemon created from AI analysis: ${result.analysis.pokemonizedDescription}. Stats: HP ${result.analysis.stats?.hp || 'N/A'}, ATK ${result.analysis.stats?.attack || 'N/A'}, DEF ${result.analysis.stats?.defense || 'N/A'}. Abilities: ${result.analysis.abilities.join(', ')}.`
      });

      toast({
        title: "🎉 Custom Pokemon saved!",
        description: `${result.analysis.suggestedPokemon} has been added to your Favorites collection`,
      });

      if (onPokemonCreated) {
        onPokemonCreated();
      }

      // Reset component
      clearSelection();
    } catch (error) {
      console.error('Error saving custom Pokemon:', error);
      toast({
        title: "Failed to save Pokemon",
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
            <User className="w-5 h-5" />
            Pokemon Character Creator
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
                  alt="Selected person"
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
                  <p className="text-lg font-medium">Upload a photo to pokemonize</p>
                  <p className="text-muted-foreground">Turn yourself or friends into Pokemon characters!</p>
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

          {/* Analyze Button */}
          {selectedFile && !result && (
            <div className="flex justify-center">
              <PokemonButton
                onClick={analyzePerson}
                disabled={isAnalyzing}
                className="w-full max-w-sm"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                {isAnalyzing ? 'Creating Pokemon Character...' : 'Pokemonize!'}
              </PokemonButton>
            </div>
          )}

          {/* Analysis Progress Indicator */}
          {isAnalyzing && (
            <Card className="mt-4">
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <div className="flex justify-center space-x-2">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                  </div>
                  <div className="space-y-2">
                    <p className="font-medium">Creating Your Pokemon Character...</p>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>🧠 Analyzing your characteristics...</p>
                      <p>⚡ Generating Pokemon type & abilities...</p>
                      <p>🎨 Creating custom artwork...</p>
                      <p className="text-xs">This may take 10-20 seconds</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Result */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              {result.success ? 'Pokemon Character Created!' : 'Analysis Result'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {result.success && result.analysis ? (
              <div className="space-y-6">
                {/* Generated Pokemon Image */}
                {result.generatedPokemonImageUrl && (
                  <div className="text-center">
                    <h4 className="font-semibold mb-4">Your Pokemon Character:</h4>
                    <div className="w-64 h-64 mx-auto flex items-center justify-center bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg border-2 border-purple-200 shadow-lg">
                      <img
                        src={result.generatedPokemonImageUrl}
                        alt="Generated Pokemon character"
                        className="max-w-full max-h-full object-contain rounded-lg"
                      />
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      AI-generated Pokemon character based on your photo!
                    </p>
                  </div>
                )}

                {/* Characteristics */}
                <div>
                  <h4 className="font-semibold mb-2">Detected Characteristics:</h4>
                  <div className="flex flex-wrap gap-2">
                    {result.analysis.characteristics.map((trait, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                      >
                        {trait}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Pokemon Name - Highlighted */}
                <div className="text-center">
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                    {result.analysis.suggestedPokemon}
                  </h3>
                </div>

                {/* Pokemon Type */}
                <div>
                  <h4 className="font-semibold mb-2">Pokemon Type:</h4>
                  <span className="px-4 py-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-lg font-medium">
                    {result.analysis.powerType}
                  </span>
                </div>

                {/* Pokemon Stats */}
                {result.analysis.stats && (
                  <div>
                    <h4 className="font-semibold mb-2">Base Stats:</h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                          {result.analysis.stats.hp}
                        </div>
                        <div className="text-sm text-green-700 font-medium">HP</div>
                      </div>
                      <div className="text-center p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="text-2xl font-bold text-red-600">
                          {result.analysis.stats.attack}
                        </div>
                        <div className="text-sm text-red-700 font-medium">ATK</div>
                      </div>
                      <div className="text-center p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                          {result.analysis.stats.defense}
                        </div>
                        <div className="text-sm text-blue-700 font-medium">DEF</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Abilities */}
                <div>
                  <h4 className="font-semibold mb-2">Special Abilities:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    {result.analysis.abilities.map((ability, index) => (
                      <div
                        key={index}
                        className="p-3 border rounded-lg text-center bg-purple-50 border-purple-200"
                      >
                        <span className="font-medium text-purple-800">{ability}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <h4 className="font-semibold mb-2">Pokemon Character Description:</h4>
                  <div className="p-4 bg-gray-50 rounded-lg border-l-4 border-blue-500">
                    <p className="text-gray-700 leading-relaxed">
                      {result.analysis.pokemonizedDescription}
                    </p>
                  </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-center pt-4">
                  <PokemonButton
                    onClick={saveCustomPokemon}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Save My Pokemon Character
                  </PokemonButton>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-muted-foreground">{result.message}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}