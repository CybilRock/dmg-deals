"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { revalidatePath } from "next/cache"

export async function applyAsPartner(data: {
  name: string
  email: string
  phone: string
  role: string
}) {
  const admin = createAdminClient()

  const { error } = await admin.from("people").insert({
    name:   data.name.trim(),
    email:  data.email.trim().toLowerCase(),
    phone:  data.phone.trim() || null,
    role:   data.role,
    status: "pending",
  })

  if (error) throw new Error(error.message)
}

export async function approvePerson(formData: FormData) {
  const id = formData.get("id") as string
  const admin = createAdminClient()

  const { data: person } = await admin
    .from("people")
    .select("email")
    .eq("id", id)
    .single()

  if (!person?.email) throw new Error("Person has no email — add one before approving")

  await admin.from("people").update({ status: "approved" }).eq("id", id)

  const { error } = await admin.auth.admin.inviteUserByEmail(person.email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
  })

  if (error) throw new Error(error.message)

  revalidatePath("/dashboard")
}

export async function rejectPerson(formData: FormData) {
  const id = formData.get("id") as string
  const admin = createAdminClient()
  await admin.from("people").update({ status: "rejected" }).eq("id", id)
  revalidatePath("/dashboard")
}
