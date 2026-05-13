"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { redirect } from "next/navigation"

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/login")
}

export async function sendPortalInvite(personId: string): Promise<{ error: string } | void> {
  const admin = createAdminClient()

  const { data: person, error } = await admin
    .from("people")
    .select("email, name")
    .eq("id", personId)
    .single()

  if (error || !person) return { error: "Person not found." }
  if (!person.email) return { error: "No email address on record. Add an email first." }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"

  // If user already exists in auth but has never logged in, delete and re-invite
  // so they always receive the branded invite email (not a "Reset Password" email)
  const { data: existingUsers } = await admin.auth.admin.listUsers()
  const existingUser = existingUsers?.users.find((u) => u.email === person.email)

  if (existingUser && !existingUser.last_sign_in_at) {
    await admin.auth.admin.deleteUser(existingUser.id)
  }

  const { error: inviteError } = await admin.auth.admin.inviteUserByEmail(person.email, {
    redirectTo: `${appUrl}/auth/callback?next=/set-password`,
    data: { name: person.name },
  })
  if (inviteError) return { error: inviteError.message }

  redirect(`/people/${personId}?invited=true`)
}
