import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateRecipes } from "./openai";
import { recipeGenerationSchema, savedRecipeSchema } from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

export async function registerRoutes(app: Express): Promise<Server> {
  // Generate recipes based on ingredients, cuisine type, and dietary preferences
  // Note: This endpoint will use sample recipes if no OpenAI API key is provided
  app.post("/api/recipes/generate", async (req, res) => {
    try {
      const validatedData = recipeGenerationSchema.parse(req.body);
      
      // If no OpenAI API key is set, we'll still generate recipes using fallback data
      const recipes = await generateRecipes(
        validatedData.ingredients,
        validatedData.cuisine,
        validatedData.dietary || []
      );
      
      // Save the generated recipes in storage
      const savedRecipes = await Promise.all(
        recipes.map(recipe => storage.createRecipe(recipe))
      );
      
      return res.status(200).json({ 
        success: true, 
        recipes: savedRecipes 
      });
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ 
          success: false, 
          message: validationError.message 
        });
      }
      
      console.error("Error generating recipes:", error);
      return res.status(500).json({ 
        success: false, 
        message: "Failed to generate recipes. Please try again." 
      });
    }
  });

  // Get all recipes
  app.get("/api/recipes", async (req, res) => {
    try {
      const allRecipes = await storage.getAllRecipes();
      return res.status(200).json(allRecipes);
    } catch (error) {
      console.error("Error fetching all recipes:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch recipes"
      });
    }
  });

  // Get all saved recipes
  app.get("/api/recipes/saved", async (req, res) => {
    try {
      const savedRecipes = await storage.getSavedRecipes();
      return res.status(200).json(savedRecipes);
    } catch (error) {
      console.error("Error fetching saved recipes:", error);
      return res.status(500).json({ 
        success: false, 
        message: "Failed to fetch saved recipes" 
      });
    }
  });

  // Save a recipe
  app.post("/api/recipes/save", async (req, res) => {
    try {
      const { recipeId } = savedRecipeSchema.parse(req.body);
      const recipe = await storage.getRecipe(recipeId);
      
      if (!recipe) {
        return res.status(404).json({ 
          success: false, 
          message: "Recipe not found" 
        });
      }
      
      await storage.saveRecipe(recipeId);
      return res.status(200).json({ 
        success: true, 
        message: "Recipe saved successfully" 
      });
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ 
          success: false, 
          message: validationError.message 
        });
      }
      
      console.error("Error saving recipe:", error);
      return res.status(500).json({ 
        success: false, 
        message: "Failed to save recipe" 
      });
    }
  });

  // Remove a saved recipe
  app.delete("/api/recipes/saved/:id", async (req, res) => {
    try {
      const recipeId = parseInt(req.params.id);
      
      if (isNaN(recipeId) || recipeId <= 0) {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid recipe ID" 
        });
      }
      
      await storage.removeSavedRecipe(recipeId);
      return res.status(200).json({ 
        success: true, 
        message: "Recipe removed from saved recipes" 
      });
    } catch (error) {
      console.error("Error removing saved recipe:", error);
      return res.status(500).json({ 
        success: false, 
        message: "Failed to remove saved recipe" 
      });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
