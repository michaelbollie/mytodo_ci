import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getUserSession } from "@/lib/session"

// GET /api/admin/zip-backups/[id] - Get a single zip backup record (admin only)
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getUserSession()
    if (!session || session.userRole !== "admin") {
      return NextResponse.json({ message: "Forbidden: Admins only" }, { status: 403 })
    }

    const { id } = params
    const [backup] = await sql`
      SELECT zb.*, u.email as uploaded_by_email
      FROM zip_backups zb
      LEFT JOIN users u ON zb.uploaded_by = u.id
      WHERE zb.id = ${id}
    `

    if (!backup) {
      return NextResponse.json({ message: "Backup not found." }, { status: 404 })
    }

    return NextResponse.json(backup, { status: 200 })
  } catch (error) {
    console.error(`Error fetching backup ${params.id}:`, error)
    return NextResponse.json({ message: "Internal server error." }, { status: 500 })
  }
}

// POST /api/admin/zip-backups/[id]/restore - Simulate restoring a zip backup (admin only)
export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getUserSession()
    if (!session || session.userRole !== "admin") {
      return NextResponse.json({ message: "Forbidden: Admins only" }, { status: 403 })
    }

    const { id } = params
    const [backup] = await sql`SELECT * FROM zip_backups WHERE id = ${id}`

    if (!backup) {
      return NextResponse.json({ message: "Backup not found." }, { status: 404 })
    }

    // In a real application, this is where the complex restoration logic would go:
    // 1. Download the ZIP file from `backup.storage_path`.
    // 2. Unzip its contents.
    // 3. Replace relevant website files/database content.
    // This operation is highly sensitive and complex, often requiring specific server-side tools.
    console.log(`Simulating restore of backup ID: ${id}, File: ${backup.file_name}, Version: ${backup.version}`)
    // You might want to log this action in your 'logs' table as well.

    return NextResponse.json(
      { message: `Restore of backup '${backup.file_name}' (version ${backup.version}) simulated successfully.` },
      { status: 200 },
    )
  } catch (error) {
    console.error(`Error simulating restore for backup ${params.id}:`, error)
    return NextResponse.json({ message: "Internal server error." }, { status: 500 })
  }
}

// DELETE /api/admin/zip-backups/[id] - Delete a zip backup record (admin only)
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getUserSession()
    if (!session || session.userRole !== "admin") {
      return NextResponse.json({ message: "Forbidden: Admins only" }, { status: 403 })
    }

    const { id } = params
    // In a real application, you would also delete the actual file from storage here.
    const [deletedBackup] = await sql`DELETE FROM zip_backups WHERE id = ${id} RETURNING id;`

    if (!deletedBackup) {
      return NextResponse.json({ message: "Backup not found." }, { status: 404 })
    }

    return NextResponse.json({ message: "Backup deleted successfully." }, { status: 200 })
  } catch (error) {
    console.error(`Error deleting backup ${params.id}:`, error)
    return NextResponse.json({ message: "Internal server error." }, { status: 500 })
  }
}
