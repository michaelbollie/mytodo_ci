"use client" // This component has client-side interactions, but the data fetching part is server-side.

import { useState } from "react"
import { useRouter } from "next/navigation"
import { redirect } from "next/navigation"
import { getUserSession } from "@/lib/session" // This is a server-only function
import { HeaderWrapper } from "@/components/header-wrapper"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { format } from "date-fns"
import { RefreshCcwIcon, TrashIcon } from "lucide-react"
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

// This function is called in the Server Component context
async function getBackupDetails(id: string, authToken: string | undefined) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/admin/zip-backups/${id}`, {
    headers: {
      Cookie: `auth_token=${authToken}`, // Use the token passed from the server session
    },
    cache: "no-store",
  })
  if (!res.ok) {
    throw new Error(`Failed to fetch backup: ${res.statusText}`)
  }
  return res.json()
}

export default async function AdminBackupDetailPage({ params }: { params: { id: string } }) {
  const session = await getUserSession() // This is a server-side call

  if (!session || session.userRole !== "admin") {
    redirect("/login")
  }

  let backup = null
  let error = ""
  try {
    // Pass the token from the server session to the fetch function
    backup = await getBackupDetails(params.id, session.authToken)
  } catch (err: any) {
    console.error("Error fetching backup details:", err)
    error = err.message || "Could not load backup details."
  }

  if (!backup && !error) {
    return (
      <div className="flex min-h-screen flex-col">
        <HeaderWrapper />
        <main className="flex-1 p-4 md:p-8">
          <div className="container mx-auto">
            <h1 className="text-3xl font-bold mb-6">Backup Details</h1>
            <p>Loading backup...</p>
          </div>
        </main>
      </div>
    )
  }

  // Client-side actions for restore/delete
  const ClientActions = ({ backupId, fileName, version }: { backupId: string; fileName: string; version: string }) => {
    const router = useRouter()
    const [isDeleting, setIsDeleting] = useState(false)
    const [isRestoring, setIsRestoring] = useState(false)

    const handleDelete = async () => {
      setIsDeleting(true)
      try {
        const res = await fetch(`/api/admin/zip-backups/${backupId}`, {
          method: "DELETE",
        })

        if (res.ok) {
          toast({
            title: "Backup Deleted",
            description: "The backup record has been successfully deleted.",
          })
          router.push("/admin/backup") // Redirect to list after deletion
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
        setIsDeleting(false)
      }
    }

    const handleRestore = async () => {
      setIsRestoring(true)
      try {
        const res = await fetch(`/api/admin/zip-backups/${backupId}/restore`, {
          method: "POST",
        })

        if (res.ok) {
          toast({
            title: "Restore Initiated",
            description: `Restore for '${fileName}' (version ${version}) simulated successfully.`,
          })
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
        setIsRestoring(false)
      }
    }

    return (
      <div className="flex gap-2">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" disabled={isRestoring}>
              {isRestoring ? (
                <>
                  <RefreshCcwIcon className="mr-2 h-4 w-4 animate-spin" /> Restoring...
                </>
              ) : (
                <>
                  <RefreshCcwIcon className="mr-2 h-4 w-4" /> Simulate Restore
                </>
              )}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action will simulate restoring the website from backup{" "}
                <span className="font-semibold">{fileName}</span> (version{" "}
                <span className="font-semibold">{version}</span>). This is a critical operation and should be performed
                with caution.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleRestore}>Simulate Restore</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" disabled={isDeleting}>
              {isDeleting ? (
                <>
                  <TrashIcon className="mr-2 h-4 w-4 animate-spin" /> Deleting...
                </>
              ) : (
                <>
                  <TrashIcon className="mr-2 h-4 w-4" /> Delete Backup
                </>
              )}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the backup record for{" "}
                <span className="font-semibold">{fileName}</span> from the database.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <HeaderWrapper />
      <main className="flex-1 p-4 md:p-8">
        <div className="container mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold">Backup Details: {backup?.file_name}</h1>
            <Button asChild variant="outline">
              <Link href="/admin/backup">Back to All Backups</Link>
            </Button>
          </div>
          {error ? (
            <p className="text-red-500">{error}</p>
          ) : backup ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Backup: {backup.file_name}</CardTitle>
                    <CardDescription>Version: {backup.version}</CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-4">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-sm text-muted-foreground">File Size</p>
                        <p className="text-lg font-semibold">
                          {(backup.file_size_bytes / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Storage Path</p>
                        <p className="text-lg font-semibold break-all">{backup.storage_path}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-sm text-muted-foreground">Uploaded By</p>
                        <p className="text-lg font-semibold">{backup.uploaded_by_email || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Created At</p>
                        <p className="text-lg font-semibold">{format(new Date(backup.created_at), "PPP")}</p>
                      </div>
                    </div>
                    {backup.notes && (
                      <div>
                        <p className="text-sm text-muted-foreground">Notes</p>
                        <p className="text-lg font-semibold whitespace-pre-wrap">{backup.notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
              <div className="lg:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle>Actions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ClientActions backupId={backup.id} fileName={backup.file_name} version={backup.version} />
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            <p className="text-red-500">Backup not found.</p>
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
