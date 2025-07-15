"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { format } from "date-fns"
import Link from "next/link"
import { Button } from "@/components/ui/button"

interface WebsiteContent {
  id: string
  page_name: string
  section_name: string
  content_html: string | null
  image_url: string | null
  last_updated_by: string | null
  updated_at: string
}

interface WebsiteContentTableProps {
  content: WebsiteContent[]
}

export function WebsiteContentTable({ content }: WebsiteContentTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Page</TableHead>
            <TableHead>Section</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Last Updated</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {content.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center">
                No editable content sections found.
              </TableCell>
            </TableRow>
          ) : (
            content.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.page_name}</TableCell>
                <TableCell>{item.section_name}</TableCell>
                <TableCell>{item.content_html ? "Text" : item.image_url ? "Image" : "N/A"}</TableCell>
                <TableCell>{format(new Date(item.updated_at), "PPP")}</TableCell>
                <TableCell>
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/admin/website-editor/${item.id}/edit`}>Edit</Link>
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
