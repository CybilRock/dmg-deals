import TopBar from "@/components/layout/TopBar"
import { createAdminClient } from "@/lib/supabase/admin"
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

export default async function LeadsPage() {
  const supabase = createAdminClient()

  const [{ data: leads }, { data: people }] = await Promise.all([
    supabase.from("leads").select("id, name, phone, email, source_brand, status, assigned_to, created_at, city, region").order("created_at", { ascending: false }),
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
            className="bg-[#c9a84c] hover:bg-[#b8943e] text-black text-xs font-bold px-4 py-2 rounded-lg transition-colors"
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
              <div key={key} className="min-w-[200px] bg-[#1a1a1a] border border-[#2e2e2e] rounded-xl p-4 shrink-0">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-bold text-[#f5f5f5] tracking-wide">{label}</p>
                  <span className="text-[10px] font-bold text-[#aaa] bg-[#222] px-1.5 py-0.5 rounded-full">{col.length}</span>
                </div>
                {col.length === 0 ? (
                  <p className="text-xs text-[#aaa]">No leads</p>
                ) : (
                  <div className="space-y-2">
                    {col.map((lead) => (
                      <div key={lead.id} className="bg-[#222] border border-[#2e2e2e] rounded-lg p-3 text-xs">
                        <p className="font-semibold text-[#f5f5f5] truncate">{lead.name}</p>
                        {lead.phone && <p className="text-[#a8a8a8] mt-0.5">{lead.phone}</p>}
                        {lead.source_brand && (
                          <p className="text-[#aaa] mt-1 truncate">{lead.source_brand}</p>
                        )}
                        {(lead.city || lead.region) && (
                          <p className="text-[#888] mt-0.5 truncate">
                            📍 {[lead.city, lead.region].filter(Boolean).join(", ")}
                          </p>
                        )}
                        {lead.assigned_to && peopleMap[lead.assigned_to] && (
                          <p className="text-[#c9a84c] mt-1 truncate">→ {peopleMap[lead.assigned_to]}</p>
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
