"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

const leadFormSchema = z.object({
  name: z.string().min(1, { message: "Lead name is required." }),
  email: z.string().email({ message: "Invalid email address." }).nullable().optional().or(z.literal("")),
  phone: z.string().max(50).nullable().optional().or(z.literal("")),
  company: z.string().max(255).nullable().optional().or(z.literal("")),
  source: z.string().max(100).nullable().optional().or(z.literal("")),
  status: z.enum(["new", "contacted", "qualified", "unqualified", "converted"], {
    required_error: "Status is required.",
  }),
  notes: z.string().nullable().optional().or(z.literal("")),
  assignedTo: z.string().uuid({ message: "Invalid user assigned." }).nullable().optional().or(z.literal("")),
})

type LeadFormValues = z.infer<typeof leadFormSchema>

interface LeadFormProps {
  initialData?: LeadFormValues & { id?: string }
}

interface AdminUser {
  id: string
  email: string
}

export function LeadForm({ initialData }: LeadFormProps) {
  const router = useRouter()
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([])
  const [loadingAdmins, setLoadingAdmins] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<LeadFormValues>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: {
      name: initialData?.name || "",
      email: initialData?.email || "",
      phone: initialData?.phone || "",
      company: initialData?.company || "",
      source: initialData?.source || "",
      status: initialData?.status || "new",
      notes: initialData?.notes || "",
      assignedTo: initialData?.assignedTo || "unassigned",
    },
  })

  useEffect(() => {
    const fetchAdminUsers = async () => {
      try {
        const res = await fetch("/api/users/admins")
        if (!res.ok) {
          throw new Error("Failed to fetch admin users.")
        }
        const data = await res.json()
        setAdminUsers(data)
      } catch (err: any) {
        console.error("Error fetching admin users:", err)
        setError(err.message || "Failed to load admin users for assignment.")
      } finally {
        setLoadingAdmins(false)
      }
    }
    fetchAdminUsers()
  }, [])

  const onSubmit = async (values: LeadFormValues) => {
    setIsSubmitting(true)
    setError(null)

    const payload = {
      ...values,
      email: values.email === "" ? null : values.email,
      phone: values.phone === "" ? null : values.phone,
      company: values.company === "" ? null : values.company,
      source: values.source === "" ? null : values.source,
      notes: values.notes === "" ? null : values.notes,
      assignedTo: values.assignedTo === "unassigned" ? null : values.assignedTo,
    }

    try {
      const method = initialData?.id ? "PUT" : "POST"
      const url = initialData?.id ? `/api/leads/${initialData.id}` : "/api/leads"

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (res.ok) {
        router.push("/admin/leads")
        router.refresh() // Revalidate data on the leads list page
      } else {
        setError(data.message || `Failed to ${initialData?.id ? "update" : "create"} lead.`)
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
        <Label htmlFor="name">Lead Name</Label>
        <Input
          id="name"
          type="text"
          {...form.register("name")}
          className={cn(form.formState.errors.name && "border-red-500")}
        />
        {form.formState.errors.name && <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email (Optional)</Label>
          <Input
            id="email"
            type="email"
            {...form.register("email")}
            className={cn(form.formState.errors.email && "border-red-500")}
          />
          {form.formState.errors.email && <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone (Optional)</Label>
          <Input
            id="phone"
            type="tel"
            {...form.register("phone")}
            className={cn(form.formState.errors.phone && "border-red-500")}
          />
          {form.formState.errors.phone && <p className="text-sm text-red-500">{form.formState.errors.phone.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="company">Company (Optional)</Label>
          <Input
            id="company"
            type="text"
            {...form.register("company")}
            className={cn(form.formState.errors.company && "border-red-500")}
          />
          {form.formState.errors.company && (
            <p className="text-sm text-red-500">{form.formState.errors.company.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="source">Source (Optional)</Label>
          <Input
            id="source"
            type="text"
            placeholder="e.g., Website, Referral, Cold Call"
            {...form.register("source")}
            className={cn(form.formState.errors.source && "border-red-500")}
          />
          {form.formState.errors.source && (
            <p className="text-sm text-red-500">{form.formState.errors.source.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select
            onValueChange={(value) => form.setValue("status", value as LeadFormValues["status"])}
            defaultValue={initialData?.status}
            disabled={isSubmitting}
          >
            <SelectTrigger className={cn(form.formState.errors.status && "border-red-500")}>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="contacted">Contacted</SelectItem>
              <SelectItem value="qualified">Qualified</SelectItem>
              <SelectItem value="unqualified">Unqualified</SelectItem>
              <SelectItem value="converted">Converted</SelectItem>
            </SelectContent>
          </Select>
          {form.formState.errors.status && (
            <p className="text-sm text-red-500">{form.formState.errors.status.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="assignedTo">Assigned To (Optional)</Label>
          <Select
            onValueChange={(value) => form.setValue("assignedTo", value)}
            defaultValue={initialData?.assignedTo || "unassigned"}
            disabled={loadingAdmins || isSubmitting}
          >
            <SelectTrigger className={cn(form.formState.errors.assignedTo && "border-red-500")}>
              <SelectValue placeholder="Select an admin/sales user" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              {loadingAdmins ? (
                <SelectItem value="loading" disabled>
                  Loading users...
                </SelectItem>
              ) : adminUsers.length === 0 ? (
                <SelectItem value="no-admins" disabled>
                  No admin users available.
                </SelectItem>
              ) : (
                adminUsers.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.email}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          {form.formState.errors.assignedTo && (
            <p className="text-sm text-red-500">{form.formState.errors.assignedTo.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes (Optional)</Label>
        <Textarea
          id="notes"
          {...form.register("notes")}
          className={cn(form.formState.errors.notes && "border-red-500")}
        />
        {form.formState.errors.notes && <p className="text-sm text-red-500">{form.formState.errors.notes.message}</p>}
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Saving..." : initialData?.id ? "Update Lead" : "Create Lead"}
      </Button>
    </form>
  )
}
