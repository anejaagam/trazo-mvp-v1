import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { RecipeAuthor } from './RecipeAuthor';
import { RecipeViewer } from './RecipeViewer';
import { mockRecipes } from '../lib/mockData';
import { Recipe } from '../types';
import { Plus, Search, Clock, User } from 'lucide-react';

export function RecipeLibrary() {
  const [recipes] = useState<Recipe[]>(mockRecipes);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [isAuthoring, setIsAuthoring] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filteredRecipes = recipes.filter(recipe => {
    const matchesSearch = recipe.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         recipe.ownerName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || recipe.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Published': return 'bg-emerald-100 text-emerald-800';
      case 'Applied': return 'bg-blue-100 text-blue-800';
      case 'Draft': return 'bg-slate-100 text-slate-800';
      case 'Deprecated': return 'bg-amber-100 text-amber-800';
      case 'Archived': return 'bg-slate-100 text-slate-500';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  if (isAuthoring) {
    return (
      <RecipeAuthor 
        onCancel={() => setIsAuthoring(false)}
        onSave={() => setIsAuthoring(false)}
      />
    );
  }

  if (selectedRecipe) {
    return (
      <RecipeViewer 
        recipe={selectedRecipe}
        onClose={() => setSelectedRecipe(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-slate-900">Recipe Library</h2>
          <p className="text-slate-600">Stage-based environmental control templates</p>
        </div>
        <Button onClick={() => setIsAuthoring(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          New Recipe
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search recipes by name or author..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              {['all', 'Published', 'Applied', 'Draft'].map(status => (
                <Button
                  key={status}
                  variant={filterStatus === status ? 'default' : 'outline'}
                  onClick={() => setFilterStatus(status)}
                  size="sm"
                >
                  {status === 'all' ? 'All' : status}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recipe Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRecipes.map(recipe => (
          <Card 
            key={recipe.id} 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setSelectedRecipe(recipe)}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <CardTitle className="text-slate-900">{recipe.name}</CardTitle>
                <Badge className={getStatusColor(recipe.status)}>
                  {recipe.status}
                </Badge>
              </div>
              <CardDescription className="flex items-center gap-2">
                <User className="w-3 h-3" />
                {recipe.ownerName}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Version</span>
                  <span className="text-slate-900">v{recipe.currentVersion}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Clock className="w-3 h-3" />
                  Updated {new Date(recipe.updatedAt).toLocaleDateString()}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredRecipes.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-slate-600">No recipes found matching your criteria</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
