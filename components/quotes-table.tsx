"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { format } from "date-fns"
import Link from "next/link"
import { Button } from "@/components/ui/button"

interface Quote {
  id: string
  user_id: string
  quote_number: string
  issue_date: string
  due_date: string | null
  total_amount: number
  status: string
  created_at: string
  updated_at: string
}

interface QuotesTableProps {
  quotes: Quote[]
  isAdmin: boolean
}

export function QuotesTable({ quotes, isAdmin }: QuotesTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Quote #</TableHead>
            {isAdmin && <TableHead>Client ID</TableHead>}
            <TableHead>Issue Date</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {quotes.length === 0 ? (
            <TableRow>
              <TableCell colSpan={isAdmin ? 7 : 6} className="h-24 text-center">
                No quotes found.
              </TableCell>
            </TableRow>
          ) : (
            quotes.map((quote) => (
              <TableRow key={quote.id}>
                <TableCell className="font-medium">{quote.quote_number}</TableCell>
                {isAdmin && <TableCell>{quote.user_id}</TableCell>}
                <TableCell>{format(new Date(quote.issue_date), "PPP")}</TableCell>
                <TableCell>{quote.due_date ? format(new Date(quote.due_date), "PPP") : "N/A"}</TableCell>
                <TableCell className="text-right">${quote.total_amount.toFixed(2)}</TableCell>
                <TableCell>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      quote.status === "accepted"
                        ? "bg-green-100 text-green-800"
                        : quote.status === "sent"
                          ? "bg-blue-100 text-blue-800"
                          : quote.status === "rejected"
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {quote.status.charAt(0).toUpperCase() + quote.status.slice(1)}
                  </span>
                </TableCell>
                <TableCell>
                  <Button asChild variant="outline" size="sm">
                    <Link href={`${isAdmin ? "/admin" : "/client"}/quotes/${quote.id}`}>View</Link>
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
