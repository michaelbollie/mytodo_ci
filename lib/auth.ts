import { SignJWT, jwtVerify } from "jose"
import bcrypt from "bcryptjs"

const JWT_SECRET = process.env.JWT_SECRET || "your_super_secret_jwt_key_please_change_this_in_production"
const JWT_EXPIRATION_TIME = "2h" // Token expires in 2 hours

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10)
  return bcrypt.hash(password, salt)
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export async function generateAuthToken(userId: string, userRole: string): Promise<string> {
  const token = await new SignJWT({ userId, userRole })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRATION_TIME)
    .sign(new TextEncoder().encode(JWT_SECRET))
  return token
}

export async function verifyAuthToken(token: string): Promise<{ userId: string; userRole: string }> {
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(JWT_SECRET))
    return { userId: payload.userId as string, userRole: payload.userRole as string }
  } catch (error) {
    console.error("Token verification failed:", error)
    throw new Error("Invalid or expired token.")
  }
}

// Helper to extract IP and device info from request headers
export function getClientInfo(request: Request) {
  const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || request.ip
  const userAgent = request.headers.get("user-agent")
  return { ip: ip ? String(ip) : null, userAgent: userAgent || null }
}
