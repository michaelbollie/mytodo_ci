import { redirect } from "next/navigation"
import { getUserSession } from "@/lib/session"
import { HeaderWrapper } from "@/components/header-wrapper" // Use the new HeaderWrapper
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function ClientDashboardPage() {
  const session = await getUserSession()

  if (!session || session.userRole !== "client") {
    redirect("/login")
  }

  return (
    <div className="flex min-h-screen flex-col">
      <HeaderWrapper /> {/* Use the new HeaderWrapper */}
      <main className="flex-1 p-4 md:p-8">
        <div className="container mx-auto">
          <h1 className="text-3xl font-bold mb-6">Welcome, Client {session.userId}!</h1>
          <p className="text-lg text-muted-foreground mb-8">This is your personalized client dashboard.</p>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>My Quotes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">View and manage your pending and accepted quotes.</p>
                <Button asChild className="mt-4">
                  <Link href="/client/quotes">View Quotes</Link>
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>My Invoices</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Track your invoices and make payments.</p>
                <Button asChild className="mt-4">
                  <Link href="/client/invoices">View Invoices</Link>
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>My Receipts</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Access your payment receipts.</p>
                <Button asChild className="mt-4">
                  <Link href="/client/receipts">View Receipts</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
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
