import { redirect } from "next/navigation"
import { getUserSession } from "@/lib/session"
import { HeaderWrapper } from "@/components/header-wrapper"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CompanyBankAccountForm } from "@/components/company-bank-account-form"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { sql } from "@/lib/db"

async function getCompanyBankAccountForEdit(id: string) {
  const [account] = await sql`SELECT * FROM company_bank_accounts WHERE id = ${id}`
  return account
}

export default async function EditCompanyBankAccountPage({ params }: { params: { id: string } }) {
  const session = await getUserSession()

  if (!session || session.userRole !== "admin") {
    redirect("/login")
  }

  const account = await getCompanyBankAccountForEdit(params.id)

  if (!account) {
    redirect("/admin/company-bank-accounts") // Redirect if account not found
  }

  // Format data for the form
  const initialData = {
    id: account.id,
    bankName: account.bank_name,
    accountName: account.account_name,
    accountNumber: account.account_number,
    currency: account.currency,
    currentBalance: Number.parseFloat(account.current_balance),
    branchName: account.branch_name,
    swiftCode: account.swift_code,
    notes: account.notes,
  }

  return (
    <div className="flex min-h-screen flex-col">
      <HeaderWrapper />
      <main className="flex-1 p-4 md:p-8">
        <div className="container mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold">Edit Bank Account: {account.account_name}</h1>
            <Button asChild variant="outline">
              <Link href="/admin/company-bank-accounts">Back to Accounts</Link>
            </Button>
          </div>
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Account Details</CardTitle>
            </CardHeader>
            <CardContent>
              <CompanyBankAccountForm initialData={initialData} />
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
