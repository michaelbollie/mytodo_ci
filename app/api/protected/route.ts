import { NextResponse } from "next/server"
import { verifyAuthToken } from "@/lib/auth"
import { cookies } from "next/headers"

export async function GET(request: Request) {
  try {
    const token = cookies().get("auth_token")?.value

    if (!token) {
      return NextResponse.json({ message: "Unauthorized: No token provided." }, { status: 401 })
    }

    const { userId, userRole } = await verifyAuthToken(token)

    return NextResponse.json({ message: "Access granted!", userId, userRole }, { status: 200 })
  } catch (error: any) {
    console.error("Protected route access error:", error)
    return NextResponse.json({ message: `Unauthorized: ${error.message}` }, { status: 401 })
  }
}
