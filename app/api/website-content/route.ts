import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getUserSession } from "@/lib/session"

// GET /api/website-content - Get all editable content sections (admin only)
export async function GET(request: Request) {
  try {
    const session = await getUserSession()
    if (!session || session.userRole !== "admin") {
      return NextResponse.json({ message: "Forbidden: Admins only" }, { status: 403 })
    }

    const content = await sql`SELECT * FROM page_content ORDER BY page_name, section_name ASC`
    return NextResponse.json(content, { status: 200 })
  } catch (error) {
    console.error("Error fetching website content:", error)
    return NextResponse.json({ message: "Internal server error." }, { status: 500 })
  }
}
