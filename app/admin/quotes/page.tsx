import { redirect } from "next/navigation"
import { getUserSession } from "@/lib/session"
import { HeaderWrapper } from "@/components/header-wrapper"
import { QuotesTable } from "@/components/quotes-table"
import { Button } from "@/components/ui/button"
import Link from "next/link"

async function getAllQuotes() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/quotes`, {
    headers: {
      Cookie: `auth_token=${await (await import("next/headers")).cookies().get("auth_token")?.value}`,
    },
    cache: "no-store", // Ensure fresh data
  })
  if (!res.ok) {
    throw new Error(`Failed to fetch quotes: ${res.statusText}`)
  }
  return res.json()
}

export default async function AdminQuotesPage() {
  const session = await getUserSession()

  if (!session || session.userRole !== "admin") {
    redirect("/login")
  }

  let quotes = []
  let error = ""
  try {
    quotes = await getAllQuotes()
  } catch (err: any) {
    console.error("Error fetching all quotes for admin:", err)
    error = err.message || "Could not load quotes."
  }

  return (
    <div className="flex min-h-screen flex-col">
      <HeaderWrapper />
      <main className="flex-1 p-4 md:p-8">
        <div className="container mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold">All Quotes</h1>
            <Button asChild>
              <Link href="/admin/quotes/new">Create New Quote</Link>
            </Button>
          </div>
          {error ? <p className="text-red-500">{error}</p> : <QuotesTable quotes={quotes} isAdmin={true} />}
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
