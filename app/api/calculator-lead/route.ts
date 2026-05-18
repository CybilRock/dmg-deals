import { createAdminClient } from "@/lib/supabase/admin"
import { NextRequest, NextResponse } from "next/server"

const ALLOWED_ORIGINS = new Set([
  "https://holidaybrokers.co.za",
  "https://www.holidaybrokers.co.za",
])

// Vercel country-region code → consultant UUID (update when Sebastian is added to people table)
const REGION_MAP: Record<string, string> = {
  GP:  "4eaaaecf-cff5-4b04-b381-9eb195f977d7", // Gauteng → Cybil
  KZN: "8eb3c0eb-2ecb-4d6e-8e21-c98b6568b4a6", // KwaZulu-Natal → Clint
  // WC (Western Cape → Sebastian) — falls to round-robin until Sebastian is added to people table
}

function cors(res: NextResponse, origin: string | null) {
  const allowed = origin && ALLOWED_ORIGINS.has(origin) ? origin : "https://holidaybrokers.co.za"
  res.headers.set("Access-Control-Allow-Origin", allowed)
  res.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS")
  res.headers.set("Access-Control-Allow-Headers", "Content-Type")
  return res
}

export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get("origin")
  return cors(new NextResponse(null, { status: 204 }), origin)
}

export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin")
  const body = await req.json().catch(() => ({}))
  const { email, first_name } = body as { email?: string; first_name?: string }

  if (!email || typeof email !== "string" || !email.includes("@")) {
    return cors(NextResponse.json({ error: "Valid email required" }, { status: 400 }), origin)
  }

  const supabase = createAdminClient()
  const name   = first_name?.trim() || email
  const city   = req.headers.get("x-vercel-ip-city") ?? null
  const region = req.headers.get("x-vercel-ip-country-region") ?? null

  // Rate limit: one submission per email per hour
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
  const { count: recentCount, error: countError } = await supabase
    .from("leads")
    .select("*", { count: "exact", head: true })
    .eq("email", email.trim().toLowerCase())
    .gte("created_at", oneHourAgo)
  if (countError) {
    console.error("[calculator-lead] rate-limit check failed", countError)
    return cors(NextResponse.json({ error: "Service unavailable" }, { status: 503 }), origin)
  }
  if (recentCount && recentCount > 0) {
    return cors(NextResponse.json({ success: true }), origin)
  }

  let assignedTo: string | null = null

  const { data: consultants } = await supabase
    .from("people")
    .select("id, name")
    .in("role", ["consultant", "both"])
    .eq("active", true)

  if (consultants && consultants.length > 0) {
    // Geo-route by UUID — no fragile name matching
    if (region) {
      const targetId = REGION_MAP[region.toUpperCase()]
      if (targetId && consultants.find((c) => c.id === targetId)) {
        assignedTo = targetId
      }
    }

    // Round-robin fallback — single aggregated query instead of N queries
    if (!assignedTo) {
      const consultantIds = consultants.map((c) => c.id)
      const { data: counts } = await supabase
        .from("leads")
        .select("assigned_to, count:id.count()")
        .in("assigned_to", consultantIds)

      const countMap = Object.fromEntries(
        (counts ?? []).map((r: { assigned_to: string; count: number }) => [r.assigned_to, r.count])
      )
      const sorted = consultants
        .map((c) => ({ id: c.id, count: countMap[c.id] ?? 0 }))
        .sort((a, b) => a.count - b.count)
      assignedTo = sorted[0].id
    }
  }

  const { error } = await supabase.from("leads").insert({
    name,
    email:          email.trim().toLowerCase(),
    source_brand:   "Holiday Brokers",
    source_channel: "calculator",
    status:         "new",
    city,
    region,
    assigned_to:    assignedTo,
  })

  if (error) {
    console.error("[calculator-lead]", error)
    return cors(NextResponse.json({ error: "Failed to save lead" }, { status: 500 }), origin)
  }

  return cors(NextResponse.json({ success: true }), origin)
}
