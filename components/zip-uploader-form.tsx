"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"

const zipUploadFormSchema = z.object({
  fileName: z.string().min(1, { message: "File name is required." }),
  fileSize: z.coerce.number().min(1, { message: "File size must be greater than 0." }),
  version: z.string().min(1, { message: "Version is required." }),
  notes: z.string().nullable().optional().or(z.literal("")),
})

type ZipUploadFormValues = z.infer<typeof zipUploadFormSchema>

export function ZipUploaderForm() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const form = useForm<ZipUploadFormValues>({
    resolver: zodResolver(zipUploadFormSchema),
    defaultValues: {
      fileName: `website-backup-${new Date().toISOString().split("T")[0]}.zip`,
      fileSize: 1024 * 1024 * 50, // Default to 50MB for simulation
      version: `v${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, "0")}${String(new Date().getDate()).padStart(2, "0")}`,
      notes: "",
    },
  })

  const onSubmit = async (values: ZipUploadFormValues) => {
    setIsSubmitting(true)
    setError(null)
    setSuccess(null)

    const payload = {
      ...values,
      notes: values.notes === "" ? null : values.notes,
    }

    try {
      const res = await fetch("/api/admin/zip-backups", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (res.ok) {
        setSuccess(data.message || "Backup record created successfully!")
        form.reset({
          fileName: `website-backup-${new Date().toISOString().split("T")[0]}.zip`,
          fileSize: 1024 * 1024 * 50,
          version: `v${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, "0")}${String(new Date().getDate()).padStart(2, "0")}`,
          notes: "",
        })
        router.refresh() // Revalidate data on the backups list page
      } else {
        setError(data.message || "Failed to create backup record.")
      }
    } catch (err: any) {
      console.error("Submission error:", err)
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="fileName">File Name</Label>
        <Input
          id="fileName"
          type="text"
          {...form.register("fileName")}
          className={cn(form.formState.errors.fileName && "border-red-500")}
          disabled={isSubmitting}
        />
        {form.formState.errors.fileName && (
          <p className="text-sm text-red-500">{form.formState.errors.fileName.message}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="fileSize">File Size (bytes)</Label>
          <Input
            id="fileSize"
            type="number"
            step="1"
            {...form.register("fileSize", { valueAsNumber: true })}
            className={cn(form.formState.errors.fileSize && "border-red-500")}
            disabled={isSubmitting}
          />
          {form.formState.errors.fileSize && (
            <p className="text-sm text-red-500">{form.formState.errors.fileSize.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="version">Version</Label>
          <Input
            id="version"
            type="text"
            {...form.register("version")}
            className={cn(form.formState.errors.version && "border-red-500")}
            disabled={isSubmitting}
          />
          {form.formState.errors.version && (
            <p className="text-sm text-red-500">{form.formState.errors.version.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes (Optional)</Label>
        <Textarea
          id="notes"
          {...form.register("notes")}
          className={cn(form.formState.errors.notes && "border-red-500")}
          rows={3}
          disabled={isSubmitting}
        />
        {form.formState.errors.notes && <p className="text-sm text-red-500">{form.formState.errors.notes.message}</p>}
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}
      {success && <p className="text-green-500 text-sm">{success}</p>}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating Backup Record...
          </>
        ) : (
          "Create Backup Record"
        )}
      </Button>
    </form>
  )
}
