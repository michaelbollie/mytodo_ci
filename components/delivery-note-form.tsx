"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { CalendarIcon, PlusIcon, TrashIcon } from "lucide-react"
import { cn } from "@/lib/utils"

const deliveryNoteItemSchema = z.object({
  description: z.string().min(1, { message: "Description is required." }),
  quantity: z.coerce.number().min(0.01, { message: "Quantity must be greater than 0." }),
  unitPrice: z.coerce.number().min(0, { message: "Unit price cannot be negative." }),
})

const deliveryNoteFormSchema = z.object({
  invoiceId: z.string().uuid({ message: "Invalid invoice selected." }).nullable().optional().or(z.literal("")),
  issueDate: z.date({ required_error: "Issue date is required." }),
  recipientName: z.string().min(1, { message: "Recipient name is required." }),
  recipientAddress: z.string().min(1, { message: "Recipient address is required." }),
  status: z.enum(["pending", "delivered", "returned"], { required_error: "Status is required." }),
  notes: z.string().nullable().optional().or(z.literal("")),
  items: z.array(deliveryNoteItemSchema).min(1, { message: "At least one item is required." }),
})

type DeliveryNoteFormValues = z.infer<typeof deliveryNoteFormSchema>

interface DeliveryNoteFormProps {
  initialData?: DeliveryNoteFormValues & { id?: string; delivery_note_number?: string }
}

interface InvoiceForDeliveryNote {
  id: string
  invoice_number: string
  total_amount: number
  client_email: string
}

export function DeliveryNoteForm({ initialData }: DeliveryNoteFormProps) {
  const router = useRouter()
  const [invoices, setInvoices] = useState<InvoiceForDeliveryNote[]>([])
  const [loadingInvoices, setLoadingInvoices] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<DeliveryNoteFormValues>({
    resolver: zodResolver(deliveryNoteFormSchema),
    defaultValues: {
      invoiceId: initialData?.invoiceId || "none", // Updated default value to be a non-empty string
      issueDate: initialData?.issueDate || new Date(),
      recipientName: initialData?.recipientName || "",
      recipientAddress: initialData?.recipientAddress || "",
      status: initialData?.status || "pending",
      notes: initialData?.notes || "",
      items:
        initialData?.items && initialData.items.length > 0
          ? initialData.items
          : [{ description: "", quantity: 1, unitPrice: 0 }],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  })

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const res = await fetch("/api/invoices/for-delivery-notes")
        if (!res.ok) {
          throw new Error("Failed to fetch invoices.")
        }
        const data = await res.json()
        setInvoices(data)
      } catch (err: any) {
        console.error("Error fetching invoices:", err)
        setError(err.message || "Failed to load invoices for selection.")
      } finally {
        setLoadingInvoices(false)
      }
    }
    fetchInvoices()
  }, [])

  const onSubmit = async (values: DeliveryNoteFormValues) => {
    setIsSubmitting(true)
    setError(null)

    const payload = {
      ...values,
      invoiceId: values.invoiceId === "none" ? null : values.invoiceId, // Updated condition to handle "none" value
      issueDate: values.issueDate.toISOString().split("T")[0], // Format to YYYY-MM-DD
      notes: values.notes === "" ? null : values.notes,
    }

    try {
      const method = initialData?.id ? "PUT" : "POST"
      const url = initialData?.id ? `/api/delivery-notes/${initialData.id}` : "/api/delivery-notes"

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (res.ok) {
        router.push("/admin/delivery-notes")
        router.refresh() // Revalidate data on the list page
      } else {
        setError(data.message || `Failed to ${initialData?.id ? "update" : "create"} delivery note.`)
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
      {initialData?.delivery_note_number && (
        <div className="space-y-2">
          <Label>Delivery Note Number</Label>
          <Input value={initialData.delivery_note_number} disabled />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="invoiceId">Associated Invoice (Optional)</Label>
        <Select
          onValueChange={(value) => form.setValue("invoiceId", value)}
          defaultValue={initialData?.invoiceId || "none"} // Updated default value to be a non-empty string
          disabled={loadingInvoices || isSubmitting}
        >
          <SelectTrigger className={cn(form.formState.errors.invoiceId && "border-red-500")}>
            <SelectValue placeholder="Select an invoice" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No Invoice</SelectItem> {/* Updated value prop to be a non-empty string */}
            {loadingInvoices ? (
              <SelectItem value="loading" disabled>
                Loading invoices...
              </SelectItem>
            ) : invoices.length === 0 ? (
              <SelectItem value="no-invoices" disabled>
                No invoices available.
              </SelectItem>
            ) : (
              invoices.map((invoice) => (
                <SelectItem key={invoice.id} value={invoice.id}>
                  {invoice.invoice_number} (Client: {invoice.client_email})
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
        {form.formState.errors.invoiceId && (
          <p className="text-sm text-red-500">{form.formState.errors.invoiceId.message}</p>
        )}
      </div>

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
        <Label htmlFor="recipientName">Recipient Name</Label>
        <Input
          id="recipientName"
          type="text"
          {...form.register("recipientName")}
          className={cn(form.formState.errors.recipientName && "border-red-500")}
        />
        {form.formState.errors.recipientName && (
          <p className="text-sm text-red-500">{form.formState.errors.recipientName.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="recipientAddress">Recipient Address</Label>
        <Textarea
          id="recipientAddress"
          {...form.register("recipientAddress")}
          className={cn(form.formState.errors.recipientAddress && "border-red-500")}
        />
        {form.formState.errors.recipientAddress && (
          <p className="text-sm text-red-500">{form.formState.errors.recipientAddress.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <Select
          onValueChange={(value) => form.setValue("status", value as DeliveryNoteFormValues["status"])}
          defaultValue={initialData?.status}
          disabled={isSubmitting}
        >
          <SelectTrigger className={cn(form.formState.errors.status && "border-red-500")}>
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="returned">Returned</SelectItem>
          </SelectContent>
        </Select>
        {form.formState.errors.status && <p className="text-sm text-red-500">{form.formState.errors.status.message}</p>}
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

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Items</h3>
        {fields.map((field, index) => (
          <div key={field.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 border p-4 rounded-md relative">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor={`items.${index}.description`}>Description</Label>
              <Input
                id={`items.${index}.description`}
                type="text"
                {...form.register(`items.${index}.description`)}
                className={cn(form.formState.errors.items?.[index]?.description && "border-red-500")}
              />
              {form.formState.errors.items?.[index]?.description && (
                <p className="text-sm text-red-500">{form.formState.errors.items[index]?.description?.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor={`items.${index}.quantity`}>Quantity</Label>
              <Input
                id={`items.${index}.quantity`}
                type="number"
                step="0.01"
                {...form.register(`items.${index}.quantity`, { valueAsNumber: true })}
                className={cn(form.formState.errors.items?.[index]?.quantity && "border-red-500")}
              />
              {form.formState.errors.items?.[index]?.quantity && (
                <p className="text-sm text-red-500">{form.formState.errors.items[index]?.quantity?.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor={`items.${index}.unitPrice`}>Unit Price</Label>
              <Input
                id={`items.${index}.unitPrice`}
                type="number"
                step="0.01"
                {...form.register(`items.${index}.unitPrice`, { valueAsNumber: true })}
                className={cn(form.formState.errors.items?.[index]?.unitPrice && "border-red-500")}
              />
              {form.formState.errors.items?.[index]?.unitPrice && (
                <p className="text-sm text-red-500">{form.formState.errors.items[index]?.unitPrice?.message}</p>
              )}
            </div>
            {fields.length > 1 && (
              <Button
                type="button"
                variant="destructive"
                size="icon"
                onClick={() => remove(index)}
                className="absolute top-2 right-2"
              >
                <TrashIcon className="h-4 w-4" />
                <span className="sr-only">Remove item</span>
              </Button>
            )}
          </div>
        ))}
        {form.formState.errors.items && <p className="text-sm text-red-500">{form.formState.errors.items.message}</p>}
        <Button type="button" variant="outline" onClick={() => append({ description: "", quantity: 1, unitPrice: 0 })}>
          <PlusIcon className="mr-2 h-4 w-4" /> Add Item
        </Button>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Saving..." : initialData?.id ? "Update Delivery Note" : "Create Delivery Note"}
      </Button>
    </form>
  )
}
