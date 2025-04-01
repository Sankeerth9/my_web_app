import { useState, KeyboardEvent, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  PlusIcon, 
  XCircleIcon, 
  SearchIcon, 
  RefreshCw, 
  Sparkles, 
  ChefHat 
} from 'lucide-react';

// Enhanced popular ingredients list with emojis for suggestion by category
const POPULAR_INGREDIENTS = [
  // Proteins
  { name: 'chicken', emoji: '🍗', category: 'protein' },
  { name: 'beef', emoji: '🥩', category: 'protein' },
  { name: 'tofu', emoji: '🧊', category: 'protein' },
  { name: 'eggs', emoji: '🥚', category: 'protein' },
  { name: 'salmon', emoji: '🐟', category: 'protein' },
  { name: 'shrimp', emoji: '🦐', category: 'protein' },
  
  // Grains & Starches
  { name: 'rice', emoji: '🍚', category: 'grain' },
  { name: 'pasta', emoji: '🍝', category: 'grain' },
  { name: 'bread', emoji: '🍞', category: 'grain' },
  { name: 'noodles', emoji: '🍜', category: 'grain' },
  
  // Vegetables
  { name: 'potato', emoji: '🥔', category: 'vegetable' },
  { name: 'tomato', emoji: '🍅', category: 'vegetable' },
  { name: 'onion', emoji: '🧅', category: 'vegetable' },
  { name: 'carrot', emoji: '🥕', category: 'vegetable' },
  { name: 'garlic', emoji: '🧄', category: 'vegetable' },
  { name: 'bell pepper', emoji: '🫑', category: 'vegetable' },
  { name: 'mushroom', emoji: '🍄', category: 'vegetable' },
  { name: 'spinach', emoji: '🥬', category: 'vegetable' },
  { name: 'broccoli', emoji: '🥦', category: 'vegetable' },
  { name: 'corn', emoji: '🌽', category: 'vegetable' },
  
  // Fruits
  { name: 'lemon', emoji: '🍋', category: 'fruit' },
  { name: 'apple', emoji: '🍎', category: 'fruit' },
  { name: 'banana', emoji: '🍌', category: 'fruit' },
  { name: 'avocado', emoji: '🥑', category: 'fruit' },
  
  // Dairy
  { name: 'cheese', emoji: '🧀', category: 'dairy' },
  { name: 'milk', emoji: '🥛', category: 'dairy' },
  { name: 'yogurt', emoji: '🥣', category: 'dairy' },
  
  // Spices & Condiments
  { name: 'soy sauce', emoji: '🍶', category: 'spice' },
  { name: 'olive oil', emoji: '🫒', category: 'spice' },
  { name: 'ginger', emoji: '🫘', category: 'spice' },
];

interface IngredientInputProps {
  ingredients: string[];
  setIngredients: (ingredients: string[]) => void;
}

export const IngredientInput = ({ ingredients, setIngredients }: IngredientInputProps) => {
  const [inputValue, setInputValue] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);
  const [showSuggestionCategories, setShowSuggestionCategories] = useState(false);
  const [activeCategoryTab, setActiveCategoryTab] = useState('all');
  
  // Suggest common ingredients combinations
  const suggestIngredientCombos = [
    { name: "Breakfast combo", ingredients: ["eggs", "bread", "milk"] },
    { name: "Pasta night", ingredients: ["pasta", "tomato", "garlic", "onion"] },
    { name: "Stir fry", ingredients: ["rice", "bell pepper", "carrot", "soy sauce"] },
    { name: "Taco Tuesday", ingredients: ["beef", "onion", "bell pepper", "tomato"] }
  ];
  
  // Filter popular ingredients based on active category tab and search
  const getFilteredIngredients = () => {
    let filtered = POPULAR_INGREDIENTS;
    
    // First filter by selected category if not 'all'
    if (activeCategoryTab !== 'all') {
      filtered = filtered.filter(ing => ing.category === activeCategoryTab);
    }
    
    // Then filter out ingredients already added and match search input
    filtered = filtered.filter(ing => 
      !ingredients.includes(ing.name) && 
      (inputValue === '' || ing.name.toLowerCase().includes(inputValue.toLowerCase()))
    );
    
    // Limit for display
    return inputValue ? filtered.slice(0, 6) : filtered.slice(0, 8);
  };
  
  const filteredSuggestions = getFilteredIngredients();
  
  const addIngredient = (ingredient?: string) => {
    const valueToAdd = ingredient || inputValue.trim();
    if (valueToAdd && !ingredients.includes(valueToAdd)) {
      setIngredients([...ingredients, valueToAdd]);
      setInputValue('');
      setActiveIndex(-1);
    }
  };
  
  const addMultipleIngredients = (newIngredients: string[]) => {
    // Filter out ingredients already in the list
    const uniqueNewIngredients = newIngredients.filter(ing => !ingredients.includes(ing));
    if (uniqueNewIngredients.length > 0) {
      setIngredients([...ingredients, ...uniqueNewIngredients]);
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
  
  // Toggle suggestion categories panel
  const toggleSuggestionCategories = () => {
    setShowSuggestionCategories(!showSuggestionCategories);
    // Reset to 'all' when opening
    if (!showSuggestionCategories) {
      setActiveCategoryTab('all');
    }
  };

  return (
    <div className="mb-8 bg-white p-6 rounded-xl shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <label className="block text-lg font-semibold flex items-center">
          <span className="text-xl mr-2">🛒</span>
          Your Ingredients
        </label>
        
        <div className="flex items-center gap-2">
          <button
            onClick={toggleSuggestionCategories}
            className="text-sm text-primary hover:text-primary/80 transition-colors flex items-center"
            title="Get ingredient suggestions"
          >
            <Sparkles className="h-4 w-4 mr-1" />
            {showSuggestionCategories ? 'Hide Suggestions' : 'Suggestions'}
          </button>
          
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
      
      {/* Ingredient suggestions panel */}
      {showSuggestionCategories && (
        <div className="mb-4 border rounded-lg p-3 bg-gray-50">
          <div className="mb-2">
            <div className="flex overflow-x-auto pb-2 gap-2">
              <button 
                onClick={() => setActiveCategoryTab('all')}
                className={`px-3 py-1 text-sm rounded-full whitespace-nowrap ${
                  activeCategoryTab === 'all' 
                    ? 'bg-primary text-white' 
                    : 'bg-white border hover:bg-gray-100'
                }`}
              >
                All
              </button>
              <button 
                onClick={() => setActiveCategoryTab('protein')}
                className={`px-3 py-1 text-sm rounded-full whitespace-nowrap flex items-center ${
                  activeCategoryTab === 'protein' 
                    ? 'bg-primary text-white' 
                    : 'bg-white border hover:bg-gray-100'
                }`}
              >
                <span className="mr-1">🍗</span> Proteins
              </button>
              <button 
                onClick={() => setActiveCategoryTab('vegetable')}
                className={`px-3 py-1 text-sm rounded-full whitespace-nowrap flex items-center ${
                  activeCategoryTab === 'vegetable' 
                    ? 'bg-primary text-white' 
                    : 'bg-white border hover:bg-gray-100'
                }`}
              >
                <span className="mr-1">🥕</span> Vegetables
              </button>
              <button 
                onClick={() => setActiveCategoryTab('grain')}
                className={`px-3 py-1 text-sm rounded-full whitespace-nowrap flex items-center ${
                  activeCategoryTab === 'grain' 
                    ? 'bg-primary text-white' 
                    : 'bg-white border hover:bg-gray-100'
                }`}
              >
                <span className="mr-1">🍚</span> Grains
              </button>
              <button 
                onClick={() => setActiveCategoryTab('dairy')}
                className={`px-3 py-1 text-sm rounded-full whitespace-nowrap flex items-center ${
                  activeCategoryTab === 'dairy' 
                    ? 'bg-primary text-white' 
                    : 'bg-white border hover:bg-gray-100'
                }`}
              >
                <span className="mr-1">🧀</span> Dairy
              </button>
              <button 
                onClick={() => setActiveCategoryTab('spice')}
                className={`px-3 py-1 text-sm rounded-full whitespace-nowrap flex items-center ${
                  activeCategoryTab === 'spice' 
                    ? 'bg-primary text-white' 
                    : 'bg-white border hover:bg-gray-100'
                }`}
              >
                <span className="mr-1">🧂</span> Spices
              </button>
              <button 
                onClick={() => setActiveCategoryTab('fruit')}
                className={`px-3 py-1 text-sm rounded-full whitespace-nowrap flex items-center ${
                  activeCategoryTab === 'fruit' 
                    ? 'bg-primary text-white' 
                    : 'bg-white border hover:bg-gray-100'
                }`}
              >
                <span className="mr-1">🍎</span> Fruits
              </button>
            </div>
          </div>
          
          {/* Individual ingredient suggestions */}
          <div className="flex flex-wrap gap-2 mb-3">
            {filteredSuggestions.map((ingredient) => (
              <button
                key={ingredient.name}
                className="py-1 px-3 rounded-full text-sm border bg-white hover:bg-primary/10 hover:border-primary transition-colors flex items-center"
                onClick={() => addIngredient(ingredient.name)}
              >
                <span className="mr-1">{ingredient.emoji}</span>
                <span>{ingredient.name}</span>
                <PlusIcon className="h-3 w-3 ml-1 text-gray-500" />
              </button>
            ))}
            
            {filteredSuggestions.length === 0 && (
              <p className="text-sm text-gray-500 italic">No matching ingredients in this category</p>
            )}
          </div>
          
          {/* Common ingredient combinations */}
          <div className="mt-3 pt-3 border-t">
            <h4 className="text-sm font-medium mb-2 flex items-center">
              <ChefHat className="h-4 w-4 mr-1 text-primary" />
              Quick Combinations
            </h4>
            <div className="flex flex-wrap gap-2">
              {suggestIngredientCombos.map((combo) => (
                <button
                  key={combo.name}
                  onClick={() => addMultipleIngredients(combo.ingredients)}
                  className="py-1 px-3 rounded-lg text-sm border bg-primary/5 hover:bg-primary/10 hover:border-primary transition-colors flex items-center"
                >
                  <span>{combo.name}</span>
                  <PlusIcon className="h-3 w-3 ml-1 text-gray-500" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Quick add suggestions when not in category view and input has value */}
      {!showSuggestionCategories && filteredSuggestions.length > 0 && inputValue && (
        <div className="flex flex-wrap gap-2 mb-4">
          {filteredSuggestions.map((ingredient) => (
            <button
              key={ingredient.name}
              className="py-1 px-3 rounded-full text-sm border bg-gray-50 hover:bg-primary/10 hover:border-primary transition-colors flex items-center"
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
