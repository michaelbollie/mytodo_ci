import { NextResponse } from "next/server"

export async function GET() {
  const publicKey = process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY

  if (!publicKey) {
    return NextResponse.json({ message: "Flutterwave public key not configured." }, { status: 500 })
  }

  return NextResponse.json({ publicKey }, { status: 200 })
}
