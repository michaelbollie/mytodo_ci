import { NextResponse } from "next/server"
import { initiateFlutterwavePayment } from "@/lib/flutterwave"
import { sql } from "@/lib/db"
import { getUserSession } from "@/lib/session"

export async function POST(request: Request) {
  try {
    const session = await getUserSession()
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { invoiceId, amount, email, name, phoneNumber } = await request.json()

    if (!invoiceId || !amount || !email || !name) {
      return NextResponse.json(
        { message: "Invoice ID, amount, customer email, and name are required." },
        { status: 400 },
      )
    }

    // Basic validation
    if (amount <= 0) {
      return NextResponse.json({ message: "Invalid amount." }, { status: 400 })
    }

    // Verify invoice exists and belongs to the user (or admin is initiating)
    const [invoice] = await sql`SELECT id, user_id, total_amount FROM invoices WHERE id = ${invoiceId}`
    if (!invoice) {
      return NextResponse.json({ message: "Invoice not found." }, { status: 404 })
    }
    if (session.userRole !== "admin" && invoice.user_id !== session.userId) {
      return NextResponse.json({ message: "Forbidden: You can only pay for your own invoices." }, { status: 403 })
    }

    const tx_ref = `AFRICOREX_INV_${invoiceId}_${Date.now()}` // Unique transaction reference
    const redirect_url = `${process.env.NEXT_PUBLIC_APP_URL}/client/invoices/${invoiceId}?payment_status=success` // Redirect back to invoice page

    const payload = {
      tx_ref,
      amount: Number(amount),
      currency: "KES", // Assuming KES, adjust if needed
      redirect_url,
      customer: {
        email,
        phonenumber: phoneNumber,
        name,
      },
      meta: {
        invoice_id: invoiceId,
        user_id: session.userId,
      },
      customizations: {
        title: "AfricorexCrm Invoice Payment",
        description: `Payment for Invoice #${invoiceId}`,
      },
    }

    const flutterwaveResponse = await initiateFlutterwavePayment(payload)

    if (flutterwaveResponse.status === "success" && flutterwaveResponse.data?.link) {
      // Store the transaction details in your database with a 'pending' status
      await sql`
        INSERT INTO flutterwave_transactions (user_id, invoice_id, transaction_id, amount, currency, status, metadata)
        VALUES (
          ${invoice.user_id},
          ${invoiceId},
          ${tx_ref},
          ${amount},
          'KES',
          'pending',
          ${JSON.stringify(flutterwaveResponse)}
        );
      `
      return NextResponse.json(
        { message: "Payment initiated successfully.", link: flutterwaveResponse.data.link },
        { status: 200 },
      )
    } else {
      return NextResponse.json(
        { message: flutterwaveResponse.message || "Failed to initiate Flutterwave payment." },
        { status: 400 },
      )
    }
  } catch (error: any) {
    console.error("Flutterwave initiation error:", error)
    return NextResponse.json({ message: error.message || "Failed to initiate Flutterwave payment." }, { status: 500 })
  }
}
