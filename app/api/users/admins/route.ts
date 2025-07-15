import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getUserSession } from "@/lib/session"

// GET /api/users/admins - Get all users with role 'admin' (admin only)
export async function GET(request: Request) {
  try {
    const session = await getUserSession()
    if (!session || session.userRole !== "admin") {
      return NextResponse.json({ message: "Forbidden: Admins only" }, { status: 403 })
    }

    const admins = await sql`SELECT id, email FROM users WHERE role = 'admin' ORDER BY email ASC`

    return NextResponse.json(admins, { status: 200 })
  } catch (error) {
    console.error("Error fetching admin users:", error)
    return NextResponse.json({ message: "Internal server error." }, { status: 500 })
  }
}
