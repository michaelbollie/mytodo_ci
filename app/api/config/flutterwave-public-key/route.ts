import { NextResponse } from "next/server"

export async function GET() {
  // Access the environment variable without the NEXT_PUBLIC_ prefix
  const publicKey = process.env.FLUTTERWAVE_PUBLIC_KEY

  if (!publicKey) {
    return NextResponse.json({ message: "Flutterwave public key not configured." }, { status: 500 })
  }

  return NextResponse.json({ publicKey }, { status: 200 })
}
