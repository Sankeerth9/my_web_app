import { 
  type Recipe, 
  type InsertRecipe
} from "@shared/schema";
import { db } from './db';
import { recipes } from '../shared/schema';
import { eq, and, desc } from 'drizzle-orm';

export interface IStorage {
  getUser(id: number): Promise<any | undefined>;
  getUserByUsername(username: string): Promise<any | undefined>;
  createUser(user: any): Promise<any>;
  
  // Recipe-related methods
  createRecipe(recipe: InsertRecipe): Promise<Recipe>;
  getRecipe(id: number): Promise<Recipe | undefined>;
  getSavedRecipes(): Promise<Recipe[]>;
  saveRecipe(recipeId: number): Promise<void>;
  removeSavedRecipe(recipeId: number): Promise<void>;
  getAllRecipes(): Promise<Recipe[]>;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private users: Map<number, any>;
  private recipes: Map<number, Recipe>;
  private savedRecipes: Set<number>;
  private currentUserId: number;
  private currentRecipeId: number;

  constructor() {
    this.users = new Map();
    this.recipes = new Map();
    this.savedRecipes = new Set();
    this.currentUserId = 1;
    this.currentRecipeId = 1;
  }

  async getUser(id: number) {
    return this.users.get(id);
  }

  async getUserByUsername(username: string) {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: any) {
    const id = this.currentUserId++;
    const user = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createRecipe(insertRecipe: InsertRecipe): Promise<Recipe> {
    const id = this.currentRecipeId++;
    
    // Ensure proper typing for dietaryFlags
    const dietaryFlags: Record<string, boolean> = {};
    if (insertRecipe.dietaryFlags) {
      // Convert the object to proper boolean values
      Object.entries(insertRecipe.dietaryFlags).forEach(([key, value]) => {
        dietaryFlags[key] = Boolean(value);
      });
    }
    
    const recipe: Recipe = { 
      title: insertRecipe.title,
      description: insertRecipe.description,
      ingredients: insertRecipe.ingredients,
      instructions: insertRecipe.instructions,
      cuisine: insertRecipe.cuisine,
      calories: insertRecipe.calories,
      cookTime: insertRecipe.cookTime,
      imageUrl: insertRecipe.imageUrl,
      chefNote: insertRecipe.chefNote || null,
      dietaryFlags: dietaryFlags,
      id,
      saved: false 
    };
    
    this.recipes.set(id, recipe);
    return recipe;
  }

  async getRecipe(id: number): Promise<Recipe | undefined> {
    return this.recipes.get(id);
  }

  async getSavedRecipes(): Promise<Recipe[]> {
    return Array.from(this.savedRecipes)
      .map(id => this.recipes.get(id))
      .filter((recipe): recipe is Recipe => recipe !== undefined);
  }
  
  async getAllRecipes(): Promise<Recipe[]> {
    return Array.from(this.recipes.values());
  }

  async saveRecipe(recipeId: number): Promise<void> {
    if (!this.recipes.has(recipeId)) {
      throw new Error(`Recipe with ID ${recipeId} does not exist`);
    }
    // Add to saved set for backward compatibility
    this.savedRecipes.add(recipeId);
    
    // Update the saved flag
    const recipe = this.recipes.get(recipeId);
    if (recipe) {
      recipe.saved = true;
      this.recipes.set(recipeId, recipe);
    }
  }

  async removeSavedRecipe(recipeId: number): Promise<void> {
    // Remove from saved set for backward compatibility
    this.savedRecipes.delete(recipeId);
    
    // Update the saved flag
    const recipe = this.recipes.get(recipeId);
    if (recipe) {
      recipe.saved = false;
      this.recipes.set(recipeId, recipe);
    }
  }
}

// Database storage implementation using PostgreSQL
export class DbStorage implements IStorage {
  async getUser(id: number) {
    // User functionality not needed for this app
    return undefined;
  }

  async getUserByUsername(username: string) {
    // User functionality not needed for this app
    return undefined;
  }

  async createUser(user: any) {
    // User functionality not needed for this app
    return user;
  }

  async createRecipe(recipe: InsertRecipe): Promise<Recipe> {
    try {
      // Ensure proper typing for dietaryFlags
      const dietaryFlags: Record<string, boolean> = {};
      if (recipe.dietaryFlags) {
        // Convert the object to proper boolean values
        Object.entries(recipe.dietaryFlags).forEach(([key, value]) => {
          dietaryFlags[key] = Boolean(value);
        });
      }
        
      // Insert the recipe into the database with proper typing
      const recipeData = {
        title: recipe.title,
        description: recipe.description,
        ingredients: recipe.ingredients,
        instructions: recipe.instructions,
        cuisine: recipe.cuisine,
        calories: recipe.calories,
        cookTime: recipe.cookTime,
        imageUrl: recipe.imageUrl,
        chefNote: recipe.chefNote || null,
        dietaryFlags: dietaryFlags,
        saved: false
      };
      
      const result = await db.insert(recipes).values(recipeData).returning();
      
      // Ensure the saved field is a boolean
      return {
        ...result[0],
        saved: result[0].saved === true
      };
    } catch (error) {
      console.error('Error creating recipe:', error);
      throw error;
    }
  }

  async getRecipe(id: number): Promise<Recipe | undefined> {
    try {
      const result = await db.select().from(recipes).where(eq(recipes.id, id));
      if (!result.length) return undefined;
      
      // Ensure saved is a boolean
      return {
        ...result[0],
        saved: result[0].saved === true
      };
    } catch (error) {
      console.error(`Error fetching recipe with id ${id}:`, error);
      return undefined;
    }
  }

  async getSavedRecipes(): Promise<Recipe[]> {
    try {
      const result = await db.select().from(recipes).where(eq(recipes.saved, true)).orderBy(desc(recipes.id));
      
      // Ensure saved is a boolean for each recipe
      return result.map(recipe => ({
        ...recipe,
        saved: recipe.saved === true
      }));
    } catch (error) {
      console.error('Error fetching saved recipes:', error);
      return [];
    }
  }
  
  async getAllRecipes(): Promise<Recipe[]> {
    try {
      const result = await db.select().from(recipes).orderBy(desc(recipes.id));
      
      // Ensure saved is a boolean for each recipe
      return result.map(recipe => ({
        ...recipe,
        saved: recipe.saved === true
      }));
    } catch (error) {
      console.error('Error fetching all recipes:', error);
      return [];
    }
  }

  async saveRecipe(recipeId: number): Promise<void> {
    try {
      await db.update(recipes)
        .set({ saved: true })
        .where(eq(recipes.id, recipeId));
    } catch (error) {
      console.error(`Error saving recipe with id ${recipeId}:`, error);
      throw error;
    }
  }

  async removeSavedRecipe(recipeId: number): Promise<void> {
    try {
      await db.update(recipes)
        .set({ saved: false })
        .where(eq(recipes.id, recipeId));
    } catch (error) {
      console.error(`Error removing saved recipe with id ${recipeId}:`, error);
      throw error;
    }
  }
}

// Use database storage if DATABASE_URL is available, otherwise use memory storage
export const storage = process.env.DATABASE_URL
  ? new DbStorage()
  : new MemStorage();
