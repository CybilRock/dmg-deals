"use client"

import TopBar from "@/components/layout/TopBar"
import { addLead } from "@/app/actions/leads"
import { useTransition, useState, useEffect } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"

const SOURCE_BRANDS = ["Doctor Travel", "Advocate Travel", "Holiday Brokers", "Online"]
const SOURCE_CHANNELS = ["meta_ad", "tiktok_ad", "referral", "walk_in", "cold_call", "other"]
const CHANNEL_LABELS: Record<string, string> = {
  meta_ad: "Meta Ad", tiktok_ad: "TikTok Ad", referral: "Referral",
  walk_in: "Walk-in", cold_call: "Cold Call", other: "Other",
}

const inputClass = "mt-1 w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
const labelClass = "text-xs text-[#64748b] font-medium"

type Person = { id: string; name: string }

export default function NewLeadPage() {
  const [form, setForm] = useState({
    name: "", phone: "", email: "", source_brand: "", source_channel: "",
    assigned_to: "", notes: "",
  })
  const [pending, startTransition] = useTransition()
  const [consultants, setConsultants] = useState<Person[]>([])
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from("people")
      .select("id, name")
      .in("role", ["consultant", "both"])
      .eq("status", "approved")
      .order("name")
      .then(({ data }) => setConsultants(data ?? []))
  }, [])

  return (
    <>
      <TopBar
        title="Add Lead"
        action={<Link href="/leads" className="text-xs text-[#64748b] hover:text-[#0f172a]">← Cancel</Link>}
      />
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-md bg-white rounded-xl border border-[#e2e8f0] p-6 space-y-4">
          <div>
            <label className={labelClass}>Full Name</label>
            <input value={form.name} onChange={(e) => set("name", e.target.value)} className={inputClass} placeholder="e.g. John Smith" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Phone</label>
              <input value={form.phone} onChange={(e) => set("phone", e.target.value)} className={inputClass} placeholder="082 000 0000" />
            </div>
            <div>
              <label className={labelClass}>Email</label>
              <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} className={inputClass} placeholder="email@example.com" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Source Brand</label>
              <select value={form.source_brand} onChange={(e) => set("source_brand", e.target.value)} className={inputClass}>
                <option value="">Select…</option>
                {SOURCE_BRANDS.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Channel</label>
              <select value={form.source_channel} onChange={(e) => set("source_channel", e.target.value)} className={inputClass}>
                <option value="">Select…</option>
                {SOURCE_CHANNELS.map((c) => <option key={c} value={c}>{CHANNEL_LABELS[c]}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className={labelClass}>Assign To</label>
            <select value={form.assigned_to} onChange={(e) => set("assigned_to", e.target.value)} className={inputClass}>
              <option value="">Unassigned</option>
              {consultants.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              rows={3}
              className={inputClass}
              placeholder="Any relevant details…"
            />
          </div>
          <button
            type="button"
            disabled={!form.name || pending}
            onClick={() => startTransition(() => addLead(form))}
            className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"
          >
            {pending ? "Saving…" : "Add Lead"}
          </button>
        </div>
      </div>
    </>
  )
}
