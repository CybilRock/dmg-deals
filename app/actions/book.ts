"use server"

import { createAdminClient } from "@/lib/supabase/admin"

export async function getBookedSlots(date: string): Promise<string[]> {
  const supabase = createAdminClient()

  // Query SAST day boundaries (UTC+2)
  const dayStart = new Date(`${date}T00:00:00+02:00`).toISOString()
  const dayEnd   = new Date(`${date}T23:59:59+02:00`).toISOString()

  const { data } = await supabase
    .from("leads")
    .select("appointment_at")
    .eq("status", "appointment")
    .gte("appointment_at", dayStart)
    .lte("appointment_at", dayEnd)
    .not("appointment_at", "is", null)

  return (data ?? []).map((r) => r.appointment_at as string)
}

export async function createBooking(data: {
  name: string
  phone: string
  email: string
  interest: string
  appointment_at: string
}): Promise<{ error: string } | { success: true }> {
  if (!data.name.trim())  return { error: "Name is required." }
  if (!data.phone.trim()) return { error: "Phone number is required." }
  if (!data.appointment_at) return { error: "Please select a time slot." }

  const supabase = createAdminClient()

  // Round-robin: assign to active consultant with fewest current appointments
  const { data: consultants } = await supabase
    .from("people")
    .select("id")
    .in("role", ["consultant", "both"])
    .eq("active", true)

  let assignedTo: string | null = null

  if (consultants && consultants.length > 0) {
    const counts = await Promise.all(
      consultants.map(async (c) => {
        const { count } = await supabase
          .from("leads")
          .select("*", { count: "exact", head: true })
          .eq("assigned_to", c.id)
          .eq("status", "appointment")
        return { id: c.id, count: count ?? 0 }
      })
    )
    counts.sort((a, b) => a.count - b.count)
    assignedTo = counts[0].id
  }

  const { error } = await supabase.from("leads").insert({
    name:           data.name.trim(),
    phone:          data.phone.trim(),
    email:          data.email.trim() || null,
    source_brand:   "Holiday Brokers",
    source_channel: "calculator",
    status:         "appointment",
    appointment_at: data.appointment_at,
    assigned_to:    assignedTo,
    notes:          data.interest ? `Interest: ${data.interest}` : null,
  })

  if (error) {
    console.error("[createBooking]", error)
    return { error: error.message }
  }

  return { success: true }
}
