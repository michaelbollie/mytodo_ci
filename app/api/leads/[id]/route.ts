import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getUserSession } from "@/lib/session"

// GET /api/leads/[id] - Get a single lead (admin only)
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getUserSession()
    if (!session || session.userRole !== "admin") {
      return NextResponse.json({ message: "Forbidden: Admins only" }, { status: 403 })
    }

    const { id } = params
    const [lead] = await sql`
      SELECT l.*, u.email as assigned_to_email
      FROM leads l
      LEFT JOIN users u ON l.assigned_to = u.id
      WHERE l.id = ${id}
    `

    if (!lead) {
      return NextResponse.json({ message: "Lead not found." }, { status: 404 })
    }

    return NextResponse.json(lead, { status: 200 })
  } catch (error) {
    console.error(`Error fetching lead ${params.id}:`, error)
    return NextResponse.json({ message: "Internal server error." }, { status: 500 })
  }
}

// PUT /api/leads/[id] - Update a lead (admin only)
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getUserSession()
    if (!session || session.userRole !== "admin") {
      return NextResponse.json({ message: "Forbidden: Admins only" }, { status: 403 })
    }

    const { id } = params
    const { name, email, phone, company, source, status, notes, assignedTo } = await request.json()

    const [updatedLead] = await sql`
      UPDATE leads
      SET
        name = COALESCE(${name}, name),
        email = COALESCE(${email}, email),
        phone = COALESCE(${phone}, phone),
        company = COALESCE(${company}, company),
        source = COALESCE(${source}, source),
        status = COALESCE(${status}, status),
        notes = COALESCE(${notes}, notes),
        assigned_to = COALESCE(${assignedTo}, assigned_to),
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *;
    `

    if (!updatedLead) {
      return NextResponse.json({ message: "Lead not found or no changes made." }, { status: 404 })
    }

    return NextResponse.json(updatedLead, { status: 200 })
  } catch (error) {
    console.error(`Error updating lead ${params.id}:`, error)
    if (error instanceof Error && error.message.includes("duplicate key value violates unique constraint")) {
      return NextResponse.json({ message: "A lead with this email already exists." }, { status: 409 })
    }
    return NextResponse.json({ message: "Internal server error." }, { status: 500 })
  }
}

// DELETE /api/leads/[id] - Delete a lead (admin only)
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getUserSession()
    if (!session || session.userRole !== "admin") {
      return NextResponse.json({ message: "Forbidden: Admins only" }, { status: 403 })
    }

    const { id } = params
    const [deletedLead] = await sql`DELETE FROM leads WHERE id = ${id} RETURNING id;`

    if (!deletedLead) {
      return NextResponse.json({ message: "Lead not found." }, { status: 404 })
    }

    return NextResponse.json({ message: "Lead deleted successfully." }, { status: 200 })
  } catch (error) {
    console.error(`Error deleting lead ${params.id}:`, error)
    return NextResponse.json({ message: "Internal server error." }, { status: 500 })
  }
}
