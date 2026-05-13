import TopBar from "@/components/layout/TopBar"
import { createAdminClient } from "@/lib/supabase/admin"
import { formatRand } from "@/lib/utils"
import Link from "next/link"

export const dynamic = "force-dynamic"

const ENTRY_LABELS: Record<string, string> = {
  opening_balance: "Opening Balance",
  retention_added: "Retention Added",
  debt_repaid:     "Payment Received",
}

const ENTRY_COLORS: Record<string, string> = {
  opening_balance: "text-[#a8a8a8]",
  retention_added: "text-emerald-400",
  debt_repaid:     "text-emerald-400",
}

export default async function DhrLedgerPage({
  searchParams,
}: {
  searchParams: { period?: string }
}) {
  const supabase = createAdminClient()
  const period = searchParams.period ?? "all"

  const now = new Date()
  let sinceDate: string | null = null
  if (period === "6m") {
    sinceDate = new Date(now.getFullYear(), now.getMonth() - 6, 1).toISOString().slice(0, 10)
  } else if (period === "1y") {
    sinceDate = new Date(now.getFullYear() - 1, now.getMonth(), 1).toISOString().slice(0, 10)
  }

  // Always load the full ledger for the running balance calculation
  const { data: allEntries } = await supabase
    .from("dhr_debt_ledger")
    .select("id, created_at, entry_type, amount, notes, deal_id")
    .order("created_at", { ascending: true })

  const allRows = allEntries ?? []

  // Running balance: opening balance minus all reductions (retention applied + cash paid)
  const totalDebt = allRows.reduce((sum, e) => {
    if (e.entry_type === "opening_balance") return sum + e.amount
    return sum - e.amount  // retention_added and debt_repaid both reduce the debt
  }, 0)

  // Filter for display
  const displayRows = sinceDate
    ? allRows.filter((e) => e.created_at >= sinceDate!)
    : allRows

  // Reversed for display (newest first)
  const displayRowsDesc = [...displayRows].reverse()

  const tabs = [
    { key: "all", label: "All Time" },
    { key: "1y",  label: "Last 12 Months" },
    { key: "6m",  label: "Last 6 Months" },
  ]

  const totalRetentionApplied = allRows.filter(e => e.entry_type === "retention_added").reduce((s, e) => s + e.amount, 0)
  const totalPaid             = allRows.filter(e => e.entry_type === "debt_repaid").reduce((s, e) => s + e.amount, 0)

  return (
    <>
      <TopBar
        title="DHR Debt Ledger"
        action={
          <Link href="/dashboard" className="text-xs text-[#a8a8a8] hover:text-[#f5f5f5]">
            ← Dashboard
          </Link>
        }
      />
      <div className="flex-1 overflow-auto p-6 space-y-5">

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-[#1a1a1a] border border-[#2e2e2e] rounded-xl p-5">
            <p className="text-[10px] text-[#555] font-semibold uppercase tracking-widest">DMG Debt to DHR</p>
            <p className="text-2xl font-bold mt-1.5 text-red-400">{formatRand(totalDebt)}</p>
            <p className="text-xs text-[#888] mt-1">Outstanding balance</p>
          </div>
          <div className="bg-[#1a1a1a] border border-[#2e2e2e] rounded-xl p-5">
            <p className="text-[10px] text-[#555] font-semibold uppercase tracking-widest">Total Retention Applied</p>
            <p className="text-2xl font-bold mt-1.5 text-emerald-400">{formatRand(totalRetentionApplied)}</p>
            <p className="text-xs text-[#888] mt-1">DHR commissions withheld toward debt</p>
          </div>
          <div className="bg-[#1a1a1a] border border-[#2e2e2e] rounded-xl p-5">
            <p className="text-[10px] text-[#555] font-semibold uppercase tracking-widest">Total Cash Paid to DHR</p>
            <p className="text-2xl font-bold mt-1.5 text-emerald-400">{formatRand(totalPaid)}</p>
            <p className="text-xs text-[#888] mt-1">Direct payments made</p>
          </div>
        </div>

        {/* Time filter tabs */}
        <div className="flex gap-2">
          {tabs.map((t) => (
            <Link
              key={t.key}
              href={`/reports/dhr${t.key === "all" ? "" : `?period=${t.key}`}`}
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

        {/* Ledger table */}
        <div className="bg-[#1a1a1a] border border-[#2e2e2e] rounded-xl overflow-hidden">
          {!displayRowsDesc.length ? (
            <div className="p-6">
              <p className="text-sm text-[#888]">No entries for this period.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#2e2e2e] bg-[#111]">
                  <th className="text-left text-[10px] font-bold text-[#555] px-4 py-3 uppercase tracking-widest">Date</th>
                  <th className="text-left text-[10px] font-bold text-[#555] px-4 py-3 uppercase tracking-widest">Type</th>
                  <th className="text-left text-[10px] font-bold text-[#555] px-4 py-3 uppercase tracking-widest">Notes</th>
                  <th className="text-right text-[10px] font-bold text-[#555] px-4 py-3 uppercase tracking-widest">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2e2e2e]">
                {displayRowsDesc.map((e) => (
                  <tr key={e.id} className="hover:bg-[#222] transition-colors">
                    <td className="px-4 py-3 text-[#888] text-xs">
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
                  <td colSpan={3} className="px-4 py-3 text-[10px] font-bold text-[#555] uppercase tracking-widest">
                    Outstanding Balance to DHR
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-red-400">{formatRand(totalDebt)}</td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>

        <p className="text-xs text-[#888]">
          To record a DHR payment, go to <Link href="/reports" className="text-[#c9a84c] hover:underline">Reports → Friday Payout Runs</Link>.
        </p>

      </div>
    </>
  )
}
