import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getUserSession } from "@/lib/session"
import { v4 as uuidv4 } from "uuid"

// GET /api/admin/zip-backups - Get all zip backup records (admin only)
export async function GET(request: Request) {
  try {
    const session = await getUserSession()
    if (!session || session.userRole !== "admin") {
      return NextResponse.json({ message: "Forbidden: Admins only" }, { status: 403 })
    }

    const backups = await sql`
      SELECT zb.*, u.email as uploaded_by_email
      FROM zip_backups zb
      LEFT JOIN users u ON zb.uploaded_by = u.id
      ORDER BY zb.created_at DESC
    `
    return NextResponse.json(backups, { status: 200 })
  } catch (error) {
    console.error("Error fetching zip backups:", error)
    return NextResponse.json({ message: "Internal server error." }, { status: 500 })
  }
}

// POST /api/admin/zip-backups - Simulate uploading a new zip backup (admin only)
export async function POST(request: Request) {
  try {
    const session = await getUserSession()
    if (!session || session.userRole !== "admin") {
      return NextResponse.json({ message: "Forbidden: Admins only" }, { status: 403 })
    }

    const { fileName, fileSize, version, notes } = await request.json()

    if (!fileName || !fileSize || !version) {
      return NextResponse.json({ message: "File name, size, and version are required." }, { status: 400 })
    }

    // In a real application, you would handle the actual file upload to Vercel Blob
    // or another storage service here, and get a storage_path (URL).
    // For this simulation, we'll create a dummy path.
    const storagePath = `/backups/${uuidv4()}-${fileName}`

    const [newBackup] = await sql`
      INSERT INTO zip_backups (file_name, file_size_bytes, storage_path, version, uploaded_by, notes)
      VALUES (
        ${fileName},
        ${fileSize},
        ${storagePath},
        ${version},
        ${session.userId},
        ${notes || null}
      )
      RETURNING *;
    `

    return NextResponse.json(
      { message: "Backup record created successfully (file upload simulated).", backup: newBackup },
      { status: 201 },
    )
  } catch (error) {
    console.error("Error creating zip backup record:", error)
    return NextResponse.json({ message: "Internal server error." }, { status: 500 })
  }
}
