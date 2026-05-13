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
    const { error: magicError } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email: person.email,
      options: { redirectTo: `${appUrl}/auth/callback` },
    })
    if (magicError) return { error: magicError.message }
  } else {
    const { error: inviteError } = await admin.auth.admin.inviteUserByEmail(person.email, {
      redirectTo: `${appUrl}/auth/callback`,
    })
    if (inviteError) return { error: inviteError.message }
  }

  redirect(`/people/${personId}?invited=true`)
}
