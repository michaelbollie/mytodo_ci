import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getUserSession } from "@/lib/session"

// GET /api/delivery-notes/[id] - Get a single delivery note with items (admin only)
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getUserSession()
    if (!session || session.userRole !== "admin") {
      return NextResponse.json({ message: "Forbidden: Admins only" }, { status: 403 })
    }

    const { id } = params
    const [deliveryNote] = await sql`
      SELECT dn.*, i.invoice_number, u.email as client_email
      FROM delivery_notes dn
      LEFT JOIN invoices i ON dn.invoice_id = i.id
      LEFT JOIN users u ON i.user_id = u.id
      WHERE dn.id = ${id}
    `

    if (!deliveryNote) {
      return NextResponse.json({ message: "Delivery note not found." }, { status: 404 })
    }

    const items = await sql`SELECT * FROM delivery_note_items WHERE delivery_note_id = ${id} ORDER BY created_at ASC`

    return NextResponse.json({ ...deliveryNote, items }, { status: 200 })
  } catch (error) {
    console.error(`Error fetching delivery note ${params.id}:`, error)
    return NextResponse.json({ message: "Internal server error." }, { status: 500 })
  }
}

// PUT /api/delivery-notes/[id] - Update a delivery note with items (admin only)
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
    const { invoiceId, issueDate, recipientName, recipientAddress, status, notes, items } = await request.json()

    const [updatedDeliveryNote] = await client`
      UPDATE delivery_notes
      SET
        invoice_id = COALESCE(${invoiceId}, invoice_id),
        issue_date = COALESCE(${issueDate}, issue_date),
        recipient_name = COALESCE(${recipientName}, recipient_name),
        recipient_address = COALESCE(${recipientAddress}, recipient_address),
        status = COALESCE(${status}, status),
        notes = COALESCE(${notes}, notes),
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *;
    `

    if (!updatedDeliveryNote) {
      await client.query("ROLLBACK")
      return NextResponse.json({ message: "Delivery note not found or no changes made." }, { status: 404 })
    }

    // Handle delivery note items: delete existing, then insert new ones
    await client`DELETE FROM delivery_note_items WHERE delivery_note_id = ${id}`
    if (Array.isArray(items) && items.length > 0) {
      const itemValues = items.map((item: any) => ({
        delivery_note_id: updatedDeliveryNote.id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unitPrice,
      }))
      await client`
        INSERT INTO delivery_note_items ${client(itemValues, "delivery_note_id", "description", "quantity", "unit_price")}
      `
    }

    await client.query("COMMIT")
    return NextResponse.json({ ...updatedDeliveryNote, items }, { status: 200 })
  } catch (error) {
    await client.query("ROLLBACK")
    console.error(`Error updating delivery note ${params.id}:`, error)
    if (error instanceof Error && error.message.includes("duplicate key value violates unique constraint")) {
      return NextResponse.json({ message: "A delivery note with this number already exists." }, { status: 409 })
    }
    return NextResponse.json({ message: "Internal server error." }, { status: 500 })
  } finally {
    client.release()
  }
}

// DELETE /api/delivery-notes/[id] - Delete a delivery note (admin only)
// Note: ON DELETE CASCADE in schema handles deleting associated items
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getUserSession()
    if (!session || session.userRole !== "admin") {
      return NextResponse.json({ message: "Forbidden: Admins only" }, { status: 403 })
    }

    const { id } = params
    const [deletedDeliveryNote] = await sql`DELETE FROM delivery_notes WHERE id = ${id} RETURNING id;`

    if (!deletedDeliveryNote) {
      return NextResponse.json({ message: "Delivery note not found." }, { status: 404 })
    }

    return NextResponse.json({ message: "Delivery note deleted successfully." }, { status: 200 })
  } catch (error) {
    console.error(`Error deleting delivery note ${params.id}:`, error)
    return NextResponse.json({ message: "Internal server error." }, { status: 500 })
  }
}
