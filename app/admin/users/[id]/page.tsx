import { redirect } from "next/navigation"
import { getUserSession } from "@/lib/session"
import { HeaderWrapper } from "@/components/header-wrapper"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { format } from "date-fns"

async function getUserDetails(id: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/admin/users/${id}`, {
    headers: {
      Cookie: `auth_token=${await (await import("next/headers")).cookies().get("auth_token")?.value}`,
    },
    cache: "no-store",
  })
  if (!res.ok) {
    throw new Error(`Failed to fetch user: ${res.statusText}`)
  }
  return res.json()
}

export default async function AdminUserDetailPage({ params }: { params: { id: string } }) {
  const session = await getUserSession()

  if (!session || session.userRole !== "admin") {
    redirect("/login")
  }

  let user = null
  let error = ""
  try {
    user = await getUserDetails(params.id)
  } catch (err: any) {
    console.error("Error fetching user details:", err)
    error = err.message || "Could not load user details."
  }

  if (!user && !error) {
    return (
      <div className="flex min-h-screen flex-col">
        <HeaderWrapper />
        <main className="flex-1 p-4 md:p-8">
          <div className="container mx-auto">
            <h1 className="text-3xl font-bold mb-6">User Details</h1>
            <p>Loading user...</p>
          </div>
        </main>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "inactive":
        return "bg-yellow-100 text-yellow-800"
      case "suspended":
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
            <h1 className="text-3xl font-bold">User Details: {user?.email}</h1>
            <div className="flex gap-2">
              <Button asChild variant="outline">
                <Link href={`/admin/users/${user?.id}/edit`}>Edit User</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/admin/users">Back to All Users</Link>
              </Button>
            </div>
          </div>
          {error ? (
            <p className="text-red-500">{error}</p>
          ) : user ? (
            <Card>
              <CardHeader>
                <CardTitle>{user.email}</CardTitle>
                <CardDescription>User ID: {user.id}</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Role</p>
                    <p className="text-lg font-semibold">{user.role.charAt(0).toUpperCase() + user.role.slice(1)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <p className="text-lg font-semibold">
                      <span className={`px-2 py-1 rounded-full text-sm font-semibold ${getStatusColor(user.status)}`}>
                        {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                      </span>
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Created At</p>
                    <p className="text-lg font-semibold">{format(new Date(user.created_at), "PPP")}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Last Updated</p>
                    <p className="text-lg font-semibold">{format(new Date(user.updated_at), "PPP")}</p>
                  </div>
                </div>
                {/* Add more user details here as needed, e.g., last login IP/device */}
              </CardContent>
            </Card>
          ) : (
            <p className="text-red-500">User not found.</p>
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
