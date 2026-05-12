"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { redirect } from "next/navigation"

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/login")
}

export async function sendPortalInvite(personId: string) {
  const admin = createAdminClient()

  const { data: person, error } = await admin
    .from("people")
    .select("email, name")
    .eq("id", personId)
    .single()

  if (error || !person) throw new Error("Person not found.")
  if (!person.email) throw new Error("No email address on record. Add an email first.")

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"

  const { error: inviteError } = await admin.auth.admin.inviteUserByEmail(person.email, {
    redirectTo: `${appUrl}/auth/callback`,
  })

  if (inviteError) throw new Error(inviteError.message)

  redirect(`/people/${personId}?invited=true`)
}
