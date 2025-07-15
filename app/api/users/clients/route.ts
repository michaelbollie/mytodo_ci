import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getUserSession } from "@/lib/session"

// GET /api/users/clients - Get all users with role 'client' (admin only)
export async function GET(request: Request) {
  try {
    const session = await getUserSession()
    if (!session || session.userRole !== "admin") {
      return NextResponse.json({ message: "Forbidden: Admins only" }, { status: 403 })
    }

    const clients = await sql`SELECT id, email FROM users WHERE role = 'client' ORDER BY email ASC`

    return NextResponse.json(clients, { status: 200 })
  } catch (error) {
    console.error("Error fetching client users:", error)
    return NextResponse.json({ message: "Internal server error." }, { status: 500 })
  }
}
