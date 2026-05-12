"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { redirect } from "next/navigation"

export async function addPerson(data: {
  name: string
  role: string
  email: string
  phone: string
}) {
  const supabase = createAdminClient()

  const { error } = await supabase.from("people").insert({
    name:  data.name.trim(),
    role:  data.role,
    email: data.email.trim() || null,
    phone: data.phone.trim() || null,
  })

  if (error) throw new Error(error.message)

  redirect("/people")
}
