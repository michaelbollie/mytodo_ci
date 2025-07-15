import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getUserSession } from "@/lib/session"
import { v4 as uuidv4 } from "uuid"

// GET /api/receipts - Get all receipts (admin) or user's receipts (client)
export async function GET(request: Request) {
  try {
    const session = await getUserSession()
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    let receipts
    if (session.userRole === "admin") {
      receipts = await sql`
        SELECT r.*, i.invoice_number, u.email as client_email
        FROM receipts r
        JOIN invoices i ON r.invoice_id = i.id
        JOIN users u ON i.user_id = u.id
        ORDER BY r.payment_date DESC
      `
    } else {
      receipts = await sql`
        SELECT r.*, i.invoice_number, u.email as client_email
        FROM receipts r
        JOIN invoices i ON r.invoice_id = i.id
        JOIN users u ON i.user_id = u.id
        WHERE i.user_id = ${session.userId}
        ORDER BY r.payment_date DESC
      `
    }

    return NextResponse.json(receipts, { status: 200 })
  } catch (error) {
    console.error("Error fetching receipts:", error)
    return NextResponse.json({ message: "Internal server error." }, { status: 500 })
  }
}

// POST /api/receipts - Create a new receipt (admin only)
export async function POST(request: Request) {
  try {
    const session = await getUserSession()
    if (!session || session.userRole !== "admin") {
      return NextResponse.json({ message: "Forbidden: Admins only" }, { status: 403 })
    }

    const { invoiceId, paymentDate, amountPaid, paymentMethod } = await request.json()

    if (!invoiceId || !paymentDate || !amountPaid) {
      return NextResponse.json({ message: "Missing required fields." }, { status: 400 })
    }

    // Generate a simple receipt number
    const receiptNumber = `REC-${uuidv4().substring(0, 8).toUpperCase()}`

    const [newReceipt] = await sql`
      INSERT INTO receipts (invoice_id, receipt_number, payment_date, amount_paid, payment_method)
      VALUES (${invoiceId}, ${receiptNumber}, ${paymentDate}, ${amountPaid}, ${paymentMethod || "N/A"})
      RETURNING *;
    `

    // Optionally, update the invoice status if fully paid
    // This logic can be more complex, e.g., partial payments
    const [invoice] = await sql`SELECT total_amount FROM invoices WHERE id = ${invoiceId}`
    if (invoice) {
      const [totalPaid] =
        await sql`SELECT COALESCE(SUM(amount_paid), 0) as total_paid FROM receipts WHERE invoice_id = ${invoiceId}`
      if (Number(totalPaid.total_paid) >= Number(invoice.total_amount)) {
        await sql`UPDATE invoices SET status = 'paid' WHERE id = ${invoiceId}`
      }
    }

    return NextResponse.json(newReceipt, { status: 201 })
  } catch (error) {
    console.error("Error creating receipt:", error)
    return NextResponse.json({ message: "Internal server error." }, { status: 500 })
  }
}
