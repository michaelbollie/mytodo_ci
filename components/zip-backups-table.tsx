"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { TrashIcon, RefreshCcwIcon } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { toast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react" // Import Loader2 here

interface ZipBackup {
  id: string
  file_name: string
  file_size_bytes: number
  storage_path: string
  version: string
  uploaded_by: string | null
  uploaded_by_email: string | null
  notes: string | null
  created_at: string
}

interface ZipBackupsTableProps {
  backups: ZipBackup[]
}

export function ZipBackupsTable({ backups }: ZipBackupsTableProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [isRestoring, setIsRestoring] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    setIsDeleting(id)
    try {
      const res = await fetch(`/api/admin/zip-backups/${id}`, {
        method: "DELETE",
      })

      if (res.ok) {
        toast({
          title: "Backup Deleted",
          description: "The backup record has been successfully deleted.",
        })
        router.refresh()
      } else {
        const data = await res.json()
        toast({
          title: "Deletion Failed",
          description: data.message || "Failed to delete the backup record.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error deleting backup:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred while deleting the backup.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(null)
    }
  }

  const handleRestore = async (id: string, fileName: string) => {
    setIsRestoring(id)
    try {
      const res = await fetch(`/api/admin/zip-backups/${id}/restore`, {
        method: "POST",
      })

      if (res.ok) {
        toast({
          title: "Restore Initiated",
          description: `Restore for '${fileName}' simulated successfully.`,
        })
        // In a real app, you might want to redirect or show a progress indicator
      } else {
        const data = await res.json()
        toast({
          title: "Restore Failed",
          description: data.message || "Failed to simulate backup restoration.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error restoring backup:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred while simulating backup restoration.",
        variant: "destructive",
      })
    } finally {
      setIsRestoring(null)
    }
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>File Name</TableHead>
            <TableHead>Version</TableHead>
            <TableHead className="text-right">Size</TableHead>
            <TableHead>Uploaded By</TableHead>
            <TableHead>Created At</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {backups.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center">
                No backups found.
              </TableCell>
            </TableRow>
          ) : (
            backups.map((backup) => (
              <TableRow key={backup.id}>
                <TableCell className="font-medium">{backup.file_name}</TableCell>
                <TableCell>{backup.version}</TableCell>
                <TableCell className="text-right">{(backup.file_size_bytes / (1024 * 1024)).toFixed(2)} MB</TableCell>
                <TableCell>{backup.uploaded_by_email || "N/A"}</TableCell>
                <TableCell>{format(new Date(backup.created_at), "PPP")}</TableCell>
                <TableCell className="flex gap-2">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" disabled={isRestoring === backup.id}>
                        {isRestoring === backup.id ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCcwIcon className="h-4 w-4" />
                        )}
                        <span className="sr-only">Restore</span>
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action will simulate restoring the website from backup{" "}
                          <span className="font-semibold">{backup.file_name}</span> (version{" "}
                          <span className="font-semibold">{backup.version}</span>). This is a critical operation and
                          should be performed with caution.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleRestore(backup.id, backup.file_name)}>
                          Simulate Restore
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm" disabled={isDeleting === backup.id}>
                        {isDeleting === backup.id ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <TrashIcon className="h-4 w-4" />
                        )}
                        <span className="sr-only">Delete</span>
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete the backup record for{" "}
                          <span className="font-semibold">{backup.file_name}</span> from the database.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(backup.id)}>Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
