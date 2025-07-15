import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getUserSession } from "@/lib/session"

// GET /api/admin/users - Get all users (admin only)
export async function GET(request: Request) {
  try {
    const session = await getUserSession()
    if (!session || session.userRole !== "admin") {
      return NextResponse.json({ message: "Forbidden: Admins only" }, { status: 403 })
    }

    // Fetch all users, excluding password hash
    const users = await sql`SELECT id, email, role, status, created_at, updated_at FROM users ORDER BY created_at DESC`
    return NextResponse.json(users, { status: 200 })
  } catch (error) {
    console.error("Error fetching all users for admin:", error)
    return NextResponse.json({ message: "Internal server error." }, { status: 500 })
  }
}
