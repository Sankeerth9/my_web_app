import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  ChevronDownIcon, 
  ChevronUpIcon, 
  ClockIcon, 
  FlameIcon, 
  UtensilsIcon, 
  BookmarkIcon, 
  InfoIcon, 
  LeafIcon,
  BarChart2Icon,
  HeartIcon,
  Share2Icon,
  PrinterIcon,
  CoffeeIcon
} from 'lucide-react';
import { Recipe } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

// Define the DietaryFlags interface locally
interface DietaryFlags {
  vegetarian?: boolean;
  vegan?: boolean;
  glutenFree?: boolean;
  lowCarb?: boolean;
  dairyFree?: boolean;
  keto?: boolean;
}

interface RecipeCardProps {
  recipe: Recipe;
  saved?: boolean;
}

// Function to determine taste profile based on recipe content
const getTasteProfile = (recipe: Recipe) => {
  const title = recipe.title.toLowerCase();
  const description = recipe.description.toLowerCase();
  const ingredients = recipe.ingredients.join(' ').toLowerCase();
  
  const profiles = [];
  
  if (
    ingredients.includes('sugar') || 
    ingredients.includes('honey') || 
    ingredients.includes('maple') ||
    title.includes('sweet') ||
    description.includes('sweet')
  ) {
    profiles.push({ name: 'sweet', label: 'Sweet' });
  }
  
  if (
    ingredients.includes('chili') || 
    ingredients.includes('pepper') || 
    ingredients.includes('hot sauce') ||
    title.includes('spicy') ||
    description.includes('spicy')
  ) {
    profiles.push({ name: 'spicy', label: 'Spicy' });
  }
  
  if (
    ingredients.includes('soy sauce') || 
    ingredients.includes('mushroom') || 
    ingredients.includes('cheese') ||
    ingredients.includes('tomato') ||
    title.includes('savory') ||
    description.includes('savory') ||
    description.includes('umami')
  ) {
    profiles.push({ name: 'savory', label: 'Savory' });
  }
  
  if (
    ingredients.includes('lemon') || 
    ingredients.includes('lime') || 
    ingredients.includes('vinegar') ||
    title.includes('sour') ||
    description.includes('sour') ||
    description.includes('tangy')
  ) {
    profiles.push({ name: 'sour', label: 'Tangy' });
  }
  
  // Return at least one taste profile if none detected
  if (profiles.length === 0) {
    if (recipe.cuisine === 'indian' || recipe.cuisine === 'mexican') {
      profiles.push({ name: 'spicy', label: 'Spicy' });
    } else {
      profiles.push({ name: 'savory', label: 'Savory' });
    }
  }
  
  return profiles.slice(0, 2); // Return max 2 taste profiles
};

// Function to estimate cook difficulty based on instructions and ingredients
const getCookingDifficulty = (recipe: Recipe) => {
  const instructionCount = recipe.instructions.length;
  const ingredientCount = recipe.ingredients.length;
  
  if (instructionCount > 10 || ingredientCount > 12) {
    return { level: 'advanced', label: 'Advanced' };
  } else if (instructionCount > 6 || ingredientCount > 8) {
    return { level: 'intermediate', label: 'Intermediate' };
  } else {
    return { level: 'easy', label: 'Easy' };
  }
};

export const RecipeCard = ({ recipe, saved = false }: RecipeCardProps) => {
  const [showDetails, setShowDetails] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Get taste profiles and cooking difficulty
  const tasteProfiles = getTasteProfile(recipe);
  const cookingDifficulty = getCookingDifficulty(recipe);

  const saveRecipe = async () => {
    if (saved) return;
    
    try {
      setIsSaving(true);
      await apiRequest('POST', '/api/recipes/save', { recipeId: recipe.id });
      queryClient.invalidateQueries({ queryKey: ['/api/recipes/saved'] });
      toast({
        title: "Recipe saved!",
        description: `${recipe.title} has been added to your saved recipes.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to save recipe",
        description: "Please try again later."
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Function to get cuisine emoji
  const getCuisineEmoji = (cuisine: string) => {
    switch (cuisine.toLowerCase()) {
      case 'indian': return '🍛';
      case 'italian': return '🍝';
      case 'chinese': return '🥢';
      case 'american': return '🍔';
      case 'japanese': return '🍣';
      case 'mexican': return '🌮';
      default: return '🍴';
    }
  };

  // Get dietary icons
  const getDietaryIcons = () => {
    const icons = [];
    
    // Cast dietaryFlags to the DietaryFlags interface to make TypeScript happy
    const flags = recipe.dietaryFlags as unknown as DietaryFlags;
    
    if (flags) {
      if (flags.vegetarian) {
        icons.push({ icon: <LeafIcon className="h-4 w-4 text-green-600" />, label: 'Vegetarian' });
      }
      if (flags.vegan) {
        icons.push({ icon: <LeafIcon className="h-4 w-4 text-green-700" />, label: 'Vegan' });
      }
      if (flags.glutenFree) {
        icons.push({ icon: <BarChart2Icon className="h-4 w-4 text-amber-600" />, label: 'Gluten-Free' });
      }
      if (flags.lowCarb) {
        icons.push({ icon: <HeartIcon className="h-4 w-4 text-red-500" />, label: 'Low Carb' });
      }
      if (flags.dairyFree) {
        icons.push({ icon: <BarChart2Icon className="h-4 w-4 text-blue-500" />, label: 'Dairy-Free' });
      }
      if (flags.keto) {
        icons.push({ icon: <HeartIcon className="h-4 w-4 text-purple-500" />, label: 'Keto' });
      }
    }
    
    return icons;
  };

  return (
    <div className="recipe-card bg-white rounded-xl shadow-md overflow-hidden">
      <div className="flex flex-col md:flex-row">
        <div className="md:w-2/5 lg:w-1/3 relative">
          <img 
            src={recipe.imageUrl} 
            alt={recipe.title} 
            className="h-64 md:h-full w-full object-cover"
          />
          <div className="absolute top-4 left-4 bg-white rounded-full px-3 py-1 shadow-md flex items-center">
            <span className="text-lg mr-1">{getCuisineEmoji(recipe.cuisine)}</span>
            <span className="font-medium text-sm capitalize">{recipe.cuisine}</span>
          </div>
        </div>
        
        <div className="md:w-3/5 lg:w-2/3 p-6">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h3 className="font-heading font-bold text-xl md:text-2xl mb-2">{recipe.title}</h3>
              <p className="text-gray-600 mb-4">{recipe.description}</p>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className={`text-${saved ? 'primary' : 'secondary'} hover:text-primary`}
              onClick={saveRecipe}
              disabled={isSaving || saved}
            >
              <BookmarkIcon className={`h-6 w-6 ${saved ? 'fill-primary text-primary' : ''}`} />
            </Button>
          </div>
          
          {/* Main recipe info section */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            <div className="flex flex-col items-center bg-gray-50 p-3 rounded-lg">
              <ClockIcon className="text-primary mb-1 h-5 w-5" />
              <span className="text-sm font-semibold">{recipe.cookTime}</span>
              <span className="text-xs text-gray-500">Cooking Time</span>
            </div>
            
            <div className="flex flex-col items-center bg-gray-50 p-3 rounded-lg">
              <FlameIcon className="text-primary mb-1 h-5 w-5" />
              <span className="text-sm font-semibold">{recipe.calories}</span>
              <span className="text-xs text-gray-500">Calories</span>
            </div>
            
            <div className="flex flex-col items-center bg-gray-50 p-3 rounded-lg">
              <CoffeeIcon className="text-primary mb-1 h-5 w-5" />
              <span className="text-sm font-semibold">{cookingDifficulty.label}</span>
              <span className="text-xs text-gray-500">Difficulty</span>
            </div>
          </div>
          
          {/* Taste profile and dietary badges */}
          <div className="flex flex-wrap gap-2 mb-4">
            {tasteProfiles.map((profile, idx) => (
              <span 
                key={`taste-${idx}`} 
                className={`taste-badge taste-${profile.name}`}
              >
                {profile.label}
              </span>
            ))}
            
            {getDietaryIcons().map((dietary, idx) => (
              <div 
                key={`dietary-${idx}`} 
                className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-xs"
                title={dietary.label}
              >
                {dietary.icon}
                <span className="ml-1">{dietary.label}</span>
              </div>
            ))}
          </div>
          
          {/* Ingredients section */}
          <div className="mb-4">
            <h4 className="font-semibold text-sm mb-2 flex items-center">
              <UtensilsIcon className="h-4 w-4 mr-1" />
              Ingredients:
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {recipe.ingredients.map((ingredient, idx) => (
                <span 
                  key={`${recipe.id}-ingredient-${idx}`} 
                  className="text-xs bg-gray-100 px-2.5 py-1.5 rounded-md inline-flex items-center"
                >
                  {ingredient}
                </span>
              ))}
            </div>
          </div>
          
          {/* View recipe button */}
          <div className="flex justify-between items-center mt-4">
            <div className="flex space-x-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-500 hover:text-gray-700"
                title="Share Recipe"
              >
                <Share2Icon className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-500 hover:text-gray-700"
                title="Print Recipe"
              >
                <PrinterIcon className="h-4 w-4" />
              </Button>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              className="text-primary border-primary hover:bg-primary/10 font-medium"
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? 'Hide Recipe' : 'View Full Recipe'}
              {showDetails ? <ChevronUpIcon className="ml-1 h-4 w-4" /> : <ChevronDownIcon className="ml-1 h-4 w-4" />}
            </Button>
          </div>
          
          {/* Recipe details expansion */}
          {showDetails && (
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="mb-6">
                <h4 className="font-semibold mb-3 flex items-center">
                  <span className="text-lg mr-2">👨‍🍳</span>
                  Instructions
                </h4>
                <ol className="list-decimal list-outside ml-5 space-y-3 text-sm">
                  {recipe.instructions.map((instruction, idx) => (
                    <li key={`${recipe.id}-instruction-${idx}`} className="pl-1">
                      {instruction}
                    </li>
                  ))}
                </ol>
              </div>
              
              {recipe.chefNote && (
                <div className="mt-4 mb-2">
                  <div className="bg-amber-50 border-l-4 border-amber-400 rounded-r-lg p-4">
                    <div className="flex">
                      <InfoIcon className="text-amber-600 mr-3 h-5 w-5 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-amber-800 mb-1">Chef's Note</p>
                        <p className="text-sm text-amber-700">{recipe.chefNote}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Final appearance section */}
              <div className="mt-6 bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">How it will look</h4>
                <p className="text-sm text-gray-600">
                  This {recipe.cuisine} dish will have a beautiful {recipe.cuisine === 'italian' ? 'rustic' : recipe.cuisine === 'japanese' ? 'elegant' : 'vibrant'} presentation with 
                  {tasteProfiles.some(p => p.name === 'spicy') ? ' aromatic spices and bold colors' : ' rich textures and appetizing colors'}. 
                  The {recipe.ingredients.slice(0, 3).join(', ')} create a wonderfully 
                  {tasteProfiles.map(p => p.name).includes('sweet') ? ' sweet' : ''}
                  {tasteProfiles.map(p => p.name).includes('savory') ? ' savory' : ''}
                  {tasteProfiles.map(p => p.name).includes('spicy') ? ' spicy' : ''}
                  {tasteProfiles.map(p => p.name).includes('sour') ? ' tangy' : ''} 
                  dish that's sure to impress.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
