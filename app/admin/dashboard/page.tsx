import { redirect } from "next/navigation"
import { getUserSession } from "@/lib/session"
import { HeaderWrapper } from "@/components/header-wrapper" // Use the new HeaderWrapper
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function AdminDashboardPage() {
  const session = await getUserSession()

  if (!session || session.userRole !== "admin") {
    redirect("/login") // Or redirect to a specific unauthorized page
  }

  return (
    <div className="flex min-h-screen flex-col">
      <HeaderWrapper /> {/* Use the new HeaderWrapper */}
      <main className="flex-1 p-4 md:p-8">
        <div className="container mx-auto">
          <h1 className="text-3xl font-bold mb-6">Welcome, Admin {session.userId}!</h1>
          <p className="text-lg text-muted-foreground mb-8">This is your powerful admin control panel.</p>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Manage Users</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">View, edit, and manage all client and admin accounts.</p>
                <Button asChild className="mt-4">
                  <Link href="/admin/users">Go to User Manager</Link>
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Quotes & Invoices</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Oversee all financial documents across clients.</p>
                <Button asChild className="mt-4">
                  <Link href="/admin/financials">Go to Financials</Link>
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Website Editor</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Update homepage content and other site elements.</p>
                <Button asChild className="mt-4">
                  <Link href="/admin/website-editor">Go to Editor</Link>
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>ZIP Uploader & Backup</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Manage site backups and restore previous versions.</p>
                <Button asChild className="mt-4">
                  <Link href="/admin/backup">Go to Backup Manager</Link>
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>System Logs</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Review login attempts, changes, and other system activities.</p>
                <Button asChild className="mt-4">
                  <Link href="/admin/logs">View Logs</Link>
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
