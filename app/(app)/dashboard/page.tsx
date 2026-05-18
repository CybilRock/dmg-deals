import TopBar from "@/components/layout/TopBar"
import { createAdminClient } from "@/lib/supabase/admin"
import { formatRand, formatDate } from "@/lib/utils"
import { approvePerson, rejectPerson } from "@/app/actions/partners"
import { contactLead } from "@/app/actions/leads"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  const supabase = createAdminClient()

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)

  const [
    { data: ledger },
    { data: dealsThisMonth },
    { data: recentDeals },
    { data: pendingPartners },
    { data: lastFridayRun },
    { data: last7thRun },
    { data: calculatorLeads },
  ] = await Promise.all([
    supabase.from("dhr_debt_ledger").select("entry_type, amount"),
    supabase.from("deals").select("id").gte("deal_date", monthStart).eq("product", "DVC"),
    supabase.from("deals").select("id, client_name, product, deal_value, dmg_net, deal_date, source_brand").order("created_at", { ascending: false }).limit(5),
    supabase.from("people").select("id, name, email, phone, role, created_at").eq("status", "pending").order("created_at"),
    supabase.from("payout_runs").select("total_amount, run_date").eq("run_type", "friday_dhr").order("run_date", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("payout_runs").select("total_amount, run_date").eq("run_type", "seventh_contractor").order("run_date", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("leads").select("id, name, email, created_at").eq("source_channel", "calculator").eq("status", "new").order("created_at", { ascending: false }),
  ])

  const dhrDebt = (ledger ?? []).reduce((sum, e) => {
    if (e.entry_type === "opening_balance") return sum + e.amount
    return sum - e.amount
  }, 0)

  const dealsCount = dealsThisMonth?.length ?? 0

  return (
    <>
      <TopBar title="Dashboard" />
      <div className="flex-1 overflow-auto p-6 space-y-5">

        {/* Pending Partner Applications */}
        {(pendingPartners?.length ?? 0) > 0 && (
          <div className="bg-[#1a1a1a] border border-[#c9a84c]/30 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-1.5 h-1.5 rounded-full bg-[#c9a84c] animate-pulse" />
              <p className="text-sm font-semibold text-[#f5f5f5]">Partner Applications</p>
              <span className="text-[10px] font-bold bg-[#c9a84c] text-black px-1.5 py-0.5 rounded-full">
                {pendingPartners!.length}
              </span>
            </div>
            <div className="space-y-2">
              {pendingPartners!.map((p) => (
                <div
                  key={p.id}
                  className="bg-[#222] border border-[#2e2e2e] rounded-lg px-4 py-3 flex items-center justify-between gap-4"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#f5f5f5] truncate">{p.name}</p>
                    <p className="text-xs text-[#a8a8a8] truncate">
                      {p.email}{p.phone ? ` · ${p.phone}` : ""} · {p.role}
                    </p>
                    <p className="text-xs text-[#aaa] mt-0.5">{formatDate(p.created_at)}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <form action={approvePerson}>
                      <input type="hidden" name="id" value={p.id} />
                      <button type="submit" className="text-xs bg-[#c9a84c] hover:bg-[#b8943e] text-black font-bold px-3 py-1.5 rounded-lg transition-colors">
                        Accept
                      </button>
                    </form>
                    <form action={rejectPerson}>
                      <input type="hidden" name="id" value={p.id} />
                      <button type="submit" className="text-xs border border-[#2e2e2e] text-[#a8a8a8] hover:text-red-400 hover:border-red-800 font-semibold px-3 py-1.5 rounded-lg transition-colors">
                        Decline
                      </button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* New Calculator Leads */}
        {(calculatorLeads?.length ?? 0) > 0 && (
          <div className="bg-[#1a1a1a] border border-[#c9a84c]/30 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-1.5 h-1.5 rounded-full bg-[#c9a84c] animate-pulse" />
              <p className="text-sm font-semibold text-[#f5f5f5]">New Calculator Leads</p>
              <span className="text-[10px] font-bold bg-[#c9a84c] text-black px-1.5 py-0.5 rounded-full">
                {calculatorLeads!.length}
              </span>
              <Link href="/leads" className="ml-auto text-xs text-[#c9a84c] hover:underline">View all →</Link>
            </div>
            <div className="space-y-2">
              {calculatorLeads!.map((lead) => (
                <div
                  key={lead.id}
                  className="bg-[#222] border border-[#2e2e2e] rounded-lg px-4 py-3 flex items-center justify-between gap-4"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#f5f5f5] truncate">{lead.name}</p>
                    <p className="text-xs text-[#a8a8a8] truncate">{lead.email}</p>
                    <p className="text-xs text-[#aaa] mt-0.5">{formatDate(lead.created_at)}</p>
                  </div>
                  <form action={contactLead.bind(null, lead.id)} className="shrink-0">
                    <button type="submit" className="text-xs bg-[#c9a84c] hover:bg-[#b8943e] text-black font-bold px-3 py-1.5 rounded-lg transition-colors">
                      Contact
                    </button>
                  </form>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {/* DHR Debt — clickable to full ledger */}
          <Link href="/reports/dhr" className="block bg-[#1a1a1a] border border-[#2e2e2e] rounded-xl p-5 hover:border-[#555] transition-colors">
            <p className="text-[10px] text-[#aaa] font-semibold uppercase tracking-widest">DHR Debt</p>
            <p className="text-2xl font-bold mt-1.5 text-red-400">{formatRand(dhrDebt)}</p>
            <p className="text-xs text-[#888] mt-1">Retention owed by DHR · View history →</p>
          </Link>
          <div className="bg-[#1a1a1a] border border-[#2e2e2e] rounded-xl p-5">
            <p className="text-[10px] text-[#aaa] font-semibold uppercase tracking-widest">DVC Deals</p>
            <p className="text-2xl font-bold mt-1.5 text-[#f5f5f5]">{dealsCount}</p>
            <p className="text-xs text-[#888] mt-1">{monthStart.slice(0, 7)}</p>
          </div>
          <div className="bg-[#1a1a1a] border border-[#2e2e2e] rounded-xl p-5">
            <p className="text-[10px] text-[#aaa] font-semibold uppercase tracking-widest">Last Friday Run</p>
            {lastFridayRun ? (
              <>
                <p className="text-2xl font-bold mt-1.5 text-[#f5f5f5]">{formatRand(lastFridayRun.total_amount)}</p>
                <p className="text-xs text-[#888] mt-1">{formatDate(lastFridayRun.run_date)}</p>
              </>
            ) : (
              <>
                <p className="text-2xl font-bold mt-1.5 text-[#f5f5f5]">{formatRand(0)}</p>
                <p className="text-xs text-[#888] mt-1">No runs yet</p>
              </>
            )}
          </div>
          <div className="bg-[#1a1a1a] border border-[#2e2e2e] rounded-xl p-5">
            <p className="text-[10px] text-[#aaa] font-semibold uppercase tracking-widest">Last 7th Run</p>
            {last7thRun ? (
              <>
                <p className="text-2xl font-bold mt-1.5 text-[#f5f5f5]">{formatRand(last7thRun.total_amount)}</p>
                <p className="text-xs text-[#888] mt-1">{formatDate(last7thRun.run_date)}</p>
              </>
            ) : (
              <>
                <p className="text-2xl font-bold mt-1.5 text-[#f5f5f5]">{formatRand(0)}</p>
                <p className="text-xs text-[#888] mt-1">No runs yet</p>
              </>
            )}
          </div>
        </div>

        {/* Recent Deals */}
        <div className="bg-[#1a1a1a] border border-[#2e2e2e] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-[#f5f5f5]">Recent Deals</h2>
            <Link href="/deals" className="text-xs text-[#c9a84c] hover:underline">View all →</Link>
          </div>
          {!recentDeals?.length ? (
            <p className="text-sm text-[#aaa]">
              No deals yet.{" "}
              <Link href="/deals/new" className="text-[#c9a84c] hover:underline">Add the first deal →</Link>
            </p>
          ) : (
            <div className="divide-y divide-[#2e2e2e]">
              {recentDeals.map((d) => (
                <div key={d.id} className="flex items-center justify-between py-3 text-sm">
                  <div>
                    <p className="font-medium text-[#f5f5f5]">{d.client_name}</p>
                    <p className="text-xs text-[#888] mt-0.5">{d.source_brand} · {d.product} · {formatDate(d.deal_date)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-[#f5f5f5]">{formatRand(d.deal_value)}</p>
                    <p className="text-xs text-[#888] mt-0.5">Net {formatRand(d.dmg_net)}</p>
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
