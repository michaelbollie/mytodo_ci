import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

// IMPORTANT: In a production environment, you MUST verify the webhook signature
// to ensure the request is genuinely from Flutterwave and not a malicious actor.
// Flutterwave sends a 'verif-hash' header. You would compare it with a hash
// generated using your FLUTTERWAVE_SECRET_HASH and the request body.
// For this example, we're skipping signature verification for brevity,
// but it's critical for security.

export async function POST(request: Request) {
  const client = await sql.reserve() // Use a transaction for atomicity
  try {
    await client.query("BEGIN")

    const webhookPayload = await request.json()
    console.log("Flutterwave Webhook Received:", JSON.stringify(webhookPayload, null, 2))

    // Check for the event type, typically 'charge.completed' for successful payments
    if (webhookPayload.event !== "charge.completed") {
      console.log("Ignoring non-charge.completed event.")
      await client.query("ROLLBACK")
      return NextResponse.json({ status: "success", message: "Event not handled" }, { status: 200 })
    }

    const transactionData = webhookPayload.data
    const tx_ref = transactionData.tx_ref
    const flw_ref = transactionData.flw_ref
    const transactionStatus = transactionData.status // e.g., 'successful', 'failed'
    const amount = transactionData.amount
    const currency = transactionData.currency
    const invoiceId = transactionData.meta?.invoice_id // Assuming invoice_id is passed in meta

    if (!tx_ref) {
      console.warn("Missing tx_ref in Flutterwave webhook payload.")
      await client.query("ROLLBACK")
      return NextResponse.json({ status: "error", message: "Missing transaction reference" }, { status: 400 })
    }

    // Optional: Verify the transaction directly with Flutterwave's API
    // This adds an extra layer of security to prevent spoofed webhooks.
    // const verificationResult = await verifyFlutterwavePayment(flw_ref);
    // if (verificationResult.status !== 'success' || verificationResult.data?.status !== 'successful') {
    //   console.error("Flutterwave transaction verification failed:", verificationResult);
    //   await client.query("ROLLBACK");
    //   return NextResponse.json({ status: "error", message: "Transaction verification failed" }, { status: 400 });
    // }

    // Update the flutterwave_transactions table
    const [updatedTransaction] = await client`
      UPDATE flutterwave_transactions
      SET
        status = ${transactionStatus},
        flw_transaction_id = ${flw_ref},
        metadata = ${JSON.stringify(webhookPayload)},
        updated_at = NOW()
      WHERE transaction_id = ${tx_ref}
      RETURNING *;
    `

    if (!updatedTransaction) {
      console.warn(`Flutterwave transaction with tx_ref ${tx_ref} not found in DB.`)
      await client.query("ROLLBACK")
      return NextResponse.json({ status: "error", message: "Transaction not found in database" }, { status: 404 })
    }

    // If payment was successful, update the associated invoice status
    if (transactionStatus === "successful" && invoiceId) {
      // Fetch current invoice total and sum of all successful payments for it (including M-Pesa if applicable)
      const [invoice] = await client`SELECT total_amount FROM invoices WHERE id = ${invoiceId}`
      if (invoice) {
        const [totalPaid] = await client`
          SELECT COALESCE(SUM(amount), 0) as total_paid
          FROM flutterwave_transactions
          WHERE invoice_id = ${invoiceId} AND status = 'successful';
        `
        const [mpesaTotalPaid] = await client`
          SELECT COALESCE(SUM(amount), 0) as total_paid
          FROM payment_transactions
          WHERE invoice_id = ${invoiceId} AND status = 'successful';
        `
        const combinedTotalPaid = Number(totalPaid.total_paid) + Number(mpesaTotalPaid.total_paid)

        if (combinedTotalPaid >= Number(invoice.total_amount)) {
          await client`UPDATE invoices SET status = 'paid' WHERE id = ${invoiceId}`
        } else {
          // Handle partial payments if your system supports it
          await client`UPDATE invoices SET status = 'partially_paid' WHERE id = ${invoiceId}`
        }
      }
    }

    await client.query("COMMIT")
    return NextResponse.json({ status: "success", message: "Webhook processed successfully" }, { status: 200 })
  } catch (error) {
    await client.query("ROLLBACK")
    console.error("Error processing Flutterwave webhook:", error)
    return NextResponse.json({ status: "error", message: "Internal server error" }, { status: 500 })
  } finally {
    client.release()
  }
}
