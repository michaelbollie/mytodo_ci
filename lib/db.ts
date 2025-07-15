import { neon } from "@neondatabase/serverless"

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  throw new Error("DATABASE_URL environment variable is not set.")
}

// Log a masked version of the URL for debugging purposes.
// This helps verify if the variable is being picked up, without exposing sensitive information.
console.log(`[DB] Attempting to connect to database: ${databaseUrl.substring(0, 20)}... (masked)`)

export const sql = neon(databaseUrl)

// This function is for explicit connection testing and can provide more detailed error messages.
// While app/page.tsx catches the error, this function can be called elsewhere for diagnostics.
export async function testDbConnection() {
  try {
    const result = await sql`SELECT NOW() as current_time`
    console.log("[DB] Database connected successfully:", result[0].current_time)
    return true
  } catch (error: any) {
    console.error("[DB Error] Failed to connect to database.")
    console.error("[DB Error] Details:", error.message || error)
    if (error instanceof TypeError && error.message === "Load failed") {
      console.error(
        "[DB Error] This 'Load failed' error often indicates a network connectivity issue or an invalid database URL.",
      )
      console.error(
        "[DB Error] Please ensure your DATABASE_URL environment variable is correctly set in Vercel project settings.",
      )
      console.error("[DB Error] Also, verify that your Neon database is active and accessible from Vercel's network.")
    } else {
      console.error("[DB Error] Please check your database credentials and network configuration.")
    }
    return false
  }
}
