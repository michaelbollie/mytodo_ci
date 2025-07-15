import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getUserSession } from "@/lib/session"

// GET /api/invoices/for-delivery-notes - Get invoices suitable for linking to delivery notes (admin only)
export async function GET(request: Request) {
  try {
    const session = await getUserSession()
    if (!session || session.userRole !== "admin") {
      return NextResponse.json({ message: "Forbidden: Admins only" }, { status: 403 })
    }

    // Fetch invoices that are not yet fully delivered or are relevant for delivery note creation
    // You might refine this query based on your business logic (e.g., status 'sent', 'paid')
    const invoices = await sql`
      SELECT i.id, i.invoice_number, i.total_amount, u.email as client_email
      FROM invoices i
      JOIN users u ON i.user_id = u.id
      WHERE i.status IN ('sent', 'paid') -- Example: only allow delivery notes for sent or paid invoices
      ORDER BY i.invoice_number ASC;
    `

    return NextResponse.json(invoices, { status: 200 })
  } catch (error) {
    console.error("Error fetching invoices for delivery notes:", error)
    return NextResponse.json({ message: "Internal server error." }, { status: 500 })
  }
}
