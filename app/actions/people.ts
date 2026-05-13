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
