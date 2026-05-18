import { createAdminClient } from "@/lib/supabase/admin"
import { NextRequest, NextResponse } from "next/server"

const ALLOWED_ORIGINS = new Set([
  "https://holidaybrokers.co.za",
  "https://www.holidaybrokers.co.za",
])

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
  const name = first_name?.trim() || email

  const city   = req.headers.get("x-vercel-ip-city") ?? null
  const region = req.headers.get("x-vercel-ip-country-region") ?? null

  const { error } = await supabase.from("leads").insert({
    name,
    email: email.trim().toLowerCase(),
    source_brand: "Holiday Brokers",
    source_channel: "calculator",
    status: "new",
    city,
    region,
  })

  if (error) {
    console.error("[calculator-lead]", error)
    return cors(NextResponse.json({ error: "Failed to save lead" }, { status: 500 }), origin)
  }

  return cors(NextResponse.json({ success: true }), origin)
}
