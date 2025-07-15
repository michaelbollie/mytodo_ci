import "server-only" // Explicitly mark this file as server-only
import { cookies } from "next/headers"
import { verifyAuthToken } from "@/lib/auth"

export async function getUserSession() {
  const token = cookies().get("auth_token")?.value

  if (!token) {
    return null
  }

  try {
    const payload = await verifyAuthToken(token)
    return payload
  } catch (error) {
    console.error("Failed to verify session token:", error)
    return null
  }
}
