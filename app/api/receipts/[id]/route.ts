import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getUserSession } from "@/lib/session"

// GET /api/receipts/[id] - Get a single receipt
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getUserSession()
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { id } = params
    const [receipt] = await sql`
      SELECT r.*, i.invoice_number, i.user_id, u.email as client_email
      FROM receipts r
      JOIN invoices i ON r.invoice_id = i.id
      JOIN users u ON i.user_id = u.id
      WHERE r.id = ${id}
    `

    if (!receipt) {
      return NextResponse.json({ message: "Receipt not found." }, { status: 404 })
    }

    // Authorization check: Admin can view any receipt, client can only view their own
    if (session.userRole !== "admin" && receipt.user_id !== session.userId) {
      return NextResponse.json({ message: "Forbidden: You can only view your own receipts." }, { status: 403 })
    }

    return NextResponse.json(receipt, { status: 200 })
  } catch (error) {
    console.error(`Error fetching receipt ${params.id}:`, error)
    return NextResponse.json({ message: "Internal server error." }, { status: 500 })
  }
}

// PUT /api/receipts/[id] - Update a receipt (admin only)
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getUserSession()
    if (!session || session.userRole !== "admin") {
      return NextResponse.json({ message: "Forbidden: Admins only" }, { status: 403 })
    }

    const { id } = params
    const { invoiceId, paymentDate, amountPaid, paymentMethod } = await request.json()

    const [updatedReceipt] = await sql`
      UPDATE receipts
      SET
        invoice_id = COALESCE(${invoiceId}, invoice_id),
        payment_date = COALESCE(${paymentDate}, payment_date),
        amount_paid = COALESCE(${amountPaid}, amount_paid),
        payment_method = COALESCE(${paymentMethod}, payment_method),
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *;
    `

    if (!updatedReceipt) {
      return NextResponse.json({ message: "Receipt not found or no changes made." }, { status: 404 })
    }

    // Re-evaluate invoice status after receipt update
    const [invoice] = await sql`SELECT total_amount FROM invoices WHERE id = ${updatedReceipt.invoice_id}`
    if (invoice) {
      const [totalPaid] =
        await sql`SELECT COALESCE(SUM(amount_paid), 0) as total_paid FROM receipts WHERE invoice_id = ${updatedReceipt.invoice_id}`
      if (Number(totalPaid.total_paid) >= Number(invoice.total_amount)) {
        await sql`UPDATE invoices SET status = 'paid' WHERE id = ${updatedReceipt.invoice_id}`
      } else {
        await sql`UPDATE invoices SET status = 'sent' WHERE id = ${updatedReceipt.invoice_id}` // Or 'overdue' if applicable
      }
    }

    return NextResponse.json(updatedReceipt, { status: 200 })
  } catch (error) {
    console.error(`Error updating receipt ${params.id}:`, error)
    return NextResponse.json({ message: "Internal server error." }, { status: 500 })
  }
}

// DELETE /api/receipts/[id] - Delete a receipt (admin only)
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getUserSession()
    if (!session || session.userRole !== "admin") {
      return NextResponse.json({ message: "Forbidden: Admins only" }, { status: 403 })
    }

    const { id } = params
    const [deletedReceipt] = await sql`DELETE FROM receipts WHERE id = ${id} RETURNING id, invoice_id;`

    if (!deletedReceipt) {
      return NextResponse.json({ message: "Receipt not found." }, { status: 404 })
    }

    // Re-evaluate invoice status after receipt deletion
    const [invoice] = await sql`SELECT total_amount FROM invoices WHERE id = ${deletedReceipt.invoice_id}`
    if (invoice) {
      const [totalPaid] =
        await sql`SELECT COALESCE(SUM(amount_paid), 0) as total_paid FROM receipts WHERE invoice_id = ${deletedReceipt.invoice_id}`
      if (Number(totalPaid.total_paid) < Number(invoice.total_amount)) {
        await sql`UPDATE invoices SET status = 'sent' WHERE id = ${deletedReceipt.invoice_id}` // Or 'overdue'
      }
    }

    return NextResponse.json({ message: "Receipt deleted successfully." }, { status: 200 })
  } catch (error) {
    console.error(`Error deleting receipt ${params.id}:`, error)
    return NextResponse.json({ message: "Internal server error." }, { status: 500 })
  }
}
