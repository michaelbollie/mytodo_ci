import "server-only" // Mark this module as server-only [^1][^2]
import { FLUTTERWAVE_SECRET_KEY } from "@/lib/constants"

const FLUTTERWAVE_API_BASE_URL = "https://api.flutterwave.com/v3"

interface InitiatePaymentPayload {
  tx_ref: string
  amount: number
  currency: string
  redirect_url: string
  customer: {
    email: string
    phonenumber?: string
    name: string
  }
  meta?: Record<string, any>
  customizations?: {
    title?: string
    description?: string
    logo?: string
  }
}

interface FlutterwaveResponse {
  status: "success" | "error"
  message: string
  data?: {
    link?: string
    status?: string
    id?: number
    tx_ref?: string
    flw_ref?: string
    amount?: number
    currency?: string
    customer?: {
      email: string
      phonenumber?: string
      name: string
    }
    // Add other fields as needed from Flutterwave API response
  }
}

export async function initiateFlutterwavePayment(payload: InitiatePaymentPayload): Promise<FlutterwaveResponse> {
  const secretKey = process.env.FLUTTERWAVE_SECRET_KEY || FLUTTERWAVE_SECRET_KEY

  if (!secretKey) {
    throw new Error("Flutterwave secret key is not configured.")
  }

  try {
    const response = await fetch(`${FLUTTERWAVE_API_BASE_URL}/payments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${secretKey}`,
      },
      body: JSON.stringify(payload),
    })

    const data = await response.json()
    return data as FlutterwaveResponse
  } catch (error: any) {
    console.error("Error initiating Flutterwave payment:", error)
    return {
      status: "error",
      message: error.message || "An unknown error occurred during payment initiation.",
    }
  }
}

// Optional: Function to verify a transaction (for webhook security)
export async function verifyFlutterwavePayment(transactionId: string): Promise<FlutterwaveResponse> {
  const secretKey = process.env.FLUTTERWAVE_SECRET_KEY || FLUTTERWAVE_SECRET_KEY

  if (!secretKey) {
    throw new Error("Flutterwave secret key is not configured.")
  }

  try {
    const response = await fetch(`${FLUTTERWAVE_API_BASE_URL}/transactions/${transactionId}/verify`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${secretKey}`,
      },
    })

    const data = await response.json()
    return data as FlutterwaveResponse
  } catch (error: any) {
    console.error("Error verifying Flutterwave payment:", error)
    return {
      status: "error",
      message: error.message || "An unknown error occurred during payment verification.",
    }
  }
}
