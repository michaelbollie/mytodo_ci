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

const websiteContentFormSchema = z.object({
  contentHtml: z.string().nullable().optional().or(z.literal("")),
  imageUrl: z.string().url({ message: "Invalid URL format." }).nullable().optional().or(z.literal("")),
})

type WebsiteContentFormValues = z.infer<typeof websiteContentFormSchema>

interface WebsiteContentFormProps {
  initialData: {
    id: string
    page_name: string
    section_name: string
    content_html: string | null
    image_url: string | null
  }
}

export function WebsiteContentForm({ initialData }: WebsiteContentFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<WebsiteContentFormValues>({
    resolver: zodResolver(websiteContentFormSchema),
    defaultValues: {
      contentHtml: initialData.content_html || "",
      imageUrl: initialData.image_url || "",
    },
  })

  const onSubmit = async (values: WebsiteContentFormValues) => {
    setIsSubmitting(true)
    setError(null)

    const payload = {
      contentHtml: values.contentHtml === "" ? null : values.contentHtml,
      imageUrl: values.imageUrl === "" ? null : values.imageUrl,
    }

    try {
      const res = await fetch(`/api/website-content/${initialData.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (res.ok) {
        router.push("/admin/website-editor")
        router.refresh() // Revalidate data on the list page and homepage
      } else {
        setError(data.message || "Failed to update content.")
      }
    } catch (err: any) {
      console.error("Submission error:", err)
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const isTextContent = initialData.content_html !== null
  const isImageContent = initialData.image_url !== null

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label>Page Name</Label>
        <Input value={initialData.page_name} disabled />
      </div>
      <div className="space-y-2">
        <Label>Section Name</Label>
        <Input value={initialData.section_name} disabled />
      </div>

      {isTextContent && (
        <div className="space-y-2">
          <Label htmlFor="contentHtml">Content (HTML/Text)</Label>
          <Textarea
            id="contentHtml"
            {...form.register("contentHtml")}
            className={cn(form.formState.errors.contentHtml && "border-red-500")}
            rows={8}
          />
          {form.formState.errors.contentHtml && (
            <p className="text-sm text-red-500">{form.formState.errors.contentHtml.message}</p>
          )}
        </div>
      )}

      {isImageContent && (
        <div className="space-y-2">
          <Label htmlFor="imageUrl">Image URL</Label>
          <Input
            id="imageUrl"
            type="url"
            {...form.register("imageUrl")}
            className={cn(form.formState.errors.imageUrl && "border-red-500")}
          />
          {form.formState.errors.imageUrl && (
            <p className="text-sm text-red-500">{form.formState.errors.imageUrl.message}</p>
          )}
        </div>
      )}

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Saving..." : "Update Content"}
      </Button>
    </form>
  )
}
