import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { comparePassword, generateAuthToken, getClientInfo } from "@/lib/auth"
import { cookies } from "next/headers"

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ message: "Email and password are required." }, { status: 400 })
    }

    const [user] = await sql`SELECT id, email, password_hash, role FROM users WHERE email = ${email}`

    if (!user) {
      return NextResponse.json({ message: "Invalid credentials." }, { status: 401 })
    }

    const isPasswordValid = await comparePassword(password, user.password_hash)

    if (!isPasswordValid) {
      return NextResponse.json({ message: "Invalid credentials." }, { status: 401 })
    }

    const token = await generateAuthToken(user.id, user.role)

    // Update last login info
    const { ip, userAgent } = getClientInfo(request)
    await sql`
      UPDATE users
      SET last_login_ip = ${ip}, last_login_device = ${userAgent}, updated_at = NOW()
      WHERE id = ${user.id};
    `

    // Set HTTP-only cookie
    cookies().set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Use secure in production
      sameSite: "strict",
      maxAge: 60 * 60 * 2, // 2 hours
      path: "/",
    })

    return NextResponse.json(
      { message: "Login successful.", user: { id: user.id, email: user.email, role: user.role } },
      { status: 200 },
    )
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ message: "Internal server error." }, { status: 500 })
  }
}
