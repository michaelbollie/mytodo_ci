import { neon } from "@neondatabase/serverless"

// Ensure DATABASE_URL is set in your environment variables
// For local development, you might use a .env file (though not supported in Next.js directly)
// On Vercel, you'll set it in your project settings.
const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  throw new Error("DATABASE_URL environment variable is not set.")
}

// Create a reusable SQL client instance
export const sql = neon(databaseUrl)

// Example function to test connection (optional, for demonstration)
export async function testDbConnection() {
  try {
    const result = await sql`SELECT NOW() as current_time`
    console.log("Database connected successfully:", result[0].current_time)
    return true
  } catch (error) {
    console.error("Failed to connect to database:", error)
    return false
  }
}
