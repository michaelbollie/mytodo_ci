import { redirect } from "next/navigation"
import { getUserSession } from "@/lib/session"
import { HeaderWrapper } from "@/components/header-wrapper"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { UserForm } from "@/components/user-form"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { sql } from "@/lib/db"

async function getUserForEdit(id: string) {
  const [user] = await sql`SELECT id, email, role, status FROM users WHERE id = ${id}`
  return user
}

export default async function EditUserPage({ params }: { params: { id: string } }) {
  const session = await getUserSession()

  if (!session || session.userRole !== "admin") {
    redirect("/login")
  }

  const user = await getUserForEdit(params.id)

  if (!user) {
    redirect("/admin/users") // Redirect if user not found
  }

  // Format data for the form
  const initialData = {
    id: user.id,
    email: user.email,
    role: user.role,
    status: user.status,
    password: "", // Do not pre-fill password for security
  }

  return (
    <div className="flex min-h-screen flex-col">
      <HeaderWrapper />
      <main className="flex-1 p-4 md:p-8">
        <div className="container mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold">Edit User: {user.email}</h1>
            <Button asChild variant="outline">
              <Link href="/admin/users">Back to All Users</Link>
            </Button>
          </div>
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>User Details</CardTitle>
            </CardHeader>
            <CardContent>
              <UserForm initialData={initialData} />
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
