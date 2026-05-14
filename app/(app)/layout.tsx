import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { redirect } from "next/navigation"
import LayoutShell from "@/components/layout/LayoutShell"

// Admin-only section: any person record = staff, redirect to portal
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  // Use admin client so RLS never blocks the lookup — if this user has a people
  // record they are staff and must be sent to /portal regardless of RLS policies
  const admin = createAdminClient()
  const { data: person } = await admin
    .from("people")
    .select("id")
    .eq("email", user.email)
    .maybeSingle()

  // Any person record = staff (consultant/booker) → portal only; no people record = admin
  if (person) redirect("/portal")

  return <LayoutShell>{children}</LayoutShell>
}
