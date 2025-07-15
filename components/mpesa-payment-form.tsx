"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

interface MpesaPaymentFormProps {
  invoiceId: string
  amount: number
  onPaymentInitiated?: (success: boolean, message: string) => void
}

export function MpesaPaymentForm({ invoiceId, amount, onPaymentInitiated }: MpesaPaymentFormProps) {
  const [phoneNumber, setPhoneNumber] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [isError, setIsError] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage("")
    setIsError(false)
    setLoading(true)

    if (!phoneNumber || !amount || amount <= 0) {
      setMessage("Please enter a valid phone number and amount.")
      setIsError(true)
      setLoading(false)
      return
    }

    try {
      const response = await fetch("/api/payments/mpesa/stk-push", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phoneNumber, amount, invoiceId }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage(data.message || "Payment request sent to your phone. Please complete the transaction.")
        setIsError(false)
        setPhoneNumber("") // Clear phone number after successful initiation
        onPaymentInitiated?.(true, data.message)
      } else {
        setMessage(data.message || "Failed to initiate M-Pesa payment. Please try again.")
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
        <CardTitle>Pay with M-Pesa</CardTitle>
        <CardDescription>Enter your M-Pesa phone number to pay for this invoice.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phoneNumber">M-Pesa Phone Number (e.g., 2547XXXXXXXX)</Label>
            <Input
              id="phoneNumber"
              type="tel"
              placeholder="2547XXXXXXXX"
              required
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="amount">Amount to Pay</Label>
            <Input id="amount" type="number" value={amount.toFixed(2)} disabled />
          </div>
          {message && <p className={`text-sm ${isError ? "text-red-500" : "text-green-500"}`}>{message}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Initiating Payment...
              </>
            ) : (
              "Pay Now"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
