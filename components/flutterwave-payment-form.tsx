"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

interface FlutterwavePaymentFormProps {
  invoiceId: string
  amount: number
  userEmail: string
  userName: string
  userPhoneNumber?: string
  onPaymentInitiated?: (success: boolean, message: string) => void
}

export function FlutterwavePaymentForm({
  invoiceId,
  amount,
  userEmail,
  userName,
  userPhoneNumber,
  onPaymentInitiated,
}: FlutterwavePaymentFormProps) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [isError, setIsError] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage("")
    setIsError(false)
    setLoading(true)

    if (!amount || amount <= 0 || !userEmail || !userName) {
      setMessage("Payment details (amount, email, name) are incomplete.")
      setIsError(true)
      setLoading(false)
      return
    }

    try {
      const response = await fetch("/api/payments/flutterwave/initiate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          invoiceId,
          amount,
          email: userEmail,
          name: userName,
          phoneNumber: userPhoneNumber,
        }),
      })

      const data = await response.json()

      if (response.ok && data.link) {
        setMessage(data.message || "Redirecting to Flutterwave for payment...")
        setIsError(false)
        onPaymentInitiated?.(true, data.message)
        router.push(data.link) // Redirect to Flutterwave payment page
      } else {
        setMessage(data.message || "Failed to initiate Flutterwave payment. Please try again.")
        setIsError(true)
        onPaymentInitiated?.(false, data.message)
      }
    } catch (err) {
      console.error("Network or server error:", err)
      setMessage("An unexpected error occurred. Please try again.")
      setIsError(true)
      onPaymentInitiated?.(false, "An unexpected error occurred.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pay with Flutterwave</CardTitle>
        <CardDescription>Click the button below to pay for this invoice using Flutterwave.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount to Pay</Label>
            <Input id="amount" type="number" value={amount.toFixed(2)} disabled />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Your Email</Label>
            <Input id="email" type="email" value={userEmail} disabled />
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Your Name</Label>
            <Input id="name" type="text" value={userName} disabled />
          </div>
          {userPhoneNumber && (
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Your Phone Number</Label>
              <Input id="phoneNumber" type="tel" value={userPhoneNumber} disabled />
            </div>
          )}
          {message && <p className={`text-sm ${isError ? "text-red-500" : "text-green-500"}`}>{message}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Redirecting...
              </>
            ) : (
              "Pay Now with Flutterwave"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
