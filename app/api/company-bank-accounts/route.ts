import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getUserSession } from "@/lib/session"

// GET /api/company-bank-accounts - Get all company bank accounts (admin only)
export async function GET(request: Request) {
  try {
    const session = await getUserSession()
    if (!session || session.userRole !== "admin") {
      return NextResponse.json({ message: "Forbidden: Admins only" }, { status: 403 })
    }

    const accounts = await sql`SELECT * FROM company_bank_accounts ORDER BY bank_name, account_name ASC`

    return NextResponse.json(accounts, { status: 200 })
  } catch (error) {
    console.error("Error fetching company bank accounts:", error)
    return NextResponse.json({ message: "Internal server error." }, { status: 500 })
  }
}

// POST /api/company-bank-accounts - Create a new company bank account (admin only)
export async function POST(request: Request) {
  try {
    const session = await getUserSession()
    if (!session || session.userRole !== "admin") {
      return NextResponse.json({ message: "Forbidden: Admins only" }, { status: 403 })
    }

    const { bankName, accountName, accountNumber, currency, currentBalance, branchName, swiftCode, notes } =
      await request.json()

    if (!bankName || !accountName || !accountNumber) {
      return NextResponse.json(
        { message: "Bank name, account name, and account number are required." },
        { status: 400 },
      )
    }

    const [newAccount] = await sql`
      INSERT INTO company_bank_accounts (bank_name, account_name, account_number, currency, current_balance, branch_name, swift_code, notes)
      VALUES (
        ${bankName},
        ${accountName},
        ${accountNumber},
        ${currency || "KES"},
        ${currentBalance || 0.0},
        ${branchName || null},
        ${swiftCode || null},
        ${notes || null}
      )
      RETURNING *;
    `

    return NextResponse.json(newAccount, { status: 201 })
  } catch (error) {
    console.error("Error creating company bank account:", error)
    if (error instanceof Error && error.message.includes("duplicate key value violates unique constraint")) {
      return NextResponse.json({ message: "An account with this account number already exists." }, { status: 409 })
    }
    return NextResponse.json({ message: "Internal server error." }, { status: 500 })
  }
}
