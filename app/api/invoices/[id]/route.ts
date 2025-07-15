import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getUserSession } from "@/lib/session"

// GET /api/invoices/[id] - Get a single invoice
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getUserSession()
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { id } = params
    const [invoice] = await sql`SELECT * FROM invoices WHERE id = ${id}`

    if (!invoice) {
      return NextResponse.json({ message: "Invoice not found." }, { status: 404 })
    }

    // Authorization check: Admin can view any invoice, client can only view their own
    if (session.userRole !== "admin" && invoice.user_id !== session.userId) {
      return NextResponse.json({ message: "Forbidden: You can only view your own invoices." }, { status: 403 })
    }

    return NextResponse.json(invoice, { status: 200 })
  } catch (error) {
    console.error(`Error fetching invoice ${params.id}:`, error)
    return NextResponse.json({ message: "Internal server error." }, { status: 500 })
  }
}

// PUT /api/invoices/[id] - Update an invoice (admin only)
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getUserSession()
    if (!session || session.userRole !== "admin") {
      return NextResponse.json({ message: "Forbidden: Admins only" }, { status: 403 })
    }

    const { id } = params
    const { userId, issueDate, dueDate, totalAmount, status } = await request.json()

    const [updatedInvoice] = await sql`
      UPDATE invoices
      SET
        user_id = COALESCE(${userId}, user_id),
        issue_date = COALESCE(${issueDate}, issue_date),
        due_date = COALESCE(${dueDate}, due_date),
        total_amount = COALESCE(${totalAmount}, total_amount),
        status = COALESCE(${status}, status),
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *;
    `

    if (!updatedInvoice) {
      return NextResponse.json({ message: "Invoice not found or no changes made." }, { status: 404 })
    }

    return NextResponse.json(updatedInvoice, { status: 200 })
  } catch (error) {
    console.error(`Error updating invoice ${params.id}:`, error)
    return NextResponse.json({ message: "Internal server error." }, { status: 500 })
  }
}

// DELETE /api/invoices/[id] - Delete an invoice (admin only)
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getUserSession()
    if (!session || session.userRole !== "admin") {
      return NextResponse.json({ message: "Forbidden: Admins only" }, { status: 403 })
    }

    const { id } = params
    const [deletedInvoice] = await sql`DELETE FROM invoices WHERE id = ${id} RETURNING id;`

    if (!deletedInvoice) {
      return NextResponse.json({ message: "Invoice not found." }, { status: 404 })
    }

    return NextResponse.json({ message: "Invoice deleted successfully." }, { status: 200 })
  } catch (error) {
    console.error(`Error deleting invoice ${params.id}:`, error)
    return NextResponse.json({ message: "Internal server error." }, { status: 500 })
  }
}
