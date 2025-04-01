import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Header } from '@/components/Header';
import { IngredientInput } from '@/components/IngredientInput';
import { CuisineSelector } from '@/components/CuisineSelector';
import { DietaryOptions } from '@/components/DietaryOptions';
import { RecipeCard } from '@/components/RecipeCard';
import { Button } from '@/components/ui/button';
import { Recipe, RecipeGeneration } from '@shared/schema';
import { WandIcon, RefreshCwIcon, LightbulbIcon, ChefHatIcon } from 'lucide-react';

export default function Home() {
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [cuisine, setCuisine] = useState('italian');
  const [dietary, setDietary] = useState<string[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [showTips, setShowTips] = useState(true);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const savedRecipesQuery = useQueryClient().getQueryData<Recipe[]>(['/api/recipes/saved']);
  
  const isSaved = (recipeId: number) => {
    return savedRecipesQuery?.some(recipe => recipe.id === recipeId) || false;
  };
  
  // Chef tips for the sidebar
  const chefTips = [
    "Try combining ingredients from different food groups for more balanced recipes.",
    "Adding herbs and spices can transform simple ingredients into extraordinary dishes.",
    "When selecting dietary preferences, consider how they might complement your chosen cuisine.",
    "For best results, include at least one protein, one vegetable, and one starch in your ingredients.",
    "Fresh ingredients always yield better results than processed ones."
  ];
  
  const [currentTip, setCurrentTip] = useState(0);
  
  // Rotate through chef tips every 8 seconds
  useEffect(() => {
    if (!showTips) return;
    
    const interval = setInterval(() => {
      setCurrentTip((prev) => (prev + 1) % chefTips.length);
    }, 8000);
    
    return () => clearInterval(interval);
  }, [chefTips.length, showTips]);

  const generateRecipesMutation = useMutation({
    mutationFn: (data: RecipeGeneration) => 
      apiRequest('POST', '/api/recipes/generate', data)
        .then(res => res.json()),
    
    onSuccess: (data) => {
      if (data.success && data.recipes) {
        setRecipes(data.recipes);
        toast({
          title: "Recipes generated!",
          description: `Found ${data.recipes.length} recipes based on your ingredients.`,
        });
        
        // Scroll to results on mobile
        if (window.innerWidth < 768) {
          setTimeout(() => {
            document.getElementById('recipe-results')?.scrollIntoView({ behavior: 'smooth' });
          }, 300);
        }
      } else {
        toast({
          variant: "destructive",
          title: "Failed to generate recipes",
          description: data.message || "Please try again with different ingredients."
        });
      }
    },
    
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate recipes. Please check your inputs and try again."
      });
      console.error("Error generating recipes:", error);
    }
  });

  const handleGenerateRecipes = () => {
    if (ingredients.length === 0) {
      toast({
        variant: "destructive",
        title: "No ingredients",
        description: "Please add at least one ingredient to generate recipes."
      });
      return;
    }
    
    generateRecipesMutation.mutate({
      ingredients,
      cuisine,
      dietary: dietary.length > 0 ? dietary : undefined
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 font-body text-neutral-dark antialiased">
      <Header />
      
      {/* Hero section */}
      <div className="relative overflow-hidden bg-gradient-to-b from-primary/90 to-primary mb-8 text-white">
        <div className="food-pattern-bg absolute inset-0 w-full h-full opacity-10"></div>
        <div className="container mx-auto px-4 py-12 md:py-20 relative">
          <div className="max-w-3xl">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-heading font-bold mb-4">
              Turn Your Ingredients Into Delicious Meals
            </h1>
            <p className="text-lg md:text-xl opacity-90 mb-6">
              FoodGenius helps you create amazing recipes with what you already have in your kitchen.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button 
                size="lg"
                className="bg-white text-primary hover:bg-gray-100 rounded-full font-semibold"
                onClick={() => document.getElementById('create-recipe')?.scrollIntoView({ behavior: 'smooth' })}
              >
                <WandIcon className="mr-2 h-5 w-5" />
                Create Recipe
              </Button>
              <Button 
                size="lg"
                variant="outline"
                className="text-white border-white hover:bg-white/20 rounded-full"
                onClick={() => document.getElementById('cuisine-selector')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Explore Cuisines
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-4 pb-16">
        <div className="grid md:grid-cols-12 gap-8">
          {/* Search Panel */}
          <div className="md:col-span-5 lg:col-span-4">
            <div id="create-recipe" className="mb-8">
              <IngredientInput 
                ingredients={ingredients} 
                setIngredients={setIngredients} 
              />
            </div>
            
            <div id="cuisine-selector" className="mb-8">
              <CuisineSelector 
                selectedCuisine={cuisine} 
                setSelectedCuisine={setCuisine} 
              />
            </div>
            
            <DietaryOptions 
              selectedDietary={dietary} 
              setSelectedDietary={setDietary} 
            />
            
            <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-8">
              <Button 
                className="w-full py-6 bg-primary hover:bg-primary/90 text-white rounded-lg text-lg font-semibold transition-colors pulse-animation"
                onClick={handleGenerateRecipes}
                disabled={generateRecipesMutation.isPending}
              >
                {generateRecipesMutation.isPending ? (
                  <div className="flex items-center justify-center">
                    <div className="loading-dots">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                ) : (
                  <>
                    <WandIcon className="mr-2 h-5 w-5" />
                    Generate Recipes
                  </>
                )}
              </Button>
            </div>
            
            {/* Chef Tips */}
            {showTips && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl overflow-hidden">
                <div className="bg-amber-100 px-4 py-3 flex justify-between items-center">
                  <div className="flex items-center">
                    <ChefHatIcon className="h-5 w-5 text-amber-700 mr-2" />
                    <h3 className="font-semibold text-amber-900">Chef Tips</h3>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-amber-700"
                    onClick={() => setCurrentTip((prev) => (prev + 1) % chefTips.length)}
                  >
                    <RefreshCwIcon className="h-4 w-4" />
                  </Button>
                </div>
                <div className="p-4 min-h-[100px] flex items-center">
                  <div className="flex">
                    <LightbulbIcon className="h-5 w-5 text-amber-600 mr-3 flex-shrink-0 mt-1" />
                    <p className="text-amber-800 transition-opacity duration-300">
                      {chefTips[currentTip]}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Recipe Results */}
          <div id="recipe-results" className="md:col-span-7 lg:col-span-8">
            {/* Loading State */}
            {generateRecipesMutation.isPending && (
              <div className="bg-white rounded-xl shadow-md p-10 text-center">
                <div className="inline-block float-animation text-6xl mb-6">🍳</div>
                <h3 className="text-2xl font-heading font-semibold mb-3">Cooking up some ideas</h3>
                <p className="text-gray-600 mb-6">Our AI chef is preparing your personalized recipes based on your ingredients and preferences.</p>
                <div className="flex justify-center">
                  <div className="loading-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
            
            {/* Empty State */}
            {!generateRecipesMutation.isPending && recipes.length === 0 && (
              <div className="bg-white rounded-xl shadow-md p-10 text-center">
                <div className="text-7xl mb-6 float-animation inline-block">👨‍🍳</div>
                <h3 className="text-2xl font-heading font-semibold mb-3">Ready to cook something amazing?</h3>
                <p className="text-gray-600 mb-4">Enter your ingredients and select a cuisine type to get started.</p>
                <div className="max-w-md mx-auto">
                  <p className="mb-6 text-gray-500">FoodGenius will analyze your ingredients and suggest delicious recipes tailored to your preferences.</p>
                  
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                        <span className="text-2xl">🥕</span>
                      </div>
                      <p className="text-xs text-gray-600">Add your ingredients</p>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                        <span className="text-2xl">🌍</span>
                      </div>
                      <p className="text-xs text-gray-600">Choose cuisine type</p>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                        <span className="text-2xl">✨</span>
                      </div>
                      <p className="text-xs text-gray-600">Get AI recipes</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Results */}
            {!generateRecipesMutation.isPending && recipes.length > 0 && (
              <div>
                <div className="bg-white rounded-xl shadow-sm p-4 mb-6 flex justify-between items-center">
                  <h2 className="font-heading font-bold text-xl md:text-2xl flex items-center">
                    <span className="text-2xl mr-2">🍽️</span>
                    Your Recipe Suggestions
                  </h2>
                  <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">
                    {recipes.length} recipes found
                  </div>
                </div>
                
                <div className="grid grid-cols-1 gap-6">
                  {recipes.map((recipe) => (
                    <RecipeCard 
                      key={recipe.id} 
                      recipe={recipe} 
                      saved={isSaved(recipe.id)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="bg-gray-800 text-white py-10">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <h2 className="text-2xl font-heading font-bold flex items-center">
                <span className="text-2xl mr-2">🧪</span>
                FoodGenius
              </h2>
              <p className="text-sm text-gray-400 mt-1">
                Turn your ingredients into delicious recipes with AI
              </p>
            </div>
            <div className="flex space-x-8">
              <div>
                <h3 className="font-semibold mb-2">Cuisines</h3>
                <ul className="text-sm text-gray-400 space-y-1">
                  <li>Italian 🍝</li>
                  <li>Indian 🍛</li>
                  <li>Chinese 🥢</li>
                  <li>American 🍔</li>
                  <li>Japanese 🍣</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Dietary Options</h3>
                <ul className="text-sm text-gray-400 space-y-1">
                  <li>Vegetarian 🥦</li>
                  <li>Vegan 🌱</li>
                  <li>Gluten Free 🌾</li>
                  <li>Low Carb 🥩</li>
                </ul>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400 text-sm">
            <p>© {new Date().getFullYear()} FoodGenius AI Recipe Generator. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
