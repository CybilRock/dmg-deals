import { createAdminClient } from "@/lib/supabase/admin"
import { NextRequest, NextResponse } from "next/server"

const ALLOWED_ORIGIN = "https://holidaybrokers.co.za"

function cors(res: NextResponse) {
  res.headers.set("Access-Control-Allow-Origin", ALLOWED_ORIGIN)
  res.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS")
  res.headers.set("Access-Control-Allow-Headers", "Content-Type")
  return res
}

export async function OPTIONS() {
  return cors(new NextResponse(null, { status: 204 }))
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const { email, first_name } = body as { email?: string; first_name?: string }

  if (!email || typeof email !== "string" || !email.includes("@")) {
    return cors(NextResponse.json({ error: "Valid email required" }, { status: 400 }))
  }

  const supabase = createAdminClient()
  const name = first_name?.trim() || email

  const { error } = await supabase.from("leads").insert({
    name,
    email: email.trim().toLowerCase(),
    source_brand: "Holiday Brokers",
    source_channel: "calculator",
    status: "new",
  })

  if (error) {
    console.error("[calculator-lead]", error)
    return cors(NextResponse.json({ error: "Failed to save lead" }, { status: 500 }))
  }

  return cors(NextResponse.json({ success: true }))
}
