"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { format } from "date-fns"
import Link from "next/link"
import { Button } from "@/components/ui/button"

interface Receipt {
  id: string
  invoice_id: string
  receipt_number: string
  payment_date: string
  amount_paid: number
  payment_method: string | null
  invoice_number: string // Joined from invoices table
  client_email: string // Joined from users table
  created_at: string
  updated_at: string
}

interface ReceiptsTableProps {
  receipts: Receipt[]
  isAdmin: boolean
}

export function ReceiptsTable({ receipts, isAdmin }: ReceiptsTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Receipt #</TableHead>
            <TableHead>Invoice #</TableHead>
            {isAdmin && <TableHead>Client Email</TableHead>}
            <TableHead>Payment Date</TableHead>
            <TableHead className="text-right">Amount Paid</TableHead>
            <TableHead>Payment Method</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {receipts.length === 0 ? (
            <TableRow>
              <TableCell colSpan={isAdmin ? 7 : 6} className="h-24 text-center">
                No receipts found.
              </TableCell>
            </TableRow>
          ) : (
            receipts.map((receipt) => (
              <TableRow key={receipt.id}>
                <TableCell className="font-medium">{receipt.receipt_number}</TableCell>
                <TableCell>
                  <Link href={`${isAdmin ? "/admin" : "/client"}/invoices/${receipt.invoice_id}`} className="underline">
                    {receipt.invoice_number}
                  </Link>
                </TableCell>
                {isAdmin && <TableCell>{receipt.client_email}</TableCell>}
                <TableCell>{format(new Date(receipt.payment_date), "PPP")}</TableCell>
                <TableCell className="text-right">${receipt.amount_paid.toFixed(2)}</TableCell>
                <TableCell>{receipt.payment_method || "N/A"}</TableCell>
                <TableCell>
                  <Button asChild variant="outline" size="sm">
                    <Link href={`${isAdmin ? "/admin" : "/client"}/receipts/${receipt.id}`}>View</Link>
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
