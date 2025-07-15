import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getUserSession } from "@/lib/session"

// GET /api/invoices/for-receipts - Get invoices suitable for receipt creation (admin only)
export async function GET(request: Request) {
  try {
    const session = await getUserSession()
    if (!session || session.userRole !== "admin") {
      return NextResponse.json({ message: "Forbidden: Admins only" }, { status: 403 })
    }

    // Fetch invoices that are not yet fully paid or are relevant for receipt creation
    // You might refine this query based on your business logic (e.g., status 'sent', 'overdue')
    const invoices = await sql`
      SELECT id, invoice_number, total_amount, user_id
      FROM invoices
      WHERE status IN ('sent', 'overdue') OR total_amount > (SELECT COALESCE(SUM(amount_paid), 0) FROM receipts WHERE invoice_id = invoices.id)
      ORDER BY invoice_number ASC;
    `

    return NextResponse.json(invoices, { status: 200 })
  } catch (error) {
    console.error("Error fetching invoices for receipts:", error)
    return NextResponse.json({ message: "Internal server error." }, { status: 500 })
  }
}
