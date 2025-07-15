import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getUserSession } from "@/lib/session"
import { hashPassword } from "@/lib/auth"

// GET /api/admin/users/[id] - Get a single user by ID (admin only)
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getUserSession()
    if (!session || session.userRole !== "admin") {
      return NextResponse.json({ message: "Forbidden: Admins only" }, { status: 403 })
    }

    const { id } = params
    const [user] = await sql`SELECT id, email, role, status, created_at, updated_at FROM users WHERE id = ${id}`

    if (!user) {
      return NextResponse.json({ message: "User not found." }, { status: 404 })
    }

    return NextResponse.json(user, { status: 200 })
  } catch (error) {
    console.error(`Error fetching user ${params.id}:`, error)
    return NextResponse.json({ message: "Internal server error." }, { status: 500 })
  }
}

// PUT /api/admin/users/[id] - Update a user (admin only)
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getUserSession()
    if (!session || session.userRole !== "admin") {
      return NextResponse.json({ message: "Forbidden: Admins only" }, { status: 403 })
    }

    const { id } = params
    const { email, role, status, password } = await request.json()

    let passwordHash = undefined
    if (password) {
      passwordHash = await hashPassword(password)
    }

    const [updatedUser] = await sql`
      UPDATE users
      SET
        email = COALESCE(${email}, email),
        role = COALESCE(${role}, role),
        status = COALESCE(${status}, status),
        password_hash = COALESCE(${passwordHash}, password_hash),
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING id, email, role, status;
    `

    if (!updatedUser) {
      return NextResponse.json({ message: "User not found or no changes made." }, { status: 404 })
    }

    return NextResponse.json(updatedUser, { status: 200 })
  } catch (error) {
    console.error(`Error updating user ${params.id}:`, error)
    if (error instanceof Error && error.message.includes("duplicate key value violates unique constraint")) {
      return NextResponse.json({ message: "A user with this email already exists." }, { status: 409 })
    }
    return NextResponse.json({ message: "Internal server error." }, { status: 500 })
  }
}

// DELETE /api/admin/users/[id] - Delete a user (admin only)
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getUserSession()
    if (!session || session.userRole !== "admin") {
      return NextResponse.json({ message: "Forbidden: Admins only" }, { status: 403 })
    }

    const { id } = params
    // Consider a soft delete (e.g., update status to 'deleted' or 'archived')
    // For now, a hard delete:
    const [deletedUser] = await sql`DELETE FROM users WHERE id = ${id} RETURNING id;`

    if (!deletedUser) {
      return NextResponse.json({ message: "User not found." }, { status: 404 })
    }

    return NextResponse.json({ message: "User deleted successfully." }, { status: 200 })
  } catch (error) {
    console.error(`Error deleting user ${params.id}:`, error)
    return NextResponse.json({ message: "Internal server error." }, { status: 500 })
  }
}
