import { redirect } from "next/navigation"
import { getUserSession } from "@/lib/session"
import { HeaderWrapper } from "@/components/header-wrapper"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { format } from "date-fns"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

async function getDeliveryNoteDetails(id: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/delivery-notes/${id}`, {
    headers: {
      Cookie: `auth_token=${await (await import("next/headers")).cookies().get("auth_token")?.value}`,
    },
    cache: "no-store",
  })
  if (!res.ok) {
    throw new Error(`Failed to fetch delivery note: ${res.statusText}`)
  }
  return res.json()
}

export default async function AdminDeliveryNoteDetailPage({ params }: { params: { id: string } }) {
  const session = await getUserSession()

  if (!session || session.userRole !== "admin") {
    redirect("/login")
  }

  let deliveryNote = null
  let error = ""
  try {
    deliveryNote = await getDeliveryNoteDetails(params.id)
  } catch (err: any) {
    console.error("Error fetching delivery note details:", err)
    error = err.message || "Could not load delivery note details."
  }

  if (!deliveryNote && !error) {
    return (
      <div className="flex min-h-screen flex-col">
        <HeaderWrapper />
        <main className="flex-1 p-4 md:p-8">
          <div className="container mx-auto">
            <h1 className="text-3xl font-bold mb-6">Delivery Note Details</h1>
            <p>Loading delivery note...</p>
          </div>
        </main>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "delivered":
        return "bg-green-100 text-green-800"
      case "returned":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <HeaderWrapper />
      <main className="flex-1 p-4 md:p-8">
        <div className="container mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold">Delivery Note: {deliveryNote?.delivery_note_number}</h1>
            <div className="flex gap-2">
              <Button asChild variant="outline">
                <Link href={`/admin/delivery-notes/${deliveryNote?.id}/edit`}>Edit Delivery Note</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/admin/delivery-notes">Back to All Delivery Notes</Link>
              </Button>
            </div>
          </div>
          {error ? (
            <p className="text-red-500">{error}</p>
          ) : deliveryNote ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Delivery Note #{deliveryNote.delivery_note_number}</CardTitle>
                    <CardDescription>Issued on {format(new Date(deliveryNote.issue_date), "PPP")}</CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-4">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-sm text-muted-foreground">Recipient Name</p>
                        <p className="text-lg font-semibold">{deliveryNote.recipient_name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Status</p>
                        <p className="text-lg font-semibold">
                          <span
                            className={`px-2 py-1 rounded-full text-sm font-semibold ${getStatusColor(deliveryNote.status)}`}
                          >
                            {deliveryNote.status.charAt(0).toUpperCase() + deliveryNote.status.slice(1)}
                          </span>
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Recipient Address</p>
                      <p className="text-lg font-semibold whitespace-pre-wrap">{deliveryNote.recipient_address}</p>
                    </div>
                    {deliveryNote.invoice_id && (
                      <div>
                        <p className="text-sm text-muted-foreground">Associated Invoice</p>
                        <p className="text-lg font-semibold">
                          <Link href={`/admin/invoices/${deliveryNote.invoice_id}`} className="underline">
                            {deliveryNote.invoice_number}
                          </Link>
                        </p>
                      </div>
                    )}
                    {deliveryNote.notes && (
                      <div>
                        <p className="text-sm text-muted-foreground">Notes</p>
                        <p className="text-lg font-semibold whitespace-pre-wrap">{deliveryNote.notes}</p>
                      </div>
                    )}

                    <h3 className="text-lg font-semibold mt-4">Items</h3>
                    {deliveryNote.items && deliveryNote.items.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Description</TableHead>
                            <TableHead className="text-right">Quantity</TableHead>
                            <TableHead className="text-right">Unit Price</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {deliveryNote.items.map((item: any) => (
                            <TableRow key={item.id}>
                              <TableCell>{item.description}</TableCell>
                              <TableCell className="text-right">{item.quantity}</TableCell>
                              <TableCell className="text-right">${item.unit_price.toFixed(2)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <p className="text-muted-foreground">No items listed for this delivery note.</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            <p className="text-red-500">Delivery note not found.</p>
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
