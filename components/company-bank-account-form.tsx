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

const companyBankAccountFormSchema = z.object({
  bankName: z.string().min(1, { message: "Bank name is required." }),
  accountName: z.string().min(1, { message: "Account name is required." }),
  accountNumber: z.string().min(1, { message: "Account number is required." }).max(255),
  currency: z.string().max(10).optional().nullable().or(z.literal("")),
  currentBalance: z.coerce.number().min(0, { message: "Balance cannot be negative." }).optional(),
  branchName: z.string().max(255).nullable().optional().or(z.literal("")),
  swiftCode: z.string().max(50).nullable().optional().or(z.literal("")),
  notes: z.string().nullable().optional().or(z.literal("")),
})

type CompanyBankAccountFormValues = z.infer<typeof companyBankAccountFormSchema>

interface CompanyBankAccountFormProps {
  initialData?: CompanyBankAccountFormValues & { id?: string }
}

export function CompanyBankAccountForm({ initialData }: CompanyBankAccountFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<CompanyBankAccountFormValues>({
    resolver: zodResolver(companyBankAccountFormSchema),
    defaultValues: {
      bankName: initialData?.bankName || "",
      accountName: initialData?.accountName || "",
      accountNumber: initialData?.accountNumber || "",
      currency: initialData?.currency || "KES",
      currentBalance: initialData?.currentBalance || 0.0,
      branchName: initialData?.branchName || "",
      swiftCode: initialData?.swiftCode || "",
      notes: initialData?.notes || "",
    },
  })

  const onSubmit = async (values: CompanyBankAccountFormValues) => {
    setIsSubmitting(true)
    setError(null)

    const payload = {
      ...values,
      currency: values.currency === "" ? "KES" : values.currency,
      currentBalance: values.currentBalance === undefined ? 0.0 : values.currentBalance,
      branchName: values.branchName === "" ? null : values.branchName,
      swiftCode: values.swiftCode === "" ? null : values.swiftCode,
      notes: values.notes === "" ? null : values.notes,
    }

    try {
      const method = initialData?.id ? "PUT" : "POST"
      const url = initialData?.id ? `/api/company-bank-accounts/${initialData.id}` : "/api/company-bank-accounts"

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (res.ok) {
        router.push("/admin/company-bank-accounts")
        router.refresh() // Revalidate data on the list page
      } else {
        setError(data.message || `Failed to ${initialData?.id ? "update" : "create"} bank account.`)
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
        <Label htmlFor="bankName">Bank Name</Label>
        <Input
          id="bankName"
          type="text"
          {...form.register("bankName")}
          className={cn(form.formState.errors.bankName && "border-red-500")}
        />
        {form.formState.errors.bankName && (
          <p className="text-sm text-red-500">{form.formState.errors.bankName.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="accountName">Account Name</Label>
        <Input
          id="accountName"
          type="text"
          {...form.register("accountName")}
          className={cn(form.formState.errors.accountName && "border-red-500")}
        />
        {form.formState.errors.accountName && (
          <p className="text-sm text-red-500">{form.formState.errors.accountName.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="accountNumber">Account Number</Label>
        <Input
          id="accountNumber"
          type="text"
          {...form.register("accountNumber")}
          className={cn(form.formState.errors.accountNumber && "border-red-500")}
        />
        {form.formState.errors.accountNumber && (
          <p className="text-sm text-red-500">{form.formState.errors.accountNumber.message}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="currency">Currency</Label>
          <Input
            id="currency"
            type="text"
            {...form.register("currency")}
            className={cn(form.formState.errors.currency && "border-red-500")}
          />
          {form.formState.errors.currency && (
            <p className="text-sm text-red-500">{form.formState.errors.currency.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="currentBalance">Current Balance</Label>
          <Input
            id="currentBalance"
            type="number"
            step="0.01"
            {...form.register("currentBalance", { valueAsNumber: true })}
            className={cn(form.formState.errors.currentBalance && "border-red-500")}
          />
          {form.formState.errors.currentBalance && (
            <p className="text-sm text-red-500">{form.formState.errors.currentBalance.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="branchName">Branch Name (Optional)</Label>
          <Input
            id="branchName"
            type="text"
            {...form.register("branchName")}
            className={cn(form.formState.errors.branchName && "border-red-500")}
          />
          {form.formState.errors.branchName && (
            <p className="text-sm text-red-500">{form.formState.errors.branchName.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="swiftCode">SWIFT Code (Optional)</Label>
          <Input
            id="swiftCode"
            type="text"
            {...form.register("swiftCode")}
            className={cn(form.formState.errors.swiftCode && "border-red-500")}
          />
          {form.formState.errors.swiftCode && (
            <p className="text-sm text-red-500">{form.formState.errors.swiftCode.message}</p>
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
        {isSubmitting ? "Saving..." : initialData?.id ? "Update Account" : "Add Account"}
      </Button>
    </form>
  )
}
