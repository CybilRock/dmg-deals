"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { redirect } from "next/navigation"

export async function addPerson(data: {
  name: string
  role: string
  email: string
  phone: string
}): Promise<{ error: string } | void> {
  const supabase = createAdminClient()

  const { error } = await supabase.from("people").insert({
    name:  data.name.trim(),
    role:  data.role,
    email: data.email.trim() || null,
    phone: data.phone.trim() || null,
  })

  if (error) {
    console.error("[addPerson] Supabase insert error:", error)
    return { error: error.message }
  }

  redirect("/people")
}

export async function updatePerson(
  id: string,
  data: { name: string; role: string; email: string; phone: string; active: boolean }
): Promise<{ error: string } | void> {
  const supabase = createAdminClient()

  const { error } = await supabase.from("people").update({
    name:   data.name.trim(),
    role:   data.role,
    email:  data.email.trim() || null,
    phone:  data.phone.trim() || null,
    active: data.active,
  }).eq("id", id)

  if (error) {
    console.error("[updatePerson] Supabase update error:", error)
    return { error: error.message }
  }

  redirect(`/people/${id}`)
}
