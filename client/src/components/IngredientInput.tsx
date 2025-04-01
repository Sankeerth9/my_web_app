import { useState, KeyboardEvent } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PlusIcon, XCircleIcon, SearchIcon, RefreshCw } from 'lucide-react';

// Popular ingredients with emojis for suggestion
const POPULAR_INGREDIENTS = [
  { name: 'chicken', emoji: '🍗' },
  { name: 'rice', emoji: '🍚' },
  { name: 'potato', emoji: '🥔' },
  { name: 'tomato', emoji: '🍅' },
  { name: 'onion', emoji: '🧅' },
  { name: 'carrot', emoji: '🥕' },
  { name: 'beef', emoji: '🥩' },
  { name: 'garlic', emoji: '🧄' },
  { name: 'lemon', emoji: '🍋' },
  { name: 'pasta', emoji: '🍝' },
  { name: 'bell pepper', emoji: '🫑' },
  { name: 'mushroom', emoji: '🍄' },
];

interface IngredientInputProps {
  ingredients: string[];
  setIngredients: (ingredients: string[]) => void;
}

export const IngredientInput = ({ ingredients, setIngredients }: IngredientInputProps) => {
  const [inputValue, setInputValue] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);
  
  // Filter popular ingredients that match the input value or haven't been added yet
  const filteredSuggestions = POPULAR_INGREDIENTS
    .filter(ing => 
      !ingredients.includes(ing.name) && 
      (inputValue === '' || ing.name.toLowerCase().includes(inputValue.toLowerCase()))
    )
    .slice(0, 6);

  const addIngredient = (ingredient?: string) => {
    const valueToAdd = ingredient || inputValue.trim();
    if (valueToAdd && !ingredients.includes(valueToAdd)) {
      setIngredients([...ingredients, valueToAdd]);
      setInputValue('');
      setActiveIndex(-1);
    }
  };

  const removeIngredient = (ingredient: string) => {
    setIngredients(ingredients.filter(i => i !== ingredient));
  };

  const clearAll = () => {
    setIngredients([]);
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addIngredient();
    }
  };

  return (
    <div className="mb-8 bg-white p-6 rounded-xl shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <label className="block text-lg font-semibold flex items-center">
          <span className="text-xl mr-2">🛒</span>
          Your Ingredients
        </label>
        {ingredients.length > 0 && (
          <button
            onClick={clearAll}
            className="text-sm text-red-500 hover:text-red-700 transition-colors flex items-center"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Clear All
          </button>
        )}
      </div>
      
      <div className="relative mb-4">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <SearchIcon className="h-5 w-5 text-gray-400" />
        </div>
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          className="pl-10 pr-16 py-3 border-2 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary w-full"
          placeholder="Type ingredients you have..."
        />
        <div className="absolute inset-y-0 right-0 flex items-center">
          <Button 
            onClick={() => addIngredient()} 
            className="h-full rounded-l-none rounded-r-xl bg-primary text-white hover:bg-primary/90 px-4"
            disabled={!inputValue.trim()}
          >
            <PlusIcon className="h-5 w-5" />
          </Button>
        </div>
      </div>
      
      {/* Quick add suggestions */}
      {filteredSuggestions.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {filteredSuggestions.map((ingredient, index) => (
            <button
              key={ingredient.name}
              className={`
                py-1 px-3 rounded-full text-sm border 
                bg-gray-50 hover:bg-primary/10 hover:border-primary 
                transition-colors flex items-center
              `}
              onClick={() => addIngredient(ingredient.name)}
            >
              <span className="mr-1">{ingredient.emoji}</span>
              <span>{ingredient.name}</span>
              <PlusIcon className="h-3 w-3 ml-1 text-gray-500" />
            </button>
          ))}
        </div>
      )}
      
      {/* Ingredient tags */}
      <div className="flex flex-wrap gap-2 mt-3 min-h-[40px]">
        {ingredients.length === 0 ? (
          <p className="text-gray-400 text-sm italic">Add ingredients to generate recipes...</p>
        ) : (
          ingredients.map((ingredient, index) => {
            // Find emoji if it's a popular ingredient
            const popularIngredient = POPULAR_INGREDIENTS.find(
              ing => ing.name.toLowerCase() === ingredient.toLowerCase()
            );
            const emoji = popularIngredient ? popularIngredient.emoji : '';
            
            return (
              <div 
                key={`${ingredient}-${index}`} 
                className="ingredient-tag bg-primary/10 text-primary px-3 py-2 rounded-full text-sm font-medium flex items-center"
              >
                {emoji && <span className="mr-1">{emoji}</span>}
                <span>{ingredient}</span>
                <button 
                  className="ml-2 text-primary/70 hover:text-primary"
                  onClick={() => removeIngredient(ingredient)}
                  aria-label={`Remove ${ingredient}`}
                >
                  <XCircleIcon className="h-4 w-4" />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
