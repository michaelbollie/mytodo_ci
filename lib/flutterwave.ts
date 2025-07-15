const FLUTTERWAVE_PUBLIC_KEY = process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY || ""
const FLUTTERWAVE_SECRET_KEY = process.env.FLUTTERWAVE_SECRET_KEY || ""
const FLUTTERWAVE_API_BASE_URL = "https://api.flutterwave.com/v3"

if (!FLUTTERWAVE_PUBLIC_KEY || !FLUTTERWAVE_SECRET_KEY) {
  console.warn("Flutterwave environment variables are not fully configured. Payments module may not function.")
}

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

interface InitiatePaymentResponse {
  status: string
  message: string
  data?: {
    link: string
  }
}

interface VerifyPaymentResponse {
  status: string
  message: string
  data?: {
    id: number
    tx_ref: string
    flw_ref: string
    amount: number
    currency: string
    status: string // e.g., successful, failed, pending
    customer: {
      email: string
      phone_number?: string
      name: string
    }
    // ... other transaction details
  }
}

export async function initiateFlutterwavePayment(payload: InitiatePaymentPayload): Promise<InitiatePaymentResponse> {
  const response = await fetch(`${FLUTTERWAVE_API_BASE_URL}/payments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${FLUTTERWAVE_SECRET_KEY}`,
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error("Flutterwave Initiate Payment API Error:", errorText)
    throw new Error(`Flutterwave payment initiation failed: ${response.status} - ${errorText}`)
  }

  return response.json()
}

export async function verifyFlutterwavePayment(transactionId: string): Promise<VerifyPaymentResponse> {
  const response = await fetch(`${FLUTTERWAVE_API_BASE_URL}/transactions/${transactionId}/verify`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${FLUTTERWAVE_SECRET_KEY}`,
    },
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error("Flutterwave Verify Payment API Error:", errorText)
    throw new Error(`Flutterwave payment verification failed: ${response.status} - ${errorText}`)
  }

  return response.json()
}

export function getFlutterwavePublicKey(): string {
  return FLUTTERWAVE_PUBLIC_KEY
}
