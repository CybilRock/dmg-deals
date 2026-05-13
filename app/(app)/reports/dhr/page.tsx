import TopBar from "@/components/layout/TopBar"
import { createAdminClient } from "@/lib/supabase/admin"
import { formatRand, formatDate } from "@/lib/utils"
import Link from "next/link"

export const dynamic = "force-dynamic"

const ENTRY_LABELS: Record<string, string> = {
  opening_balance: "Opening Balance",
  retention_added: "Retention Applied",
  debt_repaid:     "Cash Payment Made",
}

const ENTRY_COLORS: Record<string, string> = {
  opening_balance: "text-[#a8a8a8]",
  retention_added: "text-emerald-400",
  debt_repaid:     "text-emerald-400",
}

const DEPOSIT_LABEL: Record<string, string> = {
  "10pct":          "10% Deposit",
  "25to49pct":      "25–49% Deposit",
  "50pct":          "50% Deposit",
  "no_deposit":     "No Deposit",
  "self_generated": "Self-Generated",
  "upgrade":        "Upgrade",
  "hcorp_3yr":      "HCorp 3-Year",
  "hcorp_5yr":      "HCorp 5-Year",
  "hcorp_10yr":     "HCorp 10-Year",
}

const STATUS_BADGE: Record<string, string> = {
  active:    "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
  paid:      "bg-blue-500/10 text-blue-400 border border-blue-500/20",
  cancelled: "bg-red-500/10 text-red-400 border border-red-500/20",
  clawback:  "bg-orange-500/10 text-orange-400 border border-orange-500/20",
}

const PERIOD_TABS = [
  { key: "all", label: "All Time" },
  { key: "1y",  label: "Last 12 Months" },
  { key: "6m",  label: "Last 6 Months" },
]

export default async function LedgersPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; tab?: string }>
}) {
  const { tab: tabParam, period: periodParam } = await searchParams
  const supabase = createAdminClient()
  const tab    = tabParam    ?? "dhr"
  const period = periodParam ?? "all"

  const now = new Date()
  let sinceDate: string | null = null
  if (period === "6m") {
    sinceDate = new Date(now.getFullYear(), now.getMonth() - 6, 1).toISOString().slice(0, 10)
  } else if (period === "1y") {
    sinceDate = new Date(now.getFullYear() - 1, now.getMonth(), 1).toISOString().slice(0, 10)
  }

  // ── DHR debt ledger ─────────────────────────────────────────────────────────
  const { data: allEntries } = await supabase
    .from("dhr_debt_ledger")
    .select("id, created_at, entry_type, amount, notes, deal_id")
    .order("created_at", { ascending: true })

  const allRows = allEntries ?? []

  // opening_balance adds to debt; retention_added and debt_repaid both reduce it
  const totalDebt = allRows.reduce((sum, e) => {
    if (e.entry_type === "opening_balance") return sum + e.amount
    return sum - e.amount
  }, 0)

  const dhrDisplayRows = (sinceDate
    ? allRows.filter((e) => e.created_at >= sinceDate!)
    : allRows
  ).slice().reverse()

  const totalRetentionApplied = allRows
    .filter(e => e.entry_type === "retention_added")
    .reduce((s, e) => s + e.amount, 0)
  const totalPaid = allRows
    .filter(e => e.entry_type === "debt_repaid")
    .reduce((s, e) => s + e.amount, 0)

  // ── DMG income ledger ───────────────────────────────────────────────────────
  const [{ data: rawDeals }, { data: people }] = await Promise.all([
    supabase
      .from("deals")
      .select("id, deal_date, client_name, source_brand, product, points, deposit_type, deal_value, dmg_net, status, self_generated, consultant_id, booker_id")
      .order("deal_date", { ascending: false }),
    supabase.from("people").select("id, name"),
  ])

  const peopleMap = new Map((people ?? []).map(p => [p.id, p.name]))

  const incomeDeals = sinceDate
    ? (rawDeals ?? []).filter(d => d.deal_date >= sinceDate!)
    : (rawDeals ?? [])

  const activeIncomeDeals  = incomeDeals.filter(d => d.status !== "cancelled")
  const totalDmgNet        = activeIncomeDeals.reduce((s, d) => s + (d.dmg_net   ?? 0), 0)
  const totalDealValue     = activeIncomeDeals.reduce((s, d) => s + (d.deal_value ?? 0), 0)
  const dvcDeals           = activeIncomeDeals.filter(d => d.product === "DVC")
  const hcorpDeals         = activeIncomeDeals.filter(d => d.product === "HolidayCorp")
  const dvcDmgNet          = dvcDeals.reduce((s, d)   => s + (d.dmg_net ?? 0), 0)
  const hcorpDmgNet        = hcorpDeals.reduce((s, d) => s + (d.dmg_net ?? 0), 0)
  const dvcDealValue       = dvcDeals.reduce((s, d)   => s + (d.deal_value ?? 0), 0)
  const hcorpDealValue     = hcorpDeals.reduce((s, d) => s + (d.deal_value ?? 0), 0)

  return (
    <>
      <TopBar
        title="Ledgers"
        action={
          <Link href="/dashboard" className="text-xs text-[#a8a8a8] hover:text-[#f5f5f5]">
            ← Dashboard
          </Link>
        }
      />
      <div className="flex-1 overflow-auto p-6 space-y-5">

        {/* Main tab bar */}
        <div className="flex gap-1 border-b border-[#2e2e2e]">
          <Link
            href="/reports/dhr?tab=dhr"
            className={`text-sm font-semibold px-5 py-2.5 border-b-2 transition-colors ${
              tab === "dhr"
                ? "border-[#c9a84c] text-[#c9a84c]"
                : "border-transparent text-[#888] hover:text-[#f5f5f5]"
            }`}
          >
            DHR Debt Ledger
          </Link>
          <Link
            href="/reports/dhr?tab=income"
            className={`text-sm font-semibold px-5 py-2.5 border-b-2 transition-colors ${
              tab === "income"
                ? "border-[#c9a84c] text-[#c9a84c]"
                : "border-transparent text-[#888] hover:text-[#f5f5f5]"
            }`}
          >
            DMG Income Ledger
          </Link>
        </div>

        {/* ── DHR TAB ──────────────────────────────────────────────────────── */}
        {tab === "dhr" && (
          <>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-[#1a1a1a] border border-[#2e2e2e] rounded-xl p-5">
                <p className="text-[10px] text-[#aaa] font-semibold uppercase tracking-widest">DMG Debt to DHR</p>
                <p className="text-2xl font-bold mt-1.5 text-red-400">{formatRand(totalDebt)}</p>
                <p className="text-xs text-[#888] mt-1">Outstanding balance</p>
              </div>
              <div className="bg-[#1a1a1a] border border-[#2e2e2e] rounded-xl p-5">
                <p className="text-[10px] text-[#aaa] font-semibold uppercase tracking-widest">Total Retention Applied</p>
                <p className="text-2xl font-bold mt-1.5 text-emerald-400">{formatRand(totalRetentionApplied)}</p>
                <p className="text-xs text-[#888] mt-1">DHR commissions withheld toward debt</p>
              </div>
              <div className="bg-[#1a1a1a] border border-[#2e2e2e] rounded-xl p-5">
                <p className="text-[10px] text-[#aaa] font-semibold uppercase tracking-widest">Total Cash Paid to DHR</p>
                <p className="text-2xl font-bold mt-1.5 text-emerald-400">{formatRand(totalPaid)}</p>
                <p className="text-xs text-[#888] mt-1">Direct payments made</p>
              </div>
            </div>

            <div className="flex gap-2">
              {PERIOD_TABS.map((t) => (
                <Link
                  key={t.key}
                  href={`/reports/dhr?tab=dhr${t.key === "all" ? "" : `&period=${t.key}`}`}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                    period === t.key
                      ? "bg-[#c9a84c] text-black"
                      : "bg-[#1a1a1a] border border-[#2e2e2e] text-[#a8a8a8] hover:text-[#f5f5f5]"
                  }`}
                >
                  {t.label}
                </Link>
              ))}
            </div>

            <div className="bg-[#1a1a1a] border border-[#2e2e2e] rounded-xl overflow-hidden">
              {!dhrDisplayRows.length ? (
                <div className="p-6">
                  <p className="text-sm text-[#888]">No entries for this period.</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#2e2e2e] bg-[#111]">
                      <th className="text-left text-[10px] font-bold text-[#aaa] px-4 py-3 uppercase tracking-widest">Date</th>
                      <th className="text-left text-[10px] font-bold text-[#aaa] px-4 py-3 uppercase tracking-widest">Type</th>
                      <th className="text-left text-[10px] font-bold text-[#aaa] px-4 py-3 uppercase tracking-widest">Notes</th>
                      <th className="text-right text-[10px] font-bold text-[#aaa] px-4 py-3 uppercase tracking-widest">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2e2e2e]">
                    {dhrDisplayRows.map((e) => (
                      <tr key={e.id} className="hover:bg-[#222] transition-colors">
                        <td className="px-4 py-3 text-[#888] text-xs whitespace-nowrap">
                          {new Date(e.created_at).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-semibold ${ENTRY_COLORS[e.entry_type] ?? "text-[#a8a8a8]"}`}>
                            {ENTRY_LABELS[e.entry_type] ?? e.entry_type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[#888] text-xs">{e.notes ?? "—"}</td>
                        <td className={`px-4 py-3 text-right font-semibold ${ENTRY_COLORS[e.entry_type] ?? "text-[#a8a8a8]"}`}>
                          {e.entry_type === "opening_balance" ? formatRand(e.amount) : `− ${formatRand(e.amount)}`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-[#2e2e2e] bg-[#111]">
                      <td colSpan={3} className="px-4 py-3 text-[10px] font-bold text-[#aaa] uppercase tracking-widest">
                        Outstanding Balance to DHR
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-red-400">{formatRand(totalDebt)}</td>
                    </tr>
                  </tfoot>
                </table>
              )}
            </div>

            <p className="text-xs text-[#888]">
              To record a DHR payment, go to{" "}
              <Link href="/reports" className="text-[#c9a84c] hover:underline">
                Reports → Friday Payout Runs
              </Link>.
            </p>
          </>
        )}

        {/* ── INCOME TAB ───────────────────────────────────────────────────── */}
        {tab === "income" && (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <div className="bg-[#1a1a1a] border border-[#c9a84c]/20 rounded-xl p-5">
                <p className="text-[10px] text-[#aaa] font-semibold uppercase tracking-widest">Total DMG Net</p>
                <p className="text-2xl font-bold mt-1.5 text-[#c9a84c]">{formatRand(totalDmgNet)}</p>
                <p className="text-xs text-[#888] mt-1">
                  {activeIncomeDeals.length} deal{activeIncomeDeals.length !== 1 ? "s" : ""} active
                </p>
              </div>
              <div className="bg-[#1a1a1a] border border-[#2e2e2e] rounded-xl p-5">
                <p className="text-[10px] text-[#aaa] font-semibold uppercase tracking-widest">Total Deal Value</p>
                <p className="text-2xl font-bold mt-1.5 text-[#f5f5f5]">{formatRand(totalDealValue)}</p>
                <p className="text-xs text-[#888] mt-1">Gross value closed</p>
              </div>
              <div className="bg-[#1a1a1a] border border-[#2e2e2e] rounded-xl p-5">
                <p className="text-[10px] text-[#aaa] font-semibold uppercase tracking-widest">DVC Net</p>
                <p className="text-2xl font-bold mt-1.5 text-[#f5f5f5]">{formatRand(dvcDmgNet)}</p>
                <p className="text-xs text-[#888] mt-1">
                  {dvcDeals.length} deal{dvcDeals.length !== 1 ? "s" : ""} · {formatRand(dvcDealValue)} gross
                </p>
              </div>
              <div className="bg-[#1a1a1a] border border-[#2e2e2e] rounded-xl p-5">
                <p className="text-[10px] text-[#aaa] font-semibold uppercase tracking-widest">HolidayCorp Net</p>
                <p className="text-2xl font-bold mt-1.5 text-[#f5f5f5]">{formatRand(hcorpDmgNet)}</p>
                <p className="text-xs text-[#888] mt-1">
                  {hcorpDeals.length} deal{hcorpDeals.length !== 1 ? "s" : ""} · {formatRand(hcorpDealValue)} gross
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              {PERIOD_TABS.map((t) => (
                <Link
                  key={t.key}
                  href={`/reports/dhr?tab=income${t.key === "all" ? "" : `&period=${t.key}`}`}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                    period === t.key
                      ? "bg-[#c9a84c] text-black"
                      : "bg-[#1a1a1a] border border-[#2e2e2e] text-[#a8a8a8] hover:text-[#f5f5f5]"
                  }`}
                >
                  {t.label}
                </Link>
              ))}
            </div>

            <div className="bg-[#1a1a1a] border border-[#2e2e2e] rounded-xl overflow-hidden">
              {!incomeDeals.length ? (
                <div className="p-6">
                  <p className="text-sm text-[#888]">No deals for this period.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#2e2e2e] bg-[#111]">
                        <th className="text-left text-[10px] font-bold text-[#aaa] px-4 py-3 uppercase tracking-widest">Date</th>
                        <th className="text-left text-[10px] font-bold text-[#aaa] px-4 py-3 uppercase tracking-widest">Client</th>
                        <th className="text-left text-[10px] font-bold text-[#aaa] px-4 py-3 uppercase tracking-widest">Consultant</th>
                        <th className="text-left text-[10px] font-bold text-[#aaa] px-4 py-3 uppercase tracking-widest">Source</th>
                        <th className="text-left text-[10px] font-bold text-[#aaa] px-4 py-3 uppercase tracking-widest">Product</th>
                        <th className="text-left text-[10px] font-bold text-[#aaa] px-4 py-3 uppercase tracking-widest">Structure</th>
                        <th className="text-right text-[10px] font-bold text-[#aaa] px-4 py-3 uppercase tracking-widest">Deal Value</th>
                        <th className="text-right text-[10px] font-bold text-[#aaa] px-4 py-3 uppercase tracking-widest">DMG Net</th>
                        <th className="text-left text-[10px] font-bold text-[#aaa] px-4 py-3 uppercase tracking-widest">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#2e2e2e]">
                      {incomeDeals.map((d) => (
                        <tr
                          key={d.id}
                          className={`hover:bg-[#222] transition-colors ${d.status === "cancelled" ? "opacity-40" : ""}`}
                        >
                          <td className="px-4 py-3 text-[#888] text-xs whitespace-nowrap">{formatDate(d.deal_date)}</td>
                          <td className="px-4 py-3 font-medium text-[#f5f5f5] whitespace-nowrap">
                            {d.client_name}
                            {d.self_generated && (
                              <span className="ml-2 text-[9px] bg-[#c9a84c]/10 text-[#c9a84c] border border-[#c9a84c]/20 font-bold px-1.5 py-0.5 rounded">
                                SG
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-[#a8a8a8]">
                            {peopleMap.get(d.consultant_id) ?? "—"}
                          </td>
                          <td className="px-4 py-3 text-[#a8a8a8]">{d.source_brand ?? "—"}</td>
                          <td className="px-4 py-3 text-[#a8a8a8] whitespace-nowrap">
                            {d.product === "DVC" ? "DVC" : "HCorp"}
                            {d.product === "DVC" && d.points ? (
                              <span className="ml-1 text-[#888]">({d.points.toLocaleString()} pts)</span>
                            ) : null}
                          </td>
                          <td className="px-4 py-3 text-[#a8a8a8]">{DEPOSIT_LABEL[d.deposit_type] ?? d.deposit_type}</td>
                          <td className="px-4 py-3 text-right text-[#f5f5f5] whitespace-nowrap">{formatRand(d.deal_value)}</td>
                          <td className="px-4 py-3 text-right font-semibold text-[#c9a84c] whitespace-nowrap">
                            {formatRand(d.dmg_net)}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${STATUS_BADGE[d.status] ?? "bg-[#222] text-[#a8a8a8]"}`}>
                              {d.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-[#2e2e2e] bg-[#111]">
                        <td colSpan={6} className="px-4 py-3 text-[10px] font-bold text-[#aaa] uppercase tracking-widest">
                          Total (active deals)
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-[#f5f5f5]">{formatRand(totalDealValue)}</td>
                        <td className="px-4 py-3 text-right font-bold text-[#c9a84c]">{formatRand(totalDmgNet)}</td>
                        <td />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

      </div>
    </>
  )
}
