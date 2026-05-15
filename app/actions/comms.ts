"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { revalidatePath } from "next/cache"

export async function addCommsEntry(data: {
  person_id: string
  type: string
  direction: string | null
  summary: string
  logged_by: string
}): Promise<{ error: string } | void> {
  if (!data.summary.trim()) return { error: "Summary is required." }

  const supabase = createAdminClient()

  const { error } = await supabase.from("comms_log").insert({
    person_id:  data.person_id,
    type:       data.type,
    direction:  data.direction || null,
    summary:    data.summary.trim(),
    logged_by:  data.logged_by.trim() || null,
  })

  if (error) {
    console.error("[addCommsEntry]", error)
    return { error: error.message }
  }

  revalidatePath(`/people/${data.person_id}`)
}

export async function deleteCommsEntry(
  entryId: string,
  personId: string
): Promise<{ error: string } | void> {
  const supabase = createAdminClient()

  const { error } = await supabase.from("comms_log").delete().eq("id", entryId)

  if (error) {
    console.error("[deleteCommsEntry]", error)
    return { error: error.message }
  }

  revalidatePath(`/people/${personId}`)
}
