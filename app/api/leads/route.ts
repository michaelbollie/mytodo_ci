import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getUserSession } from "@/lib/session"

// GET /api/leads - Get all leads (admin only)
export async function GET(request: Request) {
  try {
    const session = await getUserSession()
    if (!session || session.userRole !== "admin") {
      return NextResponse.json({ message: "Forbidden: Admins only" }, { status: 403 })
    }

    const leads = await sql`
      SELECT l.*, u.email as assigned_to_email
      FROM leads l
      LEFT JOIN users u ON l.assigned_to = u.id
      ORDER BY l.created_at DESC
    `

    return NextResponse.json(leads, { status: 200 })
  } catch (error) {
    console.error("Error fetching leads:", error)
    return NextResponse.json({ message: "Internal server error." }, { status: 500 })
  }
}

// POST /api/leads - Create a new lead (admin only)
export async function POST(request: Request) {
  try {
    const session = await getUserSession()
    if (!session || session.userRole !== "admin") {
      return NextResponse.json({ message: "Forbidden: Admins only" }, { status: 403 })
    }

    const { name, email, phone, company, source, status, notes, assignedTo } = await request.json()

    if (!name) {
      return NextResponse.json({ message: "Lead name is required." }, { status: 400 })
    }

    const [newLead] = await sql`
      INSERT INTO leads (name, email, phone, company, source, status, notes, assigned_to)
      VALUES (${name}, ${email || null}, ${phone || null}, ${company || null}, ${source || null}, ${status || "new"}, ${notes || null}, ${assignedTo || null})
      RETURNING *;
    `

    return NextResponse.json(newLead, { status: 201 })
  } catch (error) {
    console.error("Error creating lead:", error)
    // Handle unique email constraint error specifically
    if (error instanceof Error && error.message.includes("duplicate key value violates unique constraint")) {
      return NextResponse.json({ message: "A lead with this email already exists." }, { status: 409 })
    }
    return NextResponse.json({ message: "Internal server error." }, { status: 500 })
  }
}
