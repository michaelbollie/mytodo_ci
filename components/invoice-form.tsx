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
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"

const invoiceFormSchema = z.object({
  userId: z.string().uuid({ message: "Invalid client selected." }),
  issueDate: z.date({ required_error: "Issue date is required." }),
  dueDate: z.date().nullable().optional(),
  totalAmount: z.coerce.number().min(0.01, { message: "Total amount must be greater than 0." }),
  status: z.enum(["draft", "sent", "paid", "overdue"], { required_error: "Status is required." }),
  // You might add more fields here like items, notes, etc.
})

type InvoiceFormValues = z.infer<typeof invoiceFormSchema>

interface InvoiceFormProps {
  initialData?: InvoiceFormValues & { id?: string; invoice_number?: string }
}

interface Client {
  id: string
  email: string
}

export function InvoiceForm({ initialData }: InvoiceFormProps) {
  const router = useRouter()
  const [clients, setClients] = useState<Client[]>([])
  const [loadingClients, setLoadingClients] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: initialData || {
      userId: "",
      issueDate: new Date(),
      dueDate: null,
      totalAmount: 0,
      status: "draft",
    },
  })

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const res = await fetch("/api/users/clients")
        if (!res.ok) {
          throw new Error("Failed to fetch clients.")
        }
        const data = await res.json()
        setClients(data)
      } catch (err: any) {
        console.error("Error fetching clients:", err)
        setError(err.message || "Failed to load clients for selection.")
      } finally {
        setLoadingClients(false)
      }
    }
    fetchClients()
  }, [])

  const onSubmit = async (values: InvoiceFormValues) => {
    setIsSubmitting(true)
    setError(null)

    const payload = {
      ...values,
      issueDate: values.issueDate.toISOString().split("T")[0], // Format to YYYY-MM-DD
      dueDate: values.dueDate ? values.dueDate.toISOString().split("T")[0] : null,
    }

    try {
      const method = initialData?.id ? "PUT" : "POST"
      const url = initialData?.id ? `/api/invoices/${initialData.id}` : "/api/invoices"

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (res.ok) {
        router.push("/admin/invoices")
        router.refresh() // Revalidate data on the invoices list page
      } else {
        setError(data.message || `Failed to ${initialData?.id ? "update" : "create"} invoice.`)
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
      {initialData?.invoice_number && (
        <div className="space-y-2">
          <Label>Invoice Number</Label>
          <Input value={initialData.invoice_number} disabled />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="userId">Client</Label>
        <Select
          onValueChange={(value) => form.setValue("userId", value)}
          defaultValue={initialData?.userId}
          disabled={loadingClients || isSubmitting}
        >
          <SelectTrigger className={cn(form.formState.errors.userId && "border-red-500")}>
            <SelectValue placeholder="Select a client" />
          </SelectTrigger>
          <SelectContent>
            {loadingClients ? (
              <SelectItem value="loading" disabled>
                Loading clients...
              </SelectItem>
            ) : clients.length === 0 ? (
              <SelectItem value="no-clients" disabled>
                No clients available. Create one first.
              </SelectItem>
            ) : (
              clients.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.email}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
        {form.formState.errors.userId && <p className="text-sm text-red-500">{form.formState.errors.userId.message}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="issueDate">Issue Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !form.watch("issueDate") && "text-muted-foreground",
                  form.formState.errors.issueDate && "border-red-500",
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {form.watch("issueDate") ? format(form.watch("issueDate"), "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={form.watch("issueDate")}
                onSelect={(date) => form.setValue("issueDate", date!)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          {form.formState.errors.issueDate && (
            <p className="text-sm text-red-500">{form.formState.errors.issueDate.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="dueDate">Due Date (Optional)</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !form.watch("dueDate") && "text-muted-foreground",
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {form.watch("dueDate") ? format(form.watch("dueDate"), "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={form.watch("dueDate") || undefined}
                onSelect={(date) => form.setValue("dueDate", date || null)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="totalAmount">Total Amount</Label>
        <Input
          id="totalAmount"
          type="number"
          step="0.01"
          {...form.register("totalAmount", { valueAsNumber: true })}
          className={cn(form.formState.errors.totalAmount && "border-red-500")}
        />
        {form.formState.errors.totalAmount && (
          <p className="text-sm text-red-500">{form.formState.errors.totalAmount.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <Select
          onValueChange={(value) => form.setValue("status", value as InvoiceFormValues["status"])}
          defaultValue={initialData?.status}
          disabled={isSubmitting}
        >
          <SelectTrigger className={cn(form.formState.errors.status && "border-red-500")}>
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
          </SelectContent>
        </Select>
        {form.formState.errors.status && <p className="text-sm text-red-500">{form.formState.errors.status.message}</p>}
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Saving..." : initialData?.id ? "Update Invoice" : "Create Invoice"}
      </Button>
    </form>
  )
}
