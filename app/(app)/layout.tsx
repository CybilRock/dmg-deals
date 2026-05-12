import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Sidebar from "@/components/layout/Sidebar"

// Admin-only section: portal users are redirected to their own view
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const { data: person } = await supabase
    .from("people")
    .select("id")
    .eq("email", user.email)
    .maybeSingle()

  if (person) redirect("/portal")

  return (
    <div className="flex h-full">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden bg-[#f8fafc]">
        {children}
      </main>
    </div>
  )
}
