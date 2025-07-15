import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getUserSession } from "@/lib/session"
import { v4 as uuidv4 } from "uuid"

// GET /api/quotes - Get all quotes (admin) or user's quotes (client) with items
export async function GET(request: Request) {
  try {
    const session = await getUserSession()
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    let quotes
    if (session.userRole === "admin") {
      quotes = await sql`SELECT * FROM quotes ORDER BY issue_date DESC`
    } else {
      quotes = await sql`SELECT * FROM quotes WHERE user_id = ${session.userId} ORDER BY issue_date DESC`
    }

    // Fetch items for each quote
    const quotesWithItems = await Promise.all(
      quotes.map(async (quote: any) => {
        const items = await sql`SELECT * FROM quote_items WHERE quote_id = ${quote.id} ORDER BY created_at ASC`
        return { ...quote, items }
      }),
    )

    return NextResponse.json(quotesWithItems, { status: 200 })
  } catch (error) {
    console.error("Error fetching quotes:", error)
    return NextResponse.json({ message: "Internal server error." }, { status: 500 })
  }
}

// POST /api/quotes - Create a new quote with items (admin only)
export async function POST(request: Request) {
  const client = await sql.reserve() // Use a transaction for atomicity
  try {
    await client.query("BEGIN")

    const session = await getUserSession()
    if (!session || session.userRole !== "admin") {
      await client.query("ROLLBACK")
      return NextResponse.json({ message: "Forbidden: Admins only" }, { status: 403 })
    }

    const { userId, issueDate, dueDate, totalAmount, status, items } = await request.json()

    if (!userId || !issueDate || !totalAmount || !Array.isArray(items)) {
      await client.query("ROLLBACK")
      return NextResponse.json({ message: "Missing required fields or invalid items array." }, { status: 400 })
    }

    // Generate a simple quote number
    const quoteNumber = `Q-${uuidv4().substring(0, 8).toUpperCase()}`

    const [newQuote] = await client`
      INSERT INTO quotes (user_id, quote_number, issue_date, due_date, total_amount, status)
      VALUES (${userId}, ${quoteNumber}, ${issueDate}, ${dueDate}, ${totalAmount}, ${status || "draft"})
      RETURNING *;
    `

    // Insert quote items
    if (items.length > 0) {
      const itemValues = items.map((item: any) => ({
        quote_id: newQuote.id,
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
    return NextResponse.json({ ...newQuote, items }, { status: 201 })
  } catch (error) {
    await client.query("ROLLBACK")
    console.error("Error creating quote:", error)
    return NextResponse.json({ message: "Internal server error." }, { status: 500 })
  } finally {
    client.release()
  }
}
