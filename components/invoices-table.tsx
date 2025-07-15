"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { format } from "date-fns"
import Link from "next/link"
import { Button } from "@/components/ui/button"

interface Invoice {
  id: string
  user_id: string
  invoice_number: string
  issue_date: string
  due_date: string | null
  total_amount: number
  status: string
  created_at: string
  updated_at: string
}

interface InvoicesTableProps {
  invoices: Invoice[]
  isAdmin: boolean
}

export function InvoicesTable({ invoices, isAdmin }: InvoicesTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Invoice #</TableHead>
            {isAdmin && <TableHead>Client ID</TableHead>}
            <TableHead>Issue Date</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.length === 0 ? (
            <TableRow>
              <TableCell colSpan={isAdmin ? 7 : 6} className="h-24 text-center">
                No invoices found.
              </TableCell>
            </TableRow>
          ) : (
            invoices.map((invoice) => (
              <TableRow key={invoice.id}>
                <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                {isAdmin && <TableCell>{invoice.user_id}</TableCell>}
                <TableCell>{format(new Date(invoice.issue_date), "PPP")}</TableCell>
                <TableCell>{invoice.due_date ? format(new Date(invoice.due_date), "PPP") : "N/A"}</TableCell>
                <TableCell className="text-right">${invoice.total_amount.toFixed(2)}</TableCell>
                <TableCell>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      invoice.status === "paid"
                        ? "bg-green-100 text-green-800"
                        : invoice.status === "sent"
                          ? "bg-blue-100 text-blue-800"
                          : invoice.status === "overdue"
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                  </span>
                </TableCell>
                <TableCell>
                  <Button asChild variant="outline" size="sm">
                    <Link href={`${isAdmin ? "/admin" : "/client"}/invoices/${invoice.id}`}>View</Link>
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
