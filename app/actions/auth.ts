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

  // If user already exists in auth, generate a magic link instead of an invite
  const { data: existingUsers } = await admin.auth.admin.listUsers()
  const alreadyExists = existingUsers?.users.some((u) => u.email === person.email)

  if (alreadyExists) {
    // generateLink doesn't send email — use resetPasswordForEmail which does
    const anonClient = await createClient()
    const { error: resetError } = await anonClient.auth.resetPasswordForEmail(person.email, {
      redirectTo: `${appUrl}/auth/callback?intent=invite`,
    })
    if (resetError) return { error: resetError.message }
  } else {
    const { error: inviteError } = await admin.auth.admin.inviteUserByEmail(person.email, {
      redirectTo: `${appUrl}/auth/callback?intent=invite`,
    })
    if (inviteError) return { error: inviteError.message }
  }

  redirect(`/people/${personId}?invited=true`)
}
