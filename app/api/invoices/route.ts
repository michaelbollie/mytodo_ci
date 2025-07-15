import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getUserSession } from "@/lib/session"
import { v4 as uuidv4 } from "uuid"

// GET /api/invoices - Get all invoices (admin) or user's invoices (client)
export async function GET(request: Request) {
  try {
    const session = await getUserSession()
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    let invoices
    if (session.userRole === "admin") {
      invoices = await sql`SELECT * FROM invoices ORDER BY issue_date DESC`
    } else {
      invoices = await sql`SELECT * FROM invoices WHERE user_id = ${session.userId} ORDER BY issue_date DESC`
    }

    return NextResponse.json(invoices, { status: 200 })
  } catch (error) {
    console.error("Error fetching invoices:", error)
    return NextResponse.json({ message: "Internal server error." }, { status: 500 })
  }
}

// POST /api/invoices - Create a new invoice (admin only)
export async function POST(request: Request) {
  try {
    const session = await getUserSession()
    if (!session || session.userRole !== "admin") {
      return NextResponse.json({ message: "Forbidden: Admins only" }, { status: 403 })
    }

    const { userId, issueDate, dueDate, totalAmount, status } = await request.json()

    if (!userId || !issueDate || !totalAmount) {
      return NextResponse.json({ message: "Missing required fields." }, { status: 400 })
    }

    // Generate a simple invoice number
    const invoiceNumber = `INV-${uuidv4().substring(0, 8).toUpperCase()}`

    const [newInvoice] = await sql`
      INSERT INTO invoices (user_id, invoice_number, issue_date, due_date, total_amount, status)
      VALUES (${userId}, ${invoiceNumber}, ${issueDate}, ${dueDate}, ${totalAmount}, ${status || "draft"})
      RETURNING *;
    `

    return NextResponse.json(newInvoice, { status: 201 })
  } catch (error) {
    console.error("Error creating invoice:", error)
    return NextResponse.json({ message: "Internal server error." }, { status: 500 })
  }
}
