import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Recipe } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { BookmarkIcon, EyeIcon, TrashIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface SavedRecipesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SavedRecipesModal = ({ open, onOpenChange }: SavedRecipesModalProps) => {
  const { data: savedRecipes, isLoading } = useQuery<Recipe[]>({
    queryKey: ['/api/recipes/saved'],
    enabled: open,
  });
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [removing, setRemoving] = useState<number | null>(null);

  const removeRecipe = async (recipeId: number) => {
    try {
      setRemoving(recipeId);
      await apiRequest('DELETE', `/api/recipes/saved/${recipeId}`, undefined);
      queryClient.invalidateQueries({ queryKey: ['/api/recipes/saved'] });
      toast({
        title: "Recipe removed",
        description: "Recipe has been removed from your saved recipes.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to remove recipe",
        description: "Please try again later."
      });
    } finally {
      setRemoving(null);
    }
  };

  const handleViewRecipe = (recipe: Recipe) => {
    // Close the modal and scroll to the recipe
    onOpenChange(false);
    
    // This is a simple way to find the recipe on the page
    // In a real app, you might want to navigate to a recipe detail page
    setTimeout(() => {
      const recipeElements = document.querySelectorAll('.recipe-card');
      recipeElements.forEach(element => {
        if (element.textContent?.includes(recipe.title)) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      });
    }, 100);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[80vh] flex flex-col">
        <DialogHeader className="border-b pb-4">
          <DialogTitle className="flex items-center font-heading font-semibold text-lg">
            <BookmarkIcon className="text-primary mr-2 h-5 w-5" />
            Saved Recipes
          </DialogTitle>
        </DialogHeader>
        
        <div className="overflow-y-auto flex-grow p-4">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="loading-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          ) : savedRecipes?.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-3">📝</div>
              <h4 className="font-heading font-semibold mb-2">No saved recipes yet</h4>
              <p className="text-neutral-dark/70 text-sm">Your saved recipes will appear here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {savedRecipes?.map((recipe) => (
                <div key={recipe.id} className="border rounded-lg p-3 flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-12 w-12 bg-neutral rounded-md overflow-hidden">
                      <img src={recipe.imageUrl} alt={recipe.title} className="h-full w-full object-cover" />
                    </div>
                    <div className="ml-3">
                      <h4 className="font-semibold text-sm">{recipe.title}</h4>
                      <p className="text-xs text-neutral-dark/70">
                        {recipe.cuisine} • {recipe.calories} calories
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-secondary hover:text-primary"
                      onClick={() => handleViewRecipe(recipe)}
                    >
                      <EyeIcon className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-secondary hover:text-error"
                      onClick={() => removeRecipe(recipe.id)}
                      disabled={removing === recipe.id}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
