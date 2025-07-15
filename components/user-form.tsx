"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"

const userFormSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }).min(1, { message: "Email is required." }),
  role: z.enum(["client", "admin"], { required_error: "Role is required." }),
  status: z.enum(["active", "inactive", "suspended"], { required_error: "Status is required." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }).optional().or(z.literal("")),
})

type UserFormValues = z.infer<typeof userFormSchema>

interface UserFormProps {
  initialData?: UserFormValues & { id?: string }
}

export function UserForm({ initialData }: UserFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      email: initialData?.email || "",
      role: initialData?.role || "client",
      status: initialData?.status || "active",
      password: "", // Password should always be empty for security reasons on edit
    },
  })

  const onSubmit = async (values: UserFormValues) => {
    setIsSubmitting(true)
    setError(null)

    const payload = {
      email: values.email,
      role: values.role,
      status: values.status,
      password: values.password === "" ? undefined : values.password, // Only send password if provided
    }

    try {
      const method = initialData?.id ? "PUT" : "POST"
      const url = initialData?.id ? `/api/admin/users/${initialData.id}` : "/api/admin/users" // POST not implemented yet for new users

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (res.ok) {
        router.push("/admin/users")
        router.refresh() // Revalidate data on the users list page
      } else {
        setError(data.message || `Failed to ${initialData?.id ? "update" : "create"} user.`)
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
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          {...form.register("email")}
          className={cn(form.formState.errors.email && "border-red-500")}
          disabled={isSubmitting}
        />
        {form.formState.errors.email && <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="role">Role</Label>
          <Select
            onValueChange={(value) => form.setValue("role", value as UserFormValues["role"])}
            defaultValue={initialData?.role}
            disabled={isSubmitting}
          >
            <SelectTrigger className={cn(form.formState.errors.role && "border-red-500")}>
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="client">Client</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
          {form.formState.errors.role && <p className="text-sm text-red-500">{form.formState.errors.role.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select
            onValueChange={(value) => form.setValue("status", value as UserFormValues["status"])}
            defaultValue={initialData?.status}
            disabled={isSubmitting}
          >
            <SelectTrigger className={cn(form.formState.errors.status && "border-red-500")}>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
            </SelectContent>
          </Select>
          {form.formState.errors.status && (
            <p className="text-sm text-red-500">{form.formState.errors.status.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">New Password (Optional, leave blank to keep current)</Label>
        <Input
          id="password"
          type="password"
          {...form.register("password")}
          className={cn(form.formState.errors.password && "border-red-500")}
          disabled={isSubmitting}
        />
        {form.formState.errors.password && (
          <p className="text-sm text-red-500">{form.formState.errors.password.message}</p>
        )}
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Saving..." : initialData?.id ? "Update User" : "Create User"}
      </Button>
    </form>
  )
}
