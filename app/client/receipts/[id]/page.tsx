import { redirect } from "next/navigation"
import { getUserSession } from "@/lib/session"
import { HeaderWrapper } from "@/components/header-wrapper"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { format } from "date-fns"

async function getReceiptDetails(id: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/receipts/${id}`, {
    headers: {
      Cookie: `auth_token=${await (await import("next/headers")).cookies().get("auth_token")?.value}`,
    },
    cache: "no-store",
  })
  if (!res.ok) {
    throw new Error(`Failed to fetch receipt: ${res.statusText}`)
  }
  return res.json()
}

export default async function ClientReceiptDetailPage({ params }: { params: { id: string } }) {
  const session = await getUserSession()

  if (!session || session.userRole !== "client") {
    redirect("/login")
  }

  let receipt = null
  let error = ""
  try {
    receipt = await getReceiptDetails(params.id)
    // Additional client-side check to ensure the receipt's invoice belongs to the user
    if (receipt && receipt.user_id !== session.userId) {
      redirect("/client/receipts") // Redirect if trying to access another user's receipt
    }
  } catch (err: any) {
    console.error("Error fetching receipt details:", err)
    error = err.message || "Could not load receipt details."
  }

  if (!receipt && !error) {
    return (
      <div className="flex min-h-screen flex-col">
        <HeaderWrapper />
        <main className="flex-1 p-4 md:p-8">
          <div className="container mx-auto">
            <h1 className="text-3xl font-bold mb-6">Receipt Details</h1>
            <p>Loading receipt...</p>
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
            <h1 className="text-3xl font-bold">Receipt Details: {receipt?.receipt_number}</h1>
            <Button asChild variant="outline">
              <Link href="/client/receipts">Back to Receipts</Link>
            </Button>
          </div>
          {error ? (
            <p className="text-red-500">{error}</p>
          ) : receipt ? (
            <Card>
              <CardHeader>
                <CardTitle>Receipt #{receipt.receipt_number}</CardTitle>
                <CardDescription>Paid on {format(new Date(receipt.payment_date), "PPP")}</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Amount Paid</p>
                    <p className="text-lg font-semibold">${receipt.amount_paid.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Payment Method</p>
                    <p className="text-lg font-semibold">{receipt.payment_method || "N/A"}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Associated Invoice</p>
                  <p className="text-lg font-semibold">
                    <Link href={`/client/invoices/${receipt.invoice_id}`} className="underline">
                      {receipt.invoice_number}
                    </Link>
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Client Email</p>
                  <p className="text-lg font-semibold">{receipt.client_email}</p>
                </div>
                {/* Add more receipt details here as needed */}
              </CardContent>
            </Card>
          ) : (
            <p className="text-red-500">Receipt not found.</p>
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
