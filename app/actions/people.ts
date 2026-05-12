"use server"

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export async function addPerson(data: {
  name: string
  role: string
  email: string
  phone: string
}) {
  const supabase = await createClient()

  const { error } = await supabase.from("people").insert({
    name:  data.name.trim(),
    role:  data.role,
    email: data.email.trim() || null,
    phone: data.phone.trim() || null,
  })

  if (error) throw new Error(error.message)

  redirect("/people")
}
