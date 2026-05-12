import TopBar from "@/components/layout/TopBar"
import { createClient } from "@/lib/supabase/server"
import Link from "next/link"

export const dynamic = "force-dynamic"

const STATUSES = [
  { key: "new",          label: "New" },
  { key: "contacted",    label: "Contacted" },
  { key: "qualified",    label: "Qualified" },
  { key: "appointment",  label: "Appointment" },
  { key: "presented",    label: "Presented" },
  { key: "closed_won",   label: "Won" },
  { key: "closed_lost",  label: "Lost" },
]

const STATUS_STYLE: Record<string, string> = {
  new:         "bg-slate-100 text-slate-600",
  contacted:   "bg-blue-100 text-blue-700",
  qualified:   "bg-indigo-100 text-indigo-700",
  appointment: "bg-purple-100 text-purple-700",
  presented:   "bg-amber-100 text-amber-700",
  closed_won:  "bg-green-100 text-green-700",
  closed_lost: "bg-red-100 text-red-700",
}

export default async function LeadsPage() {
  const supabase = await createClient()

  const [{ data: leads }, { data: people }] = await Promise.all([
    supabase.from("leads").select("id, name, phone, email, source_brand, source_channel, status, assigned_to, created_at").order("created_at", { ascending: false }),
    supabase.from("people").select("id, name"),
  ])

  const peopleMap = Object.fromEntries((people ?? []).map((p) => [p.id, p.name]))

  const byStatus = Object.fromEntries(
    STATUSES.map((s) => [s.key, (leads ?? []).filter((l) => l.status === s.key)])
  )

  return (
    <>
      <TopBar
        title="Leads"
        action={
          <Link
            href="/leads/new"
            className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            + Add Lead
          </Link>
        }
      />
      <div className="flex-1 overflow-auto p-6">
        <div className="flex gap-3 overflow-x-auto pb-2">
          {STATUSES.map(({ key, label }) => {
            const col = byStatus[key] ?? []
            return (
              <div key={key} className="min-w-[210px] bg-white rounded-xl border border-[#e2e8f0] p-4 shrink-0">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-[#0f172a]">{label}</p>
                  <span className="text-xs text-[#94a3b8]">{col.length}</span>
                </div>
                {col.length === 0 ? (
                  <p className="text-xs text-[#94a3b8]">No leads</p>
                ) : (
                  <div className="space-y-2">
                    {col.map((lead) => (
                      <div
                        key={lead.id}
                        className="bg-[#f8fafc] border border-[#e2e8f0] rounded-lg p-3 text-xs"
                      >
                        <p className="font-semibold text-[#0f172a] truncate">{lead.name}</p>
                        {lead.phone && <p className="text-[#64748b] mt-0.5">{lead.phone}</p>}
                        {lead.source_brand && (
                          <p className="text-[#94a3b8] mt-1 truncate">{lead.source_brand}</p>
                        )}
                        {lead.assigned_to && peopleMap[lead.assigned_to] && (
                          <p className="text-amber-600 mt-1 truncate">→ {peopleMap[lead.assigned_to]}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}
