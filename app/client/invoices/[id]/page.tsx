"use client"

import { sql } from "@/lib/db"
import { getUserSession } from "@/lib/session"
import { notFound, redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { FlutterwavePaymentForm } from "@/components/flutterwave-payment-form"
import { MpesaPaymentForm } from "@/components/mpesa-payment-form"

interface InvoiceItem {
  item_name: string
  quantity: number
  unit_price: number
  total_price: number
}

export default async function ClientInvoiceDetailPage({ params }: { params: { id: string } }) {
  const session = await getUserSession()
  if (!session) {
    redirect("/login")
  }

  const invoiceId = params.id

  const [invoice] = await sql`
    SELECT
      i.id,
      i.user_id,
      i.quote_id,
      i.invoice_number,
      i.issue_date,
      i.due_date,
      i.total_amount,
      i.status,
      i.created_at,
      i.updated_at,
      u.email AS client_email,
      u.name AS client_name
    FROM invoices i
    JOIN users u ON i.user_id = u.id
    WHERE i.id = ${invoiceId}
  `

  if (!invoice || (session.userRole !== "admin" && invoice.user_id !== session.userId)) {
    notFound()
  }

  const invoiceItems: InvoiceItem[] = await sql`
    SELECT
      item_name,
      quantity,
      unit_price,
      total_price
    FROM invoice_items
    WHERE invoice_id = ${invoiceId}
    ORDER BY created_at ASC
  `

  // Fetch Flutterwave public key on the server
  let flutterwavePublicKey = ""
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/config/flutterwave-public-key`, {
      cache: "no-store", // Ensure it's always fresh
    })
    if (res.ok) {
      const data = await res.json()
      flutterwavePublicKey = data.publicKey
    } else {
      console.error("Failed to fetch Flutterwave public key:", res.status, res.statusText)
    }
  } catch (error) {
    console.error("Error fetching Flutterwave public key:", error)
  }

  return (
    <main className="flex flex-1 flex-col p-4 md:p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Invoice #{invoice.invoice_number}</h1>
        <div className="flex items-center gap-2">
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              invoice.status === "paid"
                ? "bg-green-100 text-green-800"
                : invoice.status === "partially_paid"
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-red-100 text-red-800"
            }`}
          >
            {invoice.status.replace(/_/g, " ")}
          </span>
          {session.userRole === "admin" && (
            <Button variant="outline" onClick={() => (window.location.href = `/admin/invoices/${invoice.id}/edit`)}>
              Edit Invoice
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Invoice Details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm">
            <div className="flex justify-between">
              <span>Invoice Number:</span>
              <span className="font-medium">{invoice.invoice_number}</span>
            </div>
            <div className="flex justify-between">
              <span>Issue Date:</span>
              <span className="font-medium">{format(new Date(invoice.issue_date), "PPP")}</span>
            </div>
            <div className="flex justify-between">
              <span>Due Date:</span>
              <span className="font-medium">{format(new Date(invoice.due_date), "PPP")}</span>
            </div>
            <div className="flex justify-between">
              <span>Total Amount:</span>
              <span className="font-medium">KES {invoice.total_amount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Client:</span>
              <span className="font-medium">
                {invoice.client_name} ({invoice.client_email})
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                  <tr>
                    <th scope="col" className="px-6 py-3">
                      Item
                    </th>
                    <th scope="col" className="px-6 py-3 text-right">
                      Quantity
                    </th>
                    <th scope="col" className="px-6 py-3 text-right">
                      Unit Price
                    </th>
                    <th scope="col" className="px-6 py-3 text-right">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {invoiceItems.map((item, index) => (
                    <tr key={index} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                      <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                        {item.item_name}
                      </td>
                      <td className="px-6 py-4 text-right">{item.quantity}</td>
                      <td className="px-6 py-4 text-right">KES {item.unit_price.toLocaleString()}</td>
                      <td className="px-6 py-4 text-right">KES {item.total_price.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="font-semibold text-gray-900 dark:text-white">
                    <th scope="row" colSpan={3} className="px-6 py-3 text-right">
                      Total
                    </th>
                    <td className="px-6 py-3 text-right">KES {invoice.total_amount.toLocaleString()}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>

        {invoice.status !== "paid" && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Pay with M-Pesa</CardTitle>
              </CardHeader>
              <CardContent>
                <MpesaPaymentForm
                  invoiceId={invoice.id}
                  amount={invoice.total_amount}
                  clientEmail={invoice.client_email}
                  clientName={invoice.client_name}
                />
              </CardContent>
            </Card>

            {flutterwavePublicKey && (
              <Card>
                <CardHeader>
                  <CardTitle>Pay with Flutterwave</CardTitle>
                </CardHeader>
                <CardContent>
                  <FlutterwavePaymentForm
                    invoiceId={invoice.id}
                    amount={invoice.total_amount}
                    clientEmail={invoice.client_email}
                    clientName={invoice.client_name}
                    flutterwavePublicKey={flutterwavePublicKey} // Pass the fetched key
                  />
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </main>
  )
}
