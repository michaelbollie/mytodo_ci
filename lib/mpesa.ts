import { format } from "date-fns"

const MPESA_CONSUMER_KEY = process.env.MPESA_CONSUMER_KEY || ""
const MPESA_CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET || ""
const MPESA_PASSKEY = process.env.MPESA_PASSKEY || ""
const MPESA_SHORTCODE = process.env.MPESA_SHORTCODE || ""
const MPESA_API_BASE_URL = "https://sandbox.safaricom.co.ke" // Use "https://api.safaricom.co.ke" for production

if (!MPESA_CONSUMER_KEY || !MPESA_CONSUMER_SECRET || !MPESA_PASSKEY || !MPESA_SHORTCODE) {
  console.warn("M-Pesa environment variables are not fully configured. Payments module may not function.")
}

// Function to get M-Pesa access token
export async function getAccessToken(): Promise<string> {
  const auth = Buffer.from(`${MPESA_CONSUMER_KEY}:${MPESA_CONSUMER_SECRET}`).toString("base64")
  const response = await fetch(`${MPESA_API_BASE_URL}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: {
      Authorization: `Basic ${auth}`,
    },
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Failed to get M-Pesa access token: ${response.status} - ${errorText}`)
  }

  const data = await response.json()
  return data.access_token
}

interface STKPushPayload {
  BusinessShortCode: string
  Password: string
  Timestamp: string
  TransactionType: string
  Amount: string
  PartyA: string
  PartyB: string
  PhoneNumber: string
  CallBackURL: string
  AccountReference: string
  TransactionDesc: string
}

// Function to initiate STK Push
export async function initiateSTKPush(
  phoneNumber: string,
  amount: number,
  invoiceId: string,
  callbackUrl: string,
): Promise<any> {
  const accessToken = await getAccessToken()
  const timestamp = format(new Date(), "yyyyMMddHHmmss")
  const password = Buffer.from(`${MPESA_SHORTCODE}${MPESA_PASSKEY}${timestamp}`).toString("base64")

  const payload: STKPushPayload = {
    BusinessShortCode: MPESA_SHORTCODE,
    Password: password,
    Timestamp: timestamp,
    TransactionType: "CustomerPayBillOnline", // Or "CustomerBuyGoodsOnline" for Till Number
    Amount: amount.toString(),
    PartyA: phoneNumber, // Customer's phone number
    PartyB: MPESA_SHORTCODE, // Your Paybill/Till Number
    PhoneNumber: phoneNumber,
    CallBackURL: callbackUrl,
    AccountReference: invoiceId, // Unique identifier for your transaction (e.g., invoice ID)
    TransactionDesc: `Payment for Invoice ${invoiceId}`,
  }

  const response = await fetch(`${MPESA_API_BASE_URL}/mpesa/stkpush/v1/processrequest`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error("M-Pesa STK Push API Error:", errorText)
    throw new Error(`M-Pesa STK Push failed: ${response.status} - ${errorText}`)
  }

  return response.json()
}
