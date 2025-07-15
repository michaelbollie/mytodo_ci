import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { hashPassword, getClientInfo } from "@/lib/auth"

export async function POST(request: Request) {
  try {
    const { email, password, role } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ message: "Email and password are required." }, { status: 400 })
    }

    // Check if user already exists
    const existingUser = await sql`SELECT id FROM users WHERE email = ${email}`
    if (existingUser.length > 0) {
      return NextResponse.json({ message: "User with this email already exists." }, { status: 409 })
    }

    const hashedPassword = await hashPassword(password)
    const userRole = role === "admin" ? "admin" : "client" // Ensure only 'admin' or 'client' roles

    const { ip, userAgent } = getClientInfo(request)

    const [newUser] = await sql`
      INSERT INTO users (email, password_hash, role, last_login_ip, last_login_device)
      VALUES (${email}, ${hashedPassword}, ${userRole}, ${ip}, ${userAgent})
      RETURNING id, email, role;
    `

    return NextResponse.json({ message: "User registered successfully.", user: newUser }, { status: 201 })
  } catch (error) {
    console.error("Signup error:", error)
    return NextResponse.json({ message: "Internal server error." }, { status: 500 })
  }
}
