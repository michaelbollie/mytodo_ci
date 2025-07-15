import { redirect } from "next/navigation"
import { getUserSession } from "@/lib/session"
import { HeaderWrapper } from "@/components/header-wrapper"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { QuoteForm } from "@/components/quote-form"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { sql } from "@/lib/db"

async function getQuoteForEdit(id: string) {
  const [quote] = await sql`SELECT * FROM quotes WHERE id = ${id}`
  return quote
}

export default async function EditQuotePage({ params }: { params: { id: string } }) {
  const session = await getUserSession()

  if (!session || session.userRole !== "admin") {
    redirect("/login")
  }

  const quote = await getQuoteForEdit(params.id)

  if (!quote) {
    redirect("/admin/quotes") // Redirect if quote not found
  }

  // Format data for the form
  const initialData = {
    id: quote.id,
    quote_number: quote.quote_number,
    userId: quote.user_id,
    issueDate: new Date(quote.issue_date),
    dueDate: quote.due_date ? new Date(quote.due_date) : null,
    totalAmount: Number.parseFloat(quote.total_amount),
    status: quote.status,
  }

  return (
    <div className="flex min-h-screen flex-col">
      <HeaderWrapper />
      <main className="flex-1 p-4 md:p-8">
        <div className="container mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold">Edit Quote: {quote.quote_number}</h1>
            <Button asChild variant="outline">
              <Link href="/admin/quotes">Back to All Quotes</Link>
            </Button>
          </div>
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Quote Details</CardTitle>
            </CardHeader>
            <CardContent>
              <QuoteForm initialData={initialData} />
            </CardContent>
          </Card>
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
