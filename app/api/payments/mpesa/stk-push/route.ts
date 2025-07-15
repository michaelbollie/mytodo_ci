import { NextResponse } from "next/server"
import { initiateSTKPush } from "@/lib/mpesa"
import { sql } from "@/lib/db"
import { getUserSession } from "@/lib/session"

export async function POST(request: Request) {
  try {
    const session = await getUserSession()
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { phoneNumber, amount, invoiceId } = await request.json()

    if (!phoneNumber || !amount || !invoiceId) {
      return NextResponse.json({ message: "Phone number, amount, and invoice ID are required." }, { status: 400 })
    }

    // Basic validation: Ensure amount is positive and phone number format (e.g., 2547...)
    if (amount <= 0 || !/^2547\d{8}$/.test(phoneNumber)) {
      return NextResponse.json(
        { message: "Invalid amount or phone number format (e.g., 2547XXXXXXXX)." },
        { status: 400 },
      )
    }

    // Verify invoice exists and belongs to the user (or admin is initiating)
    const [invoice] = await sql`SELECT id, user_id, total_amount FROM invoices WHERE id = ${invoiceId}`
    if (!invoice) {
      return NextResponse.json({ message: "Invoice not found." }, { status: 404 })
    }
    if (session.userRole !== "admin" && invoice.user_id !== session.userId) {
      return NextResponse.json({ message: "Forbidden: You can only pay for your own invoices." }, { status: 403 })
    }
    // You might want to add logic here to check if the invoice is already paid or partially paid

    const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/mpesa/callback`

    const stkResponse = await initiateSTKPush(phoneNumber, amount, invoiceId, callbackUrl)

    // Store the transaction details in your database with a 'pending' status
    await sql`
      INSERT INTO payment_transactions (user_id, invoice_id, transaction_id, amount, currency, payment_gateway, status, metadata)
      VALUES (
        ${invoice.user_id},
        ${invoiceId},
        ${stkResponse.CheckoutRequestID}, -- Use M-Pesa's unique ID
        ${amount},
        'KES',
        'M-Pesa STK Push',
        'pending',
        ${JSON.stringify(stkResponse)}
      );
    `

    return NextResponse.json(
      { message: "STK Push initiated successfully. Please check your phone.", stkResponse },
      { status: 200 },
    )
  } catch (error: any) {
    console.error("STK Push initiation error:", error)
    return NextResponse.json({ message: error.message || "Failed to initiate M-Pesa STK Push." }, { status: 500 })
  }
}
