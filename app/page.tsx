import { HeaderWrapper } from "@/components/header-wrapper"
import Image from "next/image"
import Link from "next/link"
import { getUserSession } from "@/lib/session"
import { sql } from "@/lib/db"

export default async function HomePage() {
  const session = await getUserSession()
  let homepageContent: Record<string, any> = {}
  try {
    const contentArray =
      await sql`SELECT page_name, section_name, content_html, image_url FROM page_content WHERE page_name = 'homepage'`
    contentArray.forEach((item: any) => {
      homepageContent[item.section_name] = item.content_html || item.image_url
    })
  } catch (err) {
    console.error("Error fetching homepage content:", err)
    // Fallback to default content if there's an error
    homepageContent = {
      hero_title: "Your All-in-One CRM Solution",
      hero_description:
        "Manage quotes, invoices, receipts, and client communications seamlessly. Empower your business with AfricorexCrm.",
      service_quote_invoice_title: "Quote & Invoice Management",
      service_quote_invoice_description: "Create, send, and track professional quotes and invoices with ease.",
      service_client_comm_title: "Client Communication",
      service_client_comm_description: "Keep all client interactions organized and accessible in one place.",
      service_website_editor_title: "Website Content Editor",
      service_website_editor_description: "Update your homepage content directly from your admin dashboard.",
      hero_image: "/placeholder.svg?height=400&width=600",
    }
  }
  return (
    <div className="flex min-h-screen flex-col">
      <HeaderWrapper /> {/* Use the new HeaderWrapper */}
      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                    {homepageContent.hero_title || "Your All-in-One CRM Solution"}
                    {session?.userRole === "admin" && (
                      <Link href="/admin/website-editor" className="ml-2 text-sm text-blue-500 hover:underline">
                        Edit
                      </Link>
                    )}
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl">
                    {homepageContent.hero_description ||
                      "Manage quotes, invoices, receipts, and client communications seamlessly. Empower your business with AfricorexCrm."}
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Link
                    href="/signup"
                    className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                    prefetch={false}
                  >
                    Get Started
                  </Link>
                  <Link
                    href="/services"
                    className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-8 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                    prefetch={false}
                  >
                    Learn More
                  </Link>
                </div>
              </div>
              <Image
                src={homepageContent.hero_image || "/placeholder.svg?height=400&width=600"}
                width="600"
                height="400"
                alt="Hero"
                className="mx-auto aspect-video overflow-hidden rounded-xl object-cover sm:w-full lg:order-last lg:aspect-square"
              />
            </div>
          </div>
        </section>

        {/* Services Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-muted">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Our Core Services</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  From managing your finances to streamlining client communication, we&apos;ve got you covered.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-start gap-6 py-12 lg:grid-cols-3 lg:gap-12">
              <div className="grid gap-1">
                <h3 className="text-xl font-bold">
                  {homepageContent.service_quote_invoice_title || "Quote & Invoice Management"}
                </h3>
                <p className="text-muted-foreground">
                  {homepageContent.service_quote_invoice_description ||
                    "Create, send, and track professional quotes and invoices with ease."}
                </p>
              </div>
              <div className="grid gap-1">
                <h3 className="text-xl font-bold">
                  {homepageContent.service_client_comm_title || "Client Communication"}
                </h3>
                <p className="text-muted-foreground">
                  {homepageContent.service_client_comm_description ||
                    "Keep all client interactions organized and accessible in one place."}
                </p>
              </div>
              <div className="grid gap-1">
                <h3 className="text-xl font-bold">
                  {homepageContent.service_website_editor_title || "Website Content Editor"}
                </h3>
                <p className="text-muted-foreground">
                  {homepageContent.service_website_editor_description ||
                    "Update your homepage content directly from your admin dashboard."}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Section Placeholder */}
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container grid items-center gap-6 px-4 md:px-6 lg:grid-cols-2 lg:gap-10">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight">
                Ready to Transform Your Business?
              </h2>
              <p className="max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Contact us today to learn how AfricorexCrm can help you grow.
              </p>
            </div>
            <div className="flex flex-col gap-2 min-[400px]:flex-row lg:justify-end">
              <Link
                href="/contact"
                className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                prefetch={false}
              >
                Contact Sales
              </Link>
            </div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-muted-foreground">&copy; 2024 AfricorexCrm. All rights reserved.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link href="#" className="text-xs hover:underline underline-offset-4" prefetch={false}>
            Terms of Service
          </Link>
          <Link href="#" className="text-xs hover:underline underline-offset-4" prefetch={false}>
            Privacy
          </Link>
        </nav>
      </footer>
    </div>
  )
}
