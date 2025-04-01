import { useState } from 'react';
import { SavedRecipesModal } from './SavedRecipesModal';
import { Button } from '@/components/ui/button';
import { BookmarkIcon } from 'lucide-react';

export const Header = () => {
  const [savedRecipesOpen, setSavedRecipesOpen] = useState(false);
  
  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center">
          <h1 className="text-2xl md:text-3xl font-heading font-bold text-primary">
            <span className="mr-2">🧪</span>FoodGenius
          </h1>
          <p className="ml-3 text-sm hidden md:block text-neutral-dark/70">AI Recipe Generator</p>
        </div>
        <Button 
          variant="outline" 
          className="text-secondary border-secondary hover:bg-secondary hover:text-white rounded-full"
          onClick={() => setSavedRecipesOpen(true)}
        >
          <BookmarkIcon className="mr-2 h-4 w-4" />
          Saved Recipes
        </Button>
      </div>
      
      <SavedRecipesModal open={savedRecipesOpen} onOpenChange={setSavedRecipesOpen} />
    </header>
  );
};
