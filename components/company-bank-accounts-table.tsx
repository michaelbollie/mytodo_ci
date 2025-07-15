"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import Link from "next/link"
import { Button } from "@/components/ui/button"

interface CompanyBankAccount {
  id: string
  bank_name: string
  account_name: string
  account_number: string
  currency: string
  current_balance: number
  branch_name: string | null
  swift_code: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

interface CompanyBankAccountsTableProps {
  accounts: CompanyBankAccount[]
}

export function CompanyBankAccountsTable({ accounts }: CompanyBankAccountsTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Bank Name</TableHead>
            <TableHead>Account Name</TableHead>
            <TableHead>Account Number</TableHead>
            <TableHead>Currency</TableHead>
            <TableHead className="text-right">Balance</TableHead>
            <TableHead>Branch</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {accounts.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center">
                No bank accounts found.
              </TableCell>
            </TableRow>
          ) : (
            accounts.map((account) => (
              <TableRow key={account.id}>
                <TableCell className="font-medium">{account.bank_name}</TableCell>
                <TableCell>{account.account_name}</TableCell>
                <TableCell>{account.account_number}</TableCell>
                <TableCell>{account.currency}</TableCell>
                <TableCell className="text-right">{account.current_balance.toFixed(2)}</TableCell>
                <TableCell>{account.branch_name || "N/A"}</TableCell>
                <TableCell>
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/admin/company-bank-accounts/${account.id}`}>View</Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
