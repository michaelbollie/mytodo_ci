import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getUserSession } from "@/lib/session"

// GET /api/website-content/[id] - Get a single content section by ID (admin only)
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getUserSession()
    if (!session || session.userRole !== "admin") {
      return NextResponse.json({ message: "Forbidden: Admins only" }, { status: 403 })
    }

    const { id } = params
    const [content] = await sql`SELECT * FROM page_content WHERE id = ${id}`

    if (!content) {
      return NextResponse.json({ message: "Content section not found." }, { status: 404 })
    }

    return NextResponse.json(content, { status: 200 })
  } catch (error) {
    console.error(`Error fetching content section ${params.id}:`, error)
    return NextResponse.json({ message: "Internal server error." }, { status: 500 })
  }
}

// PUT /api/website-content/[id] - Update a content section (admin only)
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getUserSession()
    if (!session || session.userRole !== "admin") {
      return NextResponse.json({ message: "Forbidden: Admins only" }, { status: 403 })
    }

    const { id } = params
    const { contentHtml, imageUrl } = await request.json()

    // Ensure at least one of contentHtml or imageUrl is provided for update
    if (contentHtml === undefined && imageUrl === undefined) {
      return NextResponse.json({ message: "No content or image URL provided for update." }, { status: 400 })
    }

    const [updatedContent] = await sql`
      UPDATE page_content
      SET
        content_html = COALESCE(${contentHtml}, content_html),
        image_url = COALESCE(${imageUrl}, image_url),
        last_updated_by = ${session.userId},
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *;
    `

    if (!updatedContent) {
      return NextResponse.json({ message: "Content section not found or no changes made." }, { status: 404 })
    }

    return NextResponse.json(updatedContent, { status: 200 })
  } catch (error) {
    console.error(`Error updating content section ${params.id}:`, error)
    return NextResponse.json({ message: "Internal server error." }, { status: 500 })
  }
}
