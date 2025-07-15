import { redirect } from "next/navigation"
import { getUserSession } from "@/lib/session"
import { HeaderWrapper } from "@/components/header-wrapper"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LeadForm } from "@/components/lead-form"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { sql } from "@/lib/db"

async function getLeadForEdit(id: string) {
  const [lead] = await sql`SELECT * FROM leads WHERE id = ${id}`
  return lead
}

export default async function EditLeadPage({ params }: { params: { id: string } }) {
  const session = await getUserSession()

  if (!session || session.userRole !== "admin") {
    redirect("/login")
  }

  const lead = await getLeadForEdit(params.id)

  if (!lead) {
    redirect("/admin/leads") // Redirect if lead not found
  }

  // Format data for the form
  const initialData = {
    id: lead.id,
    name: lead.name,
    email: lead.email,
    phone: lead.phone,
    company: lead.company,
    source: lead.source,
    status: lead.status,
    notes: lead.notes,
    assignedTo: lead.assigned_to,
  }

  return (
    <div className="flex min-h-screen flex-col">
      <HeaderWrapper />
      <main className="flex-1 p-4 md:p-8">
        <div className="container mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold">Edit Lead: {lead.name}</h1>
            <Button asChild variant="outline">
              <Link href="/admin/leads">Back to All Leads</Link>
            </Button>
          </div>
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Lead Details</CardTitle>
            </CardHeader>
            <CardContent>
              <LeadForm initialData={initialData} />
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
