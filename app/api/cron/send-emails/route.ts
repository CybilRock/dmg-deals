import { createAdminClient } from "@/lib/supabase/admin"
import { resend, FROM_EMAIL } from "@/lib/email/resend"
import { EMAIL_TEMPLATES, AGENT_EMAIL_TEMPLATES } from "@/lib/email/templates"
import { timingSafeEqual } from "crypto"
import { NextRequest, NextResponse } from "next/server"

const TEMPLATE_MAP = {
  consumer: EMAIL_TEMPLATES,
  agent:    AGENT_EMAIL_TEMPLATES,
} as const

type SequenceType = keyof typeof TEMPLATE_MAP

if (!process.env.CRON_SECRET) {
  throw new Error("CRON_SECRET is not set")
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function isAuthorized(req: NextRequest): boolean {
  const auth     = req.headers.get("authorization") ?? ""
  const expected = `Bearer ${process.env.CRON_SECRET ?? ""}`
  if (auth.length !== expected.length) return false
  return timingSafeEqual(Buffer.from(auth), Buffer.from(expected))
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = createAdminClient()

  // Fetch all pending emails due now
  const { data: due, error: fetchError } = await supabase
    .from("email_queue")
    .select("id, lead_id, email_number, sequence_type")
    .eq("status", "pending")
    .lte("scheduled_at", new Date().toISOString())
    .limit(50)

  if (fetchError) {
    console.error("[send-emails] fetch failed", fetchError)
    return NextResponse.json({ error: "Failed to fetch queue" }, { status: 500 })
  }

  if (!due || due.length === 0) {
    return NextResponse.json({ sent: 0 })
  }

  // Fetch lead details for all due emails in one query
  const leadIds = [...new Set(due.map((r) => r.lead_id))]
  const { data: leads } = await supabase
    .from("leads")
    .select("id, name, email")
    .in("id", leadIds)

  const leadMap = Object.fromEntries((leads ?? []).map((l) => [l.id, l]))

  let sent = 0
  for (const row of due) {
    const lead = leadMap[row.lead_id]
    if (!lead?.email || !EMAIL_RE.test(lead.email)) continue

    const rawSeq   = row.sequence_type ?? "consumer"
    const seqType: SequenceType = rawSeq in TEMPLATE_MAP ? (rawSeq as SequenceType) : "consumer"
    const templateFn = TEMPLATE_MAP[seqType][row.email_number - 1]
    if (!templateFn) continue

    const firstName = lead.name?.split(" ")[0] || "there"
    const { subject, html } = templateFn(firstName)

    const { error: sendError } = await resend.emails.send({
      from:    FROM_EMAIL,
      to:      lead.email,
      subject,
      html,
    })

    if (sendError) {
      console.error(`[send-emails] failed email ${row.id}`, sendError)
      await supabase
        .from("email_queue")
        .update({ status: "failed", error: sendError.message })
        .eq("id", row.id)
    } else {
      await supabase
        .from("email_queue")
        .update({ status: "sent", sent_at: new Date().toISOString() })
        .eq("id", row.id)
      sent++
    }
  }

  return NextResponse.json({ sent })
}
