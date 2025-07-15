import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getUserSession } from "@/lib/session"

// GET /api/company-bank-accounts/[id] - Get a single company bank account (admin only)
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getUserSession()
    if (!session || session.userRole !== "admin") {
      return NextResponse.json({ message: "Forbidden: Admins only" }, { status: 403 })
    }

    const { id } = params
    const [account] = await sql`SELECT * FROM company_bank_accounts WHERE id = ${id}`

    if (!account) {
      return NextResponse.json({ message: "Bank account not found." }, { status: 404 })
    }

    return NextResponse.json(account, { status: 200 })
  } catch (error) {
    console.error(`Error fetching company bank account ${params.id}:`, error)
    return NextResponse.json({ message: "Internal server error." }, { status: 500 })
  }
}

// PUT /api/company-bank-accounts/[id] - Update a company bank account (admin only)
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getUserSession()
    if (!session || session.userRole !== "admin") {
      return NextResponse.json({ message: "Forbidden: Admins only" }, { status: 403 })
    }

    const { id } = params
    const { bankName, accountName, accountNumber, currency, currentBalance, branchName, swiftCode, notes } =
      await request.json()

    const [updatedAccount] = await sql`
      UPDATE company_bank_accounts
      SET
        bank_name = COALESCE(${bankName}, bank_name),
        account_name = COALESCE(${accountName}, account_name),
        account_number = COALESCE(${accountNumber}, account_number),
        currency = COALESCE(${currency}, currency),
        current_balance = COALESCE(${currentBalance}, current_balance),
        branch_name = COALESCE(${branchName}, branch_name),
        swift_code = COALESCE(${swiftCode}, swift_code),
        notes = COALESCE(${notes}, notes),
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *;
    `

    if (!updatedAccount) {
      return NextResponse.json({ message: "Bank account not found or no changes made." }, { status: 404 })
    }

    return NextResponse.json(updatedAccount, { status: 200 })
  } catch (error) {
    console.error(`Error updating company bank account ${params.id}:`, error)
    if (error instanceof Error && error.message.includes("duplicate key value violates unique constraint")) {
      return NextResponse.json({ message: "An account with this account number already exists." }, { status: 409 })
    }
    return NextResponse.json({ message: "Internal server error." }, { status: 500 })
  }
}

// DELETE /api/company-bank-accounts/[id] - Delete a company bank account (admin only)
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getUserSession()
    if (!session || session.userRole !== "admin") {
      return NextResponse.json({ message: "Forbidden: Admins only" }, { status: 403 })
    }

    const { id } = params
    const [deletedAccount] = await sql`DELETE FROM company_bank_accounts WHERE id = ${id} RETURNING id;`

    if (!deletedAccount) {
      return NextResponse.json({ message: "Bank account not found." }, { status: 404 })
    }

    return NextResponse.json({ message: "Bank account deleted successfully." }, { status: 200 })
  } catch (error) {
    console.error(`Error deleting company bank account ${params.id}:`, error)
    return NextResponse.json({ message: "Internal server error." }, { status: 500 })
  }
}
