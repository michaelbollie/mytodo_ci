import { redirect } from "next/navigation"
import { getUserSession } from "@/lib/session"
import { HeaderWrapper } from "@/components/header-wrapper"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { InvoiceForm } from "@/components/invoice-form"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { sql } from "@/lib/db"

async function getInvoiceForEdit(id: string) {
  const [invoice] = await sql`SELECT * FROM invoices WHERE id = ${id}`
  return invoice
}

export default async function EditInvoicePage({ params }: { params: { id: string } }) {
  const session = await getUserSession()

  if (!session || session.userRole !== "admin") {
    redirect("/login")
  }

  const invoice = await getInvoiceForEdit(params.id)

  if (!invoice) {
    redirect("/admin/invoices") // Redirect if invoice not found
  }

  // Format data for the form
  const initialData = {
    id: invoice.id,
    invoice_number: invoice.invoice_number,
    userId: invoice.user_id,
    issueDate: new Date(invoice.issue_date),
    dueDate: invoice.due_date ? new Date(invoice.due_date) : null,
    totalAmount: Number.parseFloat(invoice.total_amount),
    status: invoice.status,
  }

  return (
    <div className="flex min-h-screen flex-col">
      <HeaderWrapper />
      <main className="flex-1 p-4 md:p-8">
        <div className="container mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold">Edit Invoice: {invoice.invoice_number}</h1>
            <Button asChild variant="outline">
              <Link href="/admin/invoices">Back to All Invoices</Link>
            </Button>
          </div>
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Invoice Details</CardTitle>
            </CardHeader>
            <CardContent>
              <InvoiceForm initialData={initialData} />
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
