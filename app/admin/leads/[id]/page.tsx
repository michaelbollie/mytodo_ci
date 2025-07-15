import { redirect } from "next/navigation"
import { getUserSession } from "@/lib/session"
import { HeaderWrapper } from "@/components/header-wrapper"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { format } from "date-fns"

async function getLeadDetails(id: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/leads/${id}`, {
    headers: {
      Cookie: `auth_token=${await (await import("next/headers")).cookies().get("auth_token")?.value}`,
    },
    cache: "no-store",
  })
  if (!res.ok) {
    throw new Error(`Failed to fetch lead: ${res.statusText}`)
  }
  return res.json()
}

export default async function AdminLeadDetailPage({ params }: { params: { id: string } }) {
  const session = await getUserSession()

  if (!session || session.userRole !== "admin") {
    redirect("/login")
  }

  let lead = null
  let error = ""
  try {
    lead = await getLeadDetails(params.id)
  } catch (err: any) {
    console.error("Error fetching lead details:", err)
    error = err.message || "Could not load lead details."
  }

  if (!lead && !error) {
    return (
      <div className="flex min-h-screen flex-col">
        <HeaderWrapper />
        <main className="flex-1 p-4 md:p-8">
          <div className="container mx-auto">
            <h1 className="text-3xl font-bold mb-6">Lead Details</h1>
            <p>Loading lead...</p>
          </div>
        </main>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "new":
        return "bg-blue-100 text-blue-800"
      case "contacted":
        return "bg-yellow-100 text-yellow-800"
      case "qualified":
        return "bg-green-100 text-green-800"
      case "converted":
        return "bg-purple-100 text-purple-800"
      case "unqualified":
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
            <h1 className="text-3xl font-bold">Lead Details: {lead?.name}</h1>
            <div className="flex gap-2">
              <Button asChild variant="outline">
                <Link href={`/admin/leads/${lead?.id}/edit`}>Edit Lead</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/admin/leads">Back to All Leads</Link>
              </Button>
            </div>
          </div>
          {error ? (
            <p className="text-red-500">{error}</p>
          ) : lead ? (
            <Card>
              <CardHeader>
                <CardTitle>{lead.name}</CardTitle>
                <CardDescription>Created on {format(new Date(lead.created_at), "PPP")}</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="text-lg font-semibold">{lead.email || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="text-lg font-semibold">{lead.phone || "N/A"}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Company</p>
                    <p className="text-lg font-semibold">{lead.company || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Source</p>
                    <p className="text-lg font-semibold">{lead.source || "N/A"}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <p className="text-lg font-semibold">
                      <span className={`px-2 py-1 rounded-full text-sm font-semibold ${getStatusColor(lead.status)}`}>
                        {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
                      </span>
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Assigned To</p>
                    <p className="text-lg font-semibold">{lead.assigned_to_email || "Unassigned"}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Notes</p>
                  <p className="text-lg font-semibold whitespace-pre-wrap">{lead.notes || "N/A"}</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <p className="text-red-500">Lead not found.</p>
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
