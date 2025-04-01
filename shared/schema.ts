import { pgTable, text, serial, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Existing users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Define dietary flags interface for type safety
export interface DietaryFlags {
  vegetarian?: boolean;
  vegan?: boolean;
  glutenFree?: boolean;
  lowCarb?: boolean;
  dairyFree?: boolean;
  keto?: boolean;
}

// Recipe schema
export const recipes = pgTable("recipes", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  ingredients: text("ingredients").array().notNull(),
  instructions: text("instructions").array().notNull(),
  cuisine: text("cuisine").notNull(),
  calories: integer("calories").notNull(),
  cookTime: text("cookTime").notNull(),
  imageUrl: text("imageUrl").notNull(),
  chefNote: text("chefNote"),
  dietaryFlags: jsonb("dietary_flags").$type<DietaryFlags>().notNull()
});

export const insertRecipeSchema = createInsertSchema(recipes).omit({
  id: true
});

export const recipeGenerationSchema = z.object({
  ingredients: z.array(z.string()).min(1, "At least one ingredient is required"),
  cuisine: z.string().min(1, "Cuisine type is required"),
  dietary: z.array(z.string()).optional()
});

export const savedRecipeSchema = z.object({
  recipeId: z.number().int().positive()
});

export type RecipeGeneration = z.infer<typeof recipeGenerationSchema>;
export type Recipe = typeof recipes.$inferSelect;
export type InsertRecipe = z.infer<typeof insertRecipeSchema>;
export type SavedRecipe = z.infer<typeof savedRecipeSchema>;
