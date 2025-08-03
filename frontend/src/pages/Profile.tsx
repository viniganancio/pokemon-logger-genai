import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PokemonButton } from '@/components/ui/pokemon-button';
import { Badge } from '@/components/ui/badge';
import { User, Mail, Calendar, Trophy, Zap } from 'lucide-react';

export default function Profile() {
  const { user, logout } = useAuth();

  if (!user) return null;

  // Get user's Pokemon collection stats
  const userPokemon = JSON.parse(localStorage.getItem(`pokemon-collection-${user.id}`) || '[]');
  const stats = {
    total: userPokemon.length,
    caught: userPokemon.filter((p: any) => p.category === 'caught').length,
    wantToCatch: userPokemon.filter((p: any) => p.category === 'want-to-catch').length,
    favorites: userPokemon.filter((p: any) => p.category === 'favorites').length
  };

  const joinDate = new Date(parseInt(user.id)).toLocaleDateString();

  return (
    <div className="min-h-screen bg-gradient-background">
      {/* Header */}
      <header className="bg-card shadow-card border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Zap className="w-8 h-8 text-primary mr-2" />
              <h1 className="text-2xl font-bold text-foreground">Profile</h1>
            </div>
            
            <PokemonButton variant="ghost" size="sm" onClick={logout}>
              Logout
            </PokemonButton>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Info */}
          <div className="lg:col-span-1">
            <Card className="shadow-pokemon">
              <CardHeader className="text-center">
                <div className="w-24 h-24 bg-gradient-electric rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="w-12 h-12 text-white" />
                </div>
                <CardTitle className="text-2xl">{user.name}</CardTitle>
                <p className="text-muted-foreground">Pokemon Trainer</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Mail className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm">{user.email}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Calendar className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm">Joined {joinDate}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Trophy className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm">{stats.total} Pokemon Collected</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Collection Stats */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Collection Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <p className="text-3xl font-bold text-success">{stats.caught}</p>
                    <p className="text-sm text-muted-foreground">Pokemon Caught</p>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <p className="text-3xl font-bold text-warning">{stats.wantToCatch}</p>
                    <p className="text-sm text-muted-foreground">Want to Catch</p>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <p className="text-3xl font-bold text-destructive">{stats.favorites}</p>
                    <p className="text-sm text-muted-foreground">Favorites</p>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <p className="text-3xl font-bold text-primary">{stats.total}</p>
                    <p className="text-sm text-muted-foreground">Total Pokemon</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Achievements */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Achievements</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Trophy className="w-6 h-6 text-primary" />
                      <div>
                        <p className="font-medium">First Catch</p>
                        <p className="text-sm text-muted-foreground">Caught your first Pokemon</p>
                      </div>
                    </div>
                    <Badge variant={stats.caught > 0 ? "default" : "secondary"}>
                      {stats.caught > 0 ? "Unlocked" : "Locked"}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Trophy className="w-6 h-6 text-success" />
                      <div>
                        <p className="font-medium">Collector</p>
                        <p className="text-sm text-muted-foreground">Collect 10 Pokemon</p>
                      </div>
                    </div>
                    <Badge variant={stats.total >= 10 ? "default" : "secondary"}>
                      {stats.total >= 10 ? "Unlocked" : `${stats.total}/10`}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Trophy className="w-6 h-6 text-warning" />
                      <div>
                        <p className="font-medium">Pokemon Master</p>
                        <p className="text-sm text-muted-foreground">Collect 50 Pokemon</p>
                      </div>
                    </div>
                    <Badge variant={stats.total >= 50 ? "default" : "secondary"}>
                      {stats.total >= 50 ? "Unlocked" : `${stats.total}/50`}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Trophy className="w-6 h-6 text-destructive" />
                      <div>
                        <p className="font-medium">Favorites Enthusiast</p>
                        <p className="text-sm text-muted-foreground">Add 5 Pokemon to favorites</p>
                      </div>
                    </div>
                    <Badge variant={stats.favorites >= 5 ? "default" : "secondary"}>
                      {stats.favorites >= 5 ? "Unlocked" : `${stats.favorites}/5`}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}