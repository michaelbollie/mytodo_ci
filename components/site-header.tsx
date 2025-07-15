"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { MenuIcon } from "lucide-react"
import { useRouter } from "next/navigation"

interface SiteHeaderProps {
  session: { userId: string; userRole: string } | null
  loading: boolean
}

export function SiteHeader({ session, loading }: SiteHeaderProps) {
  const router = useRouter()

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      })
      if (response.ok) {
        router.push("/login")
        router.refresh() // Refresh the page to update session state
      } else {
        console.error("Logout failed")
      }
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  if (loading) {
    return (
      <header className="sticky top-0 z-40 w-full border-b bg-background">
        <div className="container flex h-16 items-center justify-between px-4 md:px-6">
          <span className="text-lg font-semibold">AfricorexCrm</span>
          <div className="h-6 w-24 animate-pulse rounded bg-gray-200" />
        </div>
      </header>
    )
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="text-lg">AfricorexCrm</span>
        </Link>
        <nav className="hidden space-x-4 md:flex items-center">
          <Link href="/" className="text-sm font-medium hover:underline">
            Home
          </Link>
          <Link href="/services" className="text-sm font-medium hover:underline">
            Services
          </Link>
          <Link href="/contact" className="text-sm font-medium hover:underline">
            Contact
          </Link>
          {session ? (
            <>
              {session.userRole === "admin" ? (
                <Link href="/admin/dashboard" className="text-sm font-medium hover:underline">
                  Admin Dashboard
                </Link>
              ) : (
                <Link href="/client/dashboard" className="text-sm font-medium hover:underline">
                  Dashboard
                </Link>
              )}
              <Button onClick={handleLogout} variant="ghost" size="sm">
                Logout
              </Button>
            </>
          ) : (
            <Link href="/login" className="text-sm font-medium hover:underline">
              Login
            </Link>
          )}
        </nav>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="md:hidden bg-transparent">
              <MenuIcon className="h-6 w-6" />
              <span className="sr-only">Toggle navigation menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right">
            <div className="flex flex-col gap-4 py-6">
              <Link href="/" className="text-lg font-semibold">
                Home
              </Link>
              <Link href="/services" className="text-lg font-semibold">
                Services
              </Link>
              <Link href="/contact" className="text-lg font-semibold">
                Contact
              </Link>
              {session ? (
                <>
                  {session.userRole === "admin" ? (
                    <Link href="/admin/dashboard" className="text-lg font-semibold">
                      Admin Dashboard
                    </Link>
                  ) : (
                    <Link href="/client/dashboard" className="text-lg font-semibold">
                      Dashboard
                    </Link>
                  )}
                  <Button onClick={handleLogout} variant="ghost" className="w-full justify-start">
                    Logout
                  </Button>
                </>
              ) : (
                <Link href="/login" className="text-lg font-semibold">
                  Login
                </Link>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}
