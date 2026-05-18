import { Webhook } from "svix"
import { resend, FROM_EMAIL } from "@/lib/email/resend"
import { emailAutoReply } from "@/lib/email/templates"
import { NextRequest, NextResponse } from "next/server"

if (!process.env.RESEND_WEBHOOK_SECRET) {
  throw new Error("RESEND_WEBHOOK_SECRET is not set")
}

export async function POST(req: NextRequest) {
  const svix_id        = req.headers.get("svix-id")
  const svix_timestamp = req.headers.get("svix-timestamp")
  const svix_signature = req.headers.get("svix-signature")

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return NextResponse.json({ error: "Missing webhook signature" }, { status: 400 })
  }

  const rawBody = await req.text()

  let event: { type: string; data: { from?: string } }
  try {
    const wh = new Webhook(process.env.RESEND_WEBHOOK_SECRET!)
    event = wh.verify(rawBody, {
      "svix-id":        svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as typeof event
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
  }

  if (event.type !== "email.received") {
    return NextResponse.json({ received: true })
  }

  const from = event.data?.from
  if (!from || !from.includes("@")) {
    return NextResponse.json({ received: true })
  }

  // Extract plain email address from "Name <email>" format if present
  const match   = from.match(/<([^>]+)>/)
  const replyTo = match ? match[1] : from

  const { subject, html } = emailAutoReply(replyTo)

  try {
    await resend.emails.send({ from: FROM_EMAIL, to: replyTo, subject, html })
  } catch (err) {
    console.error("[email-inbound] auto-reply failed", { replyTo, err })
    return NextResponse.json({ error: "Failed to send auto-reply" }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
