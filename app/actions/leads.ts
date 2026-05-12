"use server"

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export async function addLead(data: {
  name: string
  phone: string
  email: string
  source_brand: string
  source_channel: string
  assigned_to: string
  notes: string
}) {
  const supabase = await createClient()

  const { error } = await supabase.from("leads").insert({
    name:           data.name.trim(),
    phone:          data.phone.trim() || null,
    email:          data.email.trim() || null,
    source_brand:   data.source_brand || null,
    source_channel: data.source_channel || null,
    assigned_to:    data.assigned_to || null,
    notes:          data.notes.trim() || null,
    status:         "new",
  })

  if (error) throw new Error(error.message)

  redirect("/leads")
}
