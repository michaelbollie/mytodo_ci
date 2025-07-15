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

const receiptFormSchema = z.object({
  invoiceId: z.string().uuid({ message: "Invalid invoice selected." }),
  paymentDate: z.date({ required_error: "Payment date is required." }),
  amountPaid: z.coerce.number().min(0.01, { message: "Amount paid must be greater than 0." }),
  paymentMethod: z.string().max(100).optional().nullable(),
})

type ReceiptFormValues = z.infer<typeof receiptFormSchema>

interface ReceiptFormProps {
  initialData?: ReceiptFormValues & { id?: string; receipt_number?: string }
}

interface InvoiceForReceipt {
  id: string
  invoice_number: string
  total_amount: number
  user_id: string
}

export function ReceiptForm({ initialData }: ReceiptFormProps) {
  const router = useRouter()
  const [invoices, setInvoices] = useState<InvoiceForReceipt[]>([])
  const [loadingInvoices, setLoadingInvoices] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<ReceiptFormValues>({
    resolver: zodResolver(receiptFormSchema),
    defaultValues: initialData || {
      invoiceId: "",
      paymentDate: new Date(),
      amountPaid: 0,
      paymentMethod: "",
    },
  })

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const res = await fetch("/api/invoices/for-receipts")
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

  const onSubmit = async (values: ReceiptFormValues) => {
    setIsSubmitting(true)
    setError(null)

    const payload = {
      ...values,
      paymentDate: values.paymentDate.toISOString(), // Send as ISO string
    }

    try {
      const method = initialData?.id ? "PUT" : "POST"
      const url = initialData?.id ? `/api/receipts/${initialData.id}` : "/api/receipts"

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (res.ok) {
        router.push("/admin/receipts")
        router.refresh() // Revalidate data on the receipts list page
      } else {
        setError(data.message || `Failed to ${initialData?.id ? "update" : "create"} receipt.`)
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
      {initialData?.receipt_number && (
        <div className="space-y-2">
          <Label>Receipt Number</Label>
          <Input value={initialData.receipt_number} disabled />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="invoiceId">Invoice</Label>
        <Select
          onValueChange={(value) => form.setValue("invoiceId", value)}
          defaultValue={initialData?.invoiceId}
          disabled={loadingInvoices || isSubmitting}
        >
          <SelectTrigger className={cn(form.formState.errors.invoiceId && "border-red-500")}>
            <SelectValue placeholder="Select an invoice" />
          </SelectTrigger>
          <SelectContent>
            {loadingInvoices ? (
              <SelectItem value="loading" disabled>
                Loading invoices...
              </SelectItem>
            ) : invoices.length === 0 ? (
              <SelectItem value="no-invoices" disabled>
                No invoices available. Create one first.
              </SelectItem>
            ) : (
              invoices.map((invoice) => (
                <SelectItem key={invoice.id} value={invoice.id}>
                  {invoice.invoice_number} (Total: ${invoice.total_amount.toFixed(2)})
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
        <Label htmlFor="paymentDate">Payment Date</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "w-full justify-start text-left font-normal",
                !form.watch("paymentDate") && "text-muted-foreground",
                form.formState.errors.paymentDate && "border-red-500",
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {form.watch("paymentDate") ? format(form.watch("paymentDate"), "PPP") : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={form.watch("paymentDate")}
              onSelect={(date) => form.setValue("paymentDate", date!)}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        {form.formState.errors.paymentDate && (
          <p className="text-sm text-red-500">{form.formState.errors.paymentDate.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="amountPaid">Amount Paid</Label>
        <Input
          id="amountPaid"
          type="number"
          step="0.01"
          {...form.register("amountPaid", { valueAsNumber: true })}
          className={cn(form.formState.errors.amountPaid && "border-red-500")}
        />
        {form.formState.errors.amountPaid && (
          <p className="text-sm text-red-500">{form.formState.errors.amountPaid.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="paymentMethod">Payment Method (e.g., M-Pesa, Card)</Label>
        <Input
          id="paymentMethod"
          type="text"
          {...form.register("paymentMethod")}
          className={cn(form.formState.errors.paymentMethod && "border-red-500")}
        />
        {form.formState.errors.paymentMethod && (
          <p className="text-sm text-red-500">{form.formState.errors.paymentMethod.message}</p>
        )}
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Saving..." : initialData?.id ? "Update Receipt" : "Create Receipt"}
      </Button>
    </form>
  )
}
