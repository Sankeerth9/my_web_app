import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { recipes } from '../shared/schema';

// Initialize the database connection
const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql);

// Create a utility function to initialize the database schema
export async function initDatabase() {
  try {
    // Check if tables exist by trying a simple query
    await db.select().from(recipes).limit(1);
    console.log('Database tables already exist');
  } catch (error) {
    console.log('Creating database tables...');
    try {
      // Create tables if they don't exist
      await sql`
        CREATE TABLE IF NOT EXISTS recipes (
          id SERIAL PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT NOT NULL,
          instructions TEXT[] NOT NULL,
          ingredients TEXT[] NOT NULL,
          cuisine TEXT NOT NULL,
          "cookTime" TEXT NOT NULL,
          calories INTEGER NOT NULL,
          "dietaryFlags" JSONB NOT NULL,
          "imageUrl" TEXT NOT NULL,
          "chefNote" TEXT,
          saved BOOLEAN DEFAULT false
        );
      `;
      console.log('Database tables created successfully');
    } catch (createError) {
      console.error('Error creating database tables:', createError);
      throw createError;
    }
  }
}