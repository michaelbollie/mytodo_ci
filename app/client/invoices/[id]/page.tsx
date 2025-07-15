import { redirect } from "next/navigation"
import { getUserSession } from "@/lib/session"
import { HeaderWrapper } from "@/components/header-wrapper"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { MpesaPaymentForm } from "@/components/mpesa-payment-form"
import { FlutterwavePaymentForm } from "@/components/flutterwave-payment-form"

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

async function getFlutterwavePublicKey() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/config/flutterwave-public-key`, {
      cache: "no-store", // Ensure fresh data
    })
    if (!res.ok) {
      const errorData = await res.json()
      console.error("Failed to fetch Flutterwave public key:", errorData.message || res.statusText)
      return null
    }
    const data = await res.json()
    return data.publicKey
  } catch (error) {
    console.error("Error fetching Flutterwave public key:", error)
    return null
  }
}

export default async function ClientInvoiceDetailPage({ params }: { params: { id: string } }) {
  const session = await getUserSession()

  if (!session || session.userRole !== "client") {
    redirect("/login")
  }

  let invoice = null
  let error = ""
  try {
    invoice = await getInvoiceDetails(params.id)
  } catch (err: any) {
    console.error("Error fetching invoice details for client:", err)
    error = err.message || "Could not load invoice details."
  }

  const flutterwavePublicKey = await getFlutterwavePublicKey()

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
            <h1 className="text-3xl font-bold">Invoice: {invoice?.invoice_number}</h1>
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
                    <CardTitle>Invoice Details</CardTitle>
                    <CardDescription>Information about invoice {invoice.invoice_number}</CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-4">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-sm text-muted-foreground">Invoice Number</p>
                        <p className="text-lg font-semibold">{invoice.invoice_number}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Client Name</p>
                        <p className="text-lg font-semibold">{invoice.client_name}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-sm text-muted-foreground">Issue Date</p>
                        <p className="text-lg font-semibold">{format(new Date(invoice.issue_date), "PPP")}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Due Date</p>
                        <p className="text-lg font-semibold">{format(new Date(invoice.due_date), "PPP")}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Amount</p>
                        <p className="text-lg font-semibold">${invoice.total_amount.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Status</p>
                        <p className="text-lg font-semibold capitalize">{invoice.status}</p>
                      </div>
                    </div>
                    {invoice.notes && (
                      <div>
                        <p className="text-sm text-muted-foreground">Notes</p>
                        <p className="text-lg font-semibold whitespace-pre-wrap">{invoice.notes}</p>
                      </div>
                    )}

                    {invoice.items && invoice.items.length > 0 && (
                      <div className="mt-4">
                        <h3 className="text-lg font-semibold mb-2">Items</h3>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Description</TableHead>
                              <TableHead className="text-right">Quantity</TableHead>
                              <TableHead className="text-right">Unit Price</TableHead>
                              <TableHead className="text-right">Total</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {invoice.items.map((item: any, index: number) => (
                              <TableRow key={index}>
                                <TableCell>{item.description}</TableCell>
                                <TableCell className="text-right">{item.quantity}</TableCell>
                                <TableCell className="text-right">${item.unit_price.toFixed(2)}</TableCell>
                                <TableCell className="text-right">
                                  ${(item.quantity * item.unit_price).toFixed(2)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
              <div className="lg:col-span-1 space-y-6">
                {invoice.status === "pending" && (
                  <>
                    <MpesaPaymentForm
                      invoiceId={invoice.id}
                      amount={invoice.total_amount}
                      userEmail={session?.email || ""}
                      userPhoneNumber={session?.phoneNumber || ""}
                    />
                    {flutterwavePublicKey ? (
                      <FlutterwavePaymentForm
                        invoiceId={invoice.id}
                        amount={invoice.total_amount}
                        userEmail={session?.email || ""}
                        userName={session?.name || ""}
                        userPhoneNumber={session?.phoneNumber || ""}
                        flutterwavePublicKey={flutterwavePublicKey} // Pass the key as a prop
                      />
                    ) : (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-red-500">Flutterwave Not Available</CardTitle>
                          <CardDescription>
                            Flutterwave payment gateway is currently unavailable. Please check configuration.
                          </CardDescription>
                        </CardHeader>
                      </Card>
                    )}
                  </>
                )}
              </div>
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
