import { redirect } from "next/navigation"
import { getUserSession } from "@/lib/session"
import { HeaderWrapper } from "@/components/header-wrapper"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { format } from "date-fns"
import { MpesaPaymentForm } from "@/components/mpesa-payment-form"
import { FlutterwavePaymentForm } from "@/components/flutterwave-payment-form" // Import the new component
import { sql } from "@/lib/db" // Import sql to fetch user details

async function getInvoiceDetails(id: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/invoices/${id}`, {
    headers: {
      Cookie: `auth_token=${await (await import("next/headers")).cookies().get("auth_token")?.value}`,
    },
    cache: "no-store",
  })
  if (!res.ok) {
    throw new Error(`Failed to fetch invoice: ${res.statusText}`)
  }
  return res.json()
}

async function getUserDetails(userId: string) {
  // In a real application, you might have a dedicated client-side API route for this
  // For now, we'll fetch directly from the database (assuming this is a server component)
  const [user] = await sql`SELECT id, email, name, phone_number FROM users WHERE id = ${userId}`
  return user
}

export default async function ClientInvoiceDetailPage({ params }: { params: { id: string } }) {
  const session = await getUserSession()

  if (!session || session.userRole !== "client") {
    redirect("/login")
  }

  let invoice = null
  let userDetails = null
  let error = ""
  try {
    invoice = await getInvoiceDetails(params.id)
    // Additional client-side check to ensure the invoice belongs to the user
    if (invoice && invoice.user_id !== session.userId) {
      redirect("/client/invoices") // Redirect if trying to access another user's invoice
    }

    if (invoice) {
      userDetails = await getUserDetails(session.userId)
    }
  } catch (err: any) {
    console.error("Error fetching invoice details or user details:", err)
    error = err.message || "Could not load invoice details."
  }

  if (!invoice && !error) {
    return (
      <div className="flex min-h-screen flex-col">
        <HeaderWrapper />
        <main className="flex-1 p-4 md:p-8">
          <div className="container mx-auto">
            <h1 className="text-3xl font-bold mb-6">Invoice Details</h1>
            <p>Loading invoice...</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <HeaderWrapper />
      <main className="flex-1 p-4 md:p-8">
        <div className="container mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold">Invoice Details: {invoice?.invoice_number}</h1>
            <Button asChild variant="outline">
              <Link href="/client/invoices">Back to Invoices</Link>
            </Button>
          </div>
          {error ? (
            <p className="text-red-500">{error}</p>
          ) : invoice ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Invoice #{invoice.invoice_number}</CardTitle>
                    <CardDescription>Issued on {format(new Date(invoice.issue_date), "PPP")}</CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-4">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Amount</p>
                        <p className="text-lg font-semibold">${invoice.total_amount.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Status</p>
                        <p className="text-lg font-semibold">
                          <span
                            className={`px-2 py-1 rounded-full text-sm font-semibold ${
                              invoice.status === "paid"
                                ? "bg-green-100 text-green-800"
                                : invoice.status === "sent"
                                  ? "bg-blue-100 text-blue-800"
                                  : invoice.status === "overdue"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                          </span>
                        </p>
                      </div>
                    </div>
                    {invoice.due_date && (
                      <div>
                        <p className="text-sm text-muted-foreground">Due Date</p>
                        <p className="text-lg font-semibold">{format(new Date(invoice.due_date), "PPP")}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-muted-foreground">Client ID</p>
                      <p className="text-lg font-semibold">{invoice.user_id}</p>
                    </div>
                    {/* Add more invoice details here as needed */}
                  </CardContent>
                </Card>
              </div>
              {invoice.status !== "paid" &&
                userDetails && ( // Only show payment forms if invoice is not paid and user details are available
                  <div className="space-y-6">
                    <MpesaPaymentForm invoiceId={invoice.id} amount={Number.parseFloat(invoice.total_amount)} />
                    <FlutterwavePaymentForm
                      invoiceId={invoice.id}
                      amount={Number.parseFloat(invoice.total_amount)}
                      userEmail={userDetails.email}
                      userName={userDetails.name || "Client"}
                      userPhoneNumber={userDetails.phone_number || undefined}
                    />
                  </div>
                )}
            </div>
          ) : (
            <p className="text-red-500">Invoice not found.</p>
          )}
        </div>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-muted-foreground">&copy; 2024 AfricorexCrm. All rights reserved.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link href="#" className="text-xs hover:underline underline-offset-4" prefetch={false}>
            Terms of Service
          </Link>
          <Link href="#" className="text-xs hover:underline underline-offset-4" prefetch={false}>
            Privacy
          </Link>
        </nav>
      </footer>
    </div>
  )
}
