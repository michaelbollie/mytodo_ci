import { redirect } from "next/navigation"
import { getUserSession } from "@/lib/session"
import { HeaderWrapper } from "@/components/header-wrapper"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { format } from "date-fns"

async function getCompanyBankAccountDetails(id: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/company-bank-accounts/${id}`, {
    headers: {
      Cookie: `auth_token=${await (await import("next/headers")).cookies().get("auth_token")?.value}`,
    },
    cache: "no-store",
  })
  if (!res.ok) {
    throw new Error(`Failed to fetch bank account: ${res.statusText}`)
  }
  return res.json()
}

export default async function AdminCompanyBankAccountDetailPage({ params }: { params: { id: string } }) {
  const session = await getUserSession()

  if (!session || session.userRole !== "admin") {
    redirect("/login")
  }

  let account = null
  let error = ""
  try {
    account = await getCompanyBankAccountDetails(params.id)
  } catch (err: any) {
    console.error("Error fetching company bank account details:", err)
    error = err.message || "Could not load bank account details."
  }

  if (!account && !error) {
    return (
      <div className="flex min-h-screen flex-col">
        <HeaderWrapper />
        <main className="flex-1 p-4 md:p-8">
          <div className="container mx-auto">
            <h1 className="text-3xl font-bold mb-6">Bank Account Details</h1>
            <p>Loading account...</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <HeaderWrapper />
      <main className="flex-1 p-4 md:p-8">
        <div className="container mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold">Bank Account: {account?.account_name}</h1>
            <div className="flex gap-2">
              <Button asChild variant="outline">
                <Link href={`/admin/company-bank-accounts/${account?.id}/edit`}>Edit Account</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/admin/company-bank-accounts">Back to Accounts</Link>
              </Button>
            </div>
          </div>
          {error ? (
            <p className="text-red-500">{error}</p>
          ) : account ? (
            <Card>
              <CardHeader>
                <CardTitle>{account.bank_name}</CardTitle>
                <CardDescription>Account Name: {account.account_name}</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Account Number</p>
                    <p className="text-lg font-semibold">{account.account_number}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Currency</p>
                    <p className="text-lg font-semibold">{account.currency}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Current Balance</p>
                    <p className="text-lg font-semibold">{account.current_balance.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Branch Name</p>
                    <p className="text-lg font-semibold">{account.branch_name || "N/A"}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">SWIFT Code</p>
                  <p className="text-lg font-semibold">{account.swift_code || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Notes</p>
                  <p className="text-lg font-semibold whitespace-pre-wrap">{account.notes || "N/A"}</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Created At</p>
                    <p className="text-lg font-semibold">{format(new Date(account.created_at), "PPP")}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Last Updated</p>
                    <p className="text-lg font-semibold">{format(new Date(account.updated_at), "PPP")}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <p className="text-red-500">Bank account not found.</p>
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
