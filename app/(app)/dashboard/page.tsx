import TopBar from "@/components/layout/TopBar"
import { createClient } from "@/lib/supabase/server"
import { formatRand, formatDate } from "@/lib/utils"
import { approvePerson, rejectPerson } from "@/app/actions/partners"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  const supabase = await createClient()

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)

  const [
    { data: ledger },
    { data: dealsThisMonth },
    { data: recentDeals },
    { data: pendingPartners },
  ] = await Promise.all([
    supabase.from("dhr_debt_ledger").select("entry_type, amount"),
    supabase.from("deals").select("id", { count: "exact" }).gte("deal_date", monthStart).eq("product", "DVC"),
    supabase.from("deals").select("id, client_name, product, deal_value, dmg_net, deal_date, source_brand").order("created_at", { ascending: false }).limit(5),
    supabase.from("people").select("id, name, email, phone, role, created_at").eq("status", "pending").order("created_at"),
  ])

  const dhrDebt = (ledger ?? []).reduce((sum, e) => {
    if (e.entry_type === "debt_repaid") return sum - e.amount
    return sum + e.amount
  }, 0)

  const dealsCount = dealsThisMonth?.length ?? 0

  return (
    <>
      <TopBar title="Dashboard" />
      <div className="flex-1 overflow-auto p-6 space-y-6">

        {/* Pending Partner Applications */}
        {(pendingPartners?.length ?? 0) > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold text-amber-900">Partner Applications</h2>
                <p className="text-xs text-amber-700 mt-0.5">{pendingPartners!.length} pending review</p>
              </div>
            </div>
            <div className="space-y-3">
              {pendingPartners!.map((p) => (
                <div
                  key={p.id}
                  className="bg-white rounded-lg border border-amber-100 px-4 py-3 flex items-center justify-between gap-4"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#0f172a] truncate">{p.name}</p>
                    <p className="text-xs text-[#64748b] truncate">
                      {p.email} {p.phone ? `· ${p.phone}` : ""} · {p.role}
                    </p>
                    <p className="text-xs text-[#94a3b8]">Applied {formatDate(p.created_at)}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <form action={approvePerson}>
                      <input type="hidden" name="id" value={p.id} />
                      <button
                        type="submit"
                        className="text-xs bg-[#0f172a] hover:bg-[#1e293b] text-white font-semibold px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Accept
                      </button>
                    </form>
                    <form action={rejectPerson}>
                      <input type="hidden" name="id" value={p.id} />
                      <button
                        type="submit"
                        className="text-xs border border-[#e2e8f0] text-[#64748b] hover:text-red-500 hover:border-red-200 font-semibold px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Decline
                      </button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div className="bg-white rounded-xl border border-[#e2e8f0] p-5">
            <p className="text-xs text-[#94a3b8] font-medium uppercase tracking-wide">DHR Debt Balance</p>
            <p className="text-2xl font-bold mt-1 text-red-500">{formatRand(dhrDebt)}</p>
            <p className="text-xs text-[#94a3b8] mt-1">Retention owed by DHR</p>
          </div>
          <div className="bg-white rounded-xl border border-[#e2e8f0] p-5">
            <p className="text-xs text-[#94a3b8] font-medium uppercase tracking-wide">DVC Deals This Month</p>
            <p className="text-2xl font-bold mt-1 text-[#0f172a]">{dealsCount}</p>
            <p className="text-xs text-[#94a3b8] mt-1">{monthStart.slice(0, 7)}</p>
          </div>
          <div className="bg-white rounded-xl border border-[#e2e8f0] p-5">
            <p className="text-xs text-[#94a3b8] font-medium uppercase tracking-wide">Next Friday Payout</p>
            <p className="text-2xl font-bold mt-1 text-[#0f172a]">{formatRand(0)}</p>
            <p className="text-xs text-[#94a3b8] mt-1">Payout runs coming soon</p>
          </div>
          <div className="bg-white rounded-xl border border-[#e2e8f0] p-5">
            <p className="text-xs text-[#94a3b8] font-medium uppercase tracking-wide">Contractor Run (7th)</p>
            <p className="text-2xl font-bold mt-1 text-[#0f172a]">{formatRand(0)}</p>
            <p className="text-xs text-[#94a3b8] mt-1">Payout runs coming soon</p>
          </div>
        </div>

        {/* Recent Deals */}
        <div className="bg-white rounded-xl border border-[#e2e8f0] p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-[#0f172a]">Recent Deals</h2>
            <Link href="/deals" className="text-xs text-amber-500 hover:underline">View all →</Link>
          </div>
          {!recentDeals?.length ? (
            <p className="text-sm text-[#94a3b8]">
              No deals yet.{" "}
              <Link href="/deals/new" className="text-amber-500 hover:underline">Add the first deal →</Link>
            </p>
          ) : (
            <div className="divide-y divide-[#f1f5f9]">
              {recentDeals.map((d) => (
                <div key={d.id} className="flex items-center justify-between py-3 text-sm">
                  <div>
                    <p className="font-medium text-[#0f172a]">{d.client_name}</p>
                    <p className="text-xs text-[#94a3b8] mt-0.5">{d.source_brand} · {d.product} · {formatDate(d.deal_date)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-[#0f172a]">{formatRand(d.deal_value)}</p>
                    <p className="text-xs text-[#94a3b8] mt-0.5">Net {formatRand(d.dmg_net)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </>
  )
}
