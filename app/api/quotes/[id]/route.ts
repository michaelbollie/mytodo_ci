import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getUserSession } from "@/lib/session"

// GET /api/quotes/[id] - Get a single quote with items
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getUserSession()
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { id } = params
    const [quote] = await sql`SELECT * FROM quotes WHERE id = ${id}`

    if (!quote) {
      return NextResponse.json({ message: "Quote not found." }, { status: 404 })
    }

    // Authorization check: Admin can view any quote, client can only view their own
    if (session.userRole !== "admin" && quote.user_id !== session.userId) {
      return NextResponse.json({ message: "Forbidden: You can only view your own quotes." }, { status: 403 })
    }

    const items = await sql`SELECT * FROM quote_items WHERE quote_id = ${id} ORDER BY created_at ASC`

    return NextResponse.json({ ...quote, items }, { status: 200 })
  } catch (error) {
    console.error(`Error fetching quote ${params.id}:`, error)
    return NextResponse.json({ message: "Internal server error." }, { status: 500 })
  }
}

// PUT /api/quotes/[id] - Update a quote with items (admin only)
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const client = await sql.reserve() // Use a transaction for atomicity
  try {
    await client.query("BEGIN")

    const session = await getUserSession()
    if (!session || session.userRole !== "admin") {
      await client.query("ROLLBACK")
      return NextResponse.json({ message: "Forbidden: Admins only" }, { status: 403 })
    }

    const { id } = params
    const { userId, issueDate, dueDate, totalAmount, status, items } = await request.json()

    const [updatedQuote] = await client`
      UPDATE quotes
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

    if (!updatedQuote) {
      await client.query("ROLLBACK")
      return NextResponse.json({ message: "Quote not found or no changes made." }, { status: 404 })
    }

    // Handle quote items: delete existing, then insert new ones
    await client`DELETE FROM quote_items WHERE quote_id = ${id}`
    if (Array.isArray(items) && items.length > 0) {
      const itemValues = items.map((item: any) => ({
        quote_id: updatedQuote.id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        total: item.quantity * item.unitPrice,
      }))
      await client`
        INSERT INTO quote_items ${client(itemValues, "quote_id", "description", "quantity", "unit_price", "total")}
      `
    }

    await client.query("COMMIT")
    return NextResponse.json({ ...updatedQuote, items }, { status: 200 })
  } catch (error) {
    await client.query("ROLLBACK")
    console.error(`Error updating quote ${params.id}:`, error)
    return NextResponse.json({ message: "Internal server error." }, { status: 500 })
  } finally {
    client.release()
  }
}

// DELETE /api/quotes/[id] - Delete a quote (admin only)
// Note: ON DELETE CASCADE in schema handles deleting associated items
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getUserSession()
    if (!session || session.userRole !== "admin") {
      return NextResponse.json({ message: "Forbidden: Admins only" }, { status: 403 })
    }

    const { id } = params
    const [deletedQuote] = await sql`DELETE FROM quotes WHERE id = ${id} RETURNING id;`

    if (!deletedQuote) {
      return NextResponse.json({ message: "Quote not found." }, { status: 404 })
    }

    return NextResponse.json({ message: "Quote deleted successfully." }, { status: 200 })
  } catch (error) {
    console.error(`Error deleting quote ${params.id}:`, error)
    return NextResponse.json({ message: "Internal server error." }, { status: 500 })
  }
}
