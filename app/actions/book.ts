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

// Area → consultant UUID (update WC entry when Sebastian is added to people table)
const GEO_MAP: Record<string, string> = {
  "Gauteng North": "4eaaaecf-cff5-4b04-b381-9eb195f977d7", // Cybil
  "Gauteng South": "8eb3c0eb-2ecb-4d6e-8e21-c98b6568b4a6", // Clint
  "Western Cape":  "",                                       // Sebastian — add UUID when active
  "Other":         "4eaaaecf-cff5-4b04-b381-9eb195f977d7", // Cybil
}

export async function createBooking(data: {
  name: string
  phone: string
  email: string
  interest: string
  area: string
  referred_by: string
  appointment_at: string
}): Promise<{ error: string } | { success: true }> {
  if (!data.name.trim())  return { error: "Name is required." }
  if (!data.phone.trim()) return { error: "Phone number is required." }
  if (!data.appointment_at) return { error: "Please select a time slot." }

  const supabase = createAdminClient()

  const { data: consultants } = await supabase
    .from("people")
    .select("id, name")
    .in("role", ["consultant", "both"])
    .eq("active", true)

  let assignedTo: string | null = null

  if (consultants && consultants.length > 0) {
    // 1. Referral override — referred client always goes to the referring consultant
    if (data.referred_by) {
      const match = consultants.find((c) =>
        c.name.toLowerCase().includes(data.referred_by.toLowerCase())
      )
      if (match) assignedTo = match.id
    }

    // 2. Geo-routing — route by client area using UUID directly
    if (!assignedTo && data.area) {
      const targetId = GEO_MAP[data.area]
      if (targetId && consultants.find((c) => c.id === targetId)) {
        assignedTo = targetId
      }
    }

    // 3. Round-robin fallback — fewest current appointments
    if (!assignedTo) {
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
  }

  const noteParts = []
  if (data.interest)    noteParts.push(`Interest: ${data.interest}`)
  if (data.area)        noteParts.push(`Area: ${data.area}`)
  if (data.referred_by) noteParts.push(`Referred by: ${data.referred_by}`)

  const { error } = await supabase.from("leads").insert({
    name:           data.name.trim(),
    phone:          data.phone.trim(),
    email:          data.email.trim() || null,
    source_brand:   "Holiday Brokers",
    source_channel: "calculator",
    status:         "appointment",
    appointment_at: data.appointment_at,
    assigned_to:    assignedTo,
    notes:          noteParts.length > 0 ? noteParts.join(" | ") : null,
  })

  if (error) {
    console.error("[createBooking]", error)
    return { error: error.message }
  }

  return { success: true }
}
