"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

interface FlutterwavePaymentFormProps {
  invoiceId: string
  amount: number
  clientEmail: string
  clientName: string
  flutterwavePublicKey: string // Now received as a prop
}

export function FlutterwavePaymentForm({
  invoiceId,
  amount,
  clientEmail,
  clientName,
  flutterwavePublicKey,
}: FlutterwavePaymentFormProps) {
  const [phoneNumber, setPhoneNumber] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const handlePayment = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/payments/flutterwave/initiate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          invoiceId,
          amount,
          email: clientEmail,
          name: clientName,
          phoneNumber,
        }),
      })

      const data = await response.json()

      if (response.ok && data.link) {
        toast({
          title: "Payment Initiated",
          description: "Redirecting to Flutterwave to complete your payment...",
        })
        window.location.href = data.link // Redirect to Flutterwave payment page
      } else {
        toast({
          title: "Payment Failed",
          description: data.message || "Could not initiate Flutterwave payment.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error initiating Flutterwave payment:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Pay KES {amount.toLocaleString()} for Invoice #{invoiceId} via Flutterwave.
      </p>
      <div className="grid gap-2">
        <Label htmlFor="phoneNumber">Phone Number (Optional)</Label>
        <Input
          id="phoneNumber"
          type="tel"
          placeholder="e.g., +254712345678"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
        />
      </div>
      <Button onClick={handlePayment} disabled={isLoading || !flutterwavePublicKey} className="w-full">
        {isLoading ? "Processing..." : "Pay with Flutterwave"}
      </Button>
      {!flutterwavePublicKey && (
        <p className="text-sm text-red-500">Flutterwave payment is currently unavailable. Please try again later.</p>
      )}
    </div>
  )
}
