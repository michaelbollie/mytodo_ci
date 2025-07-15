import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function POST(request: Request) {
  const client = await sql.reserve() // Use a transaction for atomicity
  try {
    await client.query("BEGIN")

    const callbackData = await request.json()
    console.log("M-Pesa Callback Received:", JSON.stringify(callbackData, null, 2))

    const { Body } = callbackData
    const { stkCallback } = Body.stkCallback || {}

    if (!stkCallback) {
      console.warn("Invalid M-Pesa callback format.")
      await client.query("ROLLBACK")
      return NextResponse.json({ ResultCode: 1, ResultDesc: "Invalid callback format" }, { status: 400 })
    }

    const { MerchantRequestID, CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = stkCallback

    const invoiceId = stkCallback.AccountReference || null // Assuming AccountReference is the invoiceId

    let transactionStatus = "failed"
    let mpesaReceiptNumber = null
    let amount = 0
    let phoneNumber = null

    if (ResultCode === 0) {
      transactionStatus = "successful"
      const item = CallbackMetadata?.Item
      if (item) {
        for (const entry of item) {
          switch (entry.Name) {
            case "MpesaReceiptNumber":
              mpesaReceiptNumber = entry.Value
              break
            case "Amount":
              amount = Number.parseFloat(entry.Value)
              break
            case "PhoneNumber":
              phoneNumber = entry.Value
              break
            // You can extract more details like TransactionDate if needed
          }
        }
      }
    } else {
      transactionStatus = "failed"
    }

    // Update the payment_transactions table
    await client`
      UPDATE payment_transactions
      SET
        status = ${transactionStatus},
        transaction_id = ${mpesaReceiptNumber || CheckoutRequestID}, -- Use MpesaReceiptNumber if successful
        metadata = ${JSON.stringify(callbackData)},
        updated_at = NOW()
      WHERE transaction_id = ${CheckoutRequestID};
    `

    // If payment was successful, update the associated invoice status
    if (transactionStatus === "successful" && invoiceId) {
      // Fetch current invoice total and sum of all successful payments for it
      const [invoice] = await client`SELECT total_amount FROM invoices WHERE id = ${invoiceId}`
      if (invoice) {
        const [totalPaid] = await client`
          SELECT COALESCE(SUM(amount_paid), 0) as total_paid
          FROM payment_transactions
          WHERE invoice_id = ${invoiceId} AND status = 'successful';
        `
        if (Number(totalPaid.total_paid) >= Number(invoice.total_amount)) {
          await client`UPDATE invoices SET status = 'paid' WHERE id = ${invoiceId}`
        } else {
          // Handle partial payments if your system supports it
          await client`UPDATE invoices SET status = 'partially_paid' WHERE id = ${invoiceId}`
        }
      }
    }

    await client.query("COMMIT")
    return NextResponse.json({ ResultCode: 0, ResultDesc: "Callback received successfully" }, { status: 200 })
  } catch (error) {
    await client.query("ROLLBACK")
    console.error("Error processing M-Pesa callback:", error)
    return NextResponse.json({ ResultCode: 1, ResultDesc: "Internal server error" }, { status: 500 })
  } finally {
    client.release()
  }
}
