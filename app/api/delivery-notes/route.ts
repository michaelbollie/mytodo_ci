import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getUserSession } from "@/lib/session"
import { v4 as uuidv4 } from "uuid"

// GET /api/delivery-notes - Get all delivery notes (admin only)
export async function GET(request: Request) {
  try {
    const session = await getUserSession()
    if (!session || session.userRole !== "admin") {
      return NextResponse.json({ message: "Forbidden: Admins only" }, { status: 403 })
    }

    const deliveryNotes = await sql`
      SELECT dn.*, i.invoice_number, u.email as client_email
      FROM delivery_notes dn
      LEFT JOIN invoices i ON dn.invoice_id = i.id
      LEFT JOIN users u ON i.user_id = u.id -- Join through invoice to get client email
      ORDER BY dn.issue_date DESC
    `

    // Fetch items for each delivery note
    const deliveryNotesWithItems = await Promise.all(
      deliveryNotes.map(async (note: any) => {
        const items =
          await sql`SELECT * FROM delivery_note_items WHERE delivery_note_id = ${note.id} ORDER BY created_at ASC`
        return { ...note, items }
      }),
    )

    return NextResponse.json(deliveryNotesWithItems, { status: 200 })
  } catch (error) {
    console.error("Error fetching delivery notes:", error)
    return NextResponse.json({ message: "Internal server error." }, { status: 500 })
  }
}

// POST /api/delivery-notes - Create a new delivery note with items (admin only)
export async function POST(request: Request) {
  const client = await sql.reserve() // Use a transaction for atomicity
  try {
    await client.query("BEGIN")

    const session = await getUserSession()
    if (!session || session.userRole !== "admin") {
      await client.query("ROLLBACK")
      return NextResponse.json({ message: "Forbidden: Admins only" }, { status: 403 })
    }

    const { invoiceId, issueDate, recipientName, recipientAddress, status, notes, items } = await request.json()

    if (!issueDate || !recipientName || !recipientAddress || !Array.isArray(items)) {
      await client.query("ROLLBACK")
      return NextResponse.json({ message: "Missing required fields or invalid items array." }, { status: 400 })
    }

    // Generate a simple delivery note number
    const deliveryNoteNumber = `DN-${uuidv4().substring(0, 8).toUpperCase()}`

    const [newDeliveryNote] = await client`
      INSERT INTO delivery_notes (invoice_id, delivery_note_number, issue_date, recipient_name, recipient_address, status, notes)
      VALUES (
        ${invoiceId || null},
        ${deliveryNoteNumber},
        ${issueDate},
        ${recipientName},
        ${recipientAddress},
        ${status || "pending"},
        ${notes || null}
      )
      RETURNING *;
    `

    // Insert delivery note items
    if (items.length > 0) {
      const itemValues = items.map((item: any) => ({
        delivery_note_id: newDeliveryNote.id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unitPrice,
      }))
      await client`
        INSERT INTO delivery_note_items ${client(itemValues, "delivery_note_id", "description", "quantity", "unit_price")}
      `
    }

    await client.query("COMMIT")
    return NextResponse.json({ ...newDeliveryNote, items }, { status: 201 })
  } catch (error) {
    await client.query("ROLLBACK")
    console.error("Error creating delivery note:", error)
    if (error instanceof Error && error.message.includes("duplicate key value violates unique constraint")) {
      return NextResponse.json({ message: "A delivery note with this number already exists." }, { status: 409 })
    }
    return NextResponse.json({ message: "Internal server error." }, { status: 500 })
  } finally {
    client.release()
  }
}
