import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

// Root: dispatch to admin dashboard or consultant portal based on role
export default async function Root() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  // Check if this user has a people record (= consultant or booker)
  const { data: person } = await supabase
    .from("people")
    .select("id, status")
    .eq("email", user.email)
    .maybeSingle()

  if (person) redirect("/portal")
  redirect("/dashboard")
}
