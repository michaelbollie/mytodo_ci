import { getUserSession } from "@/lib/session"
import { SiteHeader } from "./site-header"

export async function HeaderWrapper() {
  const session = await getUserSession()
  // We can set loading to false here as the session fetch is complete on the server
  return <SiteHeader session={session} loading={false} />
}
