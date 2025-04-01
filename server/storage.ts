import { 
  type Recipe, 
  type InsertRecipe
} from "@shared/schema";

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
}

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
    const recipe: Recipe = { ...insertRecipe, id };
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

  async saveRecipe(recipeId: number): Promise<void> {
    if (!this.recipes.has(recipeId)) {
      throw new Error(`Recipe with ID ${recipeId} does not exist`);
    }
    this.savedRecipes.add(recipeId);
  }

  async removeSavedRecipe(recipeId: number): Promise<void> {
    this.savedRecipes.delete(recipeId);
  }
}

export const storage = new MemStorage();
