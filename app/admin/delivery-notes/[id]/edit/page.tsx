import { redirect } from "next/navigation"
import { getUserSession } from "@/lib/session"
import { HeaderWrapper } from "@/components/header-wrapper"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DeliveryNoteForm } from "@/components/delivery-note-form"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { sql } from "@/lib/db"

async function getDeliveryNoteForEdit(id: string) {
  const [deliveryNote] = await sql`SELECT * FROM delivery_notes WHERE id = ${id}`
  if (!deliveryNote) return null

  const items = await sql`SELECT * FROM delivery_note_items WHERE delivery_note_id = ${id} ORDER BY created_at ASC`
  return { ...deliveryNote, items }
}

export default async function EditDeliveryNotePage({ params }: { params: { id: string } }) {
  const session = await getUserSession()

  if (!session || session.userRole !== "admin") {
    redirect("/login")
  }

  const deliveryNote = await getDeliveryNoteForEdit(params.id)

  if (!deliveryNote) {
    redirect("/admin/delivery-notes") // Redirect if delivery note not found
  }

  // Format data for the form
  const initialData = {
    id: deliveryNote.id,
    delivery_note_number: deliveryNote.delivery_note_number,
    invoiceId: deliveryNote.invoice_id,
    issueDate: new Date(deliveryNote.issue_date),
    recipientName: deliveryNote.recipient_name,
    recipientAddress: deliveryNote.recipient_address,
    status: deliveryNote.status,
    notes: deliveryNote.notes,
    items: deliveryNote.items.map((item: any) => ({
      description: item.description,
      quantity: Number.parseFloat(item.quantity),
      unitPrice: Number.parseFloat(item.unit_price),
    })),
  }

  return (
    <div className="flex min-h-screen flex-col">
      <HeaderWrapper />
      <main className="flex-1 p-4 md:p-8">
        <div className="container mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold">Edit Delivery Note: {deliveryNote.delivery_note_number}</h1>
            <Button asChild variant="outline">
              <Link href="/admin/delivery-notes">Back to All Delivery Notes</Link>
            </Button>
          </div>
          <Card className="max-w-3xl mx-auto">
            <CardHeader>
              <CardTitle>Delivery Note Details</CardTitle>
            </CardHeader>
            <CardContent>
              <DeliveryNoteForm initialData={initialData} />
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
