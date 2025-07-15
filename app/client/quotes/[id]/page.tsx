import { redirect } from "next/navigation"
import { getUserSession } from "@/lib/session"
import { HeaderWrapper } from "@/components/header-wrapper"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { format } from "date-fns"

async function getQuoteDetails(id: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/quotes/${id}`, {
    headers: {
      Cookie: `auth_token=${await (await import("next/headers")).cookies().get("auth_token")?.value}`,
    },
    cache: "no-store",
  })
  if (!res.ok) {
    throw new Error(`Failed to fetch quote: ${res.statusText}`)
  }
  return res.json()
}

export default async function ClientQuoteDetailPage({ params }: { params: { id: string } }) {
  const session = await getUserSession()

  if (!session || session.userRole !== "client") {
    redirect("/login")
  }

  let quote = null
  let error = ""
  try {
    quote = await getQuoteDetails(params.id)
    // Additional client-side check to ensure the quote belongs to the user
    if (quote && quote.user_id !== session.userId) {
      redirect("/client/quotes") // Redirect if trying to access another user's quote
    }
  } catch (err: any) {
    console.error("Error fetching quote details:", err)
    error = err.message || "Could not load quote details."
  }

  if (!quote && !error) {
    return (
      <div className="flex min-h-screen flex-col">
        <HeaderWrapper />
        <main className="flex-1 p-4 md:p-8">
          <div className="container mx-auto">
            <h1 className="text-3xl font-bold mb-6">Quote Details</h1>
            <p>Loading quote...</p>
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
            <h1 className="text-3xl font-bold">Quote Details: {quote?.quote_number}</h1>
            <Button asChild variant="outline">
              <Link href="/client/quotes">Back to Quotes</Link>
            </Button>
          </div>
          {error ? (
            <p className="text-red-500">{error}</p>
          ) : quote ? (
            <Card>
              <CardHeader>
                <CardTitle>Quote #{quote.quote_number}</CardTitle>
                <CardDescription>Issued on {format(new Date(quote.issue_date), "PPP")}</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Amount</p>
                    <p className="text-lg font-semibold">${quote.total_amount.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <p className="text-lg font-semibold">
                      <span
                        className={`px-2 py-1 rounded-full text-sm font-semibold ${
                          quote.status === "accepted"
                            ? "bg-green-100 text-green-800"
                            : quote.status === "sent"
                              ? "bg-blue-100 text-blue-800"
                              : quote.status === "rejected"
                                ? "bg-red-100 text-red-800"
                                : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {quote.status.charAt(0).toUpperCase() + quote.status.slice(1)}
                      </span>
                    </p>
                  </div>
                </div>
                {quote.due_date && (
                  <div>
                    <p className="text-sm text-muted-foreground">Due Date</p>
                    <p className="text-lg font-semibold">{format(new Date(quote.due_date), "PPP")}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Client ID</p>
                  <p className="text-lg font-semibold">{quote.user_id}</p>
                </div>
                {/* Add more quote details here as needed */}
              </CardContent>
            </Card>
          ) : (
            <p className="text-red-500">Quote not found.</p>
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
