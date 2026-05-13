import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import LayoutShell from "@/components/layout/LayoutShell"

// Admin-only section: any person record = staff, redirect to portal
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const { data: person } = await supabase
    .from("people")
    .select("id")
    .eq("email", user.email)
    .maybeSingle()

  // Any person record = staff (consultant/booker) → portal only; no people record = admin
  if (person) redirect("/portal")

  return <LayoutShell>{children}</LayoutShell>
}
