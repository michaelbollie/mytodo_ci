"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { format } from "date-fns"
import Link from "next/link"
import { Button } from "@/components/ui/button"

interface DeliveryNote {
  id: string
  invoice_id: string | null
  delivery_note_number: string
  issue_date: string
  recipient_name: string
  recipient_address: string
  status: string
  notes: string | null
  invoice_number: string | null // Joined from invoices table
  client_email: string | null // Joined from users table via invoices
  created_at: string
  updated_at: string
}

interface DeliveryNotesTableProps {
  deliveryNotes: DeliveryNote[]
}

export function DeliveryNotesTable({ deliveryNotes }: DeliveryNotesTableProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "delivered":
        return "bg-green-100 text-green-800"
      case "returned":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>DN #</TableHead>
            <TableHead>Invoice #</TableHead>
            <TableHead>Recipient</TableHead>
            <TableHead>Issue Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {deliveryNotes.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center">
                No delivery notes found.
              </TableCell>
            </TableRow>
          ) : (
            deliveryNotes.map((note) => (
              <TableRow key={note.id}>
                <TableCell className="font-medium">{note.delivery_note_number}</TableCell>
                <TableCell>
                  {note.invoice_id ? (
                    <Link href={`/admin/invoices/${note.invoice_id}`} className="underline">
                      {note.invoice_number}
                    </Link>
                  ) : (
                    "N/A"
                  )}
                </TableCell>
                <TableCell>{note.recipient_name}</TableCell>
                <TableCell>{format(new Date(note.issue_date), "PPP")}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(note.status)}`}>
                    {note.status.charAt(0).toUpperCase() + note.status.slice(1)}
                  </span>
                </TableCell>
                <TableCell>
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/admin/delivery-notes/${note.id}`}>View</Link>
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
